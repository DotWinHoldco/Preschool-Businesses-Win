// @anchor: cca.crm.audience-new
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { AudienceBuilderClient } from '../audience-builder-client'

export const dynamic = 'force-dynamic'

export default async function NewAudiencePage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const { data: tags } = await supabase
    .from('contact_tags')
    .select('id, label, color')
    .eq('tenant_id', tenantId)
    .order('label')
  return <AudienceBuilderClient tags={tags ?? []} />
}
