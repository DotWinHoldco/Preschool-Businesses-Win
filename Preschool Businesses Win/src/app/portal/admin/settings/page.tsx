// @anchor: cca.settings.admin-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings | Admin Portal',
  description: 'School configuration, integrations, and preferences',
}

export default function AdminSettingsPage() {
  const settingSections = [
    {
      title: 'School Profile',
      description: 'Name, address, contact info, and timezone',
      href: '#profile',
      icon: 'Building',
    },
    {
      title: 'Branding',
      description: 'Logo, colors, fonts, and visual identity',
      href: '/portal/admin/settings/branding',
      icon: 'Palette',
    },
    {
      title: 'Notifications',
      description: 'Default notification channels and quiet hours',
      href: '#notifications',
      icon: 'Bell',
    },
    {
      title: 'Billing Configuration',
      description: 'Payment methods, late fees, grace periods, and processing fee settings',
      href: '#billing',
      icon: 'CreditCard',
    },
    {
      title: 'Integrations',
      description: 'Stripe Connect, Resend, Twilio, and hardware connections',
      href: '#integrations',
      icon: 'Plug',
    },
    {
      title: 'Feature Flags',
      description: 'Enable or disable platform features for this school',
      href: '#features',
      icon: 'ToggleRight',
    },
    {
      title: 'Drop-in Settings',
      description: 'Availability rules, rates, and cancellation policies',
      href: '#dropin',
      icon: 'CalendarPlus',
    },
    {
      title: 'Check-in / Kiosk Mode',
      description: 'QR rotation, kiosk timeout, health screening questions',
      href: '#checkin',
      icon: 'QrCode',
    },
    {
      title: 'Data & Privacy',
      description: 'Retention policies, data export, and COPPA compliance',
      href: '#privacy',
      icon: 'Shield',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Configure your school&apos;s settings, integrations, and preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingSections.map((section) => (
          <a
            key={section.title}
            href={section.href}
            className="group rounded-xl p-5 transition-shadow hover:shadow-md"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
              {section.title}
            </h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {section.description}
            </p>
            <span
              className="mt-3 inline-block text-sm font-medium"
              style={{ color: 'var(--color-primary)' }}
            >
              Configure &rarr;
            </span>
          </a>
        ))}
      </div>

      {/* Danger zone */}
      <div
        className="rounded-xl p-6"
        style={{ border: '1px solid var(--color-destructive)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-destructive)' }}>
          Danger Zone
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Actions here are irreversible. Proceed with extreme caution.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Export All Data
          </button>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-destructive)', color: 'var(--color-primary-foreground)' }}
          >
            Suspend School Account
          </button>
        </div>
      </div>
    </div>
  )
}
