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
  } catch (e) {
    return {
      ok: false,
      error: 'Auth check failed: ' + (e instanceof Error ? e.message : String(e)),
    }
  }

  const rawConsent =
    typeof input === 'object' && input !== null
      ? (input as Record<string, unknown>).consent_banner_enabled
      : 'missing'

  const parsed = AnalyticsSiteUpdateSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      ok: false,
      error: `Zod@${firstIssue?.path?.join('.') ?? '?'}: ${firstIssue?.message ?? 'invalid'}`,
    }
  }
  const data: AnalyticsSiteUpdate = parsed.data

  console.log('[analytics/update-site] incoming consent_banner_enabled:', {
    raw: rawConsent,
    parsed: data.consent_banner_enabled,
  })

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch (e) {
    return {
      ok: false,
      error: 'Tenant lookup failed: ' + (e instanceof Error ? e.message : String(e)),
    }
  }

  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
  } catch (e) {
    return {
      ok: false,
      error: 'Admin client failed: ' + (e instanceof Error ? e.message : String(e)),
    }
  }

  // Ensure the row belongs to this tenant before updating.
  const { data: existing, error: loadErr } = await supabase
    .from('analytics_sites')
    .select('id, tenant_id')
    .eq('id', data.id)
    .maybeSingle()

  if (loadErr) {
    return { ok: false, error: 'Load failed: ' + loadErr.message }
  }
  if (!existing) {
    return { ok: false, error: `Site row ${data.id} not found` }
  }
  if (existing.tenant_id !== tenantId) {
    return {
      ok: false,
      error: `Tenant mismatch: row=${existing.tenant_id} req=${tenantId}`,
    }
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
    return { ok: false, error: `Update failed: ${updErr.message || updErr.code || 'unknown'}` }
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
