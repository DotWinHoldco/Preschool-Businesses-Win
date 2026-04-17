// @anchor: platform.form-builder.edit-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { FormBuilderClient } from './form-builder-client'

export default async function FormEditPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  const { formId } = await params
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: form } = await supabase.from('forms')
    .select('*')
    .eq('id', formId)
    .single()

  if (!form) notFound()

  const { data: fields } = await supabase.from('form_fields')
    .select('*')
    .eq('form_id', formId)
    .order('sort_order')

  const { data: sections } = await supabase.from('form_sections')
    .select('*')
    .eq('form_id', formId)
    .order('sort_order')

  const { data: actions } = await supabase.from('form_submission_actions')
    .select('*')
    .eq('form_id', formId)
    .order('sort_order')

  return (
    <FormBuilderClient
      form={form}
      initialFields={fields || []}
      initialSections={sections || []}
      initialActions={actions || []}
    />
  )
}
