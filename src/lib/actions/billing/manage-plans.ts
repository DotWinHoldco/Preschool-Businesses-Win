// @anchor: cca.billing.manage-plans
// Server actions for CRUD on billing_plans.
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import {
  BillingPlanSchema,
  UpdateBillingPlanSchema,
  type BillingPlanInput,
  type UpdateBillingPlanInput,
} from '@/lib/schemas/billing'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type BillingPlanActionState = {
  ok: boolean
  error?: string
  id?: string
}

export async function createBillingPlan(input: BillingPlanInput): Promise<BillingPlanActionState> {
  try {
    await assertRole('admin')

    const parsed = BillingPlanSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const data = parsed.data
    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    const { data: plan, error } = await supabase
      .from('billing_plans')
      .insert({
        tenant_id: tenantId,
        ...data,
      })
      .select('id')
      .single()

    if (error || !plan) {
      return { ok: false, error: error?.message ?? 'Failed to create plan' }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'billing.plan.created',
      entityType: 'billing_plan',
      entityId: plan.id,
      after: data,
    })

    revalidatePath('/portal/admin/billing/plans')
    return { ok: true, id: plan.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function updateBillingPlan(
  input: UpdateBillingPlanInput,
): Promise<BillingPlanActionState> {
  try {
    await assertRole('admin')

    const parsed = UpdateBillingPlanSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { id, ...rest } = parsed.data
    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    // Fetch before for audit
    const { data: before } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (!before) {
      return { ok: false, error: 'Plan not found' }
    }

    const { error } = await supabase
      .from('billing_plans')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      return { ok: false, error: error.message }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'billing.plan.updated',
      entityType: 'billing_plan',
      entityId: id,
      before: before as Record<string, unknown>,
      after: rest as Record<string, unknown>,
    })

    revalidatePath('/portal/admin/billing/plans')
    return { ok: true, id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

/**
 * Archive a plan by setting is_active=false (soft delete).
 */
export async function deleteBillingPlan(id: string): Promise<BillingPlanActionState> {
  try {
    await assertRole('admin')

    if (typeof id !== 'string' || id.length === 0) {
      return { ok: false, error: 'Invalid plan ID' }
    }

    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    const { error } = await supabase
      .from('billing_plans')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      return { ok: false, error: error.message }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'billing.plan.archived',
      entityType: 'billing_plan',
      entityId: id,
    })

    revalidatePath('/portal/admin/billing/plans')
    return { ok: true, id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
