// @anchor: cca.settings.billing-page
// Server wrapper: loads persisted billing settings and hands them to the form.

import { loadTenantSettings } from '@/lib/actions/settings/tenant-settings'
import { BillingSettingsSchema } from '@/lib/schemas/settings'
import { BillingSettingsForm } from './billing-form'

export default async function SettingsBillingPage() {
  const raw = await loadTenantSettings('billing')
  const initialValues = BillingSettingsSchema.parse(raw)

  return <BillingSettingsForm initialValues={initialValues} />
}
