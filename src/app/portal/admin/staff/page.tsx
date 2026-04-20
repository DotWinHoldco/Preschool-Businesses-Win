// @anchor: cca.staff.admin-list
// Admin staff list with certification status — real Supabase data.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { CertStatusBadge } from '@/components/portal/staff/cert-status-badge'
import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'

export default async function AdminStaffPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch staff profiles
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const staffList = staff ?? []
  const userIds = staffList.map((s) => s.user_id).filter(Boolean)

  // Fetch related user profiles, memberships, and certifications in parallel
  const [{ data: profiles }, { data: memberships }, { data: certs }] = await Promise.all([
    userIds.length > 0
      ? supabase.from('user_profiles').select('*').in('id', userIds)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    userIds.length > 0
      ? supabase.from('user_tenant_memberships').select('*').in('user_id', userIds).eq('tenant_id', tenantId)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    staffList.length > 0
      ? supabase.from('staff_certifications').select('*').eq('tenant_id', tenantId).in('staff_id', staffList.map((s) => s.id))
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ])

  // Build lookup maps
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const membershipMap = new Map((memberships ?? []).map((m) => [m.user_id, m]))
  const certMap = new Map<string, Array<{ name: string; expiry: string | null }>>()
  for (const c of certs ?? []) {
    const list = certMap.get(c.staff_id as string) ?? []
    list.push({ name: c.cert_name as string, expiry: c.expiry_date as string | null })
    certMap.set(c.staff_id as string, list)
  }

  // Merge data
  const staffMembers = staffList.map((s) => {
    const profile = profileMap.get(s.user_id)
    const membership = membershipMap.get(s.user_id)
    return {
      id: s.id,
      name: profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : 'Unknown',
      role: (membership?.role as string) ?? s.employment_type ?? 'Staff',
      employment_type: s.employment_type ?? 'Full-time',
      certs: certMap.get(s.id) ?? [],
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Staff</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {staffMembers.length} staff member{staffMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" size="sm">
            <Link href="/portal/admin/staff/payroll">Payroll</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/portal/admin/staff/new">
              <Plus size={16} />
              Add Staff
            </Link>
          </Button>
        </div>
      </div>

      {staffMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] py-16 text-center">
          <Users size={40} className="mb-3 text-[var(--color-muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--color-muted-foreground)]">No staff members yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staffMembers.map((staffMember) => (
            <a key={staffMember.id} href={`/portal/admin/staff/${staffMember.id}`}>
              <Card className="hover:shadow-[0_2px_4px_rgba(28,28,40,.06),0_24px_48px_-12px_rgba(37,99,235,.12)] transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                        <Users size={18} className="text-[var(--color-primary)]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">{staffMember.name}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {staffMember.role} &mdash; {staffMember.employment_type}
                        </p>
                      </div>
                    </div>
                  </div>
                  {staffMember.certs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {staffMember.certs.map((cert) => (
                        <CertStatusBadge
                          key={cert.name}
                          certName={cert.name}
                          expiryDate={cert.expiry}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
