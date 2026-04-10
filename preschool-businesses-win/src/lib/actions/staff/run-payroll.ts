'use server'

// @anchor: cca.payroll.run
// Payroll run wizard logic — create a payroll run and compute line items from time entries.

import { headers } from 'next/headers'
import { createTenantServerClient } from '@/lib/supabase/server'
import { RunPayrollSchema } from '@/lib/schemas/staff'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

export type PayrollRunState = {
  ok: boolean
  error?: string
  payroll_run_id?: string
  line_items_count?: number
}

export async function runPayroll(
  _prev: PayrollRunState,
  formData: FormData,
): Promise<PayrollRunState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = RunPayrollSchema.safeParse(raw)

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { period_start, period_end } = parsed.data
    const headerStore = await headers()
    const tenantId = headerStore.get('x-tenant-id') ?? CCA_TENANT_ID
    const supabase = await createTenantServerClient()

    // Create payroll run
    const { data: run, error: runErr } = await supabase
      .from('payroll_runs')
      .insert({
        tenant_id: tenantId,
        period_start,
        period_end,
        status: 'draft',
        total_gross: 0,
        total_net: 0,
      })
      .select('id')
      .single()

    if (runErr || !run) {
      return { ok: false, error: runErr?.message ?? 'Failed to create payroll run' }
    }

    // Fetch completed time entries for the period
    const { data: timeEntries, error: teErr } = await supabase
      .from('time_entries')
      .select('user_id, total_hours, overtime_hours')
      .eq('status', 'completed')
      .gte('clock_in_at', period_start)
      .lte('clock_in_at', period_end)

    if (teErr) {
      return { ok: false, error: teErr.message }
    }

    // Aggregate hours by user
    const userHours: Record<string, { regular: number; overtime: number }> = {}
    for (const te of timeEntries ?? []) {
      if (!userHours[te.user_id]) {
        userHours[te.user_id] = { regular: 0, overtime: 0 }
      }
      userHours[te.user_id].regular += (te.total_hours ?? 0) - (te.overtime_hours ?? 0)
      userHours[te.user_id].overtime += te.overtime_hours ?? 0
    }

    // Fetch staff profiles for hourly rates
    const userIds = Object.keys(userHours)
    if (userIds.length === 0) {
      return { ok: true, payroll_run_id: run.id, line_items_count: 0 }
    }

    const { data: profiles } = await supabase
      .from('staff_profiles')
      .select('user_id, hourly_rate')
      .in('user_id', userIds)

    const rateMap: Record<string, number> = {}
    for (const p of profiles ?? []) {
      rateMap[p.user_id] = p.hourly_rate ?? 0
    }

    // Create line items
    let totalGross = 0
    const lineItems = userIds.map((userId) => {
      const hours = userHours[userId]
      const rate = rateMap[userId] ?? 0
      const regularPay = Math.round(hours.regular * rate * 100) / 100
      const overtimePay = Math.round(hours.overtime * rate * 1.5 * 100) / 100
      const grossPay = regularPay + overtimePay
      totalGross += grossPay

      return {
        tenant_id: tenantId,
        payroll_run_id: run.id,
        user_id: userId,
        regular_hours: Math.round(hours.regular * 100) / 100,
        overtime_hours: Math.round(hours.overtime * 100) / 100,
        regular_pay: regularPay,
        overtime_pay: overtimePay,
        pto_hours: 0,
        pto_pay: 0,
        gross_pay: grossPay,
        deductions: {},
        net_pay: grossPay, // Deductions configured per employee by admin
      }
    })

    if (lineItems.length > 0) {
      await supabase.from('payroll_line_items').insert(lineItems)
    }

    // Update run totals
    await supabase
      .from('payroll_runs')
      .update({ total_gross: totalGross, total_net: totalGross })
      .eq('id', run.id)

    return { ok: true, payroll_run_id: run.id, line_items_count: lineItems.length }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
