'use server'

// @anchor: cca.staff.certifications
// Add/update staff certifications with expiry tracking.

import { createTenantServerClient } from '@/lib/supabase/server'
import { ManageCertificationSchema } from '@/lib/schemas/staff'
import { getTenantId } from '@/lib/actions/get-tenant-id'

export type CertState = {
  ok: boolean
  error?: string
  cert_id?: string
}

export async function addCertification(
  _prev: CertState,
  formData: FormData,
): Promise<CertState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = ManageCertificationSchema.safeParse(raw)

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const tenantId = await getTenantId()
    const supabase = await createTenantServerClient()

    const { data: cert, error } = await supabase
      .from('staff_certifications')
      .insert({
        tenant_id: tenantId,
        ...parsed.data,
      })
      .select('id')
      .single()

    if (error || !cert) {
      return { ok: false, error: error?.message ?? 'Failed to add certification' }
    }

    return { ok: true, cert_id: cert.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function updateCertification(
  _prev: CertState,
  formData: FormData,
): Promise<CertState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const certId = raw.cert_id as string

    if (!certId) {
      return { ok: false, error: 'Certification ID is required' }
    }

    const parsed = ManageCertificationSchema.safeParse(raw)

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const supabase = await createTenantServerClient()

    const { error } = await supabase
      .from('staff_certifications')
      .update(parsed.data)
      .eq('id', certId)

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, cert_id: certId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
