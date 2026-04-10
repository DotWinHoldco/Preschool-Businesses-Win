'use client'

// @anchor: cca.billing.payment-form
// Payment form with Stripe Elements placeholder.

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { CreditCard, Building2, DollarSign } from 'lucide-react'

interface PaymentFormProps {
  invoiceId: string
  amountCents: number
  onSuccess?: () => void
  className?: string
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function PaymentForm({ invoiceId, amountCents, onSuccess, className }: PaymentFormProps) {
  const [method, setMethod] = useState<'card' | 'ach'>('ach')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProcessing(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.set('invoice_id', invoiceId)
      fd.set('amount_cents', String(amountCents))
      fd.set('method', method)

      // TODO: Create Stripe PaymentIntent and confirm with Elements
      // For now, simulate a successful payment
      const res = await fetch('/api/billing/pay', { method: 'POST', body: fd })

      if (res.ok) {
        onSuccess?.()
      } else {
        setError('Payment failed. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-6',
        className,
      )}
    >
      <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
        Make a Payment
      </h3>

      {/* Amount */}
      <div className="mb-6 flex items-center gap-3 rounded-[var(--radius,0.75rem)] bg-[var(--color-muted)] p-4">
        <DollarSign size={20} className="text-[var(--color-primary)]" />
        <div>
          <p className="text-xs text-[var(--color-muted-foreground)]">Amount due</p>
          <p className="text-2xl font-bold text-[var(--color-foreground)]">
            {formatCurrency(amountCents)}
          </p>
        </div>
      </div>

      {/* Payment method selection */}
      <div className="mb-4">
        <p className="text-sm font-medium text-[var(--color-foreground)] mb-2">Payment Method</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMethod('ach')}
            className={cn(
              'flex-1 flex items-center gap-2 rounded-[var(--radius,0.75rem)] border-2 p-3 min-h-[48px]',
              'transition-colors',
              method === 'ach'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)]',
            )}
          >
            <Building2 size={18} className={method === 'ach' ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'} />
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--color-foreground)]">Bank (ACH)</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Lower fees</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={cn(
              'flex-1 flex items-center gap-2 rounded-[var(--radius,0.75rem)] border-2 p-3 min-h-[48px]',
              'transition-colors',
              method === 'card'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-[var(--color-border)]',
            )}
          >
            <CreditCard size={18} className={method === 'card' ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'} />
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--color-foreground)]">Card</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Debit or credit</p>
            </div>
          </button>
        </div>
      </div>

      {/* Stripe Elements placeholder */}
      <div className="mb-6 rounded-[var(--radius,0.75rem)] border border-dashed border-[var(--color-border)] p-6 text-center">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {method === 'ach'
            ? 'Stripe ACH bank connection will appear here'
            : 'Stripe Card Element will appear here'}
        </p>
        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
          Secure payment powered by Stripe
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 rounded-[var(--radius,0.75rem)] bg-[var(--color-destructive)]/10 p-3">
          <p className="text-sm text-[var(--color-destructive)]">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={processing}
        className={cn(
          'w-full rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
          'px-4 py-3 text-sm font-semibold min-h-[48px]',
          'hover:brightness-110 disabled:opacity-50 transition-all',
        )}
      >
        {processing ? 'Processing...' : `Pay ${formatCurrency(amountCents)}`}
      </button>
    </form>
  )
}
