'use client'

// @anchor: cca.subsidy.agency-row-actions
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { deleteSubsidyAgency } from '@/lib/actions/subsidies/manage-agency'
import { AgencyFormDialog, type AgencyFormValues } from './agency-form-dialog'

interface AgencyRowActionsProps {
  agency: AgencyFormValues
}

export function AgencyRowActions({ agency }: AgencyRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!agency.id || deleting) return
    setDeleting(true)
    try {
      const result = await deleteSubsidyAgency({ id: agency.id })
      if (!result.ok) {
        toast({
          variant: 'error',
          title: 'Failed to delete agency',
          description: result.error ?? 'Unknown error',
        })
        return
      }
      toast({ variant: 'success', title: 'Agency deleted', description: agency.name })
      setConfirmOpen(false)
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Failed to delete agency',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <AgencyFormDialog
        mode="edit"
        initial={agency}
        trigger={(open) => (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={open}
            className="h-8 min-w-0 px-2 text-xs"
          >
            <Pencil className="h-3 w-3" /> Edit
          </Button>
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="h-8 min-w-0 px-2 text-xs text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
      >
        <Trash2 className="h-3 w-3" /> Delete
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogOverlay onClick={() => setConfirmOpen(false)} />
        <DialogContent
          title="Delete agency?"
          description={`Remove ${agency.name}. This cannot be undone. Existing claims that reference this agency will keep their historical agency_id.`}
        >
          <DialogClose onClick={() => setConfirmOpen(false)} />
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={handleDelete}
            >
              Delete agency
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
