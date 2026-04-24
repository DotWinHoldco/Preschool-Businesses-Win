// @anchor: cca.dropin.admin-page

import { Card, CardContent } from '@/components/ui/card'
import { CalendarClock, Users, DollarSign, Calendar } from 'lucide-react'
import { DropInTabs } from '@/components/portal/drop-in/drop-in-tabs'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createTenantAdminClient } from '@/lib/supabase/admin'

type BookingRow = {
  id: string
  date: string
  booking_type: string
  status: string
  rate_charged_cents: number | null
  cancel_reason: string | null
  notes: string | null
  family_id: string | null
  classroom_id: string | null
  student_id: string | null
  students: { first_name: string | null; last_name: string | null } | null
  families: { family_name: string | null } | null
  classrooms: { name: string | null } | null
}

type SessionRow = {
  id: string
  classroom_id: string | null
  day_of_week: number | null
  date: string | null
  start_time: string
  end_time: string
  capacity: number
  notes: string | null
  is_active: boolean
}

type PricingRow = {
  id: string
  classroom_id: string | null
  age_range_label: string
  age_range_min_months: number
  age_range_max_months: number
  full_day_cents: number
  half_day_cents: number
  hourly_cents: number
  is_active: boolean
}

type ClassroomRow = {
  id: string
  name: string
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]!
}

function startOfWeekISO(): string {
  const d = new Date()
  const day = d.getDay() // 0 = Sunday
  const diff = d.getDate() - day
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]!
}

function startOfMonthISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function endOfMonthISO(): string {
  const d = new Date()
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return last.toISOString().split('T')[0]!
}

export default async function AdminDropInPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'rates' || tab === 'slots' ? tab : 'bookings'

  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  const today = todayISO()
  const weekStart = startOfWeekISO()
  const monthStart = startOfMonthISO()
  const monthEnd = endOfMonthISO()

  // Today's bookings (for bookings tab + "open slots today" signal)
  const [todaysRes, weekCountRes, monthRes, sessionsRes, pricingRes, classroomsRes] =
    await Promise.all([
      supabase
        .from('drop_in_bookings')
        .select(
          'id, date, booking_type, status, rate_charged_cents, cancel_reason, notes, family_id, classroom_id, student_id, students:students(first_name,last_name), families:families(family_name), classrooms:classrooms(name)',
        )
        .eq('tenant_id', tenantId)
        .eq('date', today)
        .order('booking_type', { ascending: true }),
      supabase
        .from('drop_in_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('date', weekStart)
        .in('status', ['confirmed', 'completed']),
      supabase
        .from('drop_in_bookings')
        .select('rate_charged_cents, family_id, status')
        .eq('tenant_id', tenantId)
        .gte('date', monthStart)
        .lte('date', monthEnd),
      supabase
        .from('drop_in_sessions')
        .select(
          'id, classroom_id, day_of_week, date, start_time, end_time, capacity, notes, is_active',
        )
        .eq('tenant_id', tenantId)
        .order('day_of_week', { ascending: true }),
      supabase
        .from('drop_in_pricing')
        .select(
          'id, classroom_id, age_range_label, age_range_min_months, age_range_max_months, full_day_cents, half_day_cents, hourly_cents, is_active',
        )
        .eq('tenant_id', tenantId)
        .order('age_range_min_months', { ascending: true }),
      supabase
        .from('classrooms')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true }),
    ])

  const todaysBookings = (todaysRes.data ?? []) as unknown as BookingRow[]
  const sessions = (sessionsRes.data ?? []) as SessionRow[]
  const pricing = (pricingRes.data ?? []) as PricingRow[]
  const classrooms = (classroomsRes.data ?? []) as ClassroomRow[]

  // Stats
  const weekBookingsCount = weekCountRes.count ?? 0

  const monthRows = (monthRes.data ?? []) as Array<{
    rate_charged_cents: number | null
    family_id: string | null
    status: string
  }>

  const monthlyRevenueCents = monthRows
    .filter((r) => r.status !== 'cancelled')
    .reduce((sum, r) => sum + (r.rate_charged_cents ?? 0), 0)

  const activeFamilies = new Set(
    monthRows.filter((r) => r.status !== 'cancelled' && r.family_id).map((r) => r.family_id!),
  ).size

  // Open slots today = sum of capacity for today's active sessions minus today's confirmed bookings
  const jsDayToday = new Date().getDay()
  const todaySessionCapacity = sessions
    .filter((s) => s.is_active)
    .filter(
      (s) =>
        (s.date && s.date === today) || (s.day_of_week !== null && s.day_of_week === jsDayToday),
    )
    .reduce((sum, s) => sum + (s.capacity ?? 0), 0)
  const todayActiveBookings = todaysBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'completed',
  ).length
  const openSlotsToday = Math.max(0, todaySessionCapacity - todayActiveBookings)

  const stats = [
    { label: 'Open Slots Today', value: String(openSlotsToday), icon: CalendarClock },
    { label: 'Bookings This Week', value: String(weekBookingsCount), icon: Calendar },
    {
      label: 'Revenue This Month',
      value: `$${(monthlyRevenueCents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
    },
    { label: 'Active Drop-in Families', value: String(activeFamilies), icon: Users },
  ]

  // Shape props for tabs
  const bookingsProp = todaysBookings.map((b) => ({
    id: b.id,
    student:
      [b.students?.first_name, b.students?.last_name].filter(Boolean).join(' ').trim() ||
      'Unknown student',
    classroom: b.classrooms?.name ?? '—',
    type: b.booking_type,
    status: b.status,
  }))

  const sessionsProp = sessions.map((s) => ({
    id: s.id,
    classroom_id: s.classroom_id,
    classroom_name: classrooms.find((c) => c.id === s.classroom_id)?.name ?? '—',
    day_of_week: s.day_of_week,
    date: s.date,
    start_time: s.start_time,
    end_time: s.end_time,
    capacity: s.capacity,
    notes: s.notes,
    is_active: s.is_active,
  }))

  const pricingProp = pricing.map((p) => ({
    id: p.id,
    classroom_id: p.classroom_id,
    classroom_name: p.classroom_id
      ? (classrooms.find((c) => c.id === p.classroom_id)?.name ?? 'All classrooms')
      : 'All classrooms',
    age_range_label: p.age_range_label,
    age_range_min_months: p.age_range_min_months,
    age_range_max_months: p.age_range_max_months,
    full_day_cents: p.full_day_cents,
    half_day_cents: p.half_day_cents,
    hourly_cents: p.hourly_cents,
    is_active: p.is_active,
  }))

  const classroomsProp = classrooms.map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Drop-in Scheduling
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Manage drop-in day availability, view bookings, and configure rates per classroom.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
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
          )
        })}
      </div>

      <DropInTabs
        activeTab={activeTab}
        bookings={bookingsProp}
        sessions={sessionsProp}
        pricing={pricingProp}
        classrooms={classroomsProp}
      />
    </div>
  )
}
