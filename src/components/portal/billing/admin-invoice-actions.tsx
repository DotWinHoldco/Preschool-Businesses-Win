'use client'

// @anchor: cca.billing.admin-invoice-actions
// Client-side action bar for invoice detail page: Record Payment / Send Reminder / Void.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import {
  recordPayment,
  sendInvoiceReminder,
  voidInvoice,
} from '@/lib/actions/billing/manage-invoice'

interface Props {
  invoiceId: string
  totalCents: number
  amountPaidCents: number
  status: string
}

export function AdminInvoiceActions({ invoiceId, totalCents, amountPaidCents, status }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dialog, setDialog] = useState<null | 'pay' | 'remind' | 'void'>(null)
  const [error, setError] = useState<string | null>(null)

  const outstanding = Math.max(0, totalCents - amountPaidCents)
  const [payAmount, setPayAmount] = useState(String((outstanding / 100).toFixed(2)))
  const [payMethod, setPayMethod] = useState('cash')
  const [payReference, setPayReference] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [voidReason, setVoidReason] = useState('')

  const isTerminal = status === 'paid' || status === 'void' || status === 'voided'

  function close() {
    setDialog(null)
    setError(null)
  }

  function handleRecord(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const cents = Math.round(parseFloat(payAmount) * 100)
    if (!Number.isFinite(cents) || cents <= 0) {
      setError('Enter a valid amount greater than 0')
      return
    }
    startTransition(async () => {
      const res = await recordPayment({
        invoice_id: invoiceId,
        amount_cents: cents,
        method: payMethod as 'cash' | 'check' | 'card' | 'ach' | 'other',
        reference: payReference || undefined,
        notes: payNotes || undefined,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed to record payment')
        return
      }
      close()
      router.refresh()
    })
  }

  function handleRemind() {
    setError(null)
    startTransition(async () => {
      const res = await sendInvoiceReminder(invoiceId)
      if (!res.ok) {
        setError(res.error ?? 'Failed to send reminder')
        return
      }
      close()
      router.refresh()
    })
  }

  function handleVoid(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!voidReason.trim()) {
      setError('Reason is required')
      return
    }
    startTransition(async () => {
      const res = await voidInvoice({ invoice_id: invoiceId, reason: voidReason.trim() })
      if (!res.ok) {
        setError(res.error ?? 'Failed to void invoice')
        return
      }
      close()
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex gap-3 flex-wrap">
        <Button type="button" onClick={() => setDialog('pay')} disabled={isTerminal}>
          Record Payment
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setDialog('remind')}
          disabled={isTerminal}
        >
          Send Reminder
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={() => setDialog('void')}
          disabled={isTerminal}
        >
          Void Invoice
        </Button>
      </div>

      <Dialog open={dialog === 'pay'} onOpenChange={(v) => !v && close()}>
        <DialogOverlay onClick={close} />
        <DialogContent title="Record Payment" description="Log a payment received outside Stripe.">
          <DialogClose onClick={close} />
          <form onSubmit={handleRecord} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Amount (USD)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Outstanding: ${(outstanding / 100).toFixed(2)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Method
              </label>
              <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
                <option value="ach">ACH / Bank transfer</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Reference (check #, confirmation, etc.)
              </label>
              <Input value={payReference} onChange={(e) => setPayReference(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Notes
              </label>
              <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
            </div>
            {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={pending}>
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'remind'} onOpenChange={(v) => !v && close()}>
        <DialogOverlay onClick={close} />
        <DialogContent
          title="Send Reminder"
          description="Email the family a reminder about this invoice."
        >
          <DialogClose onClick={close} />
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              A reminder will be logged to the audit trail. Email delivery integration is pending.
            </p>
            {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleRemind} loading={pending}>
                Send Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'void'} onOpenChange={(v) => !v && close()}>
        <DialogOverlay onClick={close} />
        <DialogContent
          title="Void Invoice"
          description="This cannot be undone. The invoice will be marked void."
        >
          <DialogClose onClick={close} />
          <form onSubmit={handleVoid} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Reason
              </label>
              <Textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                required
                placeholder="Why is this invoice being voided?"
              />
            </div>
            {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm" loading={pending}>
                Void Invoice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
