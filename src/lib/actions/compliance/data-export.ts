'use server'

// @anchor: cca.compliance.data-export
// FERPA right-to-inspect: export tenant or single-family data as CSV.
// Queries students, families, family_members, attendance_records, invoices, payments, documents.

import { DataExportRequestSchema } from '@/lib/schemas/compliance'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import { writeAccessLog } from '@/lib/access-log'

export type DataExportState = {
  ok: boolean
  error?: string
  csv?: string
}

export async function exportTenantData(formData: FormData): Promise<DataExportState> {
  await assertRole('admin')

  const raw = {
    export_format: (formData.get('export_format') as string) || 'csv',
    family_id: (formData.get('family_id') as string) || undefined,
  }

  const parsed = DataExportRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const familyId = parsed.data.family_id

  // ---- Query data ----

  // 1. Families
  let familyQuery = supabase
    .from('families')
    .select('id, family_name, billing_email, billing_phone, mailing_address_line1, mailing_city, mailing_state, mailing_zip, created_at')
    .eq('tenant_id', tenantId)
  if (familyId) familyQuery = familyQuery.eq('id', familyId)
  const { data: families } = await familyQuery

  // 2. Family members
  let memberQuery = supabase
    .from('family_members')
    .select('id, family_id, first_name, last_name, email, phone, relationship_type, is_primary_contact, created_at')
    .eq('tenant_id', tenantId)
  if (familyId) memberQuery = memberQuery.eq('family_id', familyId)
  const { data: familyMembers } = await memberQuery

  // 3. Students (via student_family_links if family-scoped)
  let students: Array<Record<string, unknown>> = []
  if (familyId) {
    const { data: links } = await supabase
      .from('student_family_links')
      .select('student_id')
      .eq('tenant_id', tenantId)
      .eq('family_id', familyId)
    const studentIds = (links ?? []).map((l) => l.student_id as string)
    if (studentIds.length > 0) {
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, date_of_birth, gender, enrollment_status, enrollment_date, created_at')
        .eq('tenant_id', tenantId)
        .in('id', studentIds)
      students = (data ?? []) as Array<Record<string, unknown>>
    }
  } else {
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, date_of_birth, gender, enrollment_status, enrollment_date, created_at')
      .eq('tenant_id', tenantId)
    students = (data ?? []) as Array<Record<string, unknown>>
  }

  const studentIds = students.map((s) => s.id as string)

  // 4. Attendance records
  let attendanceRows: Array<Record<string, unknown>> = []
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from('attendance_records')
      .select('id, student_id, date, status, check_in_time, check_out_time, created_at')
      .eq('tenant_id', tenantId)
      .in('student_id', studentIds)
    attendanceRows = (data ?? []) as Array<Record<string, unknown>>
  }

  // 5. Invoices
  let invoiceRows: Array<Record<string, unknown>> = []
  if (familyId) {
    const { data } = await supabase
      .from('invoices')
      .select('id, family_id, invoice_number, amount_cents, status, due_date, created_at')
      .eq('tenant_id', tenantId)
      .eq('family_id', familyId)
    invoiceRows = (data ?? []) as Array<Record<string, unknown>>
  } else {
    const { data } = await supabase
      .from('invoices')
      .select('id, family_id, invoice_number, amount_cents, status, due_date, created_at')
      .eq('tenant_id', tenantId)
    invoiceRows = (data ?? []) as Array<Record<string, unknown>>
  }

  // 6. Payments
  const invoiceIds = invoiceRows.map((i) => i.id as string)
  let paymentRows: Array<Record<string, unknown>> = []
  if (invoiceIds.length > 0) {
    const { data } = await supabase
      .from('payments')
      .select('id, invoice_id, amount_cents, payment_method, status, created_at')
      .eq('tenant_id', tenantId)
      .in('invoice_id', invoiceIds)
    paymentRows = (data ?? []) as Array<Record<string, unknown>>
  }

  // 7. Documents
  let documentRows: Array<Record<string, unknown>> = []
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from('documents')
      .select('id, entity_type, entity_id, document_type, file_name, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('entity_type', 'student')
      .in('entity_id', studentIds)
    documentRows = (data ?? []) as Array<Record<string, unknown>>
  }

  // ---- Format output ----
  const sections: string[] = []

  sections.push(buildCsvSection('FAMILIES', families ?? []))
  sections.push(buildCsvSection('FAMILY_MEMBERS', familyMembers ?? []))
  sections.push(buildCsvSection('STUDENTS', students))
  sections.push(buildCsvSection('ATTENDANCE_RECORDS', attendanceRows))
  sections.push(buildCsvSection('INVOICES', invoiceRows))
  sections.push(buildCsvSection('PAYMENTS', paymentRows))
  sections.push(buildCsvSection('DOCUMENTS', documentRows))

  const csv = sections.join('\n\n')

  // ---- Audit + access log ----
  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: familyId ? 'compliance.data_export.family' : 'compliance.data_export.tenant',
    entityType: familyId ? 'family' : 'tenant',
    entityId: familyId ?? tenantId,
    after: { export_format: parsed.data.export_format, family_id: familyId ?? null },
  })

  await writeAccessLog(supabase, {
    tenantId,
    actorId,
    entityType: familyId ? 'family' : 'tenant',
    entityId: familyId ?? tenantId,
    accessType: 'export',
    endpoint: 'compliance/data-export',
  })

  return { ok: true, csv }
}

// ---- CSV helpers ----

function buildCsvSection(title: string, rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return `--- ${title} ---\n(no records)`

  const headers = Object.keys(rows[0]!)
  const headerLine = headers.join(',')
  const dataLines = rows.map((row) =>
    headers.map((h) => csvEscape(String(row[h] ?? ''))).join(','),
  )

  return [`--- ${title} ---`, headerLine, ...dataLines].join('\n')
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
