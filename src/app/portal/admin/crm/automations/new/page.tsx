// @anchor: cca.crm.automations-new
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { applyAutomationTemplate } from '@/lib/actions/crm/automations'
import { AUTOMATION_TEMPLATES } from '@/lib/crm/automation-templates'
import { AutomationBuilderClient } from '../automation-builder-client'

export const dynamic = 'force-dynamic'

export default async function NewAutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const sp = await searchParams
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()

  // If a template key was passed, materialize it server-side and bounce to the detail.
  if (sp.template) {
    const tpl = AUTOMATION_TEMPLATES.find((t) => t.key === sp.template)
    if (tpl) {
      const r = await applyAutomationTemplate(sp.template)
      if (r.ok && r.id) redirect(`/portal/admin/crm/automations/${r.id}`)
    }
  }

  const supabase = await createTenantAdminClient(tenantId)
  const [{ data: templates }, { data: tags }, { data: audiences }, { data: campaigns }] =
    await Promise.all([
      supabase
        .from('email_templates')
        .select('id, name, subject')
        .eq('tenant_id', tenantId)
        .order('name'),
      supabase
        .from('contact_tags')
        .select('id, label, color')
        .eq('tenant_id', tenantId)
        .order('label'),
      supabase.from('audiences').select('id, name, type').eq('tenant_id', tenantId).order('name'),
      supabase
        .from('email_campaigns')
        .select('id, name, type')
        .eq('tenant_id', tenantId)
        .eq('type', 'drip')
        .order('name'),
    ])

  return (
    <AutomationBuilderClient
      templates={(templates ?? []) as { id: string; name: string; subject: string }[]}
      tags={(tags ?? []) as { id: string; label: string; color: string }[]}
      audiences={(audiences ?? []) as { id: string; name: string; type: string }[]}
      dripCampaigns={(campaigns ?? []) as { id: string; name: string }[]}
    />
  )
}
