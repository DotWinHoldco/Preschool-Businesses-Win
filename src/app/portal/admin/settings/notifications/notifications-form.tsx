'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { saveNotificationsSettings } from '@/lib/actions/settings/save-actions'
import type { NotificationsSettings } from '@/lib/schemas/settings'

interface Props {
  initialValues: NotificationsSettings
}

export function NotificationsSettingsForm({ initialValues }: Props) {
  const [form, setForm] = useState<NotificationsSettings>(initialValues)
  const [isPending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveNotificationsSettings(form)
      if (result.ok) {
        toast({ variant: 'success', title: 'Notification settings saved' })
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
          Notifications
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Default notification channels and quiet hours.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sender Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Email Sender Name
                </label>
                <Input
                  value={form.sender_name}
                  onChange={(e) => setForm((f) => ({ ...f, sender_name: e.target.value }))}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  SMS Sender ID
                </label>
                <Input
                  value={form.sms_sender_id}
                  onChange={(e) => setForm((f) => ({ ...f, sms_sender_id: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Quiet Hours Start
                </label>
                <Input
                  type="time"
                  value={form.quiet_hours_start}
                  onChange={(e) => setForm((f) => ({ ...f, quiet_hours_start: e.target.value }))}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Quiet Hours End
                </label>
                <Input
                  type="time"
                  value={form.quiet_hours_end}
                  onChange={(e) => setForm((f) => ({ ...f, quiet_hours_end: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              Non-urgent notifications will be held until quiet hours end.
            </p>

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
