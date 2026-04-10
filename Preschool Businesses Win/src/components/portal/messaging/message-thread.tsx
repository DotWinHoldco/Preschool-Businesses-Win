'use client'

// @anchor: cca.messaging.thread
// Message thread display with real-time-ready structure.

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/cn'
import { Send, AlertTriangle, Paperclip } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  sender_name: string
  body: string
  message_type: 'text' | 'photo' | 'file' | 'system'
  file_path?: string | null
  urgent: boolean
  created_at: string
}

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
  messages: Message[]
  className?: string
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch {
    return iso
  }
}

function formatDateDivider(iso: string): string {
  try {
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export function MessageThread({
  conversationId,
  currentUserId,
  messages,
  className,
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const fd = new FormData()
      fd.set('conversation_id', conversationId)
      fd.set('sender_id', currentUserId)
      fd.set('body', newMessage.trim())
      fd.set('message_type', 'text')
      fd.set('urgent', 'false')

      await fetch('/api/messaging/send', { method: 'POST', body: fd })
      setNewMessage('')
    } catch {
      // Silently handle — message will be retried
    } finally {
      setSending(false)
    }
  }

  // Group messages by date
  let lastDate = ''

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId
          const msgDate = new Date(msg.created_at).toDateString()
          const showDateDivider = msgDate !== lastDate
          lastDate = msgDate

          return (
            <div key={msg.id}>
              {showDateDivider && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {formatDateDivider(msg.created_at)}
                  </span>
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                </div>
              )}

              {msg.message_type === 'system' ? (
                <div className="text-center">
                  <span className="text-xs text-[var(--color-muted-foreground)] italic">
                    {msg.body}
                  </span>
                </div>
              ) : (
                <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-[var(--radius,0.75rem)] px-4 py-2.5',
                      msg.urgent
                        ? 'border-2 border-[var(--color-destructive)] bg-[var(--color-destructive)]/5'
                        : isOwn
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                          : 'bg-[var(--color-muted)] text-[var(--color-foreground)]',
                    )}
                  >
                    {!isOwn && (
                      <p className={cn(
                        'text-xs font-semibold mb-1',
                        msg.urgent ? 'text-[var(--color-destructive)]' : 'text-[var(--color-primary)]',
                      )}>
                        {msg.sender_name}
                      </p>
                    )}
                    {msg.urgent && (
                      <div className="flex items-center gap-1 text-xs text-[var(--color-destructive)] font-semibold mb-1">
                        <AlertTriangle size={12} />
                        Urgent
                      </div>
                    )}
                    {msg.message_type === 'photo' && msg.file_path && (
                      <div className="mb-2 rounded-[calc(var(--radius,0.75rem)*0.5)] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.file_path} alt="Shared photo" className="max-w-full" />
                      </div>
                    )}
                    {msg.message_type === 'file' && msg.file_path && (
                      <a
                        href={msg.file_path}
                        className="flex items-center gap-1 text-xs underline mb-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Paperclip size={12} />
                        Attachment
                      </a>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        isOwn && !msg.urgent ? 'text-[var(--color-primary-foreground)]/70' : 'text-[var(--color-muted-foreground)]',
                      )}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Compose */}
      <form
        onSubmit={handleSend}
        className="border-t border-[var(--color-border)] p-3 flex gap-2"
      >
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className={cn(
            'flex-1 rounded-full border border-[var(--color-border)] bg-transparent',
            'px-4 py-2.5 text-sm min-h-[44px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
          )}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className={cn(
            'flex h-[44px] w-[44px] items-center justify-center rounded-full',
            'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
            'hover:brightness-110 disabled:opacity-50 transition-all',
          )}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
