// @anchor: cca.settings.branding-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Branding Settings | Admin Portal',
  description: 'Customize school logo, colors, and visual identity',
}

export default function AdminBrandingSettingsPage() {
  const currentColors = [
    { token: '--color-primary', label: 'Primary', value: '#5CB961' },
    { token: '--color-secondary', label: 'Secondary', value: '#3B70B0' },
    { token: '--color-accent', label: 'Accent', value: '#F15A50' },
    { token: '--color-warning', label: 'Warning', value: '#F59E0B' },
    { token: '--color-destructive', label: 'Destructive', value: '#EF4444' },
    { token: '--color-background', label: 'Background', value: '#FFFFFF' },
    { token: '--color-foreground', label: 'Foreground', value: '#1A1A1A' },
    { token: '--color-muted', label: 'Muted', value: '#F5F5F5' },
    { token: '--color-border', label: 'Border', value: '#E5E5E5' },
  ]

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
          Upload your primary logo, icon version, and favicon.
        </p>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          {['Primary Logo', 'Icon / Square', 'Favicon'].map((label) => (
            <div key={label}>
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{label}</p>
              <div
                className="mt-2 flex h-32 items-center justify-center rounded-lg border-2 border-dashed"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  Drop image or click to upload
                </span>
              </div>
            </div>
          ))}
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
            <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>School Name</label>
            <input
              type="text"
              defaultValue="Crandall Christian Academy"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
            />
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Tagline</label>
            <input
              type="text"
              defaultValue="A Place To Shine Bright"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
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
          These CSS variables drive every component in the platform. Changes apply to all portal and marketing pages.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {currentColors.map((c) => (
            <div key={c.token} className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border"
                style={{ backgroundColor: c.value, borderColor: 'var(--color-border)' }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{c.label}</p>
                <input
                  type="text"
                  defaultValue={c.value}
                  className="mt-0.5 w-full rounded border px-2 py-1 font-mono text-xs"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
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
          {[
            { label: 'Heading Font', value: 'Nunito' },
            { label: 'Body Font', value: 'Open Sans' },
            { label: 'Border Radius', value: '0.75rem' },
          ].map((item) => (
            <div key={item.label}>
              <label className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{item.label}</label>
              <input
                type="text"
                defaultValue={item.value}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <button
          className="rounded-lg px-6 py-2.5 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Save Branding
        </button>
        <button
          className="rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
        >
          Preview Changes
        </button>
        <button
          className="rounded-lg px-4 py-2.5 text-sm font-medium"
          style={{ color: 'var(--color-destructive)' }}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
