'use client'

import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { deleteAutomation } from '@/lib/actions/crm/automations'

export function DeleteAutomationButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  function onDelete() {
    if (!confirm('Delete this automation? Past run history is preserved.')) return
    start(async () => {
      const r = await deleteAutomation(id)
      if (!r.ok) {
        toast({ variant: 'error', title: r.error ?? 'Delete failed' })
        return
      }
      toast({ variant: 'success', title: 'Automation deleted' })
      router.push('/portal/admin/crm/automations')
    })
  }
  return (
    <Button variant="ghost" size="sm" onClick={onDelete} loading={pending} aria-label="Delete">
      <Trash2 size={14} />
    </Button>
  )
}
