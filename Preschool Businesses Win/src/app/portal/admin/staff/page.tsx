// @anchor: cca.staff.admin-list
// Admin staff list with certification status.

import { Card, CardContent } from '@/components/ui/card'
import { CertStatusBadge } from '@/components/portal/staff/cert-status-badge'
import { Users } from 'lucide-react'

export default async function AdminStaffPage() {
  // TODO: Fetch staff list with cert status from Supabase
  const staffMembers = [
    {
      id: 'staff-1',
      name: 'Jane Smith',
      role: 'Lead Teacher',
      classroom: 'Butterfly Room',
      employment_type: 'Full-time',
      certs: [
        { name: 'CPR', expiry: '2026-08-15' },
        { name: 'First Aid', expiry: '2026-04-20' },
        { name: 'ECE Credential', expiry: null },
      ],
    },
    {
      id: 'staff-2',
      name: 'Maria Garcia',
      role: 'Assistant Teacher',
      classroom: 'Sunshine Room',
      employment_type: 'Full-time',
      certs: [
        { name: 'CPR', expiry: '2026-03-01' },
        { name: 'First Aid', expiry: '2027-01-15' },
      ],
    },
    {
      id: 'staff-3',
      name: 'Tom Wilson',
      role: 'Aide',
      classroom: 'Rainbow Room',
      employment_type: 'Part-time',
      certs: [
        { name: 'CPR', expiry: '2026-12-01' },
        { name: 'Food Handler', expiry: '2026-06-30' },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Staff</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {staffMembers.length} staff members
          </p>
        </div>
        <a
          href="/portal/admin/staff/payroll"
          className="inline-flex items-center gap-2 rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2 text-sm font-semibold min-h-[44px] hover:brightness-110 transition-all"
        >
          Payroll
        </a>
      </div>

      <div className="space-y-3">
        {staffMembers.map((staff) => (
          <a key={staff.id} href={`/portal/admin/staff/${staff.id}`}>
            <Card className="hover:shadow-[0_2px_4px_rgba(28,28,40,.06),0_24px_48px_-12px_rgba(37,99,235,.12)] transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                      <Users size={18} className="text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">{staff.name}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {staff.role} &mdash; {staff.classroom} &mdash; {staff.employment_type}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {staff.certs.map((cert) => (
                    <CertStatusBadge
                      key={cert.name}
                      certName={cert.name}
                      expiryDate={cert.expiry}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
