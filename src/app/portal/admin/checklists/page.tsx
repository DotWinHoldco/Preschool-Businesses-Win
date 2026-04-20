// @anchor: cca.checklist.admin-page

import { ChecklistsClient } from '@/components/portal/checklists/checklists-client'

export default function AdminChecklistsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Checklist Templates
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Manage daily, weekly, and monthly checklists for your team.
        </p>
      </div>
      <ChecklistsClient />
    </div>
  )
}
