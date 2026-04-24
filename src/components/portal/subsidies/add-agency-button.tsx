'use client'

// @anchor: cca.subsidy.add-agency-button
import { Plus } from 'lucide-react'
import { AgencyFormDialog } from './agency-form-dialog'

export function AddAgencyButton() {
  return (
    <AgencyFormDialog
      mode="create"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add Agency
        </button>
      )}
    />
  )
}
