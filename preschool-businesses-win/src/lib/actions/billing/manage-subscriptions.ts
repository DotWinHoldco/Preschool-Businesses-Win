'use server'

// @anchor: cca.billing.subscriptions
// Manage family billing enrollments (subscriptions).

import { createTenantServerClient } from '@/lib/supabase/server'
import { ManageSubscriptionSchema } from '@/lib/schemas/billing'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type SubscriptionState = {
  ok: boolean
  error?: string
  enrollment_id?: string
}

export async function createSubscription(
  _prev: SubscriptionState,
  formData: FormData,
): Promise<SubscriptionState> {
  try {
    await assertRole('admin')

    const raw = Object.fromEntries(formData.entries())
    const parsed = ManageSubscriptionSchema.safeParse({
      ...raw,
      custom_amount_cents: raw.custom_amount_cents ? Number(raw.custom_amount_cents) : undefined,
      discount_pct: raw.discount_pct ? Number(raw.discount_pct) : undefined,
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const tenantId = await getTenantId()
    const supabase = await createTenantServerClient()

    const { data: enrollment, error } = await supabase
      .from('family_billing_enrollments')
      .insert({
        tenant_id: tenantId,
        ...parsed.data,
      })
      .select('id')
      .single()

    if (error || !enrollment) {
      return { ok: false, error: error?.message ?? 'Failed to create subscription' }
    }

    return { ok: true, enrollment_id: enrollment.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function pauseSubscription(
  _prev: SubscriptionState,
  formData: FormData,
): Promise<SubscriptionState> {
  try {
    await assertRole('admin')

    const enrollmentId = formData.get('enrollment_id') as string
    if (!enrollmentId) {
      return { ok: false, error: 'Enrollment ID is required' }
    }

    const supabase = await createTenantServerClient()

    const { error } = await supabase
      .from('family_billing_enrollments')
      .update({ status: 'paused' })
      .eq('id', enrollmentId)

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, enrollment_id: enrollmentId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function cancelSubscription(
  _prev: SubscriptionState,
  formData: FormData,
): Promise<SubscriptionState> {
  try {
    await assertRole('admin')

    const enrollmentId = formData.get('enrollment_id') as string
    if (!enrollmentId) {
      return { ok: false, error: 'Enrollment ID is required' }
    }

    const supabase = await createTenantServerClient()

    const { error } = await supabase
      .from('family_billing_enrollments')
      .update({
        status: 'cancelled',
        end_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', enrollmentId)

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, enrollment_id: enrollmentId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
