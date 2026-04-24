// @anchor: cca.enrollment.application-extras
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  AddApplicationDocumentSchema,
  DeleteApplicationDocumentSchema,
  SetEnrollmentDepositSchema,
  DepositIdSchema,
  GenerateAcceptanceLetterSchema,
  LetterIdSchema,
  MarkLetterAcceptedSchema,
  type AddApplicationDocumentInput,
  type DeleteApplicationDocumentInput,
  type SetEnrollmentDepositInput,
  type DepositIdInput,
  type GenerateAcceptanceLetterInput,
  type LetterIdInput,
  type MarkLetterAcceptedInput,
} from '@/lib/schemas/enrollment'

export type ApplicationExtrasState = {
  ok: boolean
  error?: string
  id?: string
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function addApplicationDocument(
  input: AddApplicationDocumentInput,
): Promise<ApplicationExtrasState> {
  await assertRole('admin')

  const parsed = AddApplicationDocumentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const data = parsed.data

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('application_documents')
    .insert({
      tenant_id: tenantId,
      application_id: data.application_id,
      document_type: data.document_type,
      file_path: data.file_path,
      file_name: data.file_name ?? null,
      expiry_date: data.expiry_date || null,
      notes: data.notes ?? null,
      uploaded_by: actorId,
    })
    .select('id')
    .single()

  if (error || !row) {
    return { ok: false, error: error?.message ?? 'Failed to add document' }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'application_document.added',
    entityType: 'application_document',
    entityId: row.id,
    after: { ...data },
  })

  revalidatePath(`/portal/admin/enrollment/${data.application_id}`)
  return { ok: true, id: row.id }
}

export async function deleteApplicationDocument(
  input: DeleteApplicationDocumentInput,
): Promise<ApplicationExtrasState> {
  await assertRole('admin')

  const parsed = DeleteApplicationDocumentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('application_documents')
    .select('*')
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Document not found' }
  }

  const { error } = await supabase
    .from('application_documents')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'application_document.deleted',
    entityType: 'application_document',
    entityId: parsed.data.id,
    before: before as Record<string, unknown>,
  })

  if (before.application_id) {
    revalidatePath(`/portal/admin/enrollment/${before.application_id}`)
  }
  return { ok: true, id: parsed.data.id }
}

// ---------------------------------------------------------------------------
// Deposits
// ---------------------------------------------------------------------------

export async function setEnrollmentDeposit(
  input: SetEnrollmentDepositInput,
): Promise<ApplicationExtrasState> {
  await assertRole('admin')

  const parsed = SetEnrollmentDepositSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const data = parsed.data

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  // Upsert a single deposit per application: if one exists, update it; else insert.
  const { data: existing } = await supabase
    .from('enrollment_deposits')
    .select('id')
    .eq('application_id', data.application_id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  let id: string
  if (existing?.id) {
    const { error } = await supabase
      .from('enrollment_deposits')
      .update({
        amount_cents: data.amount_cents,
        due_date: data.due_date || null,
        notes: data.notes ?? null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('tenant_id', tenantId)
    if (error) return { ok: false, error: error.message }
    id = existing.id
  } else {
    const { data: inserted, error } = await supabase
      .from('enrollment_deposits')
      .insert({
        tenant_id: tenantId,
        application_id: data.application_id,
        amount_cents: data.amount_cents,
        due_date: data.due_date || null,
        notes: data.notes ?? null,
        status: 'pending',
      })
      .select('id')
      .single()
    if (error || !inserted) {
      return { ok: false, error: error?.message ?? 'Failed to set deposit' }
    }
    id = inserted.id
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'enrollment_deposit.set',
    entityType: 'enrollment_deposit',
    entityId: id,
    after: { ...data },
  })

  revalidatePath(`/portal/admin/enrollment/${data.application_id}`)
  return { ok: true, id }
}

export async function markDepositPaid(input: DepositIdInput): Promise<ApplicationExtrasState> {
  await assertRole('admin')

  const parsed = DepositIdSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('enrollment_deposits')
    .select('*')
    .eq('id', parsed.data.deposit_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Deposit not found' }
  }

  const { error } = await supabase
    .from('enrollment_deposits')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.deposit_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'enrollment_deposit.marked_paid',
    entityType: 'enrollment_deposit',
    entityId: parsed.data.deposit_id,
    before: before as Record<string, unknown>,
    after: { status: 'paid' },
  })

  if (before.application_id) {
    revalidatePath(`/portal/admin/enrollment/${before.application_id}`)
  }
  return { ok: true, id: parsed.data.deposit_id }
}

export async function waiveDeposit(input: DepositIdInput): Promise<ApplicationExtrasState> {
  await assertRole('admin')

  const parsed = DepositIdSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('enrollment_deposits')
    .select('*')
    .eq('id', parsed.data.deposit_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Deposit not found' }
  }

  const { error } = await supabase
    .from('enrollment_deposits')
    .update({ status: 'waived', updated_at: new Date().toISOString() })
    .eq('id', parsed.data.deposit_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'enrollment_deposit.waived',
    entityType: 'enrollment_deposit',
    entityId: parsed.data.deposit_id,
    before: before as Record<string, unknown>,
    after: { status: 'waived' },
  })

  if (before.application_id) {
    revalidatePath(`/portal/admin/enrollment/${before.application_id}`)
  }
  return { ok: true, id: parsed.data.deposit_id }
}

// ---------------------------------------------------------------------------
// Acceptance letters
// ---------------------------------------------------------------------------

export async function generateAcceptanceLetter(
  input: GenerateAcceptanceLetterInput,
): Promise<ApplicationExtrasState> {
  await assertRole('admin')

  const parsed = GenerateAcceptanceLetterSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const data = parsed.data

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('acceptance_letters')
    .insert({
      tenant_id: tenantId,
      application_id: data.application_id,
      classroom_id: data.classroom_id,
      start_date: data.start_date,
      tuition_summary: data.tuition_summary ?? null,
      body: data.body,
    })
    .select('id')
    .single()

  if (error || !row) {
    return { ok: false, error: error?.message ?? 'Failed to generate letter' }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'acceptance_letter.generated',
    entityType: 'acceptance_letter',
    entityId: row.id,
    after: { ...data },
  })

  revalidatePath(`/portal/admin/enrollment/${data.application_id}`)
  return { ok: true, id: row.id }
}

export async function markLetterSent(input: LetterIdInput): Promise<ApplicationExtrasState> {
  await assertRole('admin')

  const parsed = LetterIdSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('acceptance_letters')
    .select('*')
    .eq('id', parsed.data.letter_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Letter not found' }
  }

  const { error } = await supabase
    .from('acceptance_letters')
    .update({
      sent_at: new Date().toISOString(),
      sent_by: actorId,
    })
    .eq('id', parsed.data.letter_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'acceptance_letter.sent',
    entityType: 'acceptance_letter',
    entityId: parsed.data.letter_id,
    before: before as Record<string, unknown>,
    after: { sent_at: new Date().toISOString() },
  })

  if (before.application_id) {
    revalidatePath(`/portal/admin/enrollment/${before.application_id}`)
  }
  return { ok: true, id: parsed.data.letter_id }
}

export async function markLetterAccepted(
  input: MarkLetterAcceptedInput,
): Promise<ApplicationExtrasState> {
  await assertRole('admin')

  const parsed = MarkLetterAcceptedSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const data = parsed.data

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('acceptance_letters')
    .select('*')
    .eq('id', data.letter_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Letter not found' }
  }

  const { error } = await supabase
    .from('acceptance_letters')
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by_name: data.accepted_by_name,
    })
    .eq('id', data.letter_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'acceptance_letter.accepted',
    entityType: 'acceptance_letter',
    entityId: data.letter_id,
    before: before as Record<string, unknown>,
    after: { accepted_by_name: data.accepted_by_name },
  })

  if (before.application_id) {
    revalidatePath(`/portal/admin/enrollment/${before.application_id}`)
  }
  return { ok: true, id: data.letter_id }
}
