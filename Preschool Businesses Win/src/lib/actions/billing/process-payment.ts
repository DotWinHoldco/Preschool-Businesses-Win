'use server'

// @anchor: cca.billing.process-payment
// Process payment for an invoice (Stripe integration placeholder).

import { headers } from 'next/headers'
import { createTenantServerClient } from '@/lib/supabase/server'
import { ProcessPaymentSchema } from '@/lib/schemas/billing'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

export type ProcessPaymentState = {
  ok: boolean
  error?: string
  payment_id?: string
}

export async function processPayment(
  _prev: ProcessPaymentState,
  formData: FormData,
): Promise<ProcessPaymentState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = ProcessPaymentSchema.safeParse({
      ...raw,
      amount_cents: raw.amount_cents ? Number(raw.amount_cents) : undefined,
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { invoice_id, amount_cents, method, stripe_payment_intent_id, notes } = parsed.data
    const headerStore = await headers()
    const tenantId = headerStore.get('x-tenant-id') ?? CCA_TENANT_ID
    const supabase = await createTenantServerClient()

    // Fetch the invoice
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('id, family_id, total_cents, status')
      .eq('id', invoice_id)
      .single()

    if (invErr || !invoice) {
      return { ok: false, error: 'Invoice not found' }
    }

    if (invoice.status === 'paid') {
      return { ok: false, error: 'Invoice is already paid' }
    }

    if (invoice.status === 'voided') {
      return { ok: false, error: 'Invoice has been voided' }
    }

    // TODO: Stripe payment intent creation/confirmation for card/ach
    // For now, record the payment directly

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        family_id: invoice.family_id,
        invoice_id,
        amount_cents,
        method,
        stripe_payment_intent_id: stripe_payment_intent_id ?? null,
        status: method === 'cash' || method === 'check' ? 'succeeded' : 'pending',
        paid_at: new Date().toISOString(),
        notes,
      })
      .select('id')
      .single()

    if (payErr || !payment) {
      return { ok: false, error: payErr?.message ?? 'Failed to process payment' }
    }

    // Update invoice status if fully paid
    if (amount_cents >= invoice.total_cents) {
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoice_id)
    }

    return { ok: true, payment_id: payment.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
