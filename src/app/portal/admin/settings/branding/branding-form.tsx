'use client'

import { useState, useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import { saveBrandingSettings } from '@/lib/actions/settings/save-actions'
import type { BrandingSettings } from '@/lib/schemas/settings'

interface Props {
  initialValues: BrandingSettings
}

type LogoSlot = { field: 'logo_url' | 'icon_url' | 'favicon_url'; label: string }

const LOGO_SLOTS: LogoSlot[] = [
  { field: 'logo_url', label: 'Primary Logo' },
  { field: 'icon_url', label: 'Icon / Square' },
  { field: 'favicon_url', label: 'Favicon' },
]

const COLOR_FIELDS: Array<{
  field: 'primary_color' | 'secondary_color' | 'accent_color'
  label: string
}> = [
  { field: 'primary_color', label: 'Primary' },
  { field: 'secondary_color', label: 'Secondary' },
  { field: 'accent_color', label: 'Accent' },
]

const TYPO_FIELDS: Array<{ field: 'heading_font' | 'body_font' | 'border_radius'; label: string }> =
  [
    { field: 'heading_font', label: 'Heading Font' },
    { field: 'body_font', label: 'Body Font' },
    { field: 'border_radius', label: 'Border Radius' },
  ]

export function BrandingSettingsForm({ initialValues }: Props) {
  const [form, setForm] = useState<BrandingSettings>(initialValues)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await saveBrandingSettings(form)
      if (result.ok) {
        toast({ variant: 'success', title: 'Branding saved' })
      } else {
        toast({ variant: 'error', title: 'Save failed', description: result.error })
      }
    })
  }

  function handleReset() {
    setForm(initialValues)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Branding Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Customize your school&apos;s visual identity. Changes apply instantly across all pages.
        </p>
      </div>

      {/* Logo */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          School Logo
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Paste a hosted image URL for now. Direct upload is coming soon.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          {LOGO_SLOTS.map(({ field, label }) => {
            const url = form[field]
            return (
              <div key={field}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  {label}
                </p>
                <div
                  className="mt-2 flex h-32 items-center justify-center rounded-lg border-2 border-dashed overflow-hidden"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {url ? (
                    <img src={url} alt={label} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                      No image
                    </span>
                  )}
                </div>
                {/* TODO: wire Supabase storage upload when bucket is configured */}
                <input
                  type="url"
                  value={url}
                  placeholder="https://..."
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-xs"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-foreground)',
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Identity */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          School Identity
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              School Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-foreground)',
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              Tagline
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-foreground)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Brand Colors
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          These CSS variables drive every component in the platform. Changes apply to all portal and
          marketing pages.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {COLOR_FIELDS.map(({ field, label }) => (
            <div key={field} className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border"
                style={{ backgroundColor: form[field], borderColor: 'var(--color-border)' }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  {label}
                </p>
                <input
                  type="text"
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="mt-0.5 w-full rounded border px-2 py-1 font-mono text-xs"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-foreground)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Typography
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {TYPO_FIELDS.map(({ field, label }) => (
            <div key={field}>
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                {label}
              </label>
              <input
                type="text"
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-60"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
          }}
        >
          {isPending ? 'Saving…' : 'Save Branding'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{ color: 'var(--color-destructive)' }}
        >
          Revert Changes
        </button>
      </div>
    </div>
  )
}
