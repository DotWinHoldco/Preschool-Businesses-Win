// @anchor: cca.leads.admin-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { LeadsPageClient } from './leads-page-client'

export default async function LeadsPage() {
  const supabase = await createTenantServerClient()

  const { data: leads } = await supabase
    .from('enrollment_leads')
    .select('*')
    .order('created_at', { ascending: false })

  const mapped = (leads ?? []).map((l: Record<string, unknown>) => ({
    id: l.id as string,
    parent_first_name: l.parent_first_name as string,
    parent_last_name: l.parent_last_name as string,
    parent_email: l.parent_email as string | null,
    parent_phone: l.parent_phone as string | null,
    child_name: l.child_name as string | null,
    program_interest: l.program_interest as string | null,
    status: (l.status as string) ?? 'new',
    priority: (l.priority as string) ?? 'warm',
    source: (l.source as string) ?? 'website',
    created_at: l.created_at as string,
  }))

  return <LeadsPageClient initialLeads={mapped} />
}
