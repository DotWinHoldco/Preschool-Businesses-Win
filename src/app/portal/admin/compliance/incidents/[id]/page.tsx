// @anchor: cca.compliance.incident-detail-page

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { IncidentStatusControls } from '@/components/portal/compliance/incident-status-controls'
import { IncidentInvolvedForm } from '@/components/portal/compliance/incident-involved-form'
import { IncidentAttachmentForm } from '@/components/portal/compliance/incident-attachment-form'

function severityVariant(s: string | null) {
  switch (s) {
    case 'critical':
    case 'serious':
      return 'danger' as const
    case 'moderate':
      return 'warning' as const
    case 'minor':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

function statusVariant(s: string | null) {
  switch (s) {
    case 'open':
    case 'investigating':
      return 'warning' as const
    case 'escalated':
      return 'danger' as const
    case 'closed':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: incident } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (!incident) notFound()

  const [{ data: involved }, { data: attachments }] = await Promise.all([
    supabase
      .from('incident_involved')
      .select('*')
      .eq('incident_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at'),
    supabase
      .from('incident_attachments')
      .select('*')
      .eq('incident_id', id)
      .eq('tenant_id', tenantId)
      .order('created_at'),
  ])

  const classroomName = incident.classroom_id
    ? (
        await supabase
          .from('classrooms')
          .select('name')
          .eq('id', incident.classroom_id)
          .eq('tenant_id', tenantId)
          .single()
      ).data?.name
    : null

  const reporterName = incident.reported_by
    ? (
        await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', incident.reported_by)
          .single()
      ).data?.full_name
    : null

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin/compliance/incidents"
        className="inline-flex items-center gap-1 text-sm"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        <ChevronLeft size={14} />
        Back to incidents
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {incident.title}
            </h1>
            <Badge variant={severityVariant(incident.severity)}>{incident.severity}</Badge>
            <Badge variant={statusVariant(incident.status)}>{incident.status}</Badge>
          </div>
          <p className="font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            {incident.incident_number ?? incident.id}
          </p>
        </div>
        <IncidentStatusControls id={incident.id} currentStatus={incident.status} />
      </div>

      {/* Core fields */}
      <div
        className="rounded-xl p-5 grid grid-cols-2 sm:grid-cols-3 gap-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <Info label="Date">
          {incident.incident_date ? new Date(incident.incident_date).toLocaleDateString() : '—'}
        </Info>
        <Info label="Time">
          {incident.incident_time ? String(incident.incident_time).slice(0, 5) : '—'}
        </Info>
        <Info label="Type">{incident.incident_type}</Info>
        <Info label="Classroom">{classroomName ?? '—'}</Info>
        <Info label="Location">{incident.location ?? '—'}</Info>
        <Info label="Reported by">{reporterName ?? '—'}</Info>
        <Info label="Parents notified">{incident.parents_notified ? 'Yes' : 'No'}</Info>
        <Info label="Medical follow-up">
          {incident.medical_followup_required ? 'Required' : 'No'}
        </Info>
        <Info label="State report">{incident.state_report_required ? 'Required' : 'No'}</Info>
      </div>

      {/* Narrative fields */}
      <Section title="Description">
        <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--color-foreground)' }}>
          {incident.description}
        </p>
      </Section>

      {incident.injury_description && (
        <Section title="Injury description">
          <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--color-foreground)' }}>
            {incident.injury_description}
          </p>
        </Section>
      )}

      {incident.treatment_provided && (
        <Section title="Treatment provided">
          <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--color-foreground)' }}>
            {incident.treatment_provided}
          </p>
        </Section>
      )}

      {/* Involved parties */}
      <Section title="Involved parties">
        {(involved ?? []).length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No parties recorded.
          </p>
        ) : (
          <ul className="space-y-3">
            {(involved ?? []).map((p) => (
              <li
                key={p.id}
                className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--color-muted)' }}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{p.party_type}</Badge>
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-foreground)' }}
                  >
                    {p.other_name ?? p.student_id ?? p.staff_user_id ?? 'Unnamed'}
                  </span>
                </div>
                {p.statement && (
                  <p
                    className="mt-2 text-sm whitespace-pre-wrap"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {p.statement}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <IncidentInvolvedForm incidentId={incident.id} />
        </div>
      </Section>

      {/* Attachments */}
      <Section title="Attachments">
        {(attachments ?? []).length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No attachments.
          </p>
        ) : (
          <ul className="space-y-2">
            {(attachments ?? []).map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--color-muted)' }}
              >
                <span style={{ color: 'var(--color-foreground)' }}>
                  {a.file_name ?? a.file_path}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {a.attachment_type ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <IncidentAttachmentForm incidentId={incident.id} />
        </div>
      </Section>
    </div>
  )
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
        {label}
      </p>
      <p className="mt-0.5 text-sm" style={{ color: 'var(--color-foreground)' }}>
        {children}
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-xl p-5"
      style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
    >
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}
