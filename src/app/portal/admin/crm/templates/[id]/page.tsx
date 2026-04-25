// @anchor: cca.crm.template-edit
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { TemplateEditorClient } from '../template-editor-client'

export const dynamic = 'force-dynamic'

export default async function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const [{ data: tpl }, { data: cf }] = await Promise.all([
    supabase
      .from('email_templates')
      .select('id, name, subject, preheader, html, design_json')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle(),
    supabase
      .from('custom_fields')
      .select('field_key, label')
      .eq('tenant_id', tenantId)
      .eq('entity_type', 'contact')
      .eq('is_merge_tag', true)
      .is('deleted_at', null)
      .order('label'),
  ])
  if (!tpl) notFound()
  const customTags = (cf ?? []).map((r) => ({
    key: `contact.${r.field_key as string}`,
    label: r.label as string,
  }))
  return (
    <TemplateEditorClient
      initial={{
        id: tpl.id as string,
        name: tpl.name as string,
        subject: tpl.subject as string,
        preheader: (tpl.preheader as string | null) ?? '',
        html: tpl.html as string,
        design_json: (tpl.design_json as Record<string, unknown>) ?? {},
      }}
      customTags={customTags}
    />
  )
}
