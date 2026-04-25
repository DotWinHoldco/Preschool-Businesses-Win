// @anchor: cca.crm.template-new
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { TemplateEditorClient } from '../template-editor-client'

export const dynamic = 'force-dynamic'

export default async function NewTemplatePage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const { data: cf } = await supabase
    .from('custom_fields')
    .select('field_key, label')
    .eq('tenant_id', tenantId)
    .eq('entity_type', 'contact')
    .eq('is_merge_tag', true)
    .is('deleted_at', null)
    .order('label')
  const customTags = (cf ?? []).map((r) => ({
    key: `contact.${r.field_key as string}`,
    label: r.label as string,
  }))
  return <TemplateEditorClient customTags={customTags} />
}
