// @anchor: cca.billing.parent-overview
// Parent billing overview — outstanding balance, recent invoices, payment methods.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceList } from '@/components/portal/billing/invoice-list'
import { DollarSign, CreditCard, FileText } from 'lucide-react'

export default async function ParentBillingPage() {
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
  const familyIds = memberships?.map(m => m.family_id) ?? []

  // Fetch invoices for this family
  const { data: invoices } = familyIds.length > 0
    ? await supabase
        .from('invoices')
        .select('id, invoice_number, period_start, period_end, total_cents, status, due_date, paid_at, created_at')
        .eq('tenant_id', tenantId)
        .in('family_id', familyIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const invoiceList = invoices ?? []

  // Compute outstanding balance (draft + sent invoices)
  const outstandingCents = invoiceList
    .filter(inv => inv.status === 'draft' || inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total_cents, 0)

  // Find next due date from outstanding invoices
  const outstandingInvoices = invoiceList
    .filter(inv => inv.status === 'draft' || inv.status === 'sent' || inv.status === 'overdue')
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
  const nextDueDate = outstandingInvoices[0]?.due_date ?? null

  // Find last payment date
  const lastPaidInvoice = invoiceList
    .filter(inv => inv.status === 'paid' && inv.paid_at)
    .sort((a, b) => (b.paid_at ?? '').localeCompare(a.paid_at ?? ''))
  const lastPaymentDate = lastPaidInvoice[0]?.paid_at ?? null

  // Find the first unpaid invoice for the "Pay Now" link
  const firstUnpaidInvoice = outstandingInvoices[0] ?? null

  function fmt(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Billing</h1>

      {/* Outstanding balance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                <DollarSign size={24} className="text-[var(--color-primary)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted-foreground)]">Current balance</p>
                <p className="text-3xl font-bold text-[var(--color-foreground)]">
                  {fmt(outstandingCents)}
                </p>
                {nextDueDate && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Due {formatDate(nextDueDate)}
                  </p>
                )}
                {!nextDueDate && outstandingCents === 0 && (
                  <p className="text-xs text-[var(--color-success)]">
                    All paid up
                  </p>
                )}
              </div>
            </div>
            {firstUnpaidInvoice && (
              <a
                href={`/portal/parent/billing/invoices/${firstUnpaidInvoice.id}`}
                className="rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-6 py-3 text-sm font-semibold min-h-[48px] hover:brightness-110 transition-all inline-flex items-center"
              >
                Pay Now
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment method + last payment */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard size={16} />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Contact your school to set up online payments.
            </p>
            <a
              href="/portal/parent/billing/payment-methods"
              className="text-xs text-[var(--color-primary)] hover:underline mt-1 inline-block"
            >
              Manage payment methods
            </a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} />
              Last Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastPaymentDate ? (
              <p className="text-sm text-[var(--color-foreground)]">
                {formatDate(lastPaymentDate)}
              </p>
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No payments recorded yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice history */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoiceList.length > 0 ? (
            <InvoiceList
              invoices={invoiceList}
              basePath="/portal/parent/billing/invoices"
            />
          ) : (
            <div className="rounded-[var(--radius,0.75rem)] border border-dashed border-[var(--color-border)] p-8 text-center">
              <FileText size={32} className="mx-auto mb-2 text-[var(--color-muted-foreground)]" />
              <p className="text-sm text-[var(--color-muted-foreground)]">No invoices yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
