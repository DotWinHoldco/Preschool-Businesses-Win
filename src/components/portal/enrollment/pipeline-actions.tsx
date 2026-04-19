'use client'

// @anchor: cca.applications.pipeline.ui-actions

import { useState, useTransition } from 'react'
import { runPipelineAction, deleteApplication } from '@/lib/actions/enrollment/pipeline-actions'
import { Send, Calendar, CheckCircle2, Clock, XCircle, Trash2 } from 'lucide-react'

const ACTIONS = [
  {
    key: 'accept_and_invite_interview' as const,
    label: 'Accept & Invite Interview',
    icon: Send,
    variant: 'primary' as const,
  },
  {
    key: 'mark_interview_complete' as const,
    label: 'Mark Interview Complete',
    icon: CheckCircle2,
    variant: 'secondary' as const,
  },
  {
    key: 'send_offer' as const,
    label: 'Send Offer',
    icon: Send,
    variant: 'primary' as const,
  },
  {
    key: 'accept_offer' as const,
    label: 'Mark Enrolled',
    icon: CheckCircle2,
    variant: 'primary' as const,
  },
  {
    key: 'request_info' as const,
    label: 'Request Info',
    icon: Calendar,
    variant: 'ghost' as const,
  },
  {
    key: 'waitlist' as const,
    label: 'Waitlist',
    icon: Clock,
    variant: 'ghost' as const,
  },
  {
    key: 'reject' as const,
    label: 'Reject',
    icon: XCircle,
    variant: 'destructive' as const,
  },
] as const

type ActionKey = (typeof ACTIONS)[number]['key']
type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90',
  secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:opacity-90',
  ghost:
    'border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
  destructive:
    'border border-[var(--color-destructive)] text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10',
}

export function PipelineActions({ applicationId }: { applicationId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [notesOpen, setNotesOpen] = useState<ActionKey | null>(null)
  const [notes, setNotes] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteApplication(applicationId)
      if (!result.ok) {
        setError(result.error ?? 'Delete failed')
      } else {
        window.location.href = '/portal/admin/enrollment'
      }
    })
  }

  const trigger = (action: ActionKey, noteValue?: string) => {
    setError(null)
    startTransition(async () => {
      const result = await runPipelineAction({
        application_id: applicationId,
        action,
        notes: noteValue,
      })
      if (!result.ok) {
        setError(result.error ?? 'Action failed')
      } else {
        setLastAction(action)
        setNotesOpen(null)
        setNotes('')
        window.location.reload()
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.key}
              disabled={pending}
              onClick={() => {
                if (a.key === 'reject' || a.key === 'request_info' || a.key === 'mark_interview_complete') {
                  setNotesOpen(a.key)
                } else {
                  trigger(a.key)
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-[var(--radius)] px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${VARIANT_CLASSES[a.variant]}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {a.label}
            </button>
          )
        })}
      </div>

      {!confirmDelete ? (
        <button
          disabled={pending}
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-destructive)] px-3 py-1.5 text-xs font-medium text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Application
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-destructive)] bg-[var(--color-destructive)]/5 px-3 py-2">
          <span className="text-xs text-[var(--color-destructive)]">
            Permanently delete this application and all related data?
          </span>
          <button
            disabled={pending}
            onClick={handleDelete}
            className="rounded-[var(--radius)] bg-[var(--color-destructive)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Deleting...' : 'Yes, delete'}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
          >
            Cancel
          </button>
        </div>
      )}

      {notesOpen && (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <label className="block text-xs font-medium text-[var(--color-muted-foreground)]">
            Notes ({ACTIONS.find((a) => a.key === notesOpen)?.label})
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <div className="mt-2 flex gap-2">
            <button
              disabled={pending}
              onClick={() => trigger(notesOpen, notes)}
              className="rounded-[var(--radius)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={() => setNotesOpen(null)}
              className="rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-xs text-[var(--color-destructive)]">{error}</div>}
      {lastAction && !error && (
        <div className="text-xs text-[var(--color-primary)]">Action {lastAction} completed.</div>
      )}
    </div>
  )
}
