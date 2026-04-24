'use client'

// @anchor: cca.cacfp.generate-claim-dialog
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { generateCACFPClaim } from '@/lib/actions/food-program/generate-cacfp-claim'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function previousMonth(): { year: number; month: number } {
  const now = new Date()
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() === 0 ? 12 : now.getMonth()
  return { year, month }
}

export function GenerateCACFPClaimDialog() {
  const { year: defaultYear, month: defaultMonth } = previousMonth()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(defaultYear)
  const [month, setMonth] = useState(defaultMonth)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const yearOptions = Array.from({ length: 6 }, (_, i) => defaultYear - i)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      const result = await generateCACFPClaim({
        claim_year: year,
        claim_month: month,
        notes: notes.trim() || undefined,
      })

      if (!result.ok) {
        toast({
          variant: 'error',
          title: 'Failed to generate claim',
          description: result.error ?? 'An unexpected error occurred',
        })
        return
      }

      toast({
        variant: 'success',
        title: 'CACFP claim generated',
        description: `${MONTHS[month - 1]} ${year} — $${((result.summary?.total_reimbursement_cents ?? 0) / 100).toFixed(2)}`,
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
        className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" /> Generate Claim
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay onClick={() => setOpen(false)} />
        <DialogContent
          title="Generate CACFP Claim"
          description="Aggregate meal service records for the selected month into a reimbursement claim."
        >
          <DialogClose onClick={() => setOpen(false)} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                >
                  {MONTHS.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
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
                placeholder="Any context for this claim"
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
