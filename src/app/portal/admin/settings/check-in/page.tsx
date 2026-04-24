// @anchor: cca.settings.checkin-page
// Server wrapper: loads persisted check-in settings and hands them to the form.

import { loadTenantSettings } from '@/lib/actions/settings/tenant-settings'
import { CheckinSettingsSchema } from '@/lib/schemas/settings'
import { CheckinSettingsForm } from './check-in-form'

const DEFAULT_QUESTIONS = [
  'Does your child have a fever (100.4°F or higher)?',
  'Has your child vomited or had diarrhea in the past 24 hours?',
  'Does your child have any unexplained rash?',
  'Has your child been exposed to a communicable disease in the past 14 days?',
]

export default async function SettingsCheckInPage() {
  const raw = await loadTenantSettings('checkin')
  const parsed = CheckinSettingsSchema.parse(raw)
  const initialValues = {
    ...parsed,
    screening_questions:
      parsed.screening_questions.length > 0 ? parsed.screening_questions : DEFAULT_QUESTIONS,
  }

  return <CheckinSettingsForm initialValues={initialValues} />
}
