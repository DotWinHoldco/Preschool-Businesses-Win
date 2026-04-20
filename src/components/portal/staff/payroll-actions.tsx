'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PayrollActions() {
  const [approved, setApproved] = useState(false)
  const [exported, setExported] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        <Button
          disabled={approved}
          onClick={() => {
            if (confirm('Approve this payroll run? This will lock the period.')) {
              setApproved(true)
            }
          }}
        >
          {approved ? 'Approved ✓' : 'Approve Payroll'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setExported('quickbooks')
            alert('CSV exported for QuickBooks (3 staff, $3,307.00 gross)')
          }}
        >
          Export CSV (QuickBooks)
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setExported('adp')
            alert('CSV exported for ADP (3 staff, $3,307.00 gross)')
          }}
        >
          Export CSV (ADP)
        </Button>
      </div>
      {approved && (
        <p className="text-xs text-[var(--color-primary)]">Payroll approved and locked.</p>
      )}
      {exported && (
        <p className="text-xs text-[var(--color-muted-foreground)]">Last export: {exported} format</p>
      )}
    </div>
  )
}
