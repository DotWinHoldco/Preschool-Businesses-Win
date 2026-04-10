'use server'

// @anchor: cca.staff.certifications
// Add/update staff certifications with expiry tracking.

import { headers } from 'next/headers'
import { createTenantServerClient } from '@/lib/supabase/server'
import { ManageCertificationSchema } from '@/lib/schemas/staff'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

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

    const headerStore = await headers()
    const tenantId = headerStore.get('x-tenant-id') ?? CCA_TENANT_ID
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

    const headerStore = await headers()
    void headerStore
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
