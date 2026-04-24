'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { saveProfileSettings } from '@/lib/actions/settings/save-actions'
import type { ProfileSettings } from '@/lib/schemas/settings'

interface Props {
  initialValues: ProfileSettings
}

export function ProfileSettingsForm({ initialValues }: Props) {
  const [form, setForm] = useState<ProfileSettings>(initialValues)
  const [isPending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveProfileSettings(form)
      if (result.ok) {
        toast({ variant: 'success', title: 'Profile saved' })
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
          School Profile
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Name, address, contact information, and timezone.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  School Name
                </label>
                <Input
                  value={form.school_name}
                  onChange={(e) => setForm((f) => ({ ...f, school_name: e.target.value }))}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Phone
                </label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Email
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Tax ID
                </label>
                <Input
                  value={form.tax_id}
                  onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value }))}
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Address Line 1
                </label>
                <Input
                  value={form.address_line1}
                  onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Address Line 2
                </label>
                <Input
                  value={form.address_line2}
                  onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))}
                  placeholder="Suite, unit, etc."
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  City
                </label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="text-xs font-medium block mb-1"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    State
                  </label>
                  <Input
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  />
                </div>
                <div>
                  <label
                    className="text-xs font-medium block mb-1"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    ZIP
                  </label>
                  <Input
                    value={form.zip}
                    onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                className="text-xs font-medium block mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Timezone
              </label>
              <select
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                }}
              >
                <option value="America/New_York">Eastern (America/New_York)</option>
                <option value="America/Chicago">Central (America/Chicago)</option>
                <option value="America/Denver">Mountain (America/Denver)</option>
                <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
              </select>
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
