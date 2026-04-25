'use client'

import { useTransition } from 'react'
import { setAutomationEnabled } from '@/lib/actions/crm/automations'
import { toast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

export function AutomationToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const [pending, start] = useTransition()
  const router = useRouter()

  function toggle() {
    start(async () => {
      const r = await setAutomationEnabled(id, !enabled)
      if (!r.ok) {
        toast({ variant: 'error', title: r.error ?? 'Failed' })
      } else {
        toast({ variant: 'success', title: enabled ? 'Paused' : 'Live' })
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? 'Pause automation' : 'Enable automation'}
      className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'} ${pending ? 'opacity-60' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}
