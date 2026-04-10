// @anchor: cca.accounting.export
'use server'

import { ExportAccountingSchema, type ExportAccountingInput } from '@/lib/schemas/expense'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type ExportAccountingState = {
  ok: boolean
  error?: string
  id?: string
  csv?: string
  row_count?: number
}

export async function exportAccounting(input: ExportAccountingInput): Promise<ExportAccountingState> {
  const parsed = ExportAccountingSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Fetch expenses in the period with category info
  const { data: expenses, error: fetchError } = await supabase
    .from('expenses')
    .select(`
      id, date, vendor, description, amount_cents, payment_method,
      expense_categories(name, gl_code)
    `)
    .gte('date', data.period_start)
    .lte('date', data.period_end)
    .order('date', { ascending: true })

  if (fetchError) {
    return { ok: false, error: fetchError.message }
  }

  const rows = expenses ?? []

  // Generate CSV based on export type
  let csv = ''
  if (data.export_type === 'quickbooks_csv') {
    csv = generateQuickBooksCSV(rows)
  } else if (data.export_type === 'xero_csv') {
    csv = generateXeroCSV(rows)
  } else {
    csv = generateGeneralLedgerCSV(rows)
  }

  // Record the export
  const { data: exportRecord, error: exportError } = await supabase
    .from('accounting_exports')
    .insert({
      tenant_id: tenantId,
      export_type: data.export_type,
      period_start: data.period_start,
      period_end: data.period_end,
      generated_by: actorId,
      row_count: rows.length,
    })
    .select('id')
    .single()

  if (exportError) {
    return { ok: false, error: exportError.message }
  }

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'expense.accounting.exported',
    entity_type: 'accounting_export',
    entity_id: exportRecord?.id ?? '',
    after: { export_type: data.export_type, period_start: data.period_start, period_end: data.period_end, row_count: rows.length },
  })

  return { ok: true, id: exportRecord?.id, csv, row_count: rows.length }
}

function generateQuickBooksCSV(rows: Array<Record<string, unknown>>): string {
  const header = 'Date,Transaction Type,Name,Account,Amount,Memo'
  const lines = rows.map((r) => {
    const cat = r.expense_categories as Record<string, unknown> | null
    const glCode = (cat?.gl_code as string) || (cat?.name as string) || 'Uncategorized'
    const amount = ((r.amount_cents as number) / 100).toFixed(2)
    return `${r.date},Expense,${csvEscape(r.vendor as string)},${csvEscape(glCode)},${amount},${csvEscape((r.description as string) || '')}`
  })
  return [header, ...lines].join('\n')
}

function generateXeroCSV(rows: Array<Record<string, unknown>>): string {
  const header = '*ContactName,*InvoiceNumber,*InvoiceDate,*DueDate,*Total,*AccountCode,Description'
  const lines = rows.map((r, i) => {
    const cat = r.expense_categories as Record<string, unknown> | null
    const glCode = (cat?.gl_code as string) || '6000'
    const amount = ((r.amount_cents as number) / 100).toFixed(2)
    return `${csvEscape(r.vendor as string)},EXP-${String(i + 1).padStart(5, '0')},${r.date},${r.date},${amount},${glCode},${csvEscape((r.description as string) || '')}`
  })
  return [header, ...lines].join('\n')
}

function generateGeneralLedgerCSV(rows: Array<Record<string, unknown>>): string {
  const header = 'Date,Account,Debit,Credit,Vendor,Description'
  const lines = rows.map((r) => {
    const cat = r.expense_categories as Record<string, unknown> | null
    const glCode = (cat?.gl_code as string) || (cat?.name as string) || 'Uncategorized'
    const amount = ((r.amount_cents as number) / 100).toFixed(2)
    return `${r.date},${csvEscape(glCode)},${amount},0.00,${csvEscape(r.vendor as string)},${csvEscape((r.description as string) || '')}`
  })
  return [header, ...lines].join('\n')
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
