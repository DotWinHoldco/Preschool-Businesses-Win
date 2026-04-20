// @anchor: cca.admin.dashboard
// Admin dashboard — overview widgets with real Supabase data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  Users,
  UserCheck,
  DollarSign,
  FileText,
  ShieldAlert,
  CheckCircle,
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
  title: 'Admin Dashboard — Portal',
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// ---------------------------------------------------------------------------
// Widget components
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconColor?: string
  badge?: { label: string; variant: 'success' | 'warning' | 'danger' }
}

function StatCard({ title, value, subtitle, icon: Icon, iconColor, badge }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">{title}</CardDescription>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${iconColor ?? 'var(--color-primary)'} 10%, transparent)`,
            color: iconColor ?? 'var(--color-primary)',
          }}
        >
          <Icon size={20} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-3">
          <p
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-foreground)' }}
          >
            {value}
          </p>
          {badge && (
            <Badge variant={badge.variant} size="sm">
              {badge.label}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01' // YYYY-MM-01

  const [
    { count: activeStudents },
    { count: todayPresent },
    { data: paidInvoices },
    { count: pendingApplications },
    { count: staffCount },
  ] = await Promise.all([
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('enrollment_status', 'active'),
    supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('date', today)
      .eq('status', 'present'),
    supabase
      .from('invoices')
      .select('total_cents')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .gte('created_at', monthStart),
    supabase
      .from('enrollment_applications')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('pipeline_stage', 'form_submitted'),
    supabase
      .from('staff_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
  ])

  const totalActiveStudents = activeStudents ?? 0
  const totalTodayPresent = todayPresent ?? 0
  const revenueMTD = (paidInvoices ?? []).reduce((sum, inv) => sum + (inv.total_cents ?? 0), 0)
  const totalPendingApplications = pendingApplications ?? 0
  const totalStaff = staffCount ?? 0

  const attendancePct =
    totalActiveStudents > 0
      ? Math.round((totalTodayPresent / totalActiveStudents) * 100)
      : 0

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight md:text-3xl"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}
        >
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Welcome back. Here is your school overview for today.
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Active Students"
          value={String(totalActiveStudents)}
          subtitle={`${totalStaff} staff member${totalStaff !== 1 ? 's' : ''}`}
          icon={Users}
        />

        <StatCard
          title="Today's Attendance"
          value={`${totalTodayPresent} / ${totalActiveStudents}`}
          subtitle={`${attendancePct}% checked in`}
          icon={UserCheck}
          iconColor="var(--color-success)"
          badge={
            totalActiveStudents > 0
              ? attendancePct >= 90
                ? { label: 'On track', variant: 'success' }
                : { label: 'Below expected', variant: 'warning' }
              : undefined
          }
        />

        <StatCard
          title="Revenue MTD"
          value={formatCurrency(revenueMTD)}
          subtitle="Tuition + fees collected this month"
          icon={DollarSign}
          iconColor="var(--color-success)"
        />

        <StatCard
          title="Pending Applications"
          value={String(totalPendingApplications)}
          subtitle="Awaiting review in enrollment queue"
          icon={FileText}
          iconColor="var(--color-warning)"
          badge={
            totalPendingApplications > 0
              ? { label: 'Action needed', variant: 'warning' }
              : undefined
          }
        />

        <StatCard
          title="Total Staff"
          value={String(totalStaff)}
          subtitle="Active staff members"
          icon={ShieldAlert}
          iconColor="var(--color-primary)"
        />

        <StatCard
          title="Attendance Rate"
          value={totalActiveStudents > 0 ? `${attendancePct}%` : 'N/A'}
          subtitle="Based on active enrollment"
          icon={CheckCircle}
          iconColor={attendancePct >= 90 ? 'var(--color-success)' : 'var(--color-warning)'}
          badge={
            totalActiveStudents > 0
              ? attendancePct >= 90
                ? { label: 'All clear', variant: 'success' }
                : { label: 'Low', variant: 'warning' }
              : undefined
          }
        />
      </div>

      {/* Quick actions section */}
      <div>
        <h2
          className="mb-4 text-lg font-semibold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}
        >
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Review Applications', href: '/portal/admin/enrollment', count: totalPendingApplications },
            { label: 'View Attendance', href: '/portal/admin/attendance', count: null },
            { label: 'Staff Scheduling', href: '/portal/admin/staff/scheduling', count: null },
            { label: 'Run Billing', href: '/portal/admin/billing', count: null },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="flex items-center justify-between rounded-[var(--radius)] border px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--color-muted)]"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
            >
              <span>{action.label}</span>
              {action.count != null && action.count > 0 && (
                <Badge variant="default" size="sm">
                  {action.count}
                </Badge>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
