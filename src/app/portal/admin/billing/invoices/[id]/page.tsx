// @anchor: cca.billing.admin-invoice-detail
// Admin invoice detail — real Supabase data with record payment / reminder / void actions.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { InvoiceDetail } from '@/components/portal/billing/invoice-detail'
import { AdminInvoiceActions } from '@/components/portal/billing/admin-invoice-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!invoice) notFound()

  const [{ data: lines }, { data: payments }, { data: family }] = await Promise.all([
    supabase
      .from('invoice_lines')
      .select('id, description, quantity, unit_amount_cents, total_cents, category')
      .eq('invoice_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true }),
    supabase
      .from('payments')
      .select('id, amount_cents, method, status, paid_at, notes, created_at')
      .eq('invoice_id', id)
      .eq('tenant_id', tenantId)
      .order('paid_at', { ascending: false }),
    invoice.family_id
      ? supabase
          .from('families')
          .select('id, family_name, billing_email')
          .eq('id', invoice.family_id)
          .eq('tenant_id', tenantId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const totalCents = (invoice.total_cents as number) ?? 0
  const amountPaidCents = (invoice.amount_paid_cents as number) ?? 0
  const subtotalCents = (invoice.subtotal_cents as number) ?? totalCents
  const discountsCents = (invoice as { discounts_cents?: number }).discounts_cents ?? 0
  const taxCents = (invoice as { tax_cents?: number }).tax_cents ?? 0
  const status = (invoice.status as string) ?? 'draft'

  const invoiceNumber =
    (invoice as { invoice_number?: string }).invoice_number ||
    `INV-${String(id).slice(0, 8).toUpperCase()}`

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <Link
        href="/portal/admin/billing/invoices"
        className="text-sm text-[var(--color-primary)] hover:underline"
      >
        &larr; Back to invoices
      </Link>

      <InvoiceDetail
        invoiceNumber={invoiceNumber}
        familyName={family?.family_name ?? 'Unknown family'}
        periodStart={invoice.period_start as string}
        periodEnd={invoice.period_end as string}
        dueDate={invoice.due_date as string}
        status={status}
        lineItems={(lines ?? []).map((l) => ({
          id: l.id as string,
          description: l.description as string,
          quantity: (l.quantity as number) ?? 1,
          unit_amount_cents: (l.unit_amount_cents as number) ?? 0,
          total_cents: (l.total_cents as number) ?? 0,
          category: (l.category as string) ?? 'other',
        }))}
        subtotalCents={subtotalCents}
        discountsCents={discountsCents}
        taxCents={taxCents}
        totalCents={totalCents}
        paidAt={(invoice as { paid_at?: string | null }).paid_at ?? null}
      />

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-3">
            Paid {formatCurrency(amountPaidCents)} of {formatCurrency(totalCents)}
          </p>
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No payments recorded.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {(payments ?? []).map((p) => (
                <li key={p.id as string} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)] capitalize">
                      {(p.method as string) ?? 'payment'}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {formatDateTime((p.paid_at as string) ?? (p.created_at as string))}
                    </p>
                    {p.notes ? (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                        {p.notes as string}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">
                      {formatCurrency((p.amount_cents as number) ?? 0)}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)] capitalize">
                      {(p.status as string) ?? ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Admin actions */}
      <AdminInvoiceActions
        invoiceId={id}
        totalCents={totalCents}
        amountPaidCents={amountPaidCents}
        status={status}
      />
    </div>
  )
}
