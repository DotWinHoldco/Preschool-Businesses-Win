'use client'

// @anchor: marketing.enroll.wrapper
// Client wrapper that adapts the enrollment system form values to
// submitSystemEnrollment (which runs the pipeline: creates one enrollment_application
// per child, creates the enrollment_lead, writes the initial pipeline step, audit
// log, etc.). The wizard itself is generic; this wrapper encodes the enrollment-
// specific submission shape.

import { WizardFormRenderer, type WizardField, type WizardSection } from '@/components/forms/wizard/wizard-form-renderer'
import { submitSystemEnrollment } from '@/lib/actions/enrollment/submit-system-enrollment'
import type { SystemEnrollmentData } from '@/lib/schemas/enrollment'

interface Props {
  formId: string
  title: string
  feeEnabled: boolean
  feeAmountCents: number | null | undefined
  feeDescription: string
  thankYouTitle: string
  thankYouMessage: string
  sections: WizardSection[]
  fields: WizardField[]
  tenantName: string
}

export function EnrollmentWizardWrapper(props: Props) {
  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      form_id: props.formId,
    } as unknown as SystemEnrollmentData

    const result = await submitSystemEnrollment(payload)
    return { ok: result.ok, error: result.error }
  }

  return (
    <WizardFormRenderer
      formId={props.formId}
      title={props.title}
      feeEnabled={props.feeEnabled}
      feeAmountCents={props.feeAmountCents}
      feeDescription={props.feeDescription}
      thankYouTitle={props.thankYouTitle}
      thankYouMessage={props.thankYouMessage}
      sections={props.sections}
      fields={props.fields}
      tenantName={props.tenantName}
      onSubmit={handleSubmit}
    />
  )
}
