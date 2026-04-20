'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
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

function ComposePostDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter()

  const [content, setContent] = useState('')
  const [scope, setScope] = useState<'school_wide' | 'classroom'>('school_wide')
  const [postType, setPostType] = useState<'announcement' | 'reminder' | 'photo' | 'shoutout'>('announcement')
  const [pinned, setPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    setError(null)

    const result = await createNewsfeedPost({
      content: content.trim(),
      scope,
      post_type: postType,
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

  const selectClass = cn(
    'w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)]',
    'bg-[var(--color-background)] text-[var(--color-foreground)]',
    'px-3 py-2.5 text-sm min-h-[44px]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        className={cn(
          'relative w-full max-w-lg rounded-[var(--radius,0.75rem)]',
          'bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="New Post"
      >
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

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <div>
              <label htmlFor="post-content" className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Content <span className="text-[var(--color-destructive)]">*</span>
              </label>
              <textarea
                id="post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post..."
                rows={5}
                required
                autoFocus
                className={cn(
                  'w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)]',
                  'bg-[var(--color-background)] text-[var(--color-foreground)]',
                  'placeholder:text-[var(--color-muted-foreground)]',
                  'px-3 py-2.5 text-sm resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="post-type" className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Type
                </label>
                <select id="post-type" value={postType} onChange={(e) => setPostType(e.target.value as typeof postType)} className={selectClass}>
                  <option value="announcement">Announcement</option>
                  <option value="reminder">Reminder</option>
                  <option value="photo">Photo</option>
                  <option value="shoutout">Shoutout</option>
                </select>
              </div>
              <div>
                <label htmlFor="post-scope" className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Audience
                </label>
                <select id="post-scope" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} className={selectClass}>
                  <option value="school_wide">School-wide</option>
                  <option value="classroom">Classroom</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={pinned}
                onClick={() => setPinned(!pinned)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                  'border-2 border-transparent',
                  pinned ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted)]',
                )}
              >
                <span className={cn('inline-block h-4 w-4 rounded-full bg-white transition-transform', pinned ? 'translate-x-5' : 'translate-x-1')} />
              </button>
              <Pin size={14} className="text-[var(--color-muted-foreground)]" />
              <span className="text-sm text-[var(--color-foreground)]">Pin to top</span>
            </label>

            {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" loading={submitting} disabled={!content.trim()}>Publish</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
