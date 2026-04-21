'use server'

// @anchor: cca.compliance.anonymize-family
// GDPR right-to-erasure / FERPA record redaction.
// Anonymizes PII for a family, its members, and linked students.
// Requires typed confirmation matching the family name.

import { AnonymizeFamilySchema } from '@/lib/schemas/compliance'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

export type AnonymizeResult = {
  ok: boolean
  error?: string
}

export async function anonymizeFamily(formData: FormData): Promise<AnonymizeResult> {
  await assertRole('admin')

  const raw = {
    family_id: formData.get('family_id') as string,
    confirmation_text: formData.get('confirmation_text') as string,
  }

  const parsed = AnonymizeFamilySchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  // 1. Fetch the family to verify confirmation text
  const { data: family, error: familyErr } = await supabase
    .from('families')
    .select('id, family_name, billing_email, billing_phone, mailing_address_line1, mailing_address_line2, mailing_city, mailing_state, mailing_zip')
    .eq('id', parsed.data.family_id)
    .eq('tenant_id', tenantId)
    .single()

  if (familyErr || !family) {
    return { ok: false, error: 'Family not found' }
  }

  // Confirmation must match family name (case-insensitive)
  if ((parsed.data.confirmation_text as string).toLowerCase() !== (family.family_name as string).toLowerCase()) {
    return { ok: false, error: 'Confirmation text does not match the family name' }
  }

  const familyId = family.id as string
  const idSuffix = familyId.slice(-4)

  // Snapshot before state for audit
  const beforeSnapshot: Record<string, unknown> = { family: { ...family } }

  // 2. Fetch family members (before snapshot)
  const { data: members } = await supabase
    .from('family_members')
    .select('id, first_name, last_name, email, phone')
    .eq('family_id', familyId)
    .eq('tenant_id', tenantId)

  beforeSnapshot.family_members = members ?? []

  // 3. Fetch linked students
  const { data: studentLinks } = await supabase
    .from('student_family_links')
    .select('student_id')
    .eq('family_id', familyId)
    .eq('tenant_id', tenantId)

  const studentIds = (studentLinks ?? []).map((l) => l.student_id as string)

  let studentsSnapshot: Array<Record<string, unknown>> = []
  if (studentIds.length > 0) {
    const { data: studentsData } = await supabase
      .from('students')
      .select('id, first_name, last_name, preferred_name, photo_path, notes_internal')
      .eq('tenant_id', tenantId)
      .in('id', studentIds)
    studentsSnapshot = (studentsData ?? []) as Array<Record<string, unknown>>
  }
  beforeSnapshot.students = studentsSnapshot

  // ---- Perform anonymization ----

  // 4. Anonymize family record
  const { error: updateFamilyErr } = await supabase
    .from('families')
    .update({
      family_name: `Anonymized Family ${idSuffix}`,
      billing_email: null,
      billing_phone: null,
      mailing_address_line1: null,
      mailing_address_line2: null,
      mailing_city: null,
      mailing_state: null,
      mailing_zip: null,
    })
    .eq('id', familyId)
    .eq('tenant_id', tenantId)

  if (updateFamilyErr) {
    return { ok: false, error: `Failed to anonymize family: ${updateFamilyErr.message}` }
  }

  // 5. Anonymize family members
  if (members && members.length > 0) {
    const memberIds = members.map((m) => m.id as string)
    await supabase
      .from('family_members')
      .update({
        first_name: 'Anonymized',
        last_name: 'User',
        email: null,
        phone: null,
      })
      .eq('tenant_id', tenantId)
      .in('id', memberIds)
  }

  // 6. Anonymize linked students
  if (studentIds.length > 0) {
    await supabase
      .from('students')
      .update({
        first_name: 'Anonymized',
        last_name: 'Student',
        preferred_name: null,
        photo_path: null,
        notes_internal: null,
      })
      .eq('tenant_id', tenantId)
      .in('id', studentIds)

    // 7. Archive documents for those students
    await supabase
      .from('documents')
      .update({ status: 'archived' })
      .eq('tenant_id', tenantId)
      .eq('entity_type', 'student')
      .in('entity_id', studentIds)
  }

  // 8. Comprehensive audit entry
  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'compliance.family.anonymized',
    entityType: 'family',
    entityId: familyId,
    before: beforeSnapshot,
    after: {
      family_name: `Anonymized Family ${idSuffix}`,
      members_anonymized: members?.length ?? 0,
      students_anonymized: studentIds.length,
    },
  })

  return { ok: true }
}
