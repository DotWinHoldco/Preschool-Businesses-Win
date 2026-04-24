// @anchor: cca.dfps.admin-page

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ShieldCheck, ClipboardList, AlertTriangle, CalendarClock, FileText } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'

export default async function DFPSCompliancePage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const [standardsRes, inspectionsRes, deficienciesRes, capsRes] = await Promise.all([
    supabase
      .from('dfps_standards')
      .select('id, compliance_status, category, rule_code')
      .eq('tenant_id', tenantId),
    supabase
      .from('dfps_inspections')
      .select(
        'id, inspection_date, inspection_type, inspector_name, result, deficiency_count, follow_up_date',
      )
      .eq('tenant_id', tenantId)
      .order('inspection_date', { ascending: false })
      .limit(20),
    supabase
      .from('dfps_deficiencies')
      .select('id, severity, findings, status, remediation_due_date, rule_code')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('corrective_action_plans')
      .select('id, title, status, due_date')
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(50),
  ])

  const standards = standardsRes.data ?? []
  const inspections = inspectionsRes.data ?? []
  const deficiencies = deficienciesRes.data ?? []
  const caps = capsRes.data ?? []

  const totalStandards = standards.length
  const compliantCount = standards.filter((s) => s.compliance_status === 'compliant').length
  const trackable = standards.filter((s) => s.compliance_status !== 'na').length
  const scorePct = trackable > 0 ? Math.round((compliantCount / trackable) * 100) : 0

  const criticalDefs = deficiencies.filter(
    (d) => d.status === 'open' && d.severity === 'critical',
  ).length
  const pendingCaps = caps.filter((c) => c.status === 'open' || c.status === 'in_progress').length
  const today = new Date().toISOString().slice(0, 10)
  const nextInspection =
    inspections
      .map((i) => i.follow_up_date)
      .filter((d): d is string => !!d && d >= today)
      .sort()[0] ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Texas DFPS Compliance
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Track Chapter 746 standards, inspections, and deficiencies.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Compliance score"
          value={totalStandards > 0 ? `${scorePct}%` : '—'}
          sub={`${compliantCount} / ${trackable} rules`}
          accent="var(--color-primary)"
        />
        <StatCard
          label="Critical deficiencies"
          value={String(criticalDefs)}
          sub="open, critical"
          accent="var(--color-destructive)"
        />
        <StatCard
          label="Pending corrective actions"
          value={String(pendingCaps)}
          sub="open or in progress"
          accent="var(--color-warning)"
        />
        <StatCard
          label="Next inspection due"
          value={nextInspection ? new Date(nextInspection).toLocaleDateString() : '—'}
          sub="follow-up date"
          accent="var(--color-muted-foreground)"
        />
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LinkCard
          href="/portal/admin/dfps-compliance/standards"
          icon={<ClipboardList size={20} />}
          title="Rules library"
          description={`${totalStandards} standards tracked. Search, filter, and mark compliance status.`}
        />
        <LinkCard
          href="/portal/admin/compliance/incidents"
          icon={<FileText size={20} />}
          title="Incident reports"
          description="Document injuries, allegations, and other reportable events."
        />
      </div>

      {/* Inspections history */}
      <Section title="Inspections history">
        {inspections.length === 0 ? (
          <EmptyRow icon={<ShieldCheck size={18} />} label="No inspections recorded." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Date', 'Type', 'Inspector', 'Result', 'Deficiencies', 'Follow-up'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inspections.map((i) => (
                  <tr key={i.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>
                      {i.inspection_date ? new Date(i.inspection_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {i.inspection_type ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {i.inspector_name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          i.result === 'pass'
                            ? 'default'
                            : i.result === 'fail'
                              ? 'danger'
                              : i.result === 'conditional'
                                ? 'warning'
                                : 'outline'
                        }
                      >
                        {i.result ?? 'pending'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>
                      {i.deficiency_count ?? 0}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {i.follow_up_date ? new Date(i.follow_up_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Pending deficiencies */}
      <Section title="Pending deficiencies">
        {deficiencies.filter((d) => d.status === 'open').length === 0 ? (
          <EmptyRow icon={<AlertTriangle size={18} />} label="No open deficiencies." />
        ) : (
          <ul className="space-y-2">
            {deficiencies
              .filter((d) => d.status === 'open')
              .map((d) => (
                <li
                  key={d.id}
                  className="flex items-start gap-3 rounded-lg p-3"
                  style={{ backgroundColor: 'var(--color-muted)' }}
                >
                  <Badge
                    variant={
                      d.severity === 'critical' || d.severity === 'high' ? 'danger' : 'warning'
                    }
                  >
                    {d.severity ?? 'open'}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {d.rule_code ? `${d.rule_code} — ` : ''}
                      {d.findings}
                    </p>
                    {d.remediation_due_date && (
                      <p
                        className="text-xs mt-0.5 inline-flex items-center gap-1"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        <CalendarClock size={12} />
                        Due {new Date(d.remediation_due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Section>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
    >
      <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color: accent }}>
        {value}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        {sub}
      </p>
    </div>
  )
}

function LinkCard({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl p-5 transition-colors hover:bg-[var(--color-muted)]"
      style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-primary)' }}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
            {title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="overflow-hidden rounded-xl"
      style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function EmptyRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="flex items-center gap-2 text-sm"
      style={{ color: 'var(--color-muted-foreground)' }}
    >
      {icon}
      {label}
    </div>
  )
}
