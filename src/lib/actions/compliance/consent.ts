'use server'

// @anchor: cca.compliance.consent
// Consent management: upsert and list consent records per family/student.
// Supports FERPA directory opt-out, COPPA parental consent, GDPR data processing.

import { UpsertConsentSchema } from '@/lib/schemas/compliance'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

export type ConsentResult = {
  ok: boolean
  error?: string
}

export type ConsentRecord = {
  id: string
  family_id: string
  student_id: string | null
  consent_type: string
  granted: boolean
  granted_at: string | null
  revoked_at: string | null
  notes: string | null
}

export async function upsertConsent(formData: FormData): Promise<ConsentResult> {
  await assertRole('admin')

  const raw = {
    family_id: formData.get('family_id') as string,
    student_id: (formData.get('student_id') as string) || undefined,
    consent_type: formData.get('consent_type') as string,
    granted: formData.get('granted') === 'true',
  }

  const parsed = UpsertConsentSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const now = new Date().toISOString()

  // Build the upsert row
  const row: Record<string, unknown> = {
    tenant_id: tenantId,
    family_id: parsed.data.family_id,
    student_id: parsed.data.student_id ?? null,
    consent_type: parsed.data.consent_type,
    granted: parsed.data.granted,
    granted_by: actorId,
    updated_at: now,
  }

  if (parsed.data.granted) {
    row.granted_at = now
    row.revoked_at = null
  } else {
    row.revoked_at = now
  }

  const { error } = await supabase
    .from('consent_records')
    .upsert(row, {
      onConflict: 'tenant_id,family_id,student_id,consent_type',
      ignoreDuplicates: false,
    })

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: parsed.data.granted ? 'compliance.consent.granted' : 'compliance.consent.revoked',
    entityType: 'consent_record',
    entityId: parsed.data.family_id,
    after: parsed.data as unknown as Record<string, unknown>,
  })

  return { ok: true }
}

export async function listConsents(familyId: string): Promise<ConsentRecord[]> {
  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data, error } = await supabase
    .from('consent_records')
    .select('id, family_id, student_id, consent_type, granted, granted_at, revoked_at, notes')
    .eq('tenant_id', tenantId)
    .eq('family_id', familyId)
    .order('consent_type', { ascending: true })

  if (error || !data) return []

  return data as ConsentRecord[]
}
