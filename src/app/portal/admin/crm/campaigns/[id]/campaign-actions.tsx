'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pause, Play, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { pauseCampaign, resumeCampaign, deleteCampaign } from '@/lib/actions/crm/campaigns'

export function CampaignActions({
  campaignId,
  status,
  type,
}: {
  campaignId: string
  status: string
  type: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function pauseOrResume() {
    startTransition(async () => {
      const r =
        status === 'paused' ? await resumeCampaign(campaignId) : await pauseCampaign(campaignId)
      if (!r.ok) {
        toast({ variant: 'error', title: 'Action failed', description: r.error })
        return
      }
      toast({ variant: 'success', title: status === 'paused' ? 'Resumed' : 'Paused' })
      router.refresh()
    })
  }
  function onDelete() {
    if (!confirm('Delete this campaign? Existing sends remain in the log.')) return
    startTransition(async () => {
      const r = await deleteCampaign(campaignId)
      if (!r.ok) {
        toast({ variant: 'error', title: 'Delete failed', description: r.error })
        return
      }
      toast({ variant: 'success', title: 'Campaign deleted' })
      router.push('/portal/admin/crm/campaigns')
    })
  }

  const showPauseResume = type === 'drip' && (status === 'sending' || status === 'paused')

  return (
    <div className="flex items-center gap-2">
      {showPauseResume && (
        <Button
          variant="secondary"
          size="sm"
          onClick={pauseOrResume}
          loading={pending}
          disabled={pending}
        >
          {status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
          {status === 'paused' ? 'Resume' : 'Pause'}
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onDelete} disabled={pending} aria-label="Delete">
        <Trash2 size={14} />
      </Button>
    </div>
  )
}
