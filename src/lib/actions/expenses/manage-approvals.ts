// @anchor: cca.expenses.manage-approvals
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import {
  SubmitExpenseForApprovalSchema,
  ApproveExpenseSchema,
  RejectExpenseSchema,
  AddExpenseReceiptSchema,
  type SubmitExpenseForApprovalInput,
  type ApproveExpenseInput,
  type RejectExpenseInput,
  type AddExpenseReceiptInput,
} from '@/lib/schemas/expense'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type ActionState = { ok: boolean; error?: string; id?: string }

export async function submitExpenseForApproval(
  input: SubmitExpenseForApprovalInput,
): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = SubmitExpenseForApprovalSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data, error } = await supabase
    .from('expense_approvals')
    .insert({
      tenant_id: tenantId,
      expense_id: parsed.data.expense_id,
      status: 'pending',
    })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? 'Submit failed' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'expense.submitted_for_approval',
    entityType: 'expense_approval',
    entityId: data.id,
    after: { expense_id: parsed.data.expense_id },
  })
  revalidatePath('/portal/admin/expenses')
  return { ok: true, id: data.id }
}

export async function approveExpense(input: ApproveExpenseInput): Promise<ActionState> {
  await assertRole('director')
  const parsed = ApproveExpenseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('expense_approvals')
    .update({
      status: 'approved',
      approver_id: actorId,
      decided_at: new Date().toISOString(),
      comments: parsed.data.comments ?? null,
    })
    .eq('id', parsed.data.approval_id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'expense.approved',
    entityType: 'expense_approval',
    entityId: parsed.data.approval_id,
    after: { comments: parsed.data.comments },
  })
  revalidatePath('/portal/admin/expenses')
  return { ok: true, id: parsed.data.approval_id }
}

export async function rejectExpense(input: RejectExpenseInput): Promise<ActionState> {
  await assertRole('director')
  const parsed = RejectExpenseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('expense_approvals')
    .update({
      status: 'rejected',
      approver_id: actorId,
      decided_at: new Date().toISOString(),
      comments: parsed.data.comments ?? null,
    })
    .eq('id', parsed.data.approval_id)
    .eq('tenant_id', tenantId)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'expense.rejected',
    entityType: 'expense_approval',
    entityId: parsed.data.approval_id,
    after: { comments: parsed.data.comments },
  })
  revalidatePath('/portal/admin/expenses')
  return { ok: true, id: parsed.data.approval_id }
}

export async function addExpenseReceipt(input: AddExpenseReceiptInput): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = AddExpenseReceiptSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data, error } = await supabase
    .from('expense_receipts')
    .insert({
      tenant_id: tenantId,
      expense_id: parsed.data.expense_id,
      file_path: parsed.data.file_path,
      file_name: parsed.data.file_name ?? null,
      uploaded_by: actorId,
    })
    .select('id')
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? 'Add failed' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'expense.receipt.added',
    entityType: 'expense_receipt',
    entityId: data.id,
    after: { expense_id: parsed.data.expense_id, file_path: parsed.data.file_path },
  })
  revalidatePath('/portal/admin/expenses')
  return { ok: true, id: data.id }
}
