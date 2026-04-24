'use server'

// @anchor: cca.payroll.run-wizard-actions
// Payroll wizard: calculate preview, submit (persist), approve, and export CSV.
// Uses time_entries + staff_profiles.hourly_rate. Follows existing column conventions
// for payroll_runs (total_gross/total_net) and payroll_line_items (regular_pay, overtime_pay, etc).

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface PayrollPreviewLineItem {
  user_id: string
  user_name: string
  employment_type: string | null
  hourly_rate: number
  regular_hours: number
  overtime_hours: number
  regular_pay_cents: number
  overtime_pay_cents: number
  gross_pay_cents: number
  federal_tax_cents: number
  fica_cents: number
  state_tax_cents: number
  net_pay_cents: number
}

// ---------------------------------------------------------------------------
// Calculate
// ---------------------------------------------------------------------------

const CalculatePayrollSchema = z.object({
  period_start: z.string().min(1),
  period_end: z.string().min(1),
})

export type CalculatePayrollInput = z.infer<typeof CalculatePayrollSchema>

export type CalculatePayrollState = {
  ok: boolean
  error?: string
  line_items?: PayrollPreviewLineItem[]
  total_gross_cents?: number
  total_net_cents?: number
}

// Build Monday-anchored weekly buckets within [start, end] and sum hours per user
// per week so that overtime (>40 hrs/week) can be computed.
function weekKey(d: Date): string {
  const day = d.getDay()
  // shift so Monday = 0
  const diff = (day + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

export async function calculatePayroll(
  input: CalculatePayrollInput,
): Promise<CalculatePayrollState> {
  await assertRole('director')

  const parsed = CalculatePayrollSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const { period_start, period_end } = parsed.data
  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  // Build datetime bounds (inclusive)
  const startAt = new Date(period_start + 'T00:00:00').toISOString()
  const endAt = new Date(period_end + 'T23:59:59').toISOString()

  // Fetch all time entries for this tenant; filter in-memory to support
  // schemas that use either clock_in/clock_out or clock_in_at/clock_out_at.
  const { data: entries, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('tenant_id', tenantId)
  if (error) {
    return { ok: false, error: error.message }
  }

  // Group hours per user per week
  const byUserWeek: Record<string, Record<string, number>> = {}
  for (const e of entries ?? []) {
    const clockIn = (e.clock_in_at as string | null) ?? (e.clock_in as string | null)
    const clockOut = (e.clock_out_at as string | null) ?? (e.clock_out as string | null)
    if (!clockIn || !clockOut) continue
    const ci = new Date(clockIn)
    const co = new Date(clockOut)
    if (ci < new Date(startAt) || ci > new Date(endAt)) continue
    const breakMin = (e.break_minutes as number | null) ?? (e.break_min as number | null) ?? 0
    const hours = Math.max(0, (co.getTime() - ci.getTime()) / 3_600_000 - breakMin / 60)
    const uid = e.user_id as string
    const wk = weekKey(ci)
    if (!byUserWeek[uid]) byUserWeek[uid] = {}
    byUserWeek[uid][wk] = (byUserWeek[uid][wk] ?? 0) + hours
  }

  const userIds = Object.keys(byUserWeek)
  if (userIds.length === 0) {
    return { ok: true, line_items: [], total_gross_cents: 0, total_net_cents: 0 }
  }

  // Fetch staff profiles
  const { data: profiles } = await supabase
    .from('staff_profiles')
    .select('user_id, employment_type, hourly_rate')
    .in('user_id', userIds)

  // Fetch names from user_tenant_memberships -> fallback to profiles table via auth.users if available
  const { data: memberships } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, email')
    .in('id', userIds)

  const nameMap: Record<string, string> = {}
  for (const p of memberships ?? []) {
    const first = (p.first_name as string | null) ?? ''
    const last = (p.last_name as string | null) ?? ''
    const email = (p.email as string | null) ?? ''
    nameMap[p.id as string] = `${first} ${last}`.trim() || email || (p.id as string)
  }

  const profileMap: Record<string, { employment_type: string | null; hourly_rate: number }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.user_id as string] = {
      employment_type: (p.employment_type as string | null) ?? null,
      hourly_rate: Number(p.hourly_rate ?? 0),
    }
  }

  const lineItems: PayrollPreviewLineItem[] = []
  let totalGrossCents = 0
  let totalNetCents = 0

  for (const uid of userIds) {
    const weekly = byUserWeek[uid]
    let regularHours = 0
    let overtimeHours = 0
    for (const hrs of Object.values(weekly)) {
      regularHours += Math.min(40, hrs)
      overtimeHours += Math.max(0, hrs - 40)
    }
    const profile = profileMap[uid] ?? { employment_type: null, hourly_rate: 0 }
    const rate = profile.hourly_rate
    const regularPayCents = Math.round(regularHours * rate * 100)
    const overtimePayCents = Math.round(overtimeHours * rate * 1.5 * 100)
    const grossCents = regularPayCents + overtimePayCents
    const federalCents = Math.round(grossCents * 0.1)
    const ficaCents = Math.round(grossCents * 0.0765)
    const stateCents = 0
    const netCents = grossCents - federalCents - ficaCents - stateCents

    totalGrossCents += grossCents
    totalNetCents += netCents

    lineItems.push({
      user_id: uid,
      user_name: nameMap[uid] ?? uid,
      employment_type: profile.employment_type,
      hourly_rate: rate,
      regular_hours: Math.round(regularHours * 100) / 100,
      overtime_hours: Math.round(overtimeHours * 100) / 100,
      regular_pay_cents: regularPayCents,
      overtime_pay_cents: overtimePayCents,
      gross_pay_cents: grossCents,
      federal_tax_cents: federalCents,
      fica_cents: ficaCents,
      state_tax_cents: stateCents,
      net_pay_cents: netCents,
    })
  }

  lineItems.sort((a, b) => a.user_name.localeCompare(b.user_name))

  return {
    ok: true,
    line_items: lineItems,
    total_gross_cents: totalGrossCents,
    total_net_cents: totalNetCents,
  }
}

// ---------------------------------------------------------------------------
// Submit Run
// ---------------------------------------------------------------------------

const LineItemSchema = z.object({
  user_id: z.string().uuid(),
  user_name: z.string(),
  regular_hours: z.number().min(0),
  overtime_hours: z.number().min(0),
  regular_pay_cents: z.number().int().min(0),
  overtime_pay_cents: z.number().int().min(0),
  gross_pay_cents: z.number().int().min(0),
  federal_tax_cents: z.number().int().min(0),
  fica_cents: z.number().int().min(0),
  state_tax_cents: z.number().int().min(0),
  net_pay_cents: z.number().int().min(0),
})

const SubmitPayrollRunSchema = z.object({
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  line_items: z.array(LineItemSchema).min(1),
})

export type SubmitPayrollRunInput = z.infer<typeof SubmitPayrollRunSchema>

export type SubmitPayrollRunState = {
  ok: boolean
  error?: string
  id?: string
}

export async function submitPayrollRun(
  input: SubmitPayrollRunInput,
): Promise<SubmitPayrollRunState> {
  await assertRole('director')

  const parsed = SubmitPayrollRunSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const { period_start, period_end, line_items } = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const totalGross = line_items.reduce((sum, li) => sum + li.gross_pay_cents, 0)
  const totalNet = line_items.reduce((sum, li) => sum + li.net_pay_cents, 0)

  const { data: run, error: runErr } = await supabase
    .from('payroll_runs')
    .insert({
      tenant_id: tenantId,
      period_start,
      period_end,
      status: 'draft',
      total_gross: totalGross / 100,
      total_net: totalNet / 100,
    })
    .select('id')
    .single()

  if (runErr || !run) {
    return { ok: false, error: runErr?.message ?? 'Failed to create payroll run' }
  }

  const liRows = line_items.map((li) => ({
    tenant_id: tenantId,
    payroll_run_id: run.id,
    user_id: li.user_id,
    regular_hours: li.regular_hours,
    overtime_hours: li.overtime_hours,
    regular_pay: li.regular_pay_cents / 100,
    overtime_pay: li.overtime_pay_cents / 100,
    pto_hours: 0,
    pto_pay: 0,
    gross_pay: li.gross_pay_cents / 100,
    net_pay: li.net_pay_cents / 100,
    deductions: {
      federal_tax_cents: li.federal_tax_cents,
      fica_cents: li.fica_cents,
      state_tax_cents: li.state_tax_cents,
    },
  }))

  const { error: liErr } = await supabase.from('payroll_line_items').insert(liRows)
  if (liErr) {
    return { ok: false, error: liErr.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'payroll.run.submitted',
    entityType: 'payroll_run',
    entityId: run.id,
    after: {
      period_start,
      period_end,
      line_items_count: line_items.length,
      total_gross_cents: totalGross,
      total_net_cents: totalNet,
    },
  })

  revalidatePath('/portal/admin/staff/payroll')

  return { ok: true, id: run.id }
}

// ---------------------------------------------------------------------------
// Approve Run
// ---------------------------------------------------------------------------

const ApproveSchema = z.object({ run_id: z.string().uuid() })

export type ApprovePayrollRunState = { ok: boolean; error?: string; id?: string }

export async function approvePayrollRun(runId: string): Promise<ApprovePayrollRunState> {
  await assertRole('director')

  const parsed = ApproveSchema.safeParse({ run_id: runId })
  if (!parsed.success) {
    return { ok: false, error: 'Invalid run id' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('payroll_runs')
    .select('status')
    .eq('id', parsed.data.run_id)
    .eq('tenant_id', tenantId)
    .single()

  const { error } = await supabase
    .from('payroll_runs')
    .update({ status: 'approved' })
    .eq('id', parsed.data.run_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'payroll.run.approved',
    entityType: 'payroll_run',
    entityId: parsed.data.run_id,
    before: before ?? undefined,
    after: { status: 'approved' },
  })

  revalidatePath('/portal/admin/staff/payroll')
  revalidatePath(`/portal/admin/staff/payroll/${parsed.data.run_id}`)

  return { ok: true, id: parsed.data.run_id }
}

// ---------------------------------------------------------------------------
// Export CSV (accounting file)
// ---------------------------------------------------------------------------

export type ExportPayrollCsvState = {
  ok: boolean
  error?: string
  csv?: string
  filename?: string
}

function csvEscape(v: unknown): string {
  if (v == null) return ''
  const s = String(v)
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

export async function exportPayrollCsv(runId: string): Promise<ExportPayrollCsvState> {
  await assertRole('director')

  const parsed = ApproveSchema.safeParse({ run_id: runId })
  if (!parsed.success) {
    return { ok: false, error: 'Invalid run id' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const [{ data: run }, { data: lines }] = await Promise.all([
    supabase
      .from('payroll_runs')
      .select('id, period_start, period_end, status')
      .eq('id', parsed.data.run_id)
      .eq('tenant_id', tenantId)
      .single(),
    supabase
      .from('payroll_line_items')
      .select('*, user_profiles(first_name, last_name, email)')
      .eq('payroll_run_id', parsed.data.run_id)
      .eq('tenant_id', tenantId),
  ])

  if (!run) return { ok: false, error: 'Run not found' }

  const header = [
    'Period Start',
    'Period End',
    'Employee',
    'Regular Hours',
    'OT Hours',
    'Regular Pay',
    'OT Pay',
    'Gross Pay',
    'Net Pay',
  ].join(',')

  const rows = (lines ?? []).map((li) => {
    const prof =
      (li.user_profiles as { first_name?: string; last_name?: string; email?: string } | null) ??
      null
    const name = prof
      ? `${prof.first_name ?? ''} ${prof.last_name ?? ''}`.trim() || (prof.email ?? '')
      : (li.user_id as string)
    return [
      csvEscape(run.period_start),
      csvEscape(run.period_end),
      csvEscape(name),
      csvEscape(li.regular_hours ?? 0),
      csvEscape(li.overtime_hours ?? 0),
      csvEscape((li.regular_pay ?? 0).toFixed(2)),
      csvEscape((li.overtime_pay ?? 0).toFixed(2)),
      csvEscape((li.gross_pay ?? 0).toFixed(2)),
      csvEscape((li.net_pay ?? 0).toFixed(2)),
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')
  const filename = `payroll-${run.period_start}-to-${run.period_end}.csv`

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'payroll.run.exported',
    entityType: 'payroll_run',
    entityId: parsed.data.run_id,
    after: { row_count: rows.length },
  })

  return { ok: true, csv, filename }
}
