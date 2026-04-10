// @anchor: cca.family.pickups-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authorized Pickups | Parent Portal',
  description: 'Manage who is authorized to pick up your children',
}

export default function ParentFamilyPickupsPage() {
  const mockPickups = [
    {
      id: '1',
      name: 'Jane Martinez',
      relationship: 'Mother',
      phone: '(555) 123-4567',
      photoOnFile: true,
      idVerified: true,
      validFrom: 'August 1, 2025',
      validTo: null,
      children: ['Sophia', 'Lucas'],
      isParent: true,
    },
    {
      id: '2',
      name: 'Carlos Martinez',
      relationship: 'Father',
      phone: '(555) 234-5678',
      photoOnFile: true,
      idVerified: true,
      validFrom: 'August 1, 2025',
      validTo: null,
      children: ['Sophia', 'Lucas'],
      isParent: true,
    },
    {
      id: '3',
      name: 'Rosa Martinez',
      relationship: 'Grandmother',
      phone: '(555) 345-6789',
      photoOnFile: true,
      idVerified: true,
      validFrom: 'August 1, 2025',
      validTo: null,
      children: ['Sophia', 'Lucas'],
      isParent: false,
    },
    {
      id: '4',
      name: 'Maria Lopez',
      relationship: 'Nanny',
      phone: '(555) 456-7890',
      photoOnFile: true,
      idVerified: false,
      validFrom: 'January 15, 2026',
      validTo: 'June 30, 2026',
      children: ['Sophia'],
      isParent: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Authorized Pickups
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Only these people may pick up your children. Photo ID verification is required for all non-parents. Unauthorized pickups will be blocked.
          </p>
        </div>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          + Add Authorized Pickup
        </button>
      </div>

      {/* Safety notice */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--color-destructive)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-destructive)' }}>
          Child safety is non-negotiable. Any person not on this list will be denied checkout and administration will be alerted immediately.
        </p>
      </div>

      {/* Pickup list */}
      <div className="space-y-4">
        {mockPickups.map((person) => (
          <div
            key={person.id}
            className="rounded-xl p-5"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: person.photoOnFile ? 'var(--color-primary)' : 'var(--color-muted)',
                    color: person.photoOnFile ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
                  }}
                >
                  {person.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-base font-semibold" style={{ color: 'var(--color-foreground)' }}>
                    {person.name}
                    {person.isParent && (
                      <span className="ml-2 text-xs font-normal" style={{ color: 'var(--color-primary)' }}>(Parent)</span>
                    )}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                    {person.relationship} &middot; {person.phone}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {person.photoOnFile ? (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                    Photo on File
                  </span>
                ) : (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-warning)', color: 'var(--color-primary-foreground)' }}>
                    No Photo
                  </span>
                )}
                {person.idVerified ? (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                    ID Verified
                  </span>
                ) : (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-warning)', color: 'var(--color-primary-foreground)' }}>
                    ID Pending
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div>
                <span style={{ color: 'var(--color-muted-foreground)' }}>Authorized for: </span>
                <span style={{ color: 'var(--color-foreground)' }}>{person.children.join(', ')}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-muted-foreground)' }}>Valid: </span>
                <span style={{ color: 'var(--color-foreground)' }}>
                  {person.validFrom} {person.validTo ? `to ${person.validTo}` : '(ongoing)'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>Edit</button>
              {!person.photoOnFile && (
                <button className="text-xs font-medium" style={{ color: 'var(--color-warning)' }}>Upload Photo</button>
              )}
              {!person.isParent && (
                <button className="text-xs font-medium" style={{ color: 'var(--color-destructive)' }}>Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
