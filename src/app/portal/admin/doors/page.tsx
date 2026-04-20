// @anchor: cca.door.admin-page

import { DoorsClient } from '@/components/portal/doors/doors-client'

export default function AdminDoorsPage() {
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
      <DoorsClient />
    </div>
  )
}
