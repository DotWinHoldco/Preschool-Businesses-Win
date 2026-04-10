// @anchor: cca.daily-report.staff-classroom-page
// Staff daily report entry page for a classroom — lists all students with report status.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, FileText } from 'lucide-react'

export default async function ClassroomDailyReportsPage({
  params,
}: {
  params: Promise<{ classroomId: string }>
}) {
  const { classroomId } = await params

  // TODO: Fetch classroom info + students + their daily report status for today
  const classroom = { id: classroomId, name: 'Butterfly Room' }
  const today = new Date().toISOString().split('T')[0]
  const students = [
    { id: '1', name: 'Sophia M.', entryCount: 5, status: 'draft' as const },
    { id: '2', name: 'Liam J.', entryCount: 3, status: 'draft' as const },
    { id: '3', name: 'Emma R.', entryCount: 0, status: 'empty' as const },
    { id: '4', name: 'Noah B.', entryCount: 7, status: 'published' as const },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Daily Reports
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {classroom.name} &mdash;{' '}
          {new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {students.map((student) => (
          <a
            key={student.id}
            href={`/portal/staff/classroom/${classroomId}/daily-reports/${student.id}`}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{student.name}</CardTitle>
                  <Badge
                    variant={
                      student.status === 'published'
                        ? 'success'
                        : student.status === 'draft'
                          ? 'warning'
                          : 'outline'
                    }
                  >
                    {student.status === 'published'
                      ? 'Published'
                      : student.status === 'draft'
                        ? 'Draft'
                        : 'No entries'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                  {student.status === 'empty' ? (
                    <>
                      <ClipboardList size={14} />
                      <span>No entries yet</span>
                    </>
                  ) : (
                    <>
                      <FileText size={14} />
                      <span>{student.entryCount} entries</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
