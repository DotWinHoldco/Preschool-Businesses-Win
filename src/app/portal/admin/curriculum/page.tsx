// @anchor: cca.curriculum.admin-page
// Admin curriculum dashboard — real lesson plans, activity library count, standards count.

import Link from 'next/link'
import { BookOpen, Calendar, Library, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import AdminCurriculumClient from '@/components/portal/admin-curriculum-client'

export const dynamic = 'force-dynamic'

function startOfWeek(d: Date): Date {
  const day = d.getDay() // 0 = Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default async function AdminCurriculumPage() {
  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  const [plansRes, activitiesCountRes, standardsCountRes, classroomsRes] = await Promise.all([
    supabase
      .from('lesson_plans')
      .select('id, title, classroom_id, week_start_date, status, theme, published_at, created_at')
      .eq('tenant_id', tenantId)
      .order('week_start_date', { ascending: false })
      .limit(50),
    supabase
      .from('curriculum_activities')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_archived', false),
    supabase
      .from('learning_standards')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('classrooms')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name'),
  ])

  const plans = plansRes.data ?? []
  const activityCount = activitiesCountRes.count ?? 0
  const standardsCount = standardsCountRes.count ?? 0
  const classrooms = classroomsRes.data ?? []

  const classroomById = new Map(classrooms.map((c) => [c.id, c.name]))
  const weekStart = startOfWeek(new Date()).toISOString().slice(0, 10)

  const publishedCount = plans.filter((p) => p.status === 'published').length
  const thisWeekCount = plans.filter((p) => p.week_start_date === weekStart).length

  const stats = [
    { label: 'Active Lesson Plans', value: String(publishedCount), icon: Calendar },
    {
      label: 'Activity Library',
      value: String(activityCount),
      icon: Library,
      href: '/portal/admin/curriculum/activities',
    },
    {
      label: 'Standards Mapped',
      value: String(standardsCount),
      icon: GraduationCap,
      href: '/portal/admin/curriculum/standards',
    },
    { label: "This Week's Plans", value: String(thisWeekCount), icon: BookOpen },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Curriculum
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Manage lesson plans, browse the activity library, and track standards alignment across
            classrooms.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/portal/admin/curriculum/activities"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
          >
            <Library size={14} /> Activity Library
          </Link>
          <Link
            href="/portal/admin/curriculum/standards"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
          >
            <GraduationCap size={14} /> Standards
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const CardWrap = stat.href
            ? (p: { children: React.ReactNode }) => <Link href={stat.href!}>{p.children}</Link>
            : (p: { children: React.ReactNode }) => <>{p.children}</>
          return (
            <CardWrap key={stat.label}>
              <Card
                className={
                  stat.href ? 'transition-colors hover:bg-[var(--color-muted)]' : undefined
                }
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-primary-foreground)',
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                      {stat.value}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {stat.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardWrap>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Recent Lesson Plans</CardTitle>
            <CardDescription>View and manage weekly lesson plans by classroom.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <AdminCurriculumClient
            initialPlans={plans.map((p) => ({
              id: p.id,
              title: p.title,
              classroomId: p.classroom_id,
              classroomName: classroomById.get(p.classroom_id) ?? 'Unknown classroom',
              weekStart: p.week_start_date,
              theme: p.theme,
              status: (p.status as 'draft' | 'published' | 'archived') ?? 'draft',
            }))}
            classrooms={classrooms.map((c) => ({ id: c.id, name: c.name }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
