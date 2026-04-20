// @anchor: cca.daily-report.staff-hub
// Staff daily reports hub — select a classroom to manage daily reports.
// Fetches real classroom assignments and report counts from Supabase.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, ChevronRight } from 'lucide-react'

export default async function StaffDailyReportsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Get classrooms assigned to this staff member
  const { data: assignments } = await supabase
    .from('classroom_staff_assignments')
    .select('classroom_id, classrooms(id, name)')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)

  const todayStr = new Date().toISOString().split('T')[0]

  // Build classroom list with student counts and report progress
  const classrooms = await Promise.all(
    (assignments ?? []).map(async (a: Record<string, unknown>) => {
      const c = a.classrooms as Record<string, unknown> | null
      const classroomId = (c?.id as string) ?? (a.classroom_id as string)
      const classroomName = (c?.name as string) ?? 'Classroom'

      // Count students assigned to this classroom
      const { count: studentCount } = await supabase
        .from('student_classroom_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('classroom_id', classroomId)
        .eq('tenant_id', tenantId)

      // Count daily reports for today (published or draft)
      const { count: reportsToday } = await supabase
        .from('daily_reports')
        .select('id', { count: 'exact', head: true })
        .eq('classroom_id', classroomId)
        .eq('tenant_id', tenantId)
        .eq('date', todayStr)

      return {
        id: classroomId,
        name: classroomName,
        studentCount: studentCount ?? 0,
        reportsToday: reportsToday ?? 0,
      }
    }),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Daily Reports
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Select a classroom to create and manage daily reports for your students.
        </p>
      </div>

      {classrooms.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <FileText size={32} className="mx-auto mb-2" style={{ color: 'var(--color-muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No classrooms assigned.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => {
            const allDone = classroom.studentCount > 0 && classroom.reportsToday >= classroom.studentCount
            return (
              <a
                key={classroom.id}
                href={`/portal/staff/classroom/${classroom.id}/daily-reports`}
                className="block"
              >
                <Card className="h-full transition-transform hover:scale-[1.01]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                      >
                        <FileText size={20} />
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                    </div>
                    <CardTitle className="mt-2">{classroom.name}</CardTitle>
                    <CardDescription>{classroom.studentCount} students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 flex-1 rounded-full"
                        style={{ backgroundColor: 'var(--color-muted)' }}
                      >
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: classroom.studentCount > 0
                              ? `${(classroom.reportsToday / classroom.studentCount) * 100}%`
                              : '0%',
                            backgroundColor: allDone ? 'var(--color-success, #10B981)' : 'var(--color-primary)',
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                        {classroom.reportsToday}/{classroom.studentCount}
                      </span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {allDone ? 'All reports complete' : 'Reports in progress'}
                    </p>
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
