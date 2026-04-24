// @anchor: cca.appointments.admin-availability

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'
import { AvailabilityClient } from '@/components/portal/appointments/availability-client'

export default async function AvailabilityPage() {
  const session = await getSession()
  if (!session) redirect('/portal/login')

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) throw new Error('Missing tenant context (x-tenant-id header not set)')

  const supabase = createAdminClient()

  const [staffResult, availabilityResult, overridesResult, connectionsResult, typesResult] =
    await Promise.all([
      supabase
        .from('staff')
        .select('id, user_id, first_name, last_name, role')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('last_name'),
      supabase
        .from('staff_availability')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('user_id')
        .order('day_of_week'),
      supabase
        .from('staff_availability_overrides')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date'),
      supabase
        .from('calendar_connections')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('appointment_types')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name'),
    ])

  const staff = (staffResult.data ?? []) as Array<{
    id: string
    user_id: string
    first_name: string
    last_name: string
    role: string
  }>

  const availability = (availabilityResult.data ?? []) as Array<{
    id: string
    user_id: string
    day_of_week: number
    start_time: string
    end_time: string
    appointment_type_id: string | null
    effective_from: string | null
    effective_to: string | null
  }>

  const overrides = (overridesResult.data ?? []) as Array<{
    id: string
    user_id: string
    date: string
    is_available: boolean
    start_time: string | null
    end_time: string | null
    reason: string | null
  }>

  const connections = (connectionsResult.data ?? []) as Array<{
    id: string
    user_id: string
    provider: string
    calendar_name: string | null
    status: string
    last_synced_at: string | null
  }>

  const appointmentTypes = (typesResult.data ?? []) as Array<{
    id: string
    name: string
  }>

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Staff Availability</h1>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Weekly patterns, date overrides, and connected calendars.
        </p>
      </div>

      <AvailabilityClient
        staff={staff}
        availabilityPatterns={availability}
        overrides={overrides}
        calendarConnections={connections}
        appointmentTypes={appointmentTypes}
      />
    </div>
  )
}
