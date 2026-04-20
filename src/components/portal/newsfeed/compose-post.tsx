'use client'

// @anchor: cca.newsfeed.compose-post
// Compose new post modal for the admin newsfeed page.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createNewsfeedPost } from '@/lib/actions/newsfeed/create-post'
import { X, Plus, Pin } from 'lucide-react'

export function ComposePostButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={16} />
        New Post
      </Button>

      {open && <ComposePostDialog onClose={() => setOpen(false)} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

interface ComposePostDialogProps {
  onClose: () => void
}

function ComposePostDialog({ onClose }: ComposePostDialogProps) {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<'all_parents' | 'classroom' | 'staff'>('all_parents')
  const [pinned, setPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    setError(null)

    const result = await createNewsfeedPost({
      title: title.trim(),
      body: body.trim(),
      audience,
      pinned,
    })

    if (result.ok) {
      router.refresh()
      onClose()
    } else {
      setError(result.error ?? 'Something went wrong')
      setSubmitting(false)
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
          'relative w-full max-w-lg rounded-[var(--radius,0.75rem)]',
          'bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="New Post"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">New Post</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-[var(--color-muted)] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="post-title"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
              >
                Title <span className="text-[var(--color-destructive)]">*</span>
              </label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title..."
                required
                autoFocus
                inputSize="sm"
              />
            </div>

            {/* Body */}
            <div>
              <label
                htmlFor="post-body"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
              >
                Body
              </label>
              <textarea
                id="post-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your announcement..."
                rows={4}
                className={cn(
                  'w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)]',
                  'bg-[var(--color-background)] text-[var(--color-foreground)]',
                  'placeholder:text-[var(--color-muted-foreground)]',
                  'px-3 py-2.5 text-sm resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
                )}
              />
            </div>

            {/* Audience */}
            <div>
              <label
                htmlFor="post-audience"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
              >
                Audience
              </label>
              <select
                id="post-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as typeof audience)}
                className={cn(
                  'w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)]',
                  'bg-[var(--color-background)] text-[var(--color-foreground)]',
                  'px-3 py-2.5 text-sm min-h-[44px]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
                )}
              >
                <option value="all_parents">All Parents</option>
                <option value="classroom">Classroom</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {/* Pin toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={pinned}
                onClick={() => setPinned(!pinned)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                  'border-2 border-transparent',
                  pinned
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-muted)]',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                    pinned ? 'translate-x-5' : 'translate-x-1',
                  )}
                />
              </button>
              <Pin size={14} className="text-[var(--color-muted-foreground)]" />
              <span className="text-sm text-[var(--color-foreground)]">Pin to top</span>
            </label>

            {/* Error */}
            {error && (
              <p className="text-sm text-[var(--color-destructive)]">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={submitting}
              disabled={!title.trim()}
            >
              Publish
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
