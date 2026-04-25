// @anchor: cca.crm.legacy-lead-detail-redirect

import { redirect } from 'next/navigation'
import { createTenantServerClient } from '@/lib/supabase/server'

export default async function LegacyLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>
}) {
  const { leadId } = await params

  try {
    const supabase = await createTenantServerClient()
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('primary_lead_id', leadId)
      .maybeSingle()
    if (contact) redirect(`/portal/admin/crm/contacts/${contact.id}`)
  } catch {
    // ignore — fall through to list redirect
  }

  redirect('/portal/admin/crm/contacts?stage=lead')
}
