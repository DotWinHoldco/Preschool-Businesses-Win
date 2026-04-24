'use client'

// @anchor: cca.enrollment.waitlist
import { useState, useTransition } from 'react'
import { GripVertical, ChevronUp, ChevronDown, CheckCircle, XCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  sendWaitlistOffer,
  approveWaitlistedApplication,
  removeFromWaitlist,
  reorderWaitlist,
} from '@/lib/actions/enrollment/waitlist'

interface WaitlistEntry {
  id: string
  student_first_name: string
  student_last_name: string
  parent_name: string
  program_type: string
  triage_score: number | null
  created_at: string
  position: number
}

interface Classroom {
  id: string
  name: string
}

interface WaitlistManagerProps {
  entries: WaitlistEntry[]
  classrooms?: Classroom[]
}

export function WaitlistManager({ entries, classrooms = [] }: WaitlistManagerProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [offerFor, setOfferFor] = useState<WaitlistEntry | null>(null)
  const [classroomId, setClassroomId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [offerExpiresAt, setOfferExpiresAt] = useState('')
  const [notes, setNotes] = useState('')

  const runAction = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null)
    startTransition(async () => {
      const r = await fn()
      if (!r.ok) setError(r.error ?? 'Action failed')
    })
  }

  const handleMoveUp = (id: string) =>
    runAction(() => reorderWaitlist({ application_id: id, direction: 'up' }))
  const handleMoveDown = (id: string) =>
    runAction(() => reorderWaitlist({ application_id: id, direction: 'down' }))
  const handleApprove = (id: string) => runAction(() => approveWaitlistedApplication(id))
  const handleRemove = (id: string) => {
    if (!confirm('Remove this applicant from the waitlist?')) return
    runAction(() => removeFromWaitlist(id))
  }

  const submitOffer = () => {
    if (!offerFor) return
    if (!classroomId || !startDate || !offerExpiresAt) {
      setError('Classroom, start date, and expiration are required.')
      return
    }
    const appId = offerFor.id
    runAction(async () => {
      const r = await sendWaitlistOffer({
        application_id: appId,
        classroom_id: classroomId,
        start_date: startDate,
        offer_expires_at: offerExpiresAt,
        notes: notes || undefined,
      })
      if (r.ok) {
        setOfferFor(null)
        setClassroomId('')
        setStartDate('')
        setOfferExpiresAt('')
        setNotes('')
      }
      return r
    })
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Waitlist</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {entries.length} {entries.length === 1 ? 'family' : 'families'} waiting
        </p>
      </div>

      {error && (
        <div className="border-b border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 px-4 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Waitlist is empty
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border)]">
          {entries.map((entry, index) => (
            <div key={entry.id} className="flex items-center gap-3 p-4">
              {/* Position */}
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => handleMoveUp(entry.id)}
                  disabled={pending || index === 0}
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-30 transition-colors"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-muted)] text-sm font-bold text-[var(--color-foreground)]">
                  {entry.position}
                </span>
                <button
                  onClick={() => handleMoveDown(entry.id)}
                  disabled={pending || index === entries.length - 1}
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-30 transition-colors"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <GripVertical className="h-4 w-4 flex-shrink-0 text-[var(--color-muted-foreground)]" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-[var(--color-foreground)]">
                  {entry.student_first_name} {entry.student_last_name}
                </span>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Parent: {entry.parent_name} | {entry.program_type}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Applied: {new Date(entry.created_at).toLocaleDateString()}
                  {entry.triage_score !== null && ` | Score: ${entry.triage_score}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setOfferFor(entry)}
                  disabled={pending}
                  className="rounded-[var(--radius)] border border-[var(--color-border)] p-1.5 text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
                  title="Send offer"
                  aria-label="Send offer"
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleApprove(entry.id)}
                  disabled={pending}
                  className="rounded-[var(--radius)] bg-[var(--color-primary)] p-1.5 text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
                  title="Approve"
                  aria-label="Approve"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleRemove(entry.id)}
                  disabled={pending}
                  className="rounded-[var(--radius)] border border-[var(--color-destructive)] p-1.5 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors"
                  title="Remove"
                  aria-label="Remove"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offer dialog */}
      <Dialog open={offerFor !== null} onOpenChange={(o) => !o && setOfferFor(null)}>
        <DialogOverlay onClick={() => setOfferFor(null)} />
        <DialogContent
          title="Send waitlist offer"
          description={
            offerFor
              ? `Send an offer to ${offerFor.student_first_name} ${offerFor.student_last_name}`
              : ''
          }
        >
          <DialogClose onClick={() => setOfferFor(null)} />
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Classroom
              </label>
              <Select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="mt-1"
              >
                <option value="">Select a classroom</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Start date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Offer expires at
              </label>
              <Input
                type="datetime-local"
                value={offerExpiresAt}
                onChange={(e) => setOfferExpiresAt(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
                placeholder="Any details to include with the offer"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOfferFor(null)} size="sm">
                Cancel
              </Button>
              <Button onClick={submitOffer} loading={pending} size="sm">
                Send offer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
