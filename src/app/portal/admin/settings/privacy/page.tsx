// @anchor: cca.settings.privacy-page
// Server Component: loads privacy settings from DB, renders client form.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { loadPrivacySettings } from '@/lib/actions/compliance/privacy-settings'
import { PrivacySettingsForm } from '@/components/portal/settings/privacy-settings-form'

export default async function SettingsPrivacyPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const settings = await loadPrivacySettings(tenantId)

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
        <h1
          className="mt-2 text-2xl font-bold"
          style={{ color: 'var(--color-foreground)' }}
        >
          Data &amp; Privacy
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Retention policies, data export, and COPPA compliance.
        </p>
      </div>

      <PrivacySettingsForm initialSettings={settings} />
    </div>
  )
}
