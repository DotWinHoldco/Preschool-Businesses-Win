// @anchor: cca.settings.dropin-page
// Server wrapper: loads persisted drop-in settings and hands them to the form.

import { loadTenantSettings } from '@/lib/actions/settings/tenant-settings'
import { DropinSettingsSchema } from '@/lib/schemas/settings'
import { DropinSettingsForm } from './drop-in-form'

export default async function SettingsDropInPage() {
  const raw = await loadTenantSettings('dropin')
  const initialValues = DropinSettingsSchema.parse(raw)

  return <DropinSettingsForm initialValues={initialValues} />
}
