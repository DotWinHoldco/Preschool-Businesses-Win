// @anchor: cca.portfolio.admin-page
// Admin portfolios overview — child development portfolios, observations, and assessments.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GraduationCap, Camera, FileText, BarChart3 } from 'lucide-react'

export default function AdminPortfoliosPage() {
  // TODO: Fetch portfolio data from Supabase
  const stats = [
    { label: 'Total Observations', value: '286', icon: Camera },
    { label: 'Learning Stories', value: '42', icon: FileText },
    { label: 'Assessments Due', value: '12', icon: BarChart3 },
    { label: 'Students with Portfolios', value: '58', icon: GraduationCap },
  ]

  const recentObservations = [
    { id: '1', student: 'Sophia Martinez', title: 'Building with blocks — spatial reasoning', domain: 'Math & Logic', date: '2026-04-08', teacher: 'Mrs. Johnson' },
    { id: '2', student: 'Liam Chen', title: 'First time sharing toys unprompted', domain: 'Social-Emotional', date: '2026-04-08', teacher: 'Ms. Davis' },
    { id: '3', student: 'Emma Wilson', title: 'Recognizing all letters in her name', domain: 'Literacy', date: '2026-04-07', teacher: 'Mrs. Johnson' },
    { id: '4', student: 'Noah Brown', title: 'Counting to 20 independently', domain: 'Math & Logic', date: '2026-04-07', teacher: 'Ms. Davis' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Portfolios
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Track child development through observations, learning stories, and formal assessments aligned to learning domains.
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
                  style={{ backgroundColor: 'var(--color-secondary, var(--color-primary))', color: 'var(--color-primary-foreground)' }}
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

      {/* Recent Observations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Observations</CardTitle>
          <CardDescription>Latest developmental observations logged by teachers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {recentObservations.map((obs) => (
              <div key={obs.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                    {obs.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {obs.student} &middot; {obs.teacher} &middot; {obs.date}
                  </p>
                </div>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
                >
                  {obs.domain}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Assessments</CardTitle>
          <CardDescription>Quarterly developmental assessments scheduled for completion.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg p-8 text-center" style={{ backgroundColor: 'var(--color-muted)' }}>
            <BarChart3 className="mx-auto mb-2" size={32} style={{ color: 'var(--color-muted-foreground)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              Q2 2026 Assessments
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              12 students due for quarterly assessment by April 30, 2026.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
