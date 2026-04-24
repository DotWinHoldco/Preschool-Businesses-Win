// @anchor: cca.analytics.admin-page

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  Users,
  UserCheck,
  DollarSign,
  CalendarCheck,
  CalendarPlus,
  ArrowRight,
  BarChart3,
  PieChart,
  ShieldCheck,
  UserCog,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// ---------------------------------------------------------------------------
// KPI type
// ---------------------------------------------------------------------------

interface KPI {
  label: string
  value: string
  icon: typeof Users
  color: string
}

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
// Date range selector (server-friendly static version)
// ---------------------------------------------------------------------------

function DateRangeSelector() {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const todayStr = today.toISOString().split('T')[0]

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        defaultValue={firstOfMonth}
        className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] min-h-[48px]"
      />
      <span className="text-sm text-[var(--color-muted-foreground)]">to</span>
      <input
        type="date"
        defaultValue={todayStr}
        className="rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] min-h-[48px]"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminAnalyticsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const [studentsRes, staffRes, paidInvoicesRes, attendanceRes, toursRes] = await Promise.all([
    supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('enrollment_status', 'active'),
    supabase
      .from('staff_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase.from('invoices').select('total_cents').eq('tenant_id', tenantId).eq('status', 'paid'),
    supabase
      .from('attendance_records')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59'),
    supabase
      .from('tours')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', firstOfMonth + 'T00:00:00'),
  ])

  const studentCount = studentsRes.count ?? 0
  const staffCount = staffRes.count ?? 0
  const revenueCents = (paidInvoicesRes.data ?? []).reduce(
    (sum, inv) => sum + (inv.total_cents ?? 0),
    0,
  )
  const attendanceToday = attendanceRes.count ?? 0
  const toursThisMonth = toursRes.count ?? 0

  const kpis: KPI[] = [
    {
      label: 'Enrolled Students',
      value: studentCount.toString(),
      icon: Users,
      color: 'var(--color-primary)',
    },
    {
      label: 'Staff Count',
      value: staffCount.toString(),
      icon: UserCheck,
      color: 'var(--color-secondary, var(--color-primary))',
    },
    {
      label: 'Revenue (Paid)',
      value: formatCurrency(revenueCents),
      icon: DollarSign,
      color: 'var(--color-success)',
    },
    {
      label: 'Attendance Today',
      value: attendanceToday.toString(),
      icon: CalendarCheck,
      color: 'var(--color-success)',
    },
    {
      label: 'Tours This Month',
      value: toursThisMonth.toString(),
      icon: CalendarPlus,
      color: 'var(--color-primary)',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header + date range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Analytics Dashboard</h1>
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
                      <p className="text-sm text-[var(--color-muted-foreground)]">{kpi.label}</p>
                      <p className="text-2xl font-bold text-[var(--color-foreground)]">
                        {kpi.value}
                      </p>
                    </div>
                  </div>
                </div>
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
