'use client'

// @anchor: cca.compliance.incident-status-controls

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { closeIncident, updateIncident } from '@/lib/actions/compliance/incidents'

export function IncidentStatusControls({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function setStatus(status: 'investigating' | 'closed' | 'escalated') {
    setError(null)
    start(async () => {
      let res
      if (status === 'investigating') {
        res = await updateIncident({ id, status: 'investigating' })
      } else {
        res = await closeIncident({ id, status })
      }
      if (!res.ok) {
        setError(res.error ?? 'Failed to update status')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending || currentStatus === 'investigating'}
        onClick={() => setStatus('investigating')}
      >
        Mark Investigating
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending || currentStatus === 'closed'}
        onClick={() => setStatus('closed')}
      >
        Close
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={pending || currentStatus === 'escalated'}
        onClick={() => setStatus('escalated')}
      >
        Escalate
      </Button>
      {error && (
        <p className="w-full text-sm" style={{ color: 'var(--color-destructive)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
