'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'

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

export function BillingActions() {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState('April')
  const [year, setYear] = useState('2026')
  const [scope, setScope] = useState<'all' | 'select'>('all')
  const [dryRun, setDryRun] = useState(true)

  function close() {
    setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const count = Math.floor(Math.random() * 20) + 5
    const mode = dryRun ? 'would be' : 'will be'
    alert(
      `${count} invoices ${mode} generated for ${scope === 'all' ? 'all families' : 'selected families'} - ${month} ${year}`,
    )
    close()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Billing</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Revenue and invoice management
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/portal/admin/billing/plans"
            className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium min-h-[44px] inline-flex items-center hover:bg-[var(--color-muted)] transition-colors"
          >
            Plans
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2 text-sm font-semibold min-h-[44px] hover:brightness-110 transition-all"
          >
            Generate Invoices
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && close()}>
        <DialogOverlay onClick={close} />
        <DialogContent
          title="Generate Invoices"
          description="Create invoices for a billing period."
        >
          <DialogClose onClick={close} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Month
                </label>
                <Select value={month} onChange={(e) => setMonth(e.target.value)} required>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Year
                </label>
                <Select value={year} onChange={(e) => setYear(e.target.value)} required>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Families
              </label>
              <Select value={scope} onChange={(e) => setScope(e.target.value as 'all' | 'select')}>
                <option value="all">All Families</option>
                <option value="select">Select Families</option>
              </Select>
            </div>

            <Checkbox
              label="Dry run (preview only, no invoices sent)"
              checked={dryRun}
              onChange={(e) => setDryRun((e.target as HTMLInputElement).checked)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {dryRun ? 'Preview Invoices' : 'Generate Invoices'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
