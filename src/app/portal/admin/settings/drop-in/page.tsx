'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsDropInPage() {
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    cancellation_window_hours: 24,
    minimum_notice_hours: 4,
    max_consecutive_days: 5,
    require_immunization_records: true,
    require_emergency_contact: true,
    auto_confirm_regular: true,
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
          Drop-in Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Availability rules, cancellation policies, and booking requirements.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-foreground)' }}>Cancellation Window (hours)</label>
                <Input type="number" min={0} value={form.cancellation_window_hours} onChange={(e) => setForm(f => ({ ...f, cancellation_window_hours: Number(e.target.value) }))} />
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Parents must cancel this many hours before start time</p>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-foreground)' }}>Minimum Notice (hours)</label>
                <Input type="number" min={0} value={form.minimum_notice_hours} onChange={(e) => setForm(f => ({ ...f, minimum_notice_hours: Number(e.target.value) }))} />
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Bookings must be made this far in advance</p>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-foreground)' }}>Max Consecutive Days</label>
                <Input type="number" min={1} value={form.max_consecutive_days} onChange={(e) => setForm(f => ({ ...f, max_consecutive_days: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium block" style={{ color: 'var(--color-foreground)' }}>Requirements</label>
              {[
                { key: 'require_immunization_records', label: 'Require immunization records on file' },
                { key: 'require_emergency_contact', label: 'Require emergency contact on file' },
                { key: 'auto_confirm_regular', label: 'Auto-confirm bookings from regular families' },
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

            <div className="pt-2">
              <Link
                href="/portal/admin/drop-in?tab=rates"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                Manage rates and availability slots &rarr;
              </Link>
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
