import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { assertRole } from '@/lib/auth/session'
import { PIPELINE_STAGE_LABELS } from '@/components/portal/enrollment/pipeline-stage-badge'

function esc(str: string | null | undefined): string {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function field(label: string, value: string | null | undefined): string {
  if (!value) return ''
  return `<div class="field"><span class="field-label">${esc(label)}</span><span class="field-value">${esc(value)}</span></div>`
}

function section(title: string, content: string): string {
  return `<div class="section"><h2 class="section-title">${esc(title)}</h2>${content}</div>`
}

function formatAddress(obj: Record<string, unknown>, prefix: string): string | null {
  const street = obj[`${prefix}_street`] as string | undefined
  const city = obj[`${prefix}_city`] as string | undefined
  const state = obj[`${prefix}_state`] as string | undefined
  const zip = obj[`${prefix}_zip`] as string | undefined
  if (!street && !city) return null
  return [street, city, state, zip].filter(Boolean).join(', ')
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  try {
    await assertRole('admin')
  } catch {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) return new NextResponse('Missing tenant', { status: 400 })

  const { applicationId } = await params
  const supabase = await createTenantAdminClient(tenantId)

  const { data: application } = await supabase
    .from('enrollment_applications')
    .select('*')
    .eq('id', applicationId)
    .eq('tenant_id', tenantId)
    .single()

  if (!application) return new NextResponse('Not found', { status: 404 })

  const { data: steps } = await supabase
    .from('application_pipeline_steps')
    .select('step_type, status, notes, completed_at, completed_by, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  const actorIds = [...new Set(
    (steps ?? []).map((s) => s.completed_by).filter(Boolean) as string[]
  )]
  const actorMap = new Map<string, string>()
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', actorIds)
    for (const p of profiles ?? []) {
      actorMap.set(p.user_id, `${p.first_name} ${p.last_name}`)
    }
  }

  const meta = (application.application_metadata ?? {}) as Record<string, unknown>
  const parentMeta = (meta.parent ?? {}) as Record<string, unknown>
  const otherParent = meta.other_parent as Record<string, unknown> | null
  const stage = application.pipeline_stage ?? 'form_submitted'
  const parentAddress = formatAddress(parentMeta, 'address')
  const otherParentAddress = otherParent && !otherParent.same_address
    ? formatAddress(otherParent, 'address')
    : null

  let otherParentSection = ''
  if (otherParent) {
    otherParentSection = section('Other Parent / Guardian', [
      field('Name', otherParent.name as string),
      field('Same Address', otherParent.same_address ? 'Yes' : 'No'),
      otherParentAddress ? field('Address', otherParentAddress) : '',
      field('Occupation', otherParent.occupation as string),
      field('Work Phone', otherParent.work_phone as string),
      field("Driver's License", otherParent.drivers_license as string),
    ].join(''))
  }

  let auditRows = ''
  for (const step of steps ?? []) {
    const ts = new Date(step.completed_at ?? step.created_at).toLocaleString()
    const label = PIPELINE_STAGE_LABELS[step.step_type] ?? step.step_type
    const actor = step.completed_by ? actorMap.get(step.completed_by) ?? '—' : '—'
    auditRows += `<tr><td>${esc(ts)}</td><td>${esc(label)}</td><td>${esc(actor)}</td><td>${esc(step.notes ?? '—')}</td></tr>`
  }

  const auditSection = auditRows
    ? section('Processing History', `
        <table class="audit-table">
          <thead><tr><th>Date</th><th>Action</th><th>By</th><th>Notes</th></tr></thead>
          <tbody>${auditRows}</tbody>
        </table>`)
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Application — ${esc(application.student_first_name)} ${esc(application.student_last_name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.4; }

    .page { padding: 0.75in; }
    .page-break { page-break-before: always; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 20px; }
    .title { font-size: 20pt; font-weight: 700; }
    .subtitle { font-size: 9pt; color: #666; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .header-right { text-align: right; }
    .badge { display: inline-block; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 10px; font-size: 9pt; font-weight: 600; }
    .score { font-size: 9pt; color: #666; margin-top: 4px; }

    .student-banner { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; }
    .student-name { font-size: 16pt; font-weight: 700; }
    .student-meta { font-size: 9pt; color: #666; margin-top: 4px; }

    .section { margin-bottom: 20px; }
    .section-title { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }

    .field { display: flex; gap: 8px; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
    .field:last-child { border-bottom: none; }
    .field-label { flex: 0 0 140px; font-size: 9pt; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.3px; padding-top: 1px; }
    .field-value { flex: 1; font-size: 10pt; white-space: pre-wrap; }

    .notes-block { font-size: 10pt; white-space: pre-wrap; padding: 8px 12px; background: #f9fafb; border-radius: 4px; border: 1px solid #e5e7eb; }

    .audit-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .audit-table th { text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding: 4px 8px; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.3px; color: #666; }
    .audit-table td { border-bottom: 1px solid #f3f4f6; padding: 4px 8px; vertical-align: top; }

    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 8pt; color: #999; text-align: center; }

    .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #1e293b; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; font-size: 13px; }
    .toolbar button { border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .btn-print { background: #3b82f6; color: white; }
    .btn-close { background: transparent; color: #94a3b8; border: 1px solid #475569 !important; }

    @media print {
      .toolbar { display: none !important; }
      .page { padding: 0; }
      @page { margin: 0.75in; size: letter; }
    }

    @media screen {
      body { background: #f1f5f9; padding-top: 50px; }
      .page { max-width: 8.5in; margin: 20px auto; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 4px; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>Enrollment Application — Print or Save as PDF</span>
    <div style="display:flex;gap:8px">
      <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
      <button class="btn-close" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="page">
    <div class="header">
      <div>
        <div class="title">Enrollment Application</div>
        <div class="subtitle">Confidential — For Administrative Use</div>
      </div>
      <div class="header-right">
        <span class="badge">${esc(PIPELINE_STAGE_LABELS[stage] ?? stage)}</span>
        ${application.triage_score !== null ? `<div class="score">Score: ${application.triage_score}</div>` : ''}
      </div>
    </div>

    <div class="student-banner">
      <div class="student-name">${esc(application.student_first_name)} ${esc(application.student_last_name)}</div>
      <div class="student-meta">DOB: ${esc(application.student_dob)} &nbsp;|&nbsp; Program: ${esc((application.program_type ?? 'N/A').replace(/_/g, ' '))} &nbsp;|&nbsp; Applied: ${new Date(application.created_at).toLocaleDateString()}</div>
    </div>

    ${section('Primary Parent / Guardian', [
      field('Name', `${application.parent_first_name} ${application.parent_last_name}`),
      field('Email', application.parent_email),
      field('Phone', application.parent_phone),
      field('Relationship', application.relationship_to_child?.replace(/_/g, ' ')),
      field('Address', parentAddress),
      field('Occupation', parentMeta.occupation as string),
      field('Work Phone', parentMeta.work_phone as string),
      field("Driver's License", parentMeta.drivers_license as string),
    ].join(''))}

    ${otherParentSection}

    ${section('Student Information', [
      field('Full Name', `${application.student_first_name} ${application.student_last_name}`),
      field('Date of Birth', application.student_dob),
      field('Gender', application.student_gender?.replace(/_/g, ' ')),
      field('Program Type', application.program_type?.replace(/_/g, ' ')),
      field('Schedule Pref.', application.schedule_preference?.replace(/_/g, ' ')),
      field('Desired Start', application.desired_start_date),
    ].join(''))}
  </div>

  <div class="page page-break">
    ${section('Medical & Special Needs', [
      field('Allergies / Medical', application.allergies_or_medical),
      field('Special Needs', application.special_needs),
    ].join(''))}

    ${section('Family Information', [
      field('Family Name', meta.family_name as string),
      field('How Heard', (application.how_heard ?? (meta.how_heard as string | undefined))?.replace(/_/g, ' ')),
      meta.how_heard === 'referral' ? field('Referral Family', meta.referral_family_name as string) : '',
      field('Faith Community', application.faith_community ?? (meta.faith_community as string)),
      application.sibling_enrolled ? field('Sibling Enrolled', application.sibling_name ?? 'Yes') : '',
      field('Parent Goals', meta.parent_goals as string),
      field('Additional Notes', meta.anything_else as string),
    ].join(''))}

    ${application.notes ? section('Compiled Notes', `<div class="notes-block">${esc(application.notes)}</div>`) : ''}

    ${section('Agreement & Signature', [
      field('Electronic Signature', meta.parent_signature as string),
      field('Agreed to Contact', application.agree_to_contact ? 'Yes' : 'No'),
      field('Date Submitted', new Date(application.created_at).toLocaleString()),
      meta.payment_intent_id ? field('Payment', 'Application fee collected') : '',
    ].join(''))}

    ${auditSection}

    <div class="footer">
      <p>Application ID: ${esc(applicationId)}</p>
      <p>Generated ${new Date().toLocaleString()} — Confidential</p>
    </div>
  </div>

  <script>setTimeout(function(){window.print()},600)</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
