// @anchor: cca.settings.integrations-page
// Server wrapper: loads persisted integration connection flags.

import { loadTenantSettings } from '@/lib/actions/settings/tenant-settings'
import { IntegrationsSettingsSchema } from '@/lib/schemas/settings'
import { IntegrationsSettingsForm } from './integrations-form'

export default async function SettingsIntegrationsPage() {
  const raw = await loadTenantSettings('integrations')
  const initialValues = IntegrationsSettingsSchema.parse(raw)

  return <IntegrationsSettingsForm initialValues={initialValues} />
}
