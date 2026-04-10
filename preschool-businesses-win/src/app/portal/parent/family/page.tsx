// @anchor: cca.family.parent-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Family Profile | Parent Portal',
  description: 'Manage your family profile, members, and household information',
}

export default function ParentFamilyPage() {
  const mockFamily = {
    name: 'Martinez Family',
    address: '456 Oak Street, Crandall, TX 75114',
    billingEmail: 'jane.martinez@email.com',
    billingPhone: '(555) 123-4567',
    autoPay: true,
  }

  const mockMembers = [
    { name: 'Jane Martinez', relationship: 'Mother', role: 'Primary Contact', billing: true, canPickup: true },
    { name: 'Carlos Martinez', relationship: 'Father', role: 'Contact', billing: false, canPickup: true },
    { name: 'Rosa Martinez', relationship: 'Grandmother', role: 'Emergency Contact', billing: false, canPickup: true },
  ]

  const mockChildren = [
    { name: 'Sophia Martinez', age: '3 years', classroom: 'Butterfly Room', status: 'Active' },
    { name: 'Lucas Martinez', age: '18 months', classroom: 'Ladybug Room', status: 'Active' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Family Profile
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {mockFamily.name}
          </p>
        </div>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Edit Family Info
        </button>
      </div>

      {/* Household info */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
          Household Information
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            ['Mailing Address', mockFamily.address],
            ['Billing Email', mockFamily.billingEmail],
            ['Billing Phone', mockFamily.billingPhone],
            ['Auto-Pay', mockFamily.autoPay ? 'Enabled' : 'Disabled'],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{label}</dt>
              <dd className="text-sm" style={{ color: 'var(--color-foreground)' }}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Children */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
          Children
        </h2>
        <div className="mt-3 space-y-3">
          {mockChildren.map((child) => (
            <div
              key={child.name}
              className="flex items-center justify-between rounded-lg p-3"
              style={{ backgroundColor: 'var(--color-muted)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{child.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {child.age} &middot; {child.classroom}
                </p>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
              >
                {child.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Family members */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
            Family Members
          </h2>
          <button
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            + Add Member
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {mockMembers.map((member) => (
            <div
              key={member.name}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  {member.name}
                  {member.role === 'Primary Contact' && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--color-primary)' }}>(Primary)</span>
                  )}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {member.relationship}
                </p>
              </div>
              <div className="flex gap-2">
                {member.canPickup && (
                  <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                    Pickup
                  </span>
                )}
                {member.billing && (
                  <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-secondary-foreground)' }}>
                    Billing
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Authorized pickups link */}
      <a
        href="/portal/parent/family/pickups"
        className="block rounded-xl p-5 transition-shadow hover:shadow-md"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
              Authorized Pickups
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Manage who is authorized to pick up your children. Photo ID required for non-parents.
            </p>
          </div>
          <span style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>&rarr;</span>
        </div>
      </a>
    </div>
  )
}
