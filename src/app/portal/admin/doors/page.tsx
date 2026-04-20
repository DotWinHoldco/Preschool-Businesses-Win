// @anchor: cca.door.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { DoorOpen } from 'lucide-react'

export default async function AdminDoorsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Door Control
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Monitor and manage access points across your facility.
        </p>
      </div>

      <div
        className="rounded-xl p-12 text-center"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <DoorOpen
          size={48}
          className="mx-auto mb-4"
          style={{ color: 'var(--color-muted-foreground)' }}
        />
        <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Hardware Setup Required
        </p>
        <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--color-muted-foreground)' }}>
          Door access control requires hardware setup. Contact your administrator to configure door access integration.
        </p>
      </div>
    </div>
  )
}
