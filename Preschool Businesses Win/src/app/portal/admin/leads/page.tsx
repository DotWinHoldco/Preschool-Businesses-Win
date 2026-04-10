// @anchor: cca.leads.admin-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { LeadPipeline } from '@/components/portal/enrollment/lead-pipeline'
import { UserPlus, Plus } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserPlus className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Lead Pipeline</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Track and manage enrollment leads from inquiry to enrollment
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Lead
        </button>
      </div>

      <LeadPipeline leads={mapped} />
    </div>
  )
}
