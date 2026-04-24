// @anchor: cca.settings.branding-page
// Server wrapper: loads persisted branding settings and hands them to the form.

import type { Metadata } from 'next'
import { loadTenantSettings } from '@/lib/actions/settings/tenant-settings'
import { BrandingSettingsSchema } from '@/lib/schemas/settings'
import { BrandingSettingsForm } from './branding-form'

export const metadata: Metadata = {
  title: 'Branding Settings | Admin Portal',
  description: 'Customize school logo, colors, and visual identity',
}

export default async function AdminBrandingSettingsPage() {
  const raw = await loadTenantSettings('branding')
  const initialValues = BrandingSettingsSchema.parse(raw)

  return <BrandingSettingsForm initialValues={initialValues} />
}
