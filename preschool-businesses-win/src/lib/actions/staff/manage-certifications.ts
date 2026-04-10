'use server'

// @anchor: cca.staff.certifications
// Add/update staff certifications with expiry tracking.

import { createTenantServerClient } from '@/lib/supabase/server'
import { ManageCertificationSchema } from '@/lib/schemas/staff'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import { assertRole } from '@/lib/auth/session'

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
    await assertRole('admin')

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

    const actorId = await getActorId()
    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'staff.add_certification',
      entityType: 'certification',
      entityId: cert.id,
      after: { ...parsed.data },
    })

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
    await assertRole('admin')

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

    const tenantId = await getTenantId()
    const actorId = await getActorId()
    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'staff.update_certification',
      entityType: 'certification',
      entityId: certId,
      after: { ...parsed.data },
    })

    return { ok: true, cert_id: certId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
