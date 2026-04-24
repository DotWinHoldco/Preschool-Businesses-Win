// @anchor: cca.newsfeed.post-detail
// Admin post detail — body, reactions count, comments list, comment composer.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Heart, MessageSquare, Pin } from 'lucide-react'
import { CommentComposer } from '@/components/portal/newsfeed/comment-composer'
import { CommentItem } from '@/components/portal/newsfeed/comment-item'

interface NewsfeedPostDetailProps {
  params: Promise<{ postId: string }>
}

export default async function NewsfeedPostDetail({ params }: NewsfeedPostDetailProps) {
  const { postId } = await params
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: post } = await supabase
    .from('newsfeed_posts')
    .select('*')
    .eq('id', postId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!post) notFound()

  // Author
  let authorName = 'Unknown'
  if (post.author_id) {
    const { data: prof } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', post.author_id)
      .maybeSingle()
    authorName = prof?.full_name ?? 'Unknown'
  }

  // Reactions count
  const { count: reactionsCount } = await supabase
    .from('newsfeed_reactions')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)

  // Comments (non-deleted, ordered oldest-first for thread readability)
  const { data: commentRows } = await supabase
    .from('newsfeed_comments')
    .select('id, post_id, author_id, body, parent_comment_id, created_at, deleted_at')
    .eq('tenant_id', tenantId)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  const comments = commentRows ?? []

  // Author lookup for comments
  const commentAuthorIds = [...new Set(comments.map((c) => c.author_id).filter(Boolean))]
  const commentAuthorMap: Record<string, string> = {}
  if (commentAuthorIds.length > 0) {
    const { data: profs } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', commentAuthorIds)
    for (const p of profs ?? []) {
      commentAuthorMap[p.id] = p.full_name ?? 'Unknown'
    }
  }

  const scopeLabel =
    post.scope === 'school_wide'
      ? 'School-wide'
      : post.scope === 'classroom'
        ? 'Classroom'
        : post.scope

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal/admin/newsfeed"
          className="inline-flex items-center gap-1 text-sm font-medium"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          <ArrowLeft size={14} /> Back to newsfeed
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{authorName}</CardTitle>
            <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              &middot; {scopeLabel}
            </span>
            {post.pinned && <Pin size={14} style={{ color: 'var(--color-primary)' }} />}
            <span
              className="ml-auto inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              style={{
                backgroundColor: 'var(--color-muted)',
                color: 'var(--color-muted-foreground)',
              }}
            >
              {post.post_type}
            </span>
          </div>
          <CardDescription>{new Date(post.created_at).toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--color-foreground)' }}>
            {post.content ?? ''}
          </p>
          <div
            className="flex items-center gap-4 border-t pt-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <Heart size={14} /> {reactionsCount ?? 0} reactions
            </span>
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              <MessageSquare size={14} /> {comments.filter((c) => !c.deleted_at).length} comments
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comments</CardTitle>
          <CardDescription>
            Staff comments are visible to everyone who can see the post.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              No comments yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  id={c.id}
                  author={commentAuthorMap[c.author_id] ?? 'Unknown'}
                  body={c.body}
                  createdAt={c.created_at}
                  deleted={!!c.deleted_at}
                />
              ))}
            </ul>
          )}

          <CommentComposer postId={postId} />
        </CardContent>
      </Card>
    </div>
  )
}
