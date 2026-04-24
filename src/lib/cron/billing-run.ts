// @anchor: platform.cron.billing-run
// Monthly billing run — session-free version of generate-invoices.
// Called from /api/cron/billing-run on the 1st of each month.

import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveTenants, SYSTEM_ACTOR_ID } from '@/lib/cron/helpers'
import { writeAudit } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/send'

interface BillingRunSummary {
  tenants_processed: number
  invoices_generated: number
  overdue_marked: number
}

export async function runBillingForAllTenants(): Promise<BillingRunSummary> {
  const supabase = createAdminClient()
  const tenants = await getActiveTenants(supabase)

  const summary: BillingRunSummary = {
    tenants_processed: 0,
    invoices_generated: 0,
    overdue_marked: 0,
  }

  // Calculate billing period: first of current month → last of current month
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0) // last day
  const periodStartStr = periodStart.toISOString().split('T')[0]
  const periodEndStr = periodEnd.toISOString().split('T')[0]
  const yyyymm = `${periodStart.getFullYear()}${String(periodStart.getMonth() + 1).padStart(2, '0')}`

  for (const tenant of tenants) {
    try {
      // ---- Idempotency check ----
      const { count: existingCount } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('period_start', periodStartStr)
        .eq('period_end', periodEndStr)

      if ((existingCount ?? 0) > 0) {
        continue
      }

      // ---- Fetch active enrollments with billing plan amounts ----
      const { data: enrollments, error: enrollErr } = await supabase
        .from('family_billing_enrollments')
        .select('id, family_id, student_id, billing_plan_id, custom_amount_cents, discount_pct')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')

      if (enrollErr) {
        continue
      }

      if (!enrollments || enrollments.length === 0) {
        summary.tenants_processed++
        continue
      }

      // Fetch billing plans for amounts
      const planIds = [...new Set(enrollments.map((e) => e.billing_plan_id))]
      const { data: plans } = await supabase
        .from('billing_plans')
        .select('id, name, amount_cents')
        .in('id', planIds)

      const planMap: Record<string, { name: string; amount_cents: number }> = {}
      for (const p of plans ?? []) {
        planMap[p.id] = { name: p.name, amount_cents: p.amount_cents }
      }

      // ---- Group enrollments by family ----
      const familyEnrollments: Record<string, typeof enrollments> = {}
      for (const e of enrollments) {
        if (!familyEnrollments[e.family_id]) {
          familyEnrollments[e.family_id] = []
        }
        familyEnrollments[e.family_id].push(e)
      }

      let tenantInvoiceCount = 0

      for (const [familyId, famEnrollments] of Object.entries(familyEnrollments)) {
        // ---- Build line items ----
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
          const discount = Math.round((amount * discountPct) / 100)
          const lineTotal = amount - discount

          lineItems.push({
            description: `${plan.name} — ${periodStartStr} to ${periodEndStr}`,
            quantity: 1,
            unit_amount_cents: amount,
            total_cents: lineTotal,
            category: 'tuition',
            student_id: enrollment.student_id,
          })

          subtotal += amount
          discountsTotal += discount
        }

        if (lineItems.length === 0) continue

        const totalCents = subtotal - discountsTotal
        tenantInvoiceCount++
        const invoiceNumber = `INV-${yyyymm}-${String(tenantInvoiceCount).padStart(4, '0')}`

        const dueDate = new Date(periodEnd)
        dueDate.setDate(dueDate.getDate() + 30)
        const dueDateStr = dueDate.toISOString().split('T')[0]

        // ---- Insert invoice ----
        const { data: invoice, error: invErr } = await supabase
          .from('invoices')
          .insert({
            tenant_id: tenant.id,
            family_id: familyId,
            invoice_number: invoiceNumber,
            period_start: periodStartStr,
            period_end: periodEndStr,
            subtotal_cents: subtotal,
            discounts_cents: discountsTotal,
            tax_cents: 0,
            total_cents: totalCents,
            status: 'draft',
            due_date: dueDateStr,
          })
          .select('id')
          .single()

        if (invErr || !invoice) {
          continue
        }

        // ---- Insert line items ----
        const lines = lineItems.map((li) => ({
          tenant_id: tenant.id,
          invoice_id: invoice.id,
          ...li,
        }))

        if (lines.length > 0) {
          await supabase.from('invoice_lines').insert(lines)
        }

        // ---- Audit ----
        await writeAudit(supabase, {
          tenantId: tenant.id,
          actorId: SYSTEM_ACTOR_ID,
          action: 'billing.generate_invoice',
          entityType: 'invoice',
          entityId: invoice.id,
          after: {
            family_id: familyId,
            period_start: periodStartStr,
            period_end: periodEndStr,
            total_cents: totalCents,
            invoice_number: invoiceNumber,
          },
        })

        // ---- Notify billing-responsible family members ----
        const { data: billingMembers } = await supabase
          .from('family_members')
          .select('user_id')
          .eq('tenant_id', tenant.id)
          .eq('family_id', familyId)
          .eq('is_billing_responsible', true)
          .not('user_id', 'is', null)

        const recipientIds = (billingMembers ?? [])
          .map((m) => m.user_id)
          .filter((id): id is string => !!id)

        if (recipientIds.length > 0) {
          await sendNotification({
            tenantId: tenant.id,
            to: recipientIds,
            template: 'invoice_generated',
            payload: {
              invoice_number: invoiceNumber,
              total_cents: totalCents,
              period: `${periodStartStr} to ${periodEndStr}`,
              due_date: dueDateStr,
            },
            channels: ['in_app'],
          })
        }

        summary.invoices_generated++
      }

      summary.tenants_processed++
    } catch {
      // Error processing tenant
    }
  }

  // ---- Mark overdue invoices across all tenants ----
  try {
    const todayStr = new Date().toISOString().split('T')[0]

    const { data: overdueInvoices, error: overdueErr } = await supabase
      .from('invoices')
      .select('id, tenant_id')
      .eq('status', 'sent')
      .lt('due_date', todayStr)

    if (!overdueErr && overdueInvoices && overdueInvoices.length > 0) {
      const overdueIds = overdueInvoices.map((inv) => inv.id)

      const { error: updateErr } = await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .in('id', overdueIds)

      if (!updateErr) {
        summary.overdue_marked = overdueIds.length
      }
    }
  } catch {
    // Error processing overdue invoices
  }

  return summary
}
