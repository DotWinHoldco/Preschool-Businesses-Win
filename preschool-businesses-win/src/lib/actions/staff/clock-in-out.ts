'use server'

// @anchor: cca.staff.clock
// Clock in/out with break tracking for staff time entries.

import { createTenantServerClient } from '@/lib/supabase/server'
import { ClockInSchema, ClockOutSchema, StartBreakSchema, EndBreakSchema } from '@/lib/schemas/staff'
import { getTenantId } from '@/lib/actions/get-tenant-id'

export type ClockState = {
  ok: boolean
  error?: string
  time_entry_id?: string
}

export async function clockIn(
  _prev: ClockState,
  formData: FormData,
): Promise<ClockState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = ClockInSchema.safeParse(raw)

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const tenantId = await getTenantId()
    const supabase = await createTenantServerClient()

    // Check for existing active entry
    const { data: active } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', parsed.data.user_id)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (active) {
      return { ok: false, error: 'Already clocked in. Clock out first.' }
    }

    const { data: entry, error } = await supabase
      .from('time_entries')
      .insert({
        tenant_id: tenantId,
        user_id: parsed.data.user_id,
        clock_in_at: new Date().toISOString(),
        clock_in_method: parsed.data.method,
        status: 'active',
        notes: parsed.data.notes,
      })
      .select('id')
      .single()

    if (error || !entry) {
      return { ok: false, error: error?.message ?? 'Failed to clock in' }
    }

    return { ok: true, time_entry_id: entry.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function clockOut(
  _prev: ClockState,
  formData: FormData,
): Promise<ClockState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = ClockOutSchema.safeParse(raw)

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const supabase = await createTenantServerClient()

    const now = new Date()
    const { data: entry, error: fetchErr } = await supabase
      .from('time_entries')
      .select('clock_in_at, break_start_at, break_end_at')
      .eq('id', parsed.data.time_entry_id)
      .eq('status', 'active')
      .single()

    if (fetchErr || !entry) {
      return { ok: false, error: 'Active time entry not found' }
    }

    const clockIn = new Date(entry.clock_in_at)
    let totalHours = (now.getTime() - clockIn.getTime()) / (1000 * 60 * 60)

    // Subtract break time if applicable
    if (entry.break_start_at && entry.break_end_at) {
      const breakMs = new Date(entry.break_end_at).getTime() - new Date(entry.break_start_at).getTime()
      totalHours -= breakMs / (1000 * 60 * 60)
    }

    const overtimeHours = Math.max(0, totalHours - 8)

    const { error } = await supabase
      .from('time_entries')
      .update({
        clock_out_at: now.toISOString(),
        total_hours: Math.round(totalHours * 100) / 100,
        overtime_hours: Math.round(overtimeHours * 100) / 100,
        status: 'completed',
        notes: parsed.data.notes,
      })
      .eq('id', parsed.data.time_entry_id)

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, time_entry_id: parsed.data.time_entry_id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function startBreak(
  _prev: ClockState,
  formData: FormData,
): Promise<ClockState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = StartBreakSchema.safeParse(raw)

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const supabase = await createTenantServerClient()

    const { error } = await supabase
      .from('time_entries')
      .update({ break_start_at: new Date().toISOString() })
      .eq('id', parsed.data.time_entry_id)
      .eq('status', 'active')

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, time_entry_id: parsed.data.time_entry_id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function endBreak(
  _prev: ClockState,
  formData: FormData,
): Promise<ClockState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = EndBreakSchema.safeParse(raw)

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const supabase = await createTenantServerClient()

    const { error } = await supabase
      .from('time_entries')
      .update({ break_end_at: new Date().toISOString() })
      .eq('id', parsed.data.time_entry_id)
      .eq('status', 'active')

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true, time_entry_id: parsed.data.time_entry_id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
