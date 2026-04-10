'use client'

// @anchor: cca.messaging.broadcast-composer
// Broadcast composer for sending school-wide or classroom messages.

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Megaphone, Send, AlertTriangle } from 'lucide-react'

interface Classroom {
  id: string
  name: string
}

interface BroadcastComposerProps {
  classrooms: Classroom[]
  senderId: string
  onSent?: () => void
  className?: string
}

export function BroadcastComposer({
  classrooms,
  senderId,
  onSent,
  className,
}: BroadcastComposerProps) {
  const [scope, setScope] = useState<'school' | 'classroom' | 'staff'>('school')
  const [classroomId, setClassroomId] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    if (scope === 'classroom' && !classroomId) return

    setSending(true)

    try {
      const fd = new FormData()
      fd.set('sender_id', senderId)
      fd.set('scope', scope)
      fd.set('title', title.trim())
      fd.set('body', body.trim())
      fd.set('urgent', String(urgent))
      if (classroomId) fd.set('classroom_id', classroomId)

      await fetch('/api/messaging/broadcast', { method: 'POST', body: fd })
      setTitle('')
      setBody('')
      setUrgent(false)
      onSent?.()
    } catch {
      // Handle error
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-6',
        className,
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <Megaphone size={20} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Broadcast</h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">Send to multiple recipients</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Scope */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
            Send to
          </label>
          <div className="flex gap-2">
            {(['school', 'classroom', 'staff'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium min-h-[40px] border',
                  'transition-colors',
                  scope === s
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]',
                )}
              >
                {s === 'school' ? 'All Parents' : s === 'classroom' ? 'Classroom' : 'All Staff'}
              </button>
            ))}
          </div>
        </div>

        {/* Classroom selector */}
        {scope === 'classroom' && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Classroom
            </label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm min-h-[44px]"
            >
              <option value="">Select classroom...</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            Subject
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Message subject..."
            className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm min-h-[44px]"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your broadcast message..."
            rows={4}
            className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm resize-none"
          />
        </div>

        {/* Urgent toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="accent-[var(--color-destructive)]"
          />
          <AlertTriangle size={14} className="text-[var(--color-destructive)]" />
          <span className="text-sm text-[var(--color-foreground)]">
            Mark as urgent (bypasses quiet hours)
          </span>
        </label>

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!title.trim() || !body.trim() || sending || (scope === 'classroom' && !classroomId)}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 rounded-[var(--radius,0.75rem)]',
            'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
            'px-4 py-3 text-sm font-semibold min-h-[48px]',
            'hover:brightness-110 disabled:opacity-50 transition-all',
          )}
        >
          <Send size={16} />
          {sending ? 'Sending broadcast...' : 'Send Broadcast'}
        </button>
      </div>
    </div>
  )
}
