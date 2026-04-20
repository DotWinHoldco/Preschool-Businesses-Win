// @anchor: cca.expenses.create
'use server'

import { CreateExpenseSchema, type CreateExpenseInput } from '@/lib/schemas/expense'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type CreateExpenseState = {
  ok: boolean
  error?: string
  id?: string
}

export async function createExpense(input: CreateExpenseInput): Promise<CreateExpenseState> {
  await assertRole('admin')

  const parsed = CreateExpenseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      tenant_id: tenantId,
      category_id: data.category_id,
      amount_cents: data.amount_cents,
      date: data.date,
      vendor: data.vendor,
      description: data.description ?? null,
      receipt_path: data.receipt_path ?? null,
      payment_method: data.payment_method,
      classroom_id: data.classroom_id ?? null,
      recurring: data.recurring,
      recurring_frequency: data.recurring_frequency ?? null,
      notes: data.notes ?? null,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (error || !expense) {
    return { ok: false, error: error?.message ?? 'Failed to create expense' }
  }

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'expense.created',
    entity_type: 'expense',
    entity_id: expense.id,
    after_data: { vendor: data.vendor, amount_cents: data.amount_cents, category_id: data.category_id },
  })

  return { ok: true, id: expense.id }
}
