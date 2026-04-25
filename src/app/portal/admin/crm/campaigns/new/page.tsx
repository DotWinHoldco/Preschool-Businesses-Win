// @anchor: cca.crm.campaign-new
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { CampaignBuilderClient } from '../campaign-builder-client'

export const dynamic = 'force-dynamic'

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string }>
}) {
  const sp = await searchParams
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const [{ data: audiences }, { data: templates }] = await Promise.all([
    supabase
      .from('audiences')
      .select('id, name, member_count, color')
      .eq('tenant_id', tenantId)
      .order('name'),
    supabase
      .from('email_templates')
      .select('id, name, subject')
      .eq('tenant_id', tenantId)
      .order('name'),
  ])
  return (
    <CampaignBuilderClient
      audiences={audiences ?? []}
      templates={templates ?? []}
      initialAudienceId={sp.audience ?? null}
    />
  )
}
