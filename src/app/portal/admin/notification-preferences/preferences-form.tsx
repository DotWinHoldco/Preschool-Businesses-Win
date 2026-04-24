'use client'

// @anchor: cca.notifications.preferences-form
// Client form for notification preferences. Persists to notification_preferences
// via saveNotificationPreferences server action.

import { useState, useCallback, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { saveNotificationPreferences } from '@/lib/actions/notifications/preferences'
import type { NotificationPreferenceRow } from '@/lib/schemas/notifications'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Channel = 'email' | 'sms' | 'in_app'

interface NotificationRowDef {
  key: string
  label: string
  description: string
  channels: Channel[]
}

interface NotificationSection {
  title: string
  description: string
  rows: NotificationRowDef[]
}

type Preferences = Record<string, Record<Channel, boolean>>

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email',
  sms: 'SMS',
  in_app: 'In-app',
}

const SECTIONS: NotificationSection[] = [
  {
    title: 'Messages',
    description: 'Direct messages from families, staff, and administrators.',
    rows: [
      {
        key: 'messages_new',
        label: 'New messages',
        description: 'When someone sends you a direct message.',
        channels: ['email', 'sms', 'in_app'],
      },
      {
        key: 'messages_reply',
        label: 'Replies',
        description: 'When someone replies to a conversation you are in.',
        channels: ['email', 'sms', 'in_app'],
      },
    ],
  },
  {
    title: 'Attendance & Safety',
    description: 'Check-ins, absences, and safety alerts.',
    rows: [
      {
        key: 'attendance_checkin',
        label: 'Check-in / check-out',
        description: 'When a child is checked in or out.',
        channels: ['email', 'sms', 'in_app'],
      },
      {
        key: 'attendance_absence',
        label: 'Unreported absences',
        description: 'When a child is marked absent without prior notice.',
        channels: ['email', 'sms', 'in_app'],
      },
      {
        key: 'safety_alert',
        label: 'Safety alerts',
        description: 'Emergency drills, lockdowns, and incident reports.',
        channels: ['email', 'sms', 'in_app'],
      },
    ],
  },
  {
    title: 'Billing & Payments',
    description: 'Invoices, payment confirmations, and overdue notices.',
    rows: [
      {
        key: 'billing_invoice',
        label: 'New invoices',
        description: 'When a new invoice is generated.',
        channels: ['email', 'sms', 'in_app'],
      },
      {
        key: 'billing_payment',
        label: 'Payment received',
        description: 'Confirmation when a payment is processed.',
        channels: ['email', 'sms', 'in_app'],
      },
      {
        key: 'billing_overdue',
        label: 'Overdue notices',
        description: 'When a payment is past due.',
        channels: ['email', 'sms', 'in_app'],
      },
    ],
  },
]

function getDefaultPreferences(): Preferences {
  const prefs: Preferences = {}
  for (const section of SECTIONS) {
    for (const row of section.rows) {
      const isBilling = row.key.startsWith('billing_')
      prefs[row.key] = {
        email: true,
        sms: !isBilling,
        in_app: true,
      }
    }
  }
  return prefs
}

function mergeInitial(rows: NotificationPreferenceRow[]): Preferences {
  const prefs = getDefaultPreferences()
  for (const r of rows) {
    if (r.channel === 'push') continue // push not shown in this form
    if (!(r.notification_type in prefs)) continue
    if (!(r.channel in prefs[r.notification_type])) continue
    prefs[r.notification_type][r.channel as Channel] = r.enabled
  }
  return prefs
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-muted)',
      }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full shadow-sm transition-transform"
        style={{
          backgroundColor: checked
            ? 'var(--color-primary-foreground)'
            : 'var(--color-muted-foreground)',
          transform: checked ? 'translateX(1.375rem)' : 'translateX(0.25rem)',
        }}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

export function NotificationPreferencesForm({
  initialRows,
  loadError,
}: {
  initialRows: NotificationPreferenceRow[]
  loadError?: string
}) {
  const initial = useMemo(() => mergeInitial(initialRows), [initialRows])
  const [preferences, setPreferences] = useState<Preferences>(initial)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const togglePref = useCallback((rowKey: string, channel: Channel) => {
    setSaved(false)
    setPreferences((prev) => ({
      ...prev,
      [rowKey]: {
        ...prev[rowKey],
        [channel]: !prev[rowKey][channel],
      },
    }))
  }, [])

  const handleSave = useCallback(() => {
    setErr(null)
    const payload: NotificationPreferenceRow[] = []
    for (const section of SECTIONS) {
      for (const row of section.rows) {
        for (const channel of row.channels) {
          payload.push({
            notification_type: row.key,
            channel,
            enabled: preferences[row.key]?.[channel] ?? false,
          })
        }
      }
    }
    startTransition(async () => {
      const res = await saveNotificationPreferences(payload)
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setErr(res.error ?? 'Failed to save preferences')
      }
    })
  }, [preferences])

  return (
    <>
      {loadError && (
        <div
          className="rounded-[var(--radius,0.75rem)] border px-4 py-3 text-sm"
          style={{
            borderColor: 'var(--color-destructive)',
            color: 'var(--color-destructive)',
            backgroundColor: 'color-mix(in srgb, var(--color-destructive) 8%, transparent)',
          }}
        >
          Failed to load saved preferences — showing defaults. ({loadError})
        </div>
      )}

      {SECTIONS.map((section) => (
        <div
          key={section.title}
          className="overflow-hidden rounded-xl"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
              {section.title}
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {section.description}
            </p>
          </div>

          <div
            className="hidden sm:grid px-6 py-2 text-xs font-medium uppercase tracking-wider"
            style={{
              color: 'var(--color-muted-foreground)',
              borderBottom: '1px solid var(--color-border)',
              gridTemplateColumns: '1fr repeat(3, 5rem)',
              gap: '0.5rem',
            }}
          >
            <span>Type</span>
            <span className="text-center">Email</span>
            <span className="text-center">SMS</span>
            <span className="text-center">In-app</span>
          </div>

          {section.rows.map((row, rowIdx) => {
            const isLast = rowIdx === section.rows.length - 1
            return (
              <div
                key={row.key}
                className="px-6 py-4 sm:grid sm:items-center"
                style={{
                  borderBottom: isLast ? undefined : '1px solid var(--color-border)',
                  gridTemplateColumns: '1fr repeat(3, 5rem)',
                  gap: '0.5rem',
                }}
              >
                <div className="mb-3 sm:mb-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {row.description}
                  </p>
                </div>

                {(['email', 'sms', 'in_app'] as Channel[]).map((channel) => (
                  <div
                    key={channel}
                    className="inline-flex items-center gap-2 sm:justify-center"
                    style={{ minWidth: '5rem' }}
                  >
                    <span
                      className="text-xs sm:hidden"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {CHANNEL_LABELS[channel]}
                    </span>
                    <Toggle
                      checked={preferences[row.key]?.[channel] ?? false}
                      onChange={() => togglePref(row.key, channel)}
                      label={`${row.label} ${CHANNEL_LABELS[channel]}`}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}

      <div className="flex items-center gap-4">
        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          loading={pending}
          disabled={pending}
        >
          Save preferences
        </Button>
        {saved && (
          <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
            Preferences saved
          </span>
        )}
        {err && (
          <span className="text-sm font-medium" style={{ color: 'var(--color-destructive)' }}>
            {err}
          </span>
        )}
      </div>
    </>
  )
}
