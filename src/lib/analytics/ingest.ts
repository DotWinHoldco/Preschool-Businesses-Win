import { createAdminClient } from '@/lib/supabase/admin'
import { hashIp } from './ip-hash'
import { parseUA } from './ua-parse'
import type { AnalyticsBatch, AnalyticsEvent } from './schemas'
import type { AnalyticsSite } from './site-lookup'

export interface IngestContext {
  site: AnalyticsSite
  ip: string | null
  user_agent: string | null
  country: string | null
  region: string | null
  city: string | null
}

export interface IngestResult {
  accepted: number
  skipped: number
  errors: number
}

const CONVERSION_EVENTS = new Set([
  'enrollment_click',
  'enrollment_started',
  'enrollment_completed',
])

export function isConversion(e: AnalyticsEvent): boolean {
  if (e.event_type === 'conversion') return true
  return CONVERSION_EVENTS.has(e.event_name)
}

export async function ingestBatch(
  batch: AnalyticsBatch,
  ctx: IngestContext,
): Promise<IngestResult> {
  const supabase = createAdminClient()
  const ipHash = await hashIp(ctx.ip)
  const ua = parseUA(ctx.user_agent)
  const result: IngestResult = { accepted: 0, skipped: 0, errors: 0 }

  // Drop bot traffic entirely
  if (ua.device_type === 'bot') {
    return { accepted: 0, skipped: batch.events.length, errors: 0 }
  }

  for (const e of batch.events) {
    try {
      const row = {
        event_id: e.event_id,
        tenant_id: ctx.site.tenant_id,
        site_id: ctx.site.id,
        visitor_id: e.visitor_id,
        session_id: e.session_id,
        event_type: e.event_type,
        event_name: e.event_name,
        page_url: e.page_url ?? null,
        page_path: e.page_path ?? null,
        page_title: e.page_title ?? null,
        referrer: e.referrer ?? null,
        utm_source: e.utm_source ?? null,
        utm_medium: e.utm_medium ?? null,
        utm_campaign: e.utm_campaign ?? null,
        utm_content: e.utm_content ?? null,
        utm_term: e.utm_term ?? null,
        click_id_fbclid: e.fbclid ?? null,
        click_id_gclid: e.gclid ?? null,
        click_id_ttclid: e.ttclid ?? null,
        ip_hash: ipHash,
        country: ctx.country,
        region: ctx.region,
        city: ctx.city,
        device_type: ua.device_type,
        browser: ua.browser,
        browser_version: ua.browser_version,
        os: ua.os,
        os_version: ua.os_version,
        user_agent: ctx.user_agent,
        screen_width: e.screen_width ?? null,
        screen_height: e.screen_height ?? null,
        viewport_width: e.viewport_width ?? null,
        viewport_height: e.viewport_height ?? null,
        language: e.language ?? null,
        properties: e.properties ?? {},
      }

      const { error: insErr } = await supabase
        .from('analytics_events')
        .insert(row)
        .select('id')
        .single()

      if (insErr) {
        if ((insErr as { code?: string }).code === '23505') {
          result.skipped += 1
          continue
        }
        console.error('[analytics/ingest] event insert error', insErr)
        result.errors += 1
        continue
      }

      result.accepted += 1

      await upsertSession(supabase, ctx, e, ua, ipHash)
      await upsertVisitor(supabase, ctx, e, isConversion(e))
    } catch (err) {
      console.error('[analytics/ingest] event processing threw', err)
      result.errors += 1
    }
  }

  return result
}

type AdminClient = ReturnType<typeof createAdminClient>

// A bounce is a session with zero engagement — no click, no conversion,
// only one page view AND less than 30 seconds on site. Any click (inbound
// CTA, outbound link, enrollment action) counts as engagement.
function isEngagement(e: AnalyticsEvent): boolean {
  return e.event_type === 'click' || e.event_type === 'conversion'
}

async function upsertSession(
  supabase: AdminClient,
  ctx: IngestContext,
  e: AnalyticsEvent,
  ua: ReturnType<typeof parseUA>,
  ipHash: string | null,
) {
  const isPageView = e.event_type === 'page_view'
  const engagement = isEngagement(e)
  const converted = isConversion(e)

  const { data: existing } = await supabase
    .from('analytics_sessions')
    .select('id, started_at, page_count, event_count, converted, is_bounce')
    .eq('tenant_id', ctx.site.tenant_id)
    .eq('session_id', e.session_id)
    .maybeSingle()

  if (!existing) {
    await supabase.from('analytics_sessions').insert({
      tenant_id: ctx.site.tenant_id,
      site_id: ctx.site.id,
      session_id: e.session_id,
      visitor_id: e.visitor_id,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      page_count: isPageView ? 1 : 0,
      event_count: 1,
      entry_page: e.page_path ?? null,
      exit_page: e.page_path ?? null,
      entry_referrer: e.referrer ?? null,
      utm_source: e.utm_source ?? null,
      utm_medium: e.utm_medium ?? null,
      utm_campaign: e.utm_campaign ?? null,
      utm_content: e.utm_content ?? null,
      utm_term: e.utm_term ?? null,
      ip_hash: ipHash,
      country: ctx.country,
      region: ctx.region,
      city: ctx.city,
      device_type: ua.device_type,
      browser: ua.browser,
      os: ua.os,
      user_agent: ctx.user_agent,
      converted,
      conversion_event: converted ? e.event_name : null,
      // Opening event is a click/conversion → already engaged, not a bounce.
      is_bounce: !engagement,
      duration_seconds: 0,
    })
    return
  }

  const startedAt = new Date(existing.started_at as string).getTime()
  const now = Date.now()
  const duration = Math.max(0, Math.floor((now - startedAt) / 1000))
  const nextPageCount = (existing.page_count as number) + (isPageView ? 1 : 0)
  const nextEventCount = (existing.event_count as number) + 1
  // Sticky: once a session is marked not-a-bounce, never flip back.
  const wasBounce = (existing.is_bounce as boolean) ?? true
  const nextIsBounce = wasBounce && !engagement && nextPageCount <= 1 && duration < 30

  await supabase
    .from('analytics_sessions')
    .update({
      ended_at: new Date().toISOString(),
      exit_page: e.page_path ?? null,
      page_count: nextPageCount,
      event_count: nextEventCount,
      duration_seconds: duration,
      is_bounce: nextIsBounce,
      converted: (existing.converted as boolean) || converted,
      conversion_event: (existing.converted as boolean)
        ? undefined
        : converted
          ? e.event_name
          : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id as string)
}

async function upsertVisitor(
  supabase: AdminClient,
  ctx: IngestContext,
  e: AnalyticsEvent,
  converted: boolean,
) {
  const { data: existing } = await supabase
    .from('analytics_visitors')
    .select(
      'id, first_utm_source, first_referrer, converted, conversion_count, total_events, first_converted_at',
    )
    .eq('tenant_id', ctx.site.tenant_id)
    .eq('visitor_id', e.visitor_id)
    .maybeSingle()

  const hasUtm = !!(e.utm_source || e.utm_medium || e.utm_campaign)

  if (!existing) {
    await supabase.from('analytics_visitors').insert({
      tenant_id: ctx.site.tenant_id,
      visitor_id: e.visitor_id,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      total_sessions: 1,
      total_events: 1,
      first_utm_source: e.utm_source ?? null,
      first_utm_medium: e.utm_medium ?? null,
      first_utm_campaign: e.utm_campaign ?? null,
      first_utm_content: e.utm_content ?? null,
      first_utm_term: e.utm_term ?? null,
      first_referrer: e.referrer ?? null,
      last_utm_source: e.utm_source ?? null,
      last_utm_medium: e.utm_medium ?? null,
      last_utm_campaign: e.utm_campaign ?? null,
      last_utm_content: e.utm_content ?? null,
      last_utm_term: e.utm_term ?? null,
      last_referrer: e.referrer ?? null,
      converted,
      conversion_count: converted ? 1 : 0,
      first_converted_at: converted ? new Date().toISOString() : null,
    })
    return
  }

  const patch: Record<string, unknown> = {
    last_seen_at: new Date().toISOString(),
    total_events: (existing.total_events as number) + 1,
  }
  if (hasUtm) {
    patch.last_utm_source = e.utm_source ?? null
    patch.last_utm_medium = e.utm_medium ?? null
    patch.last_utm_campaign = e.utm_campaign ?? null
    patch.last_utm_content = e.utm_content ?? null
    patch.last_utm_term = e.utm_term ?? null
  }
  if (e.referrer) patch.last_referrer = e.referrer
  if (converted) {
    patch.converted = true
    patch.conversion_count = (existing.conversion_count as number) + 1
    if (!existing.first_converted_at) patch.first_converted_at = new Date().toISOString()
  }

  await supabase
    .from('analytics_visitors')
    .update(patch)
    .eq('id', existing.id as string)
}
