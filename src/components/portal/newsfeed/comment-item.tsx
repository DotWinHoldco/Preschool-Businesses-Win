'use client'

// @anchor: cca.newsfeed.comment-item
// Single comment row with delete action (admin).

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteComment } from '@/lib/actions/newsfeed/comments'

interface CommentItemProps {
  id: string
  author: string
  body: string
  createdAt: string
  deleted: boolean
}

export function CommentItem({ id, author, body, createdAt, deleted }: CommentItemProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (pending || deleted) return
    startTransition(async () => {
      const res = await deleteComment(id)
      if (res.ok) router.refresh()
    })
  }

  return (
    <li
      className="rounded-[var(--radius,0.75rem)] border p-3"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: deleted
          ? 'color-mix(in srgb, var(--color-muted) 40%, transparent)'
          : 'var(--color-card)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              {author}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              {new Date(createdAt).toLocaleString()}
            </span>
          </div>
          <p
            className="mt-1 whitespace-pre-wrap text-sm"
            style={{
              color: deleted ? 'var(--color-muted-foreground)' : 'var(--color-foreground)',
              fontStyle: deleted ? 'italic' : 'normal',
            }}
          >
            {deleted ? '[comment deleted]' : body}
          </p>
        </div>
        {!deleted && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium disabled:opacity-50"
            style={{ color: 'var(--color-destructive)' }}
            aria-label="Delete comment"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </li>
  )
}
