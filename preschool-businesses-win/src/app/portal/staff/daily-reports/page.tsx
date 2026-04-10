// @anchor: cca.daily-report.staff-hub
// Staff daily reports hub — select a classroom to manage daily reports.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText, ChevronRight } from 'lucide-react'

export default function StaffDailyReportsPage() {
  // TODO: Fetch classrooms assigned to the current staff member from Supabase
  const classrooms = [
    { id: 'c1', name: 'Butterfly Room', studentCount: 12, reportsToday: 8 },
    { id: 'c2', name: 'Sunshine Room', studentCount: 10, reportsToday: 10 },
    { id: 'c3', name: 'Rainbow Room', studentCount: 15, reportsToday: 3 },
  ]

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classrooms.map((classroom) => {
          const allDone = classroom.reportsToday === classroom.studentCount
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
                          width: `${(classroom.reportsToday / classroom.studentCount) * 100}%`,
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
    </div>
  )
}
