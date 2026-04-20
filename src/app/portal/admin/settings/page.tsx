// @anchor: cca.settings.admin-page

import type { Metadata } from 'next'
import Link from 'next/link'
import { SettingsDangerZone } from '@/components/portal/settings/danger-zone'

export const metadata: Metadata = {
  title: 'Settings | Admin Portal',
  description: 'School configuration, integrations, and preferences',
}

export default function AdminSettingsPage() {
  const settingSections = [
    {
      title: 'School Profile',
      description: 'Name, address, contact info, and timezone',
      href: '/portal/admin/settings/profile',
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
      href: '/portal/admin/settings/notifications',
      icon: 'Bell',
    },
    {
      title: 'Billing Configuration',
      description: 'Payment methods, late fees, grace periods, and processing fee settings',
      href: '/portal/admin/settings/billing',
      icon: 'CreditCard',
    },
    {
      title: 'Integrations',
      description: 'Stripe Connect, Resend, Twilio, and hardware connections',
      href: '/portal/admin/settings/integrations',
      icon: 'Plug',
    },
    {
      title: 'Feature Flags',
      description: 'Enable or disable platform features for this school',
      href: '/portal/admin/settings/features',
      icon: 'ToggleRight',
    },
    {
      title: 'Drop-in Settings',
      description: 'Availability rules, rates, and cancellation policies',
      href: '/portal/admin/settings/drop-in',
      icon: 'CalendarPlus',
    },
    {
      title: 'Check-in / Kiosk Mode',
      description: 'QR rotation, kiosk timeout, health screening questions',
      href: '/portal/admin/settings/check-in',
      icon: 'QrCode',
    },
    {
      title: 'Data & Privacy',
      description: 'Retention policies, data export, and COPPA compliance',
      href: '/portal/admin/settings/privacy',
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
          <Link
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
          </Link>
        ))}
      </div>

      <SettingsDangerZone />
    </div>
  )
}
