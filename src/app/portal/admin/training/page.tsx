// @anchor: cca.training.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Award } from 'lucide-react'

export default async function AdminTrainingPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const [recordsRes, profilesRes] = await Promise.all([
    supabase
      .from('training_records')
      .select('id, user_id, training_name, provider, training_type, topic_category, hours, completed_date, certificate_path, verified_by, year, notes, created_at')
      .eq('tenant_id', tenantId)
      .order('completed_date', { ascending: false }),
    supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('tenant_id', tenantId),
  ])

  const records = recordsRes.data ?? []
  const profiles = profilesRes.data ?? []

  // Build user name lookup
  const nameMap = new Map(profiles.map((p) => [p.id, p.full_name ?? 'Unknown']))

  const totalHours = records.reduce((s, r) => s + (r.hours ?? 0), 0)
  const uniqueStaff = new Set(records.map((r) => r.user_id)).size
  const categories = [...new Set(records.map((r) => r.topic_category).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Staff Training Overview
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Track certifications, expirations, and compliance across your team.
        </p>
      </div>

      {records.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <Award
            size={48}
            className="mx-auto mb-4"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            No training records yet.
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Training records will appear here once staff training is logged.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Records', value: records.length.toString() },
              { label: 'Total Hours', value: totalHours.toFixed(1) },
              { label: 'Staff Trained', value: uniqueStaff.toString() },
              { label: 'Categories', value: categories.length.toString() },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{stat.label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Training records table */}
          <div
            className="overflow-hidden rounded-xl"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="p-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                Training Records
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Staff', 'Training', 'Type', 'Hours', 'Completed', 'Provider'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>
                        {nameMap.get(rec.user_id) ?? rec.user_id?.slice(0, 8) ?? '\u2014'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>{rec.training_name ?? '\u2014'}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                        {rec.training_type ?? rec.topic_category ?? '\u2014'}
                      </td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--color-foreground)' }}>
                        {rec.hours ?? 0}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                        {rec.completed_date ? new Date(rec.completed_date).toLocaleDateString() : '\u2014'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                        {rec.provider ?? '\u2014'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
