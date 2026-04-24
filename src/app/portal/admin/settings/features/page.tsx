// @anchor: cca.settings.features-page
// Server wrapper: loads persisted feature flags and hands them to the form.

import { loadTenantSettings } from '@/lib/actions/settings/tenant-settings'
import { FeaturesSettingsSchema } from '@/lib/schemas/settings'
import { FeaturesSettingsForm } from './features-form'

export default async function SettingsFeaturesPage() {
  const raw = await loadTenantSettings('features')
  const initialValues = FeaturesSettingsSchema.parse(raw)

  return <FeaturesSettingsForm initialValues={initialValues} />
}
