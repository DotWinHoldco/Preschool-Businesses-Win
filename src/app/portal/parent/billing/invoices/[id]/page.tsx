// @anchor: cca.billing.parent-invoice
// Parent invoice view with payment option.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { InvoiceDetail } from '@/components/portal/billing/invoice-detail'
import { PaymentForm } from '@/components/portal/billing/payment-form'

export default async function ParentInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Get families this user belongs to
  const { data: memberships } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
  const familyIds = memberships?.map((m) => m.family_id) ?? []

  if (familyIds.length === 0) notFound()

  // Fetch the invoice — must belong to one of this user's families
  const { data: invoice } = await supabase
    .from('invoices')
    .select(
      'id, invoice_number, family_id, period_start, period_end, due_date, status, subtotal_cents, discounts_cents, tax_cents, total_cents, paid_at',
    )
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .in('family_id', familyIds)
    .single()

  if (!invoice) notFound()

  // Fetch invoice line items
  const { data: lineItems } = await supabase
    .from('invoice_lines')
    .select('id, description, quantity, unit_amount_cents, total_cents, category')
    .eq('invoice_id', invoice.id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  // Fetch the family name
  const { data: family } = await supabase
    .from('families')
    .select('family_name')
    .eq('id', invoice.family_id)
    .eq('tenant_id', tenantId)
    .single()

  // Fetch payments for this invoice
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount_cents, method, status, paid_at')
    .eq('invoice_id', invoice.id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const needsPayment = invoice.status !== 'paid' && invoice.status !== 'voided'

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <Link
        href="/portal/parent/billing"
        className="text-sm text-[var(--color-primary)] hover:underline"
      >
        &larr; Back to billing
      </Link>

      <InvoiceDetail
        invoiceNumber={invoice.invoice_number ?? `INV-${invoice.id.slice(0, 8).toUpperCase()}`}
        familyName={family?.family_name ?? 'Your Family'}
        periodStart={invoice.period_start ?? ''}
        periodEnd={invoice.period_end ?? ''}
        dueDate={invoice.due_date ?? ''}
        status={invoice.status}
        lineItems={(lineItems ?? []).map((li) => ({
          id: li.id,
          description: li.description ?? '',
          quantity: li.quantity ?? 1,
          unit_amount_cents: li.unit_amount_cents ?? 0,
          total_cents: li.total_cents ?? 0,
          category: li.category ?? '',
        }))}
        subtotalCents={invoice.subtotal_cents}
        discountsCents={invoice.discounts_cents}
        taxCents={invoice.tax_cents}
        totalCents={invoice.total_cents}
        paidAt={invoice.paid_at}
      />

      {/* Payment history */}
      {(payments ?? []).length > 0 && (
        <div className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
            Payment History
          </h3>
          <div className="flex flex-col gap-2">
            {(payments ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm border-b border-[var(--color-border)]/50 pb-2 last:border-0"
              >
                <div>
                  <p className="text-[var(--color-foreground)] capitalize">{p.method}</p>
                  {p.paid_at && (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {new Date(p.paid_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--color-foreground)]">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      p.amount_cents / 100,
                    )}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      p.status === 'completed' || p.status === 'succeeded'
                        ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                        : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {needsPayment && <PaymentForm invoiceId={id} amountCents={invoice.total_cents} />}
    </div>
  )
}
