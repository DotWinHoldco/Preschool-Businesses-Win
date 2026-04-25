'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { refreshDynamicAudience } from '@/lib/actions/crm/audiences'

export function AudienceRefreshButton({ audienceId }: { audienceId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="secondary"
      onClick={() =>
        startTransition(async () => {
          const r = await refreshDynamicAudience(audienceId)
          if (!r.ok) {
            toast({ variant: 'error', title: 'Refresh failed', description: r.error })
            return
          }
          toast({ variant: 'success', title: `${r.count ?? 0} members` })
          router.refresh()
        })
      }
      loading={pending}
      disabled={pending}
    >
      <RefreshCw size={14} />
      Refresh
    </Button>
  )
}
