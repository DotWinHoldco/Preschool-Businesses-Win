// @anchor: cca.admin.dashboard
// Admin dashboard — overview widgets with server-side data fetching.
// Uses placeholder/mock data since tables are empty during Phase 1.

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

// ---------------------------------------------------------------------------
// Placeholder data (replaced with Supabase queries once data exists)
// ---------------------------------------------------------------------------

const WIDGETS = {
  totalStudents: 47,
  enrolledActive: 42,
  enrolledInactive: 5,
  todayCheckedIn: 38,
  todayExpected: 42,
  revenueMTD: 52_480_00, // in cents
  pendingApplications: 3,
  certExpirations: 2,
  ratioCompliant: true,
  ratioDetails: '100% compliant across 6 classrooms',
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

export default function AdminDashboardPage() {
  const attendancePct =
    WIDGETS.todayExpected > 0
      ? Math.round((WIDGETS.todayCheckedIn / WIDGETS.todayExpected) * 100)
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
          title="Total Students"
          value={String(WIDGETS.totalStudents)}
          subtitle={`${WIDGETS.enrolledActive} active, ${WIDGETS.enrolledInactive} inactive`}
          icon={Users}
        />

        <StatCard
          title="Today's Attendance"
          value={`${WIDGETS.todayCheckedIn} / ${WIDGETS.todayExpected}`}
          subtitle={`${attendancePct}% checked in`}
          icon={UserCheck}
          iconColor="var(--color-success)"
          badge={
            attendancePct >= 90
              ? { label: 'On track', variant: 'success' }
              : { label: 'Below expected', variant: 'warning' }
          }
        />

        <StatCard
          title="Revenue MTD"
          value={formatCurrency(WIDGETS.revenueMTD)}
          subtitle="Tuition + fees collected this month"
          icon={DollarSign}
          iconColor="var(--color-success)"
        />

        <StatCard
          title="Pending Applications"
          value={String(WIDGETS.pendingApplications)}
          subtitle="Awaiting review in enrollment queue"
          icon={FileText}
          iconColor="var(--color-warning)"
          badge={
            WIDGETS.pendingApplications > 0
              ? { label: 'Action needed', variant: 'warning' }
              : undefined
          }
        />

        <StatCard
          title="Cert Expirations"
          value={String(WIDGETS.certExpirations)}
          subtitle="Staff certifications expiring within 30 days"
          icon={ShieldAlert}
          iconColor="var(--color-destructive)"
          badge={
            WIDGETS.certExpirations > 0
              ? { label: 'Expiring soon', variant: 'danger' }
              : undefined
          }
        />

        <StatCard
          title="Ratio Compliance"
          value={WIDGETS.ratioCompliant ? 'Compliant' : 'Violation'}
          subtitle={WIDGETS.ratioDetails}
          icon={CheckCircle}
          iconColor={WIDGETS.ratioCompliant ? 'var(--color-success)' : 'var(--color-destructive)'}
          badge={
            WIDGETS.ratioCompliant
              ? { label: 'All clear', variant: 'success' }
              : { label: 'Alert', variant: 'danger' }
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
            { label: 'Review Applications', href: '/portal/admin/enrollment', count: WIDGETS.pendingApplications },
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
