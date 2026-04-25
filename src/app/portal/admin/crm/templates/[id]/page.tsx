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
  const { data: tpl } = await supabase
    .from('email_templates')
    .select('id, name, subject, preheader, html, design_json')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  if (!tpl) notFound()
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
    />
  )
}
