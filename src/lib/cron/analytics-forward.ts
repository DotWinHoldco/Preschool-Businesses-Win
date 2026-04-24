// @anchor: cca.analytics.capi-forward
// Forwards conversion events from analytics_events to Meta CAPI, GA4 MP,
// and TikTok Events API. Dedupes per-provider via the `forwarded_to` jsonb.

import { createAdminClient } from '@/lib/supabase/admin'

interface EventRow {
  id: string
  event_id: string
  tenant_id: string
  site_id: string | null
  event_name: string
  event_type: string
  visitor_id: string
  page_url: string | null
  user_agent: string | null
  click_id_fbclid: string | null
  click_id_gclid: string | null
  click_id_ttclid: string | null
  country: string | null
  city: string | null
  properties: Record<string, unknown>
  forwarded_to: Record<string, unknown>
  created_at: string
}

interface SiteConfig {
  id: string
  meta_pixel_id: string | null
  meta_capi_token: string | null
  meta_test_event_code: string | null
  ga4_measurement_id: string | null
  ga4_api_secret: string | null
  tiktok_pixel_id: string | null
  tiktok_access_token: string | null
}

interface ForwardSummary {
  scanned: number
  meta: { sent: number; failed: number; skipped: number }
  ga4: { sent: number; failed: number; skipped: number }
  tiktok: { sent: number; failed: number; skipped: number }
}

const BATCH_LIMIT = 500
const LOOKBACK_MS = 6 * 60 * 60 * 1000

export async function runAnalyticsForward(): Promise<ForwardSummary> {
  const summary: ForwardSummary = {
    scanned: 0,
    meta: { sent: 0, failed: 0, skipped: 0 },
    ga4: { sent: 0, failed: 0, skipped: 0 },
    tiktok: { sent: 0, failed: 0, skipped: 0 },
  }

  const supabase = createAdminClient()
  const since = new Date(Date.now() - LOOKBACK_MS).toISOString()

  const { data: events, error } = await supabase
    .from('analytics_events')
    .select(
      'id, event_id, tenant_id, site_id, event_name, event_type, visitor_id, page_url, user_agent, click_id_fbclid, click_id_gclid, click_id_ttclid, country, city, properties, forwarded_to, created_at',
    )
    .eq('event_type', 'conversion')
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(BATCH_LIMIT)

  if (error || !events) {
    console.error('[analytics-forward] query failed', error)
    return summary
  }

  summary.scanned = events.length
  if (events.length === 0) return summary

  const siteIds = Array.from(new Set(events.map((e) => e.site_id as string).filter(Boolean)))
  const { data: sitesData } = await supabase
    .from('analytics_sites')
    .select(
      'id, meta_pixel_id, meta_capi_token, meta_test_event_code, ga4_measurement_id, ga4_api_secret, tiktok_pixel_id, tiktok_access_token',
    )
    .in('id', siteIds.length > 0 ? siteIds : [''])

  const siteMap = new Map<string, SiteConfig>()
  for (const s of (sitesData ?? []) as SiteConfig[]) siteMap.set(s.id, s)

  for (const ev of events as EventRow[]) {
    const site = ev.site_id ? siteMap.get(ev.site_id) : undefined
    if (!site) continue

    const forwarded = (ev.forwarded_to ?? {}) as Record<string, string>
    const patch: Record<string, string> = {}

    if (site.meta_pixel_id && site.meta_capi_token && !forwarded.meta) {
      const ok = await sendMeta(ev, site).catch((e) => {
        console.error('[analytics-forward] meta throw', e)
        return false
      })
      if (ok) {
        patch.meta = new Date().toISOString()
        summary.meta.sent += 1
      } else {
        summary.meta.failed += 1
      }
    } else if (!site.meta_pixel_id || !site.meta_capi_token) {
      summary.meta.skipped += 1
    }

    if (site.ga4_measurement_id && site.ga4_api_secret && !forwarded.ga4) {
      const ok = await sendGa4(ev, site).catch((e) => {
        console.error('[analytics-forward] ga4 throw', e)
        return false
      })
      if (ok) {
        patch.ga4 = new Date().toISOString()
        summary.ga4.sent += 1
      } else {
        summary.ga4.failed += 1
      }
    } else if (!site.ga4_measurement_id || !site.ga4_api_secret) {
      summary.ga4.skipped += 1
    }

    if (site.tiktok_pixel_id && site.tiktok_access_token && !forwarded.tiktok) {
      const ok = await sendTiktok(ev, site).catch((e) => {
        console.error('[analytics-forward] tiktok throw', e)
        return false
      })
      if (ok) {
        patch.tiktok = new Date().toISOString()
        summary.tiktok.sent += 1
      } else {
        summary.tiktok.failed += 1
      }
    } else if (!site.tiktok_pixel_id || !site.tiktok_access_token) {
      summary.tiktok.skipped += 1
    }

    if (Object.keys(patch).length > 0) {
      await supabase
        .from('analytics_events')
        .update({ forwarded_to: { ...forwarded, ...patch } })
        .eq('id', ev.id)
    }
  }

  return summary
}

function eventTimeSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000)
}

function metaEventName(name: string): string {
  switch (name) {
    case 'enrollment_completed':
      return 'Lead'
    case 'enrollment_started':
      return 'InitiateCheckout'
    case 'enrollment_click':
      return 'AddToCart'
    default:
      return name
  }
}

async function sendMeta(ev: EventRow, site: SiteConfig): Promise<boolean> {
  const url = `https://graph.facebook.com/v18.0/${site.meta_pixel_id}/events?access_token=${encodeURIComponent(site.meta_capi_token!)}`
  const body: Record<string, unknown> = {
    data: [
      {
        event_name: metaEventName(ev.event_name),
        event_time: eventTimeSeconds(ev.created_at),
        event_id: ev.event_id,
        event_source_url: ev.page_url,
        action_source: 'website',
        user_data: {
          client_user_agent: ev.user_agent,
          fbc: ev.click_id_fbclid
            ? `fb.1.${eventTimeSeconds(ev.created_at) * 1000}.${ev.click_id_fbclid}`
            : undefined,
          external_id: ev.visitor_id,
        },
        custom_data: {
          currency: 'USD',
          content_name: ev.event_name,
          ...(ev.properties ?? {}),
        },
      },
    ],
  }
  if (site.meta_test_event_code) body.test_event_code = site.meta_test_event_code

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[analytics-forward] meta error', res.status, text.slice(0, 500))
    return false
  }
  return true
}

async function sendGa4(ev: EventRow, site: SiteConfig): Promise<boolean> {
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(site.ga4_measurement_id!)}&api_secret=${encodeURIComponent(site.ga4_api_secret!)}`
  const body = {
    client_id: ev.visitor_id,
    timestamp_micros: new Date(ev.created_at).getTime() * 1000,
    events: [
      {
        name: ev.event_name.slice(0, 40),
        params: {
          engagement_time_msec: 1,
          page_location: ev.page_url ?? undefined,
          gclid: ev.click_id_gclid ?? undefined,
          ...(ev.properties ?? {}),
        },
      },
    ],
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  // GA4 MP returns 204 on success. Any 2xx is fine.
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '')
    console.error('[analytics-forward] ga4 error', res.status, text.slice(0, 500))
    return false
  }
  return true
}

function tiktokEventName(name: string): string {
  switch (name) {
    case 'enrollment_completed':
      return 'CompleteRegistration'
    case 'enrollment_started':
      return 'InitiateCheckout'
    case 'enrollment_click':
      return 'ClickButton'
    default:
      return name
  }
}

async function sendTiktok(ev: EventRow, site: SiteConfig): Promise<boolean> {
  const url = 'https://business-api.tiktok.com/open_api/v1.3/event/track/'
  const body = {
    event_source: 'web',
    event_source_id: site.tiktok_pixel_id,
    data: [
      {
        event: tiktokEventName(ev.event_name),
        event_time: eventTimeSeconds(ev.created_at),
        event_id: ev.event_id,
        user: {
          user_agent: ev.user_agent,
          ttclid: ev.click_id_ttclid ?? undefined,
          external_id: ev.visitor_id,
        },
        page: {
          url: ev.page_url,
        },
        properties: {
          currency: 'USD',
          content_name: ev.event_name,
          ...(ev.properties ?? {}),
        },
      },
    ],
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Access-Token': site.tiktok_access_token!,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[analytics-forward] tiktok error', res.status, text.slice(0, 500))
    return false
  }
  return true
}
