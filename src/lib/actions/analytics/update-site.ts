'use server'

// @anchor: cca.analytics.update-site
// Updates an analytics_sites row: origins, active flag, and CAPI credentials
// for Meta / GA4 / TikTok. Admin-gated, tenant-scoped, audit-logged.

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'
import { AnalyticsSiteUpdateSchema, type AnalyticsSiteUpdate } from '@/lib/schemas/analytics-site'

interface Result {
  ok: boolean
  error?: string
  debug?: string
}

export async function updateAnalyticsSite(input: unknown): Promise<Result> {
  let session
  try {
    const r = await assertRole('admin')
    session = r.session
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const rawConsent =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>).consent_banner_enabled
      : 'missing'

  const parsed = AnalyticsSiteUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const data: AnalyticsSiteUpdate = parsed.data

  console.log('[analytics/update-site] incoming consent_banner_enabled:', {
    raw: rawConsent,
    parsed: data.consent_banner_enabled,
  })

  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  // Ensure the row belongs to this tenant before updating.
  const { data: existing, error: loadErr } = await supabase
    .from('analytics_sites')
    .select('id, tenant_id')
    .eq('id', data.id)
    .maybeSingle()

  if (loadErr || !existing) {
    return { ok: false, error: 'Site not found' }
  }
  if (existing.tenant_id !== tenantId) {
    return { ok: false, error: 'Not authorized' }
  }

  const { error: updErr } = await supabase
    .from('analytics_sites')
    .update({
      name: data.name,
      origins: data.origins,
      is_active: data.is_active,
      consent_banner_enabled: data.consent_banner_enabled,
      meta_pixel_id: data.meta_pixel_id,
      meta_capi_token: data.meta_capi_token,
      meta_test_event_code: data.meta_test_event_code,
      ga4_measurement_id: data.ga4_measurement_id,
      ga4_api_secret: data.ga4_api_secret,
      tiktok_pixel_id: data.tiktok_pixel_id,
      tiktok_access_token: data.tiktok_access_token,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  if (updErr) {
    console.error('[analytics/update-site] update failed', updErr)
    return { ok: false, error: 'Save failed' }
  }

  // Read it back so we can confirm what actually landed in the DB.
  const { data: verify } = await supabase
    .from('analytics_sites')
    .select('consent_banner_enabled, is_active, updated_at')
    .eq('id', data.id)
    .maybeSingle()
  console.log('[analytics/update-site] post-write row:', verify)

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'analytics.site.updated',
    entityType: 'analytics_site',
    entityId: data.id,
    after: {
      name: data.name,
      origins: data.origins,
      is_active: data.is_active,
      consent_banner_enabled: data.consent_banner_enabled,
      meta_configured: !!data.meta_pixel_id && !!data.meta_capi_token,
      ga4_configured: !!data.ga4_measurement_id && !!data.ga4_api_secret,
      tiktok_configured: !!data.tiktok_pixel_id && !!data.tiktok_access_token,
    },
  })

  revalidatePath('/portal/admin/analytics/traffic/install')
  revalidatePath('/portal/admin/analytics/traffic')

  return {
    ok: true,
    debug: `consent raw=${String(rawConsent)} parsed=${String(data.consent_banner_enabled)} saved=${String(verify?.consent_banner_enabled)}`,
  }
}
