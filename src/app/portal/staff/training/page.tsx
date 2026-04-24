// @anchor: cca.training.staff-page
// Staff training hours and certifications — real Supabase data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { GraduationCap, Award, Clock } from 'lucide-react'

export default async function StaffTrainingPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch training records
  const { data: trainingRows } = await supabase
    .from('training_records')
    .select('id, title, provider, hours, completed_at, certificate_url')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .order('completed_at', { ascending: false })

  const trainingRecords = (trainingRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    title: (r.title as string) ?? 'Training',
    provider: (r.provider as string) ?? '',
    hours: (r.hours as number) ?? 0,
    completedAt: r.completed_at
      ? new Date(r.completed_at as string).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'In Progress',
    hasCertificate: !!r.certificate_url,
  }))

  const totalHours = trainingRecords.reduce((sum, r) => sum + r.hours, 0)

  // Fetch certifications
  const { data: certRows } = await supabase
    .from('staff_certifications')
    .select('id, name, issued_at, expires_at, status')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .order('expires_at', { ascending: true })

  const certifications = (certRows ?? []).map((c: Record<string, unknown>) => {
    const expiresAt = c.expires_at ? new Date(c.expires_at as string) : null
    const isExpired = expiresAt ? expiresAt < new Date() : false
    const now = new Date()
    const isExpiringSoon =
      expiresAt && !isExpired
        ? expiresAt.getTime() - now.getTime() < 90 * 24 * 60 * 60 * 1000 // 90 days
        : false

    return {
      id: c.id as string,
      name: (c.name as string) ?? 'Certification',
      issuedAt: c.issued_at
        ? new Date(c.issued_at as string).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '—',
      expiresAt: expiresAt
        ? expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'No expiration',
      status: (c.status as string) ?? (isExpired ? 'expired' : 'active'),
      isExpired,
      isExpiringSoon,
    }
  })

  const hasContent = trainingRecords.length > 0 || certifications.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          My Training Hours
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Training records and professional certifications.
        </p>
      </div>

      {!hasContent ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <GraduationCap
            size={32}
            className="mx-auto mb-2"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No training records.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                <p
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  Total Hours
                </p>
              </div>
              <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                {totalHours}
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <GraduationCap size={16} style={{ color: 'var(--color-primary)' }} />
                <p
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  Trainings
                </p>
              </div>
              <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                {trainingRecords.length}
              </p>
            </div>
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <Award size={16} style={{ color: 'var(--color-primary)' }} />
                <p
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  Certifications
                </p>
              </div>
              <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                {certifications.length}
              </p>
            </div>
          </div>

          {/* Training Records */}
          {trainingRecords.length > 0 && (
            <div
              className="rounded-xl"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="p-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  Training Records
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {trainingRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-foreground)' }}
                      >
                        {record.title}
                      </p>
                      {record.provider && (
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          {record.provider}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-foreground)' }}
                      >
                        {record.hours} hrs
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {record.completedAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div
              className="rounded-xl"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="p-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  Certifications
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {certifications.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-foreground)' }}
                      >
                        {cert.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        Issued: {cert.issuedAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: cert.isExpired
                            ? 'var(--color-destructive)'
                            : cert.isExpiringSoon
                              ? 'var(--color-warning)'
                              : 'var(--color-success)',
                          color: 'var(--color-primary-foreground)',
                        }}
                      >
                        {cert.isExpired
                          ? 'Expired'
                          : cert.isExpiringSoon
                            ? 'Expiring Soon'
                            : 'Active'}
                      </span>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        Expires: {cert.expiresAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
