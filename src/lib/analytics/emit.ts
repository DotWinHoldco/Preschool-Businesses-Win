import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Server-side conversion emission. Writes directly to analytics_events and
// links analytics_visitors → application when a cross-domain visitor_id is
// available. No HTTP round-trip.

export interface EmitConversionOpts {
  tenantId: string
  eventName: 'enrollment_started' | 'enrollment_completed' | string
  visitorId?: string | null
  sessionId?: string | null
  applicationId?: string | null
  pageUrl?: string | null
  properties?: Record<string, unknown>
}

export async function emitServerConversion(opts: EmitConversionOpts): Promise<void> {
  try {
    const supabase = createAdminClient()

    const visitor_id = opts.visitorId || 'server_' + randomUUID()
    const session_id = opts.sessionId || 'server_' + randomUUID()

    // Find the tenant's active site id so the event links to it (best-effort).
    const { data: site } = await supabase
      .from('analytics_sites')
      .select('id')
      .eq('tenant_id', opts.tenantId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    await supabase.from('analytics_events').insert({
      event_id: randomUUID(),
      tenant_id: opts.tenantId,
      site_id: site?.id ?? null,
      visitor_id,
      session_id,
      event_type: 'conversion',
      event_name: opts.eventName,
      page_url: opts.pageUrl ?? null,
      page_path: opts.pageUrl ? safePath(opts.pageUrl) : null,
      application_id: opts.applicationId ?? null,
      properties: opts.properties ?? {},
    })

    if (opts.applicationId && opts.visitorId) {
      await supabase
        .from('analytics_visitors')
        .update({
          converted: true,
          application_id: opts.applicationId,
          first_converted_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
        })
        .eq('tenant_id', opts.tenantId)
        .eq('visitor_id', opts.visitorId)

      await supabase
        .from('analytics_sessions')
        .update({ converted: true, conversion_event: opts.eventName })
        .eq('tenant_id', opts.tenantId)
        .eq('visitor_id', opts.visitorId)
    }
  } catch (err) {
    // Never let analytics break the primary flow.
    console.error('[analytics/emit] server conversion failed', err)
  }
}

function safePath(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname + u.search
  } catch {
    return url.slice(0, 500)
  }
}
