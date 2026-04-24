'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { saveBillingSettings } from '@/lib/actions/settings/save-actions'
import type { BillingSettings } from '@/lib/schemas/settings'

interface Props {
  initialValues: BillingSettings
}

type PaymentMethod = BillingSettings['accepted_methods'][number]

const METHOD_OPTIONS: Array<{ key: PaymentMethod; label: string }> = [
  { key: 'credit_card', label: 'Credit / Debit Card' },
  { key: 'ach', label: 'ACH Bank Transfer' },
  { key: 'check', label: 'Check' },
  { key: 'cash', label: 'Cash' },
]

export function BillingSettingsForm({ initialValues }: Props) {
  const [form, setForm] = useState<BillingSettings>(initialValues)
  const [isPending, startTransition] = useTransition()

  function toggleMethod(method: PaymentMethod, checked: boolean) {
    setForm((f) => {
      const set = new Set(f.accepted_methods)
      if (checked) set.add(method)
      else set.delete(method)
      return { ...f, accepted_methods: Array.from(set) }
    })
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveBillingSettings(form)
      if (result.ok) {
        toast({ variant: 'success', title: 'Billing settings saved' })
      } else {
        toast({ variant: 'error', title: 'Save failed', description: result.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal/admin/settings"
          className="text-sm hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          &larr; Back to Settings
        </Link>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Billing Configuration
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Payment methods, late fees, grace periods, and processing fee settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="late-fees-enabled"
                checked={form.late_fees_enabled}
                onChange={(e) => setForm((f) => ({ ...f, late_fees_enabled: e.target.checked }))}
                className="rounded"
              />
              <label
                htmlFor="late-fees-enabled"
                className="text-sm"
                style={{ color: 'var(--color-foreground)' }}
              >
                Charge late fees on overdue invoices
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Late Fee (flat, $)
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={(form.late_fee_amount_cents / 100).toFixed(2)}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      late_fee_amount_cents: Math.max(0, Math.round(Number(e.target.value) * 100)),
                    }))
                  }
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Late Fee (%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.late_fee_percent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, late_fee_percent: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Grace Period (days)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.grace_period_days}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, grace_period_days: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="fee-passthrough"
                checked={form.processing_fee_passthrough}
                onChange={(e) =>
                  setForm((f) => ({ ...f, processing_fee_passthrough: e.target.checked }))
                }
                className="rounded"
              />
              <label
                htmlFor="fee-passthrough"
                className="text-sm"
                style={{ color: 'var(--color-foreground)' }}
              >
                Pass processing fees to parents (adds ~2.9% + 30¢ to card payments)
              </label>
            </div>

            <div>
              <label
                className="text-xs font-medium block mb-2"
                style={{ color: 'var(--color-foreground)' }}
              >
                Accepted Payment Methods
              </label>
              <div className="space-y-2">
                {METHOD_OPTIONS.map(({ key, label }) => {
                  const checked = form.accepted_methods.includes(key)
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`accept-${key}`}
                        checked={checked}
                        onChange={(e) => toggleMethod(key, e.target.checked)}
                        className="rounded"
                      />
                      <label
                        htmlFor={`accept-${key}`}
                        className="text-sm"
                        style={{ color: 'var(--color-foreground)' }}
                      >
                        {label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
