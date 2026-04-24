// @anchor: cca.dropin.admin.cancel-booking
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { CancelDropInBookingSchema, type CancelDropInBookingInput } from '@/lib/schemas/drop-in'

export type CancelDropInBookingState = {
  ok: boolean
  error?: string
  id?: string
}

const PATH = '/portal/admin/drop-in'

export async function cancelDropInBooking(
  input: CancelDropInBookingInput,
): Promise<CancelDropInBookingState> {
  await assertRole('admin')

  const parsed = CancelDropInBookingSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const { booking_id, cancel_reason } = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('drop_in_bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason,
    })
    .eq('id', booking_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'drop_in.booking.cancelled',
    entity_type: 'drop_in_booking',
    entity_id: booking_id,
    after_data: { status: 'cancelled', cancel_reason },
  })

  revalidatePath(PATH)
  return { ok: true, id: booking_id }
}
