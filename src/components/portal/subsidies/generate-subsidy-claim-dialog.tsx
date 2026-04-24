'use client'

// @anchor: cca.subsidy.generate-claim-dialog
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { generateSubsidyClaim } from '@/lib/actions/subsidies/generate-claim'

interface AgencyOption {
  id: string
  name: string
}

interface GenerateSubsidyClaimDialogProps {
  agencies: AgencyOption[]
}

function firstOfMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function GenerateSubsidyClaimDialog({ agencies }: GenerateSubsidyClaimDialogProps) {
  const [open, setOpen] = useState(false)
  const [agencyId, setAgencyId] = useState(agencies[0]?.id ?? '')
  const [periodStart, setPeriodStart] = useState(firstOfMonth())
  const [periodEnd, setPeriodEnd] = useState(today())
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const disabled = agencies.length === 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    if (!agencyId) {
      toast({
        variant: 'error',
        title: 'Pick an agency',
        description: 'You must select an agency before generating a claim.',
      })
      return
    }

    setSubmitting(true)
    try {
      const result = await generateSubsidyClaim({
        agency_id: agencyId,
        claim_period_start: periodStart,
        claim_period_end: periodEnd,
        notes: notes.trim() || undefined,
      })

      if (!result.ok) {
        toast({
          variant: 'error',
          title: 'Failed to generate claim',
          description: result.error ?? 'Unknown error',
        })
        return
      }

      toast({
        variant: 'success',
        title: 'Subsidy claim generated',
        description: `${result.summary?.line_count ?? 0} line(s), $${((result.summary?.total_claimed_cents ?? 0) / 100).toFixed(2)}`,
      })
      setOpen(false)
      setNotes('')
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Failed to generate claim',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? 'Add an agency first' : undefined}
        className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" /> Generate Claim
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay onClick={() => setOpen(false)} />
        <DialogContent
          title="Generate Subsidy Claim"
          description="Aggregate attendance for active family subsidies at a chosen agency."
        >
          <DialogClose onClick={() => setOpen(false)} />
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Agency *
              </label>
              <select
                value={agencyId}
                onChange={(e) => setAgencyId(e.target.value)}
                required
                className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
              >
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Period start *
                </label>
                <Input
                  inputSize="sm"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Period end *
                </label>
                <Input
                  inputSize="sm"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                placeholder="Any additional context for this claim"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={submitting}>
                Generate Claim
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
