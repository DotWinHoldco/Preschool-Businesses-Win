'use client'

// @anchor: cca.subsidy.claim-row-actions
import { useState } from 'react'
import { CheckCircle, DollarSign, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import {
  markSubsidyClaimSubmitted,
  markSubsidyClaimPaid,
  cancelSubsidyClaim,
} from '@/lib/actions/subsidies/manage-claim'

interface SubsidyClaimRowActionsProps {
  claim: {
    id: string
    status: string
    total_claimed_cents: number
    total_paid_cents: number | null
  }
}

export function SubsidyClaimRowActions({ claim }: SubsidyClaimRowActionsProps) {
  const [paidOpen, setPaidOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [paidCents, setPaidCents] = useState<string>(
    ((claim.total_paid_cents ?? claim.total_claimed_cents) / 100).toFixed(2),
  )
  const [cancelReason, setCancelReason] = useState('')
  const [loading, setLoading] = useState<null | 'submit' | 'pay' | 'cancel'>(null)

  const isDraft = claim.status === 'draft'
  const canPay = claim.status === 'submitted' || claim.status === 'partially_paid'
  const canCancel = claim.status === 'draft' || claim.status === 'submitted'

  async function handleSubmitted() {
    setLoading('submit')
    try {
      const result = await markSubsidyClaimSubmitted({ id: claim.id })
      if (!result.ok) {
        toast({ variant: 'error', title: 'Failed to mark submitted', description: result.error })
        return
      }
      toast({ variant: 'success', title: 'Claim marked submitted' })
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setLoading(null)
    }
  }

  async function handlePaid(e: React.FormEvent) {
    e.preventDefault()
    setLoading('pay')
    try {
      const cents = Math.round(parseFloat(paidCents) * 100)
      if (!Number.isFinite(cents) || cents < 0) {
        toast({ variant: 'error', title: 'Invalid amount' })
        return
      }
      const result = await markSubsidyClaimPaid({ id: claim.id, total_paid_cents: cents })
      if (!result.ok) {
        toast({ variant: 'error', title: 'Failed to mark paid', description: result.error })
        return
      }
      toast({ variant: 'success', title: 'Payment recorded' })
      setPaidOpen(false)
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setLoading(null)
    }
  }

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault()
    setLoading('cancel')
    try {
      const result = await cancelSubsidyClaim({
        id: claim.id,
        reason: cancelReason.trim() || undefined,
      })
      if (!result.ok) {
        toast({ variant: 'error', title: 'Failed to cancel', description: result.error })
        return
      }
      toast({ variant: 'success', title: 'Claim cancelled' })
      setCancelOpen(false)
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {isDraft && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSubmitted}
          loading={loading === 'submit'}
          className="h-8 min-w-0 px-2 text-xs"
        >
          <CheckCircle className="h-3 w-3" /> Submit
        </Button>
      )}
      {canPay && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setPaidOpen(true)}
          className="h-8 min-w-0 px-2 text-xs"
        >
          <DollarSign className="h-3 w-3" /> Mark paid
        </Button>
      )}
      {canCancel && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setCancelOpen(true)}
          className="h-8 min-w-0 px-2 text-xs text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
        >
          <XCircle className="h-3 w-3" /> Cancel
        </Button>
      )}

      <Dialog open={paidOpen} onOpenChange={setPaidOpen}>
        <DialogOverlay onClick={() => setPaidOpen(false)} />
        <DialogContent
          title="Mark claim paid"
          description="Enter the total amount received from the agency. Amounts less than the claim total will be recorded as a partial payment."
        >
          <DialogClose onClick={() => setPaidOpen(false)} />
          <form onSubmit={handlePaid} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Amount received (USD)
              </label>
              <Input
                inputSize="sm"
                type="number"
                step="0.01"
                min={0}
                value={paidCents}
                onChange={(e) => setPaidCents(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Claimed: ${(claim.total_claimed_cents / 100).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPaidOpen(false)}
                disabled={loading === 'pay'}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={loading === 'pay'}>
                Record payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogOverlay onClick={() => setCancelOpen(false)} />
        <DialogContent
          title="Cancel claim"
          description="Cancelling sets the claim to 'denied' with your reason as the denial note. This cannot be undone."
        >
          <DialogClose onClick={() => setCancelOpen(false)} />
          <form onSubmit={handleCancel} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Reason (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                placeholder="e.g. duplicate of claim #1234"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCancelOpen(false)}
                disabled={loading === 'cancel'}
              >
                Keep claim
              </Button>
              <Button type="submit" variant="danger" size="sm" loading={loading === 'cancel'}>
                Cancel claim
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
