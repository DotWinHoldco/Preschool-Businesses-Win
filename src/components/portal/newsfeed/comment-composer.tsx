'use client'

// @anchor: cca.newsfeed.comment-composer
// Client composer for posting a new comment on a newsfeed post.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { addComment } from '@/lib/actions/newsfeed/comments'

export function CommentComposer({ postId }: { postId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setErr(null)
    startTransition(async () => {
      const res = await addComment(postId, body.trim())
      if (res.ok) {
        setBody('')
        router.refresh()
      } else {
        setErr(res.error ?? 'Failed to post comment')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 border-t pt-4"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <label
        htmlFor="comment-body"
        className="block text-sm font-medium"
        style={{ color: 'var(--color-foreground)' }}
      >
        Add a comment
      </label>
      <textarea
        id="comment-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Write a comment..."
        className="w-full rounded-[var(--radius,0.75rem)] border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-offset-1"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-foreground)',
        }}
      />
      {err && (
        <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
          {err}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending} disabled={!body.trim() || pending}>
          Post comment
        </Button>
      </div>
    </form>
  )
}
