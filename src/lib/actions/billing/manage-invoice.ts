// @anchor: cca.billing.manage-invoice
// Admin server actions for recording payments, sending reminders, and voiding invoices.
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import {
  RecordPaymentSchema,
  VoidInvoiceSchema,
  type RecordPaymentInput,
  type VoidInvoiceInput,
} from '@/lib/schemas/billing'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type InvoiceActionState = {
  ok: boolean
  error?: string
  id?: string
}

export async function recordPayment(input: RecordPaymentInput): Promise<InvoiceActionState> {
  try {
    await assertRole('admin')

    const parsed = RecordPaymentSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { invoice_id, amount_cents, method, reference, notes } = parsed.data
    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('id, family_id, total_cents, amount_paid_cents, status')
      .eq('id', invoice_id)
      .eq('tenant_id', tenantId)
      .single()

    if (invErr || !invoice) {
      return { ok: false, error: 'Invoice not found' }
    }
    if (invoice.status === 'paid') {
      return { ok: false, error: 'Invoice is already paid' }
    }
    if (invoice.status === 'voided' || invoice.status === 'void') {
      return { ok: false, error: 'Invoice has been voided' }
    }

    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        family_id: invoice.family_id,
        invoice_id,
        amount_cents,
        method,
        status: 'succeeded',
        paid_at: new Date().toISOString(),
        notes: [reference ? `Ref: ${reference}` : null, notes].filter(Boolean).join(' — ') || null,
      })
      .select('id')
      .single()

    if (payErr || !payment) {
      return { ok: false, error: payErr?.message ?? 'Failed to record payment' }
    }

    const newPaid = (invoice.amount_paid_cents ?? 0) + amount_cents
    const newStatus = newPaid >= (invoice.total_cents ?? 0) ? 'paid' : invoice.status

    const invoiceUpdate: Record<string, unknown> = { amount_paid_cents: newPaid, status: newStatus }
    if (newStatus === 'paid') {
      invoiceUpdate.paid_at = new Date().toISOString()
    }

    await supabase
      .from('invoices')
      .update(invoiceUpdate)
      .eq('id', invoice_id)
      .eq('tenant_id', tenantId)

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'billing.payment.recorded',
      entityType: 'payment',
      entityId: payment.id,
      after: { invoice_id, amount_cents, method, reference, family_id: invoice.family_id },
    })

    revalidatePath(`/portal/admin/billing/invoices/${invoice_id}`)
    revalidatePath('/portal/admin/billing/invoices')
    revalidatePath('/portal/admin/billing')
    return { ok: true, id: payment.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function sendInvoiceReminder(invoiceId: string): Promise<InvoiceActionState> {
  try {
    await assertRole('admin')

    if (typeof invoiceId !== 'string' || invoiceId.length === 0) {
      return { ok: false, error: 'Invalid invoice ID' }
    }

    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('id, family_id, status, due_date')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single()

    if (invErr || !invoice) {
      return { ok: false, error: 'Invoice not found' }
    }

    // TODO: real email integration — log reminder intent for now
    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'billing.invoice.reminder_sent',
      entityType: 'invoice',
      entityId: invoiceId,
      after: { family_id: invoice.family_id, due_date: invoice.due_date, status: invoice.status },
    })

    revalidatePath(`/portal/admin/billing/invoices/${invoiceId}`)
    return { ok: true, id: invoiceId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function voidInvoice(input: VoidInvoiceInput): Promise<InvoiceActionState> {
  try {
    await assertRole('admin')

    const parsed = VoidInvoiceSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { invoice_id, reason } = parsed.data
    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    const { data: before, error: invErr } = await supabase
      .from('invoices')
      .select('id, status, notes')
      .eq('id', invoice_id)
      .eq('tenant_id', tenantId)
      .single()

    if (invErr || !before) {
      return { ok: false, error: 'Invoice not found' }
    }
    if (before.status === 'paid') {
      return { ok: false, error: 'Cannot void a paid invoice' }
    }

    const existingNotes = typeof before.notes === 'string' ? before.notes : ''
    const stamp = new Date().toISOString()
    const mergedNotes = [existingNotes, `[${stamp}] Voided: ${reason}`].filter(Boolean).join('\n')

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'void', notes: mergedNotes })
      .eq('id', invoice_id)
      .eq('tenant_id', tenantId)

    if (error) {
      // Some tables use 'voided' — fall back
      const { error: err2 } = await supabase
        .from('invoices')
        .update({ status: 'voided', notes: mergedNotes })
        .eq('id', invoice_id)
        .eq('tenant_id', tenantId)
      if (err2) {
        return { ok: false, error: err2.message }
      }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'billing.invoice.voided',
      entityType: 'invoice',
      entityId: invoice_id,
      before: { status: before.status },
      after: { status: 'void', reason },
    })

    revalidatePath(`/portal/admin/billing/invoices/${invoice_id}`)
    revalidatePath('/portal/admin/billing/invoices')
    revalidatePath('/portal/admin/billing')
    return { ok: true, id: invoice_id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
