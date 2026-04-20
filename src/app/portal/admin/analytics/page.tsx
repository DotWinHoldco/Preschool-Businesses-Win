// @anchor: cca.analytics.admin-page

import Link from 'next/link'
import {
  Users,
  UserCheck,
  DollarSign,
  FileText,
  CalendarCheck,
  CalendarPlus,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  BarChart3,
  PieChart,
  ShieldCheck,
  UserCog,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ---------------------------------------------------------------------------
// KPI data
// ---------------------------------------------------------------------------

interface KPI {
  label: string
  value: string
  trend: 'up' | 'down' | 'flat'
  comparison: string
  icon: typeof Users
  color: string
}

const kpis: KPI[] = [
  {
    label: 'Enrolled Students',
    value: '47',
    trend: 'up',
    comparison: '+3 vs last month',
    icon: Users,
    color: 'var(--color-primary)',
  },
  {
    label: 'Staff Count',
    value: '12',
    trend: 'flat',
    comparison: 'No change',
    icon: UserCheck,
    color: 'var(--color-secondary, var(--color-primary))',
  },
  {
    label: 'MTD Revenue',
    value: '$28,450',
    trend: 'up',
    comparison: '+12% vs last month',
    icon: DollarSign,
    color: 'var(--color-success)',
  },
  {
    label: 'Open Invoices',
    value: '8',
    trend: 'down',
    comparison: '$3,200 outstanding',
    icon: FileText,
    color: 'var(--color-warning)',
  },
  {
    label: 'Attendance Rate (7d)',
    value: '94.2%',
    trend: 'up',
    comparison: '+1.1% vs prior week',
    icon: CalendarCheck,
    color: 'var(--color-success)',
  },
  {
    label: 'Tours Booked (7d)',
    value: '5',
    trend: 'up',
    comparison: '+2 vs prior week',
    icon: CalendarPlus,
    color: 'var(--color-primary)',
  },
]

// ---------------------------------------------------------------------------
// Sub-route cards
// ---------------------------------------------------------------------------

interface SubRoute {
  title: string
  description: string
  href: string
  icon: typeof BarChart3
}

const subRoutes: SubRoute[] = [
  {
    title: 'Attendance Analytics',
    description: 'Daily patterns, heatmaps, and trend analysis across classrooms.',
    href: '/portal/admin/analytics/attendance',
    icon: BarChart3,
  },
  {
    title: 'Financial Overview',
    description: 'Revenue trends, outstanding balances, and collection rates.',
    href: '/portal/admin/analytics/financial',
    icon: PieChart,
  },
  {
    title: 'Compliance Scorecard',
    description: 'Licensing status, ratio tracking, and inspection readiness.',
    href: '/portal/admin/analytics/compliance',
    icon: ShieldCheck,
  },
  {
    title: 'Staff Insights',
    description: 'Hours, certifications, turnover, and training progress.',
    href: '/portal/admin/analytics/staff',
    icon: UserCog,
  },
]

// ---------------------------------------------------------------------------
// Trend icon helper
// ---------------------------------------------------------------------------

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up')
    return <TrendingUp size={16} className="text-[var(--color-success)]" />
  if (trend === 'down')
    return <TrendingDown size={16} className="text-[var(--color-destructive)]" />
  return <Minus size={16} className="text-[var(--color-muted-foreground)]" />
}

// ---------------------------------------------------------------------------
// Date range selector (server-friendly static version)
// ---------------------------------------------------------------------------

function DateRangeSelector() {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        defaultValue="2026-04-01"
        className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] min-h-[48px]"
      />
      <span className="text-sm text-[var(--color-muted-foreground)]">to</span>
      <input
        type="date"
        defaultValue="2026-04-20"
        className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] min-h-[48px]"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header + date range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Key metrics and insights for your center.
          </p>
        </div>
        <DateRangeSelector />
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: kpi.color + '18' }}
                    >
                      <Icon size={20} style={{ color: kpi.color }} />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {kpi.label}
                      </p>
                      <p className="text-2xl font-bold text-[var(--color-foreground)]">
                        {kpi.value}
                      </p>
                    </div>
                  </div>
                  <TrendIcon trend={kpi.trend} />
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                  {kpi.comparison}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sub-route cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {subRoutes.map((route) => {
          const Icon = route.icon
          return (
            <Link key={route.href} href={route.href}>
              <Card className="h-full group cursor-pointer">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                    <Icon size={20} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                      {route.title}
                    </p>
                    <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
                      {route.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 mt-0.5 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition-colors"
                  />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
