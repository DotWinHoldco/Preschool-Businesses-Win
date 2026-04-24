'use client'

// @anchor: cca.newsfeed.post-row-actions
// Client component: edit / delete / pin toggle controls for a newsfeed post row.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { Pin, PinOff, Pencil, Trash2, MessageSquare, X } from 'lucide-react'
import { togglePostPinned, updatePost } from '@/lib/actions/newsfeed/update-post'
import { deletePost } from '@/lib/actions/newsfeed/delete-post'

interface PostRowActionsProps {
  postId: string
  pinned: boolean
  content: string
  scope: 'school_wide' | 'classroom'
  postType: 'announcement' | 'reminder' | 'photo' | 'shoutout'
}

export function PostRowActions({ postId, pinned, content, scope, postType }: PostRowActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function handleTogglePin() {
    setErr(null)
    startTransition(async () => {
      const res = await togglePostPinned(postId)
      if (!res.ok) setErr(res.error ?? 'Failed to update')
      else router.refresh()
    })
  }

  function handleDelete() {
    setErr(null)
    startTransition(async () => {
      const res = await deletePost(postId)
      if (!res.ok) setErr(res.error ?? 'Failed to delete')
      else {
        setConfirmDelete(false)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/portal/admin/newsfeed/${postId}`}
        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium hover:bg-[var(--color-muted)]"
        style={{ color: 'var(--color-muted-foreground)' }}
        aria-label="View post detail"
      >
        <MessageSquare size={14} /> Details
      </Link>
      <button
        type="button"
        onClick={handleTogglePin}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium hover:bg-[var(--color-muted)] disabled:opacity-50"
        style={{ color: 'var(--color-muted-foreground)' }}
        aria-label={pinned ? 'Unpin post' : 'Pin post'}
      >
        {pinned ? <PinOff size={14} /> : <Pin size={14} />}
        {pinned ? 'Unpin' : 'Pin'}
      </button>
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium hover:bg-[var(--color-muted)] disabled:opacity-50"
        style={{ color: 'var(--color-muted-foreground)' }}
        aria-label="Edit post"
      >
        <Pencil size={14} /> Edit
      </button>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium hover:bg-[var(--color-muted)] disabled:opacity-50"
        style={{ color: 'var(--color-destructive)' }}
        aria-label="Delete post"
      >
        <Trash2 size={14} /> Delete
      </button>

      {err && <span className="ml-2 text-xs text-[var(--color-destructive)]">{err}</span>}

      {editOpen && (
        <EditPostDialog
          postId={postId}
          initialContent={content}
          initialScope={scope}
          initialPostType={postType}
          onClose={() => setEditOpen(false)}
          onDone={() => {
            setEditOpen(false)
            router.refresh()
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => (pending ? null : setConfirmDelete(false))}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-md rounded-[var(--radius,0.75rem)] bg-[var(--color-card)] border border-[var(--color-border)] p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">Delete post?</h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              This permanently removes the post. Comments and reactions will be deleted too.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={pending}
                disabled={pending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface EditPostDialogProps {
  postId: string
  initialContent: string
  initialScope: 'school_wide' | 'classroom'
  initialPostType: 'announcement' | 'reminder' | 'photo' | 'shoutout'
  onClose: () => void
  onDone: () => void
}

function EditPostDialog({
  postId,
  initialContent,
  initialScope,
  initialPostType,
  onClose,
  onDone,
}: EditPostDialogProps) {
  const [content, setContent] = useState(initialContent)
  const [scope, setScope] = useState(initialScope)
  const [postType, setPostType] = useState(initialPostType)
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    startTransition(async () => {
      const res = await updatePost(postId, {
        content: content.trim(),
        scope,
        post_type: postType,
      })
      if (!res.ok) setErr(res.error ?? 'Failed to update')
      else onDone()
    })
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
        className="relative w-full max-w-lg rounded-[var(--radius,0.75rem)] bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Edit Post"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Edit Post</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-[var(--color-muted)] flex h-10 w-10 items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-4">
            <div>
              <label
                htmlFor="edit-post-content"
                className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
              >
                Content *
              </label>
              <textarea
                id="edit-post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                required
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-post-type"
                  className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
                >
                  Type
                </label>
                <select
                  id="edit-post-type"
                  value={postType}
                  onChange={(e) => setPostType(e.target.value as typeof postType)}
                  className={selectClass}
                >
                  <option value="announcement">Announcement</option>
                  <option value="reminder">Reminder</option>
                  <option value="photo">Photo</option>
                  <option value="shoutout">Shoutout</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="edit-post-scope"
                  className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
                >
                  Audience
                </label>
                <select
                  id="edit-post-scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as typeof scope)}
                  className={selectClass}
                >
                  <option value="school_wide">School-wide</option>
                  <option value="classroom">Classroom</option>
                </select>
              </div>
            </div>
            {err && <p className="text-sm text-[var(--color-destructive)]">{err}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--color-border)] p-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={pending} disabled={!content.trim()}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
