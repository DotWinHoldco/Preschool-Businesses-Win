// @anchor: cca.curriculum.admin-page
// Admin curriculum management — lesson plans, activity library, and standards alignment.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BookOpen, Calendar, Library, GraduationCap } from 'lucide-react'

export default function AdminCurriculumPage() {
  // TODO: Fetch curriculum data from Supabase
  const stats = [
    { label: 'Active Lesson Plans', value: '8', icon: Calendar },
    { label: 'Activity Library', value: '124', icon: Library },
    { label: 'Standards Mapped', value: '47', icon: GraduationCap },
    { label: 'This Week\'s Plans', value: '4', icon: BookOpen },
  ]

  const recentPlans = [
    { id: '1', title: 'Spring Flowers & Growth', classroom: 'Butterfly Room', weekStart: '2026-04-06', status: 'published' },
    { id: '2', title: 'Community Helpers', classroom: 'Sunshine Room', weekStart: '2026-04-06', status: 'published' },
    { id: '3', title: 'Under the Sea', classroom: 'Rainbow Room', weekStart: '2026-04-06', status: 'draft' },
    { id: '4', title: 'Easter Week', classroom: 'Butterfly Room', weekStart: '2026-04-13', status: 'draft' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Curriculum
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Manage lesson plans, browse the activity library, and track standards alignment across classrooms.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
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
          )
        })}
      </div>

      {/* Recent Lesson Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lesson Plans</CardTitle>
          <CardDescription>View and manage weekly lesson plans by classroom.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {recentPlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                    {plan.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {plan.classroom} &middot; Week of {plan.weekStart}
                  </p>
                </div>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: plan.status === 'published'
                      ? 'var(--color-success, #10B981)'
                      : 'var(--color-muted)',
                    color: plan.status === 'published'
                      ? '#fff'
                      : 'var(--color-muted-foreground)',
                  }}
                >
                  {plan.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
