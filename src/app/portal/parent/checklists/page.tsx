// @anchor: cca.checklist.parent-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ClipboardList, CheckCircle2, Circle } from 'lucide-react'

export default async function ParentChecklistsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch checklist assignments for this user, joined with template name
  const { data: assignments } = await supabase
    .from('checklist_assignments')
    .select('id, template_id, status, due_date, completed_at, assigned_at, checklist_templates(name)')
    .eq('assigned_to_user_id', userId)
    .eq('tenant_id', tenantId)
    .order('assigned_at', { ascending: false })

  const assignmentList = assignments ?? []

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null
    try {
      return new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          My Checklists
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Track your assigned tasks and onboarding checklists.
        </p>
      </div>

      {assignmentList.length > 0 ? (
        <div className="flex flex-col gap-3">
          {assignmentList.map((assignment) => {
            const isCompleted = assignment.status === 'completed'
            const tpl = assignment.checklist_templates as unknown as
              | { name: string }
              | { name: string }[]
              | null
            const templateName = Array.isArray(tpl) ? tpl[0]?.name : tpl?.name ?? 'Checklist'

            return (
              <div
                key={assignment.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <Circle size={20} style={{ color: 'var(--color-muted-foreground)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {templateName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          isCompleted
                            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                            : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        }`}
                      >
                        {assignment.status}
                      </span>
                      {assignment.due_date && (
                        <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          Due {formatDate(assignment.due_date)}
                        </span>
                      )}
                      {isCompleted && assignment.completed_at && (
                        <span className="text-xs" style={{ color: 'var(--color-success)' }}>
                          Completed {formatDate(assignment.completed_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <ClipboardList size={24} style={{ color: 'var(--color-muted-foreground)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No checklists assigned.
          </p>
        </div>
      )}
    </div>
  )
}
