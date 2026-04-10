'use client'

// @anchor: cca.messaging.compose
// New message modal for starting conversations.

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { X, Send } from 'lucide-react'

interface ComposeModalProps {
  open: boolean
  onClose: () => void
  recipients?: Array<{ id: string; name: string; role: string }>
  className?: string
}

export function ComposeModal({ open, onClose, recipients = [], className }: ComposeModalProps) {
  const [selectedRecipient, setSelectedRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  if (!open) return null

  async function handleSend() {
    if (!selectedRecipient || !message.trim()) return
    setSending(true)

    try {
      // TODO: Create conversation and send first message
      onClose()
    } catch {
      // Handle error
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-md rounded-[var(--radius,0.75rem)]',
          'bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl',
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label="New Message"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">New Message</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-[var(--color-muted)] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              To
            </label>
            <select
              value={selectedRecipient}
              onChange={(e) => setSelectedRecipient(e.target.value)}
              className={cn(
                'w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)]',
                'bg-transparent px-3 py-2.5 text-sm min-h-[44px]',
              )}
            >
              <option value="">Select a recipient...</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.role})
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className={cn(
                'w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)]',
                'bg-transparent px-3 py-2.5 text-sm resize-none',
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-[var(--radius,0.75rem)] border border-[var(--color-border)]',
              'px-4 py-2.5 text-sm font-medium min-h-[44px]',
              'hover:bg-[var(--color-muted)] transition-colors',
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!selectedRecipient || !message.trim() || sending}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[var(--radius,0.75rem)]',
              'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
              'px-4 py-2.5 text-sm font-semibold min-h-[44px]',
              'hover:brightness-110 disabled:opacity-50 transition-all',
            )}
          >
            <Send size={14} />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
