'use client'

// TODO: a middleware check should read `features.*` flags from tenant_settings
// and hide sidebar links / block route access for disabled features. This
// form only persists the flags — enforcement is out of scope here.

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { saveFeaturesSettings } from '@/lib/actions/settings/save-actions'
import type { FeaturesSettings } from '@/lib/schemas/settings'

interface Props {
  initialValues: FeaturesSettings
}

const FEATURES: Array<{ key: keyof FeaturesSettings; label: string; description: string }> = [
  {
    key: 'lesson_plans',
    label: 'Lesson Plans',
    description: 'Weekly curriculum planning and learning objectives',
  },
  {
    key: 'portfolios',
    label: 'Student Portfolios',
    description: 'Photo/video documentation and learning stories',
  },
  {
    key: 'messaging',
    label: 'Messaging',
    description: 'In-app messaging between staff and parents',
  },
  { key: 'newsfeed', label: 'Newsfeed', description: 'Class and school-wide announcements' },
  {
    key: 'appointments',
    label: 'Appointments',
    description: 'Tour bookings and enrollment meetings',
  },
  { key: 'drop_in', label: 'Drop-in Care', description: 'Flexible scheduling and hourly billing' },
  {
    key: 'training',
    label: 'Staff Training',
    description: 'Training requirement tracking and compliance',
  },
  { key: 'checklists', label: 'Checklists', description: 'Daily safety and routine checklists' },
  {
    key: 'dfps_compliance',
    label: 'DFPS Compliance',
    description: 'Texas licensing inspection prep and minimum standards',
  },
  {
    key: 'emergency',
    label: 'Emergency Procedures',
    description: 'Drills, alerts, and evacuation planning',
  },
  { key: 'cameras', label: 'Camera Streaming', description: 'Live camera feeds for parents' },
  {
    key: 'doors',
    label: 'Door Access Control',
    description: 'Electronic door locks and entry logs',
  },
  { key: 'payroll', label: 'Payroll', description: 'Staff time tracking and payroll exports' },
  {
    key: 'billing',
    label: 'Billing & Invoicing',
    description: 'Automated tuition billing and payment processing',
  },
  {
    key: 'subsidies',
    label: 'Subsidy Management',
    description: 'State subsidy tracking and claims',
  },
]

export function FeaturesSettingsForm({ initialValues }: Props) {
  const [form, setForm] = useState<FeaturesSettings>(initialValues)
  const [isPending, startTransition] = useTransition()

  function toggleFeature(key: keyof FeaturesSettings) {
    setForm((f) => ({ ...f, [key]: !f[key] }))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveFeaturesSettings(form)
      if (result.ok) {
        toast({ variant: 'success', title: 'Feature flags saved' })
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
          Feature Flags
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Enable or disable platform features for this school. Disabled features are hidden from the
          sidebar and dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {FEATURES.map((feature) => {
              const enabled = form[feature.key] as boolean
              return (
                <div key={feature.key} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {feature.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {feature.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFeature(feature.key)}
                    aria-pressed={enabled}
                    aria-label={`Toggle ${feature.label}`}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                    style={{
                      backgroundColor: enabled ? 'var(--color-primary)' : 'var(--color-muted)',
                    }}
                  >
                    <span
                      className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      style={{
                        transform: enabled ? 'translateX(1.375rem)' : 'translateX(0.25rem)',
                      }}
                    />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
