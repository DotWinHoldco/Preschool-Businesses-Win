'use server'

// @anchor: cca.billing.generate-invoices
// Generate invoices for a billing period — creates invoice rows with line items
// from active family_billing_enrollments.

import { createTenantServerClient } from '@/lib/supabase/server'
import { GenerateInvoicesSchema } from '@/lib/schemas/billing'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type GenerateInvoicesState = {
  ok: boolean
  error?: string
  invoice_count?: number
}

export async function generateInvoices(
  _prev: GenerateInvoicesState,
  formData: FormData,
): Promise<GenerateInvoicesState> {
  try {
    await assertRole('admin')

    const raw = Object.fromEntries(formData.entries())
    const parsed = GenerateInvoicesSchema.safeParse({
      ...raw,
      family_ids: raw.family_ids ? JSON.parse(raw.family_ids as string) : undefined,
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { period_start, period_end, family_ids } = parsed.data
    const tenantId = await getTenantId()
    const supabase = await createTenantServerClient()

    // Fetch active billing enrollments
    let query = supabase
      .from('family_billing_enrollments')
      .select('id, family_id, student_id, billing_plan_id, custom_amount_cents, discount_pct')
      .eq('status', 'active')

    if (family_ids && family_ids.length > 0) {
      query = query.in('family_id', family_ids)
    }

    const { data: enrollments, error: enrollErr } = await query

    if (enrollErr) {
      return { ok: false, error: enrollErr.message }
    }

    if (!enrollments || enrollments.length === 0) {
      return { ok: true, invoice_count: 0 }
    }

    // Fetch billing plans
    const planIds = [...new Set(enrollments.map((e) => e.billing_plan_id))]
    const { data: plans } = await supabase
      .from('billing_plans')
      .select('id, name, amount_cents, late_fee_cents')
      .in('id', planIds)

    const planMap: Record<string, { name: string; amount_cents: number }> = {}
    for (const p of plans ?? []) {
      planMap[p.id] = { name: p.name, amount_cents: p.amount_cents }
    }

    // Group enrollments by family
    const familyEnrollments: Record<string, typeof enrollments> = {}
    for (const e of enrollments) {
      if (!familyEnrollments[e.family_id]) {
        familyEnrollments[e.family_id] = []
      }
      familyEnrollments[e.family_id].push(e)
    }

    let invoiceCount = 0

    // Generate invoice per family
    for (const [familyId, famEnrollments] of Object.entries(familyEnrollments)) {
      const lineItems: Array<{
        description: string
        quantity: number
        unit_amount_cents: number
        total_cents: number
        category: string
        student_id: string | null
      }> = []

      let subtotal = 0
      let discountsTotal = 0

      for (const enrollment of famEnrollments) {
        const plan = planMap[enrollment.billing_plan_id]
        if (!plan) continue

        const amount = enrollment.custom_amount_cents ?? plan.amount_cents
        const discountPct = enrollment.discount_pct ?? 0
        const discount = Math.round(amount * discountPct / 100)
        const lineTotal = amount - discount

        lineItems.push({
          description: `${plan.name} — ${period_start} to ${period_end}`,
          quantity: 1,
          unit_amount_cents: amount,
          total_cents: lineTotal,
          category: 'tuition',
          student_id: enrollment.student_id,
        })

        subtotal += amount
        discountsTotal += discount
      }

      const totalCents = subtotal - discountsTotal

      // Create invoice
      const invoiceNumber = `INV-${Date.now()}-${invoiceCount + 1}`
      const dueDate = new Date(period_end)
      dueDate.setDate(dueDate.getDate() + 30)

      const { data: invoice, error: invErr } = await supabase
        .from('invoices')
        .insert({
          tenant_id: tenantId,
          family_id: familyId,
          period_start,
          period_end,
          subtotal_cents: subtotal,
          discounts_cents: discountsTotal,
          tax_cents: 0,
          total_cents: totalCents,
          status: 'draft',
          due_date: dueDate.toISOString().split('T')[0],
          invoice_number: invoiceNumber,
        })
        .select('id')
        .single()

      if (invErr || !invoice) continue

      // Create line items
      const lines = lineItems.map((li) => ({
        tenant_id: tenantId,
        invoice_id: invoice.id,
        ...li,
      }))

      if (lines.length > 0) {
        await supabase.from('invoice_lines').insert(lines)
      }

      invoiceCount++
    }

    return { ok: true, invoice_count: invoiceCount }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
