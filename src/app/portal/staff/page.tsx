// @anchor: cca.staff.dashboard
// Staff dashboard — my classrooms, schedule, checked-in children.
// Fetches real data from Supabase.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  Clock,
  Users,
  FileText,
  ClipboardList,
  LogIn,
  CalendarDays,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Staff Dashboard — Portal',
}

export default async function StaffDashboardPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // --- My classrooms via staff assignments ---
  const { data: assignments } = await supabase
    .from('classroom_staff_assignments')
    .select('classroom_id, role, classrooms(id, name, age_range, capacity)')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)

  const myClassrooms = (assignments ?? []).map((a: Record<string, unknown>) => {
    const c = a.classrooms as Record<string, unknown> | null
    return {
      id: (c?.id as string) ?? (a.classroom_id as string),
      name: (c?.name as string) ?? 'Classroom',
      ageRange: (c?.age_range as string) ?? '',
      capacity: (c?.capacity as number) ?? 0,
      role: (a.role as string) ?? 'Staff',
    }
  })

  const classroomIds = myClassrooms.map((c) => c.id)

  // --- Today's schedule entries ---
  const dayOfWeek = new Date().getDay() // 0=Sun...6=Sat
  const { data: scheduleRows } = await supabase
    .from('staff_schedules')
    .select('start_time, end_time, activity, status')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('day_of_week', dayOfWeek)
    .order('start_time', { ascending: true })

  const todaysSchedule = (scheduleRows ?? []).map((row: Record<string, unknown>) => ({
    time: row.start_time as string,
    activity: row.activity as string,
    status: (row.status as string) ?? 'upcoming',
  }))

  // --- Checked-in children today ---
  const todayStr = new Date().toISOString().split('T')[0]

  let checkedInChildren: Array<{
    name: string
    checkedInAt: string
    allergies: string[]
  }> = []

  if (classroomIds.length > 0) {
    const { data: checkIns } = await supabase
      .from('check_ins')
      .select('checked_in_at, students(first_name, last_name, allergies)')
      .in('classroom_id', classroomIds)
      .eq('tenant_id', tenantId)
      .gte('checked_in_at', `${todayStr}T00:00:00`)
      .lte('checked_in_at', `${todayStr}T23:59:59`)
      .order('checked_in_at', { ascending: true })

    checkedInChildren = (checkIns ?? []).map((ci: Record<string, unknown>) => {
      const s = ci.students as Record<string, unknown> | null
      const checkedInDate = new Date(ci.checked_in_at as string)
      return {
        name: `${s?.first_name ?? ''} ${((s?.last_name as string) ?? '').charAt(0)}.`.trim(),
        checkedInAt: checkedInDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        allergies: Array.isArray(s?.allergies) ? (s.allergies as string[]) : [],
      }
    })
  }

  // Count students today per classroom
  const classroomsWithCounts = await Promise.all(
    myClassrooms.map(async (room) => {
      const { count } = await supabase
        .from('check_ins')
        .select('id', { count: 'exact', head: true })
        .eq('classroom_id', room.id)
        .eq('tenant_id', tenantId)
        .gte('checked_in_at', `${todayStr}T00:00:00`)
        .lte('checked_in_at', `${todayStr}T23:59:59`)
      return { ...room, studentsToday: count ?? 0 }
    }),
  )

  // First classroom id for quick actions (or fallback)
  const firstClassroomId = classroomIds[0] ?? ''

  // Determine greeting based on time of day
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight md:text-3xl"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}
        >
          {greeting}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Here is your day at a glance.
        </p>
      </div>

      {/* Quick action buttons */}
      {firstClassroomId && (
        <div className="grid gap-3 grid-cols-3">
          {[
            { label: 'Record Attendance', href: `/portal/staff/classroom/${firstClassroomId}/attendance`, icon: ClipboardList },
            { label: 'Daily Reports', href: `/portal/staff/classroom/${firstClassroomId}/daily-reports`, icon: FileText },
            { label: 'Time Clock', href: '/portal/staff/time-clock', icon: Clock },
          ].map((action) => {
            const Icon = action.icon
            return (
              <a
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 rounded-[var(--radius)] border px-3 py-4 text-center text-sm font-medium transition-colors hover:bg-[var(--color-muted)]"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
              >
                <Icon size={22} style={{ color: 'var(--color-primary)' }} />
                <span>{action.label}</span>
              </a>
            )
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Classrooms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              My Classrooms Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classroomsWithCounts.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                No classrooms assigned yet.
              </p>
            ) : (
              classroomsWithCounts.map((room) => (
                <a
                  key={room.id}
                  href={`/portal/staff/classroom/${room.id}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-[var(--color-muted)]"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
                        {room.name}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                        {room.ageRange} &middot; {room.role}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>
                        {room.studentsToday}/{room.capacity}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        students today
                      </p>
                    </div>
                  </div>
                </a>
              ))
            )}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays size={18} style={{ color: 'var(--color-primary)' }} />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysSchedule.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                No schedule entries for today.
              </p>
            ) : (
              <ul className="space-y-2">
                {todaysSchedule.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span
                      className="w-16 shrink-0 text-xs font-medium"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {item.time}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color:
                          item.status === 'completed'
                            ? 'var(--color-muted-foreground)'
                            : item.status === 'in-progress'
                              ? 'var(--color-primary)'
                              : 'var(--color-foreground)',
                        textDecoration: item.status === 'completed' ? 'line-through' : undefined,
                      }}
                    >
                      {item.activity}
                    </span>
                    {item.status === 'in-progress' && (
                      <Badge variant="default" size="sm">Now</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Checked-in Children */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn size={18} style={{ color: 'var(--color-success)' }} />
              Children Checked In
            </CardTitle>
            <CardDescription>
              {checkedInChildren.length} of {classroomsWithCounts[0]?.capacity ?? 0} students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkedInChildren.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                No children checked in yet today.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {checkedInChildren.map((child, i) => (
                  <div
                    key={`${child.name}-${i}`}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                        {child.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        In at {child.checkedInAt}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {child.allergies.map((allergy) => (
                        <Badge key={allergy} variant="danger" size="sm">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
