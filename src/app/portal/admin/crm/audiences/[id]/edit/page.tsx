// @anchor: cca.crm.audience-edit
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { AudienceBuilderClient } from '../../audience-builder-client'

export const dynamic = 'force-dynamic'

export default async function EditAudiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const [{ data: audience }, { data: tags }] = await Promise.all([
    supabase.from('audiences').select('*').eq('id', id).eq('tenant_id', tenantId).maybeSingle(),
    supabase
      .from('contact_tags')
      .select('id, label, color')
      .eq('tenant_id', tenantId)
      .order('label'),
  ])
  if (!audience) notFound()
  return (
    <AudienceBuilderClient
      tags={tags ?? []}
      initial={{
        id: audience.id as string,
        name: audience.name as string,
        description: (audience.description as string | null) ?? null,
        type: audience.type as 'static' | 'dynamic',
        filter_json: audience.filter_json as never,
        color: audience.color as string,
        kanban_enabled: audience.kanban_enabled as boolean,
        kanban_columns: (audience.kanban_columns as string[]) ?? [],
      }}
    />
  )
}
