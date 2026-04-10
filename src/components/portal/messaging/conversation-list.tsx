'use client'

// @anchor: cca.messaging.conversation-list
// Conversation sidebar listing all conversations.

import { cn } from '@/lib/cn'
import { MessageSquare, Megaphone, Users, Lock } from 'lucide-react'

interface Conversation {
  id: string
  type: 'direct' | 'classroom' | 'broadcast' | 'staff_only'
  title: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
}

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect?: (id: string) => void
  className?: string
}

const TYPE_ICONS: Record<string, typeof MessageSquare> = {
  direct: MessageSquare,
  classroom: Users,
  broadcast: Megaphone,
  staff_only: Lock,
}

function timeAgo(dateStr: string): string {
  try {
    const ms = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(ms / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    const days = Math.floor(hrs / 24)
    return `${days}d`
  } catch {
    return ''
  }
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  className,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <MessageSquare size={32} className="mx-auto mb-2 text-[var(--color-muted-foreground)]" />
        <p className="text-sm text-[var(--color-muted-foreground)]">No conversations yet.</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {conversations.map((conv) => {
        const Icon = TYPE_ICONS[conv.type] ?? MessageSquare
        const isActive = conv.id === activeId

        return (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect?.(conv.id)}
            className={cn(
              'flex items-start gap-3 px-4 py-3 text-left min-h-[60px]',
              'border-b border-[var(--color-border)] transition-colors',
              isActive
                ? 'bg-[var(--color-primary)]/5'
                : 'hover:bg-[var(--color-muted)]',
            )}
          >
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                isActive ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--color-muted)]',
              )}
            >
              <Icon
                size={14}
                className={isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'text-sm font-medium truncate',
                    conv.unreadCount > 0 ? 'font-semibold text-[var(--color-foreground)]' : 'text-[var(--color-foreground)]',
                  )}
                >
                  {conv.title}
                </span>
                {conv.lastMessageAt && (
                  <span className="text-xs text-[var(--color-muted-foreground)] shrink-0">
                    {timeAgo(conv.lastMessageAt)}
                  </span>
                )}
              </div>
              {conv.lastMessage && (
                <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">
                  {conv.lastMessage}
                </p>
              )}
            </div>

            {conv.unreadCount > 0 && (
              <span className="mt-1 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-xs font-bold text-[var(--color-primary-foreground)]">
                {conv.unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
