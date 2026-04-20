// @anchor: cca.parent.dashboard
// Parent dashboard — my children, daily reports, quick actions.
// Real Supabase queries replace placeholder data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  LogIn,
  MessageSquare,
  CreditCard,
  Heart,
  CalendarDays,
  CheckSquare,
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
  title: 'Parent Dashboard — Portal',
}

export default async function ParentDashboardPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Get families this user belongs to
  const { data: memberships } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
  const familyIds = memberships?.map(m => m.family_id) ?? []

  // Get students linked to those families
  const { data: links } = await supabase
    .from('student_family_links')
    .select('student_id')
    .in('family_id', familyIds)
    .eq('tenant_id', tenantId)
  const studentIds = links?.map(l => l.student_id) ?? []

  // Fetch students with classroom info and today's check-in status
  const { data: studentsRaw } = studentIds.length > 0
    ? await supabase
        .from('students')
        .select('id, first_name, last_name, date_of_birth, photo_path, enrollment_status')
        .in('id', studentIds)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
    : { data: [] }

  // Get classroom assignments for each student
  const { data: classroomAssignments } = studentIds.length > 0
    ? await supabase
        .from('student_classroom_assignments')
        .select('student_id, classroom_id, classrooms(name)')
        .in('student_id', studentIds)
        .eq('tenant_id', tenantId)
        .is('assigned_to', null)
    : { data: [] }

  // Get allergies for each student
  const { data: allergies } = studentIds.length > 0
    ? await supabase
        .from('student_allergies')
        .select('student_id, allergen')
        .in('student_id', studentIds)
        .eq('tenant_id', tenantId)
    : { data: [] }

  // Get today's check-ins
  const today = new Date().toISOString().split('T')[0]
  const { data: todayCheckIns } = studentIds.length > 0
    ? await supabase
        .from('check_ins')
        .select('student_id, checked_in_at')
        .in('student_id', studentIds)
        .eq('tenant_id', tenantId)
        .gte('checked_in_at', `${today}T00:00:00`)
        .lte('checked_in_at', `${today}T23:59:59`)
    : { data: [] }

  // Build children array
  function computeAge(dob: string): string {
    const birth = new Date(dob)
    const now = new Date()
    let years = now.getFullYear() - birth.getFullYear()
    const monthDiff = now.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years--
    return years === 1 ? '1 year old' : `${years} years old`
  }

  const myChildren = (studentsRaw ?? []).map(s => {
    const assignment = (classroomAssignments ?? []).find(a => a.student_id === s.id)
    const classroomObj = assignment?.classrooms as unknown as { name: string } | { name: string }[] | null
    const classroomName = Array.isArray(classroomObj) ? classroomObj[0]?.name ?? 'Unassigned' : classroomObj?.name ?? 'Unassigned'
    const studentAllergies = (allergies ?? []).filter(a => a.student_id === s.id).map(a => a.allergen)
    const checkIn = (todayCheckIns ?? []).find(c => c.student_id === s.id)
    return {
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      photoUrl: s.photo_path,
      classroom: classroomName,
      age: computeAge(s.date_of_birth),
      allergies: studentAllergies,
      checkedIn: !!checkIn,
      checkedInAt: checkIn
        ? new Date(checkIn.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : null,
    }
  })

  // Daily reports — today, published, for any of the parent's students
  const { data: dailyReportsRaw } = studentIds.length > 0
    ? await supabase
        .from('daily_reports')
        .select('id, student_id, date, status')
        .in('student_id', studentIds)
        .eq('tenant_id', tenantId)
        .eq('date', today)
        .eq('status', 'published')
        .limit(1)
    : { data: [] }

  const todayReport = (dailyReportsRaw ?? [])[0] ?? null
  let reportEntries: { entry_type: string; data: Record<string, unknown>; timestamp: string }[] = []
  let reportChildName = ''

  if (todayReport) {
    const child = (studentsRaw ?? []).find(s => s.id === todayReport.student_id)
    reportChildName = child?.first_name ?? 'Child'
    const { data: entries } = await supabase
      .from('daily_report_entries')
      .select('entry_type, data, timestamp')
      .eq('report_id', todayReport.id)
      .eq('tenant_id', tenantId)
      .order('timestamp', { ascending: true })
      .limit(3)
    reportEntries = entries ?? []
  }

  // Upcoming events (school_wide, future)
  const { data: upcomingEvents } = await supabase
    .from('calendar_events')
    .select('id, title, start_at, event_type')
    .eq('tenant_id', tenantId)
    .eq('scope', 'school_wide')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(5)

  // Checklist items assigned to this user, not completed
  const { data: checklistAssignments } = await supabase
    .from('checklist_assignments')
    .select('id, status, due_date, checklist_templates(name)')
    .eq('assigned_to_user_id', userId)
    .eq('tenant_id', tenantId)
    .neq('status', 'completed')
    .order('due_date', { ascending: true })

  const checklistItems = (checklistAssignments ?? []).map(a => ({
    title: (a.checklist_templates as unknown as { name: string } | null)?.name ?? 'Checklist item',
    overdue: a.due_date ? new Date(a.due_date) < new Date() : false,
  }))

  // Empty state
  if (myChildren.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight md:text-3xl"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}
          >
            Welcome!
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No children linked to your account yet.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="grid gap-3 grid-cols-3">
          {[
            { label: 'Check In', href: '/portal/parent/check-in', icon: LogIn },
            { label: 'Messages', href: '/portal/parent/messaging', icon: MessageSquare },
            { label: 'Billing', href: '/portal/parent/billing', icon: CreditCard },
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
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight md:text-3xl"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}
        >
          Good morning
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Here is what is happening with your family today.
        </p>
      </div>

      {/* Quick action buttons */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: 'Check In', href: '/portal/parent/check-in', icon: LogIn },
          { label: 'Messages', href: '/portal/parent/messaging', icon: MessageSquare },
          { label: 'Billing', href: '/portal/parent/billing', icon: CreditCard },
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

      {/* My Children cards */}
      <div>
        <h2
          className="mb-4 text-lg font-semibold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}
        >
          My Children
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {myChildren.map((child) => (
            <Card key={child.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar placeholder */}
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {child.firstName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
                        {child.firstName} {child.lastName}
                      </p>
                      {child.checkedIn ? (
                        <Badge variant="success" size="sm">Checked in</Badge>
                      ) : (
                        <Badge variant="outline" size="sm">Not checked in</Badge>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                      {child.classroom} &middot; {child.age}
                    </p>
                    {child.checkedInAt && (
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        Dropped off at {child.checkedInAt}
                      </p>
                    )}
                    {child.allergies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {child.allergies.map((allergy) => (
                          <Badge key={allergy} variant="danger" size="sm">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily report preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart size={18} style={{ color: 'var(--color-accent, var(--color-primary))' }} />
              {todayReport
                ? `Today's Report — ${reportChildName}`
                : "Today's Report"}
            </CardTitle>
            <CardDescription>
              {todayReport
                ? 'Published'
                : 'No published reports yet today'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportEntries.length > 0 ? (
              <ul className="space-y-3">
                {reportEntries.map((entry, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="mt-0.5 text-xs font-medium shrink-0 w-16"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                      {(entry.data as Record<string, unknown>)?.description as string
                        ?? (entry.data as Record<string, unknown>)?.notes as string
                        ?? (entry.data as Record<string, unknown>)?.activity_name as string
                        ?? entry.entry_type}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                No report entries for today yet. Updates will appear throughout the day.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events + checklist items */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays size={18} style={{ color: 'var(--color-primary)' }} />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(upcomingEvents ?? []).length > 0 ? (
                <ul className="space-y-3">
                  {(upcomingEvents ?? []).map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center justify-between"
                    >
                      <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                        {event.title}
                      </p>
                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {new Date(event.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  No upcoming events.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare size={18} style={{ color: 'var(--color-warning)' }} />
                Outstanding Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklistItems.length > 0 ? (
                <ul className="space-y-3">
                  {checklistItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          backgroundColor: item.overdue
                            ? 'var(--color-destructive)'
                            : 'var(--color-warning)',
                        }}
                      />
                      <div>
                        <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                          {item.title}
                        </p>
                        {item.overdue && (
                          <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>
                            Overdue
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  All caught up! No outstanding items.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
