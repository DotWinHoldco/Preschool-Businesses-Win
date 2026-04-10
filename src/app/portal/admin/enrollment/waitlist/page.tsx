// @anchor: cca.enrollment.waitlist-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { WaitlistManager } from '@/components/portal/enrollment/waitlist-manager'
import { Clock } from 'lucide-react'

export default async function WaitlistPage() {
  const supabase = await createTenantServerClient()

  const { data: applications } = await supabase
    .from('enrollment_applications')
    .select('*')
    .eq('triage_status', 'waitlisted')
    .order('created_at', { ascending: true })

  const entries = (applications ?? []).map((a: Record<string, unknown>, i: number) => ({
    id: a.id as string,
    student_first_name: a.student_first_name as string,
    student_last_name: a.student_last_name as string,
    parent_name: `${a.parent_first_name} ${a.parent_last_name}`,
    program_type: (a.program_type as string) ?? '',
    triage_score: a.triage_score as number | null,
    created_at: a.created_at as string,
    position: i + 1,
  }))

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-[var(--color-secondary)]" />
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Waitlist</h1>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Manage waitlist positions and approve when spots open
        </p>
      </div>

      <WaitlistManager entries={entries} />
    </div>
  )
}
