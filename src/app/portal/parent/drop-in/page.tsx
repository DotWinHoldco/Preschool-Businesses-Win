// @anchor: cca.dropin.parent-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { CalendarPlus, CalendarDays } from 'lucide-react'

export default async function ParentDropInPage() {
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

  // Fetch drop-in bookings for this family
  const { data: bookings } = familyIds.length > 0
    ? await supabase
        .from('drop_in_bookings')
        .select('id, date, booking_type, status, rate_charged_cents, notes, student_id, booked_at, cancelled_at')
        .eq('tenant_id', tenantId)
        .in('family_id', familyIds)
        .order('date', { ascending: false })
    : { data: [] }

  const bookingList = bookings ?? []

  function formatDate(dateStr: string | null) {
    if (!dateStr) return ''
    try {
      return new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr ?? ''
    }
  }

  function fmt(cents: number | null) {
    if (cents == null) return null
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
  }

  const statusStyles: Record<string, string> = {
    confirmed: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    pending: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    cancelled: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
    completed: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Drop-in Days
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          View and manage your drop-in bookings.
        </p>
      </div>

      {bookingList.length > 0 ? (
        <div className="flex flex-col gap-3">
          {bookingList.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--color-muted)' }}
                  >
                    <CalendarPlus size={18} style={{ color: 'var(--color-muted-foreground)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                      {formatDate(booking.date)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {booking.booking_type && (
                        <span className="text-xs capitalize" style={{ color: 'var(--color-muted-foreground)' }}>
                          {booking.booking_type.replace(/_/g, ' ')}
                        </span>
                      )}
                      {booking.rate_charged_cents != null && (
                        <span className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>
                          {fmt(booking.rate_charged_cents)}
                        </span>
                      )}
                    </div>
                    {booking.notes && (
                      <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {booking.notes}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0 ${
                    statusStyles[booking.status] ?? 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                  }`}
                >
                  {booking.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <CalendarDays size={24} style={{ color: 'var(--color-muted-foreground)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No drop-in bookings yet.
          </p>
        </div>
      )}
    </div>
  )
}
