'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { unblockEmail } from '@/lib/actions/crm/suppressions'

export function UnblockButton({ email }: { email: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function handle() {
    if (
      !confirm(
        `Re-subscribe ${email}? They will receive future campaigns again. (Their original unsubscribe is preserved in audit log.)`,
      )
    )
      return
    start(async () => {
      const r = await unblockEmail({ email })
      if (!r.ok) {
        toast({ variant: 'error', title: r.error ?? 'Failed' })
        return
      }
      toast({ variant: 'success', title: 'Re-subscribed' })
      router.refresh()
    })
  }

  return (
    <Button variant="ghost" size="sm" onClick={handle} loading={pending}>
      Re-subscribe
    </Button>
  )
}
