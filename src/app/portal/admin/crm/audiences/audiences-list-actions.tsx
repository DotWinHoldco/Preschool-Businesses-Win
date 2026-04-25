'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { deleteAudience } from '@/lib/actions/crm/audiences'

export function AudiencesListActions({ audienceId, name }: { audienceId: string; name: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete the "${name}" audience? Members keep their contact records.`)) return
    startTransition(async () => {
      const res = await deleteAudience(audienceId)
      if (!res.ok) {
        toast({ variant: 'error', title: 'Delete failed', description: res.error })
        return
      }
      toast({ variant: 'success', title: 'Audience deleted' })
      router.refresh()
    })
  }

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-colors disabled:opacity-30"
      aria-label="Delete audience"
    >
      <Trash2 size={14} />
    </button>
  )
}
