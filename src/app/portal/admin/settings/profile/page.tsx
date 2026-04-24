// @anchor: cca.settings.profile-page
// Server wrapper: loads persisted profile settings and hands them to the form.

import { loadTenantSettings } from '@/lib/actions/settings/tenant-settings'
import { ProfileSettingsSchema } from '@/lib/schemas/settings'
import { ProfileSettingsForm } from './profile-form'

export default async function SettingsProfilePage() {
  const raw = await loadTenantSettings('profile')
  const initialValues = ProfileSettingsSchema.parse(raw)

  return <ProfileSettingsForm initialValues={initialValues} />
}
