'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsBillingPage() {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    late_fee_percent: 5,
    grace_period_days: 5,
    processing_fee_passthrough: false,
    accept_credit_card: true,
    accept_ach: true,
    accept_check: true,
    accept_cash: true,
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-foreground)' }}>Late Fee (%)</label>
                <Input type="number" min={0} max={100} step={0.5} value={form.late_fee_percent} onChange={(e) => setForm(f => ({ ...f, late_fee_percent: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-foreground)' }}>Grace Period (days)</label>
                <Input type="number" min={0} value={form.grace_period_days} onChange={(e) => setForm(f => ({ ...f, grace_period_days: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="fee-passthrough"
                checked={form.processing_fee_passthrough}
                onChange={(e) => setForm(f => ({ ...f, processing_fee_passthrough: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="fee-passthrough" className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                Pass processing fees to parents (adds ~2.9% + 30¢ to card payments)
              </label>
            </div>

            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-foreground)' }}>Accepted Payment Methods</label>
              <div className="space-y-2">
                {[
                  { key: 'accept_credit_card', label: 'Credit / Debit Card' },
                  { key: 'accept_ach', label: 'ACH Bank Transfer' },
                  { key: 'accept_check', label: 'Check' },
                  { key: 'accept_cash', label: 'Cash' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={key}
                      checked={form[key as keyof typeof form] as boolean}
                      onChange={(e) => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor={key} className="text-sm" style={{ color: 'var(--color-foreground)' }}>{label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit">Save Changes</Button>
              {saved && <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Saved successfully</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
