'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Channel = 'email' | 'sms' | 'inApp'

interface NotificationRow {
  key: string
  label: string
  description: string
  channels: Channel[]
}

interface NotificationSection {
  title: string
  description: string
  rows: NotificationRow[]
}

type Preferences = Record<string, Record<Channel, boolean>>

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email',
  sms: 'SMS',
  inApp: 'In-app',
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
        channels: ['email', 'sms', 'inApp'],
      },
      {
        key: 'messages_reply',
        label: 'Replies',
        description: 'When someone replies to a conversation you are in.',
        channels: ['email', 'sms', 'inApp'],
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
        channels: ['email', 'sms', 'inApp'],
      },
      {
        key: 'attendance_absence',
        label: 'Unreported absences',
        description: 'When a child is marked absent without prior notice.',
        channels: ['email', 'sms', 'inApp'],
      },
      {
        key: 'safety_alert',
        label: 'Safety alerts',
        description: 'Emergency drills, lockdowns, and incident reports.',
        channels: ['email', 'sms', 'inApp'],
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
        channels: ['email', 'sms', 'inApp'],
      },
      {
        key: 'billing_payment',
        label: 'Payment received',
        description: 'Confirmation when a payment is processed.',
        channels: ['email', 'sms', 'inApp'],
      },
      {
        key: 'billing_overdue',
        label: 'Overdue notices',
        description: 'When a payment is past due.',
        channels: ['email', 'sms', 'inApp'],
      },
    ],
  },
]

const STORAGE_KEY = 'pbw:notification-preferences'

function getDefaultPreferences(): Preferences {
  const prefs: Preferences = {}
  for (const section of SECTIONS) {
    for (const row of section.rows) {
      const isBilling = row.key.startsWith('billing_')
      prefs[row.key] = {
        email: true,
        sms: isBilling ? false : true,
        inApp: true,
      }
    }
  }
  return prefs
}

// ---------------------------------------------------------------------------
// Toggle component
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
// Page
// ---------------------------------------------------------------------------

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Preferences>(getDefaultPreferences)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Preferences
        // Merge with defaults so new keys are always present
        const defaults = getDefaultPreferences()
        const merged: Preferences = { ...defaults }
        for (const key of Object.keys(defaults)) {
          if (parsed[key]) {
            merged[key] = { ...defaults[key], ...parsed[key] }
          }
        }
        setPreferences(merged)
      }
    } catch {
      // Ignore malformed data
    }
    setLoaded(true)
  }, [])

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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // localStorage full — unlikely but handled
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [preferences])

  // Avoid flash of default state before localStorage loads
  if (!loaded) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Notification Preferences
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Choose which notifications you receive and how.
          </p>
        </div>
        <div
          className="h-64 animate-pulse rounded-xl"
          style={{ backgroundColor: 'var(--color-muted)' }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Notification Preferences
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Choose which notifications you receive and how.
        </p>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <div
          key={section.title}
          className="overflow-hidden rounded-xl"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Section header */}
          <div
            className="px-6 py-4"
            style={{
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
              {section.title}
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {section.description}
            </p>
          </div>

          {/* Channel column headers */}
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

          {/* Rows */}
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
                {/* Label + description */}
                <div className="mb-3 sm:mb-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {row.description}
                  </p>
                </div>

                {/* Toggles — mobile: inline row with labels; desktop: aligned columns */}
                {(['email', 'sms', 'inApp'] as Channel[]).map((channel) => (
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

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button variant="primary" size="md" onClick={handleSave}>
          Save preferences
        </Button>
        {saved && (
          <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
            Preferences saved
          </span>
        )}
      </div>
    </div>
  )
}
