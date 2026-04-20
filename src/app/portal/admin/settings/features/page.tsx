'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Feature {
  key: string
  label: string
  description: string
  enabled: boolean
}

export default function SettingsFeaturesPage() {
  const [saved, setSaved] = useState(false)
  const [features, setFeatures] = useState<Feature[]>([
    { key: 'attendance_tracking', label: 'Attendance Tracking', description: 'Daily check-in/check-out with QR codes', enabled: true },
    { key: 'daily_reports', label: 'Daily Reports', description: 'Daily activity reports sent to parents', enabled: true },
    { key: 'billing', label: 'Billing & Invoicing', description: 'Automated tuition billing and payment processing', enabled: true },
    { key: 'messaging', label: 'Messaging', description: 'In-app messaging between staff and parents', enabled: true },
    { key: 'food_program', label: 'CACFP Food Program', description: 'Meal tracking and CACFP compliance reporting', enabled: true },
    { key: 'curriculum', label: 'Curriculum Planning', description: 'Lesson plans and learning objectives', enabled: true },
    { key: 'portfolios', label: 'Student Portfolios', description: 'Photo/video documentation of learning', enabled: true },
    { key: 'drop_in', label: 'Drop-in Care', description: 'Flexible scheduling and hourly billing', enabled: true },
    { key: 'subsidies', label: 'Subsidy Management', description: 'State subsidy tracking and claims', enabled: true },
    { key: 'crm', label: 'CRM / Lead Management', description: 'Lead pipeline and enrollment tracking', enabled: true },
    { key: 'doors', label: 'Door Access Control', description: 'Electronic door locks and entry logs', enabled: false },
    { key: 'cameras', label: 'Camera Streaming', description: 'Live camera feeds for parents', enabled: false },
    { key: 'surveys', label: 'Parent Surveys', description: 'Custom surveys and feedback collection', enabled: true },
    { key: 'training', label: 'Staff Training', description: 'Training requirement tracking and compliance', enabled: true },
  ])

  function toggleFeature(key: string) {
    setFeatures(prev => prev.map(f =>
      f.key === key ? { ...f, enabled: !f.enabled } : f
    ))
  }

  function handleSave() {
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
          Feature Flags
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Enable or disable platform features for this school. Disabled features are hidden from the sidebar and dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {features.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{feature.label}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{feature.description}</p>
                </div>
                <button
                  onClick={() => toggleFeature(feature.key)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  style={{ backgroundColor: feature.enabled ? 'var(--color-primary)' : 'var(--color-muted)' }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                    style={{ transform: feature.enabled ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave}>Save Changes</Button>
            {saved && <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Saved successfully</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
