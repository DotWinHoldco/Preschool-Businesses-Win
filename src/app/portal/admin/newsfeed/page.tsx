// @anchor: cca.newsfeed.admin-page
// Admin newsfeed — manage school-wide and classroom announcements, posts, and activity stream.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { parsePagination } from '@/lib/pagination'
import { Newspaper, Heart, MessageSquare, Pin } from 'lucide-react'
import { ComposePostButton } from '@/components/portal/newsfeed/compose-post'
import { PostRowActions } from '@/components/portal/newsfeed/post-row-actions'

export default async function AdminNewsfeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const { page, perPage, offset } = parsePagination(await searchParams)
  const supabase = await createTenantAdminClient(tenantId)

  // Fetch posts (paginated)
  const { data: dbPosts, count } = await supabase
    .from('newsfeed_posts')
    .select('*', { count: 'exact', head: false })
    .eq('tenant_id', tenantId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  const posts = dbPosts ?? []

  // Fetch author names from user_profiles
  const authorIds = [...new Set(posts.map((p) => p.author_id).filter(Boolean))]
  const authorMap: Record<string, string> = {}

  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', authorIds)

    for (const profile of profiles ?? []) {
      authorMap[profile.id] = profile.full_name ?? 'Unknown'
    }
  }

  // Fetch reaction counts per post
  const reactionCountMap: Record<string, number> = {}
  const postIds = posts.map((p) => p.id)

  if (postIds.length > 0) {
    const { data: reactions } = await supabase
      .from('newsfeed_reactions')
      .select('post_id')
      .in('post_id', postIds)

    for (const r of reactions ?? []) {
      reactionCountMap[r.post_id] = (reactionCountMap[r.post_id] ?? 0) + 1
    }
  }

  // Compute real stats for this month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count: postsThisMonth } = await supabase
    .from('newsfeed_posts')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', startOfMonth)

  const { count: reactionsThisMonth } = await supabase
    .from('newsfeed_reactions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfMonth)

  // Map scope values for display
  function scopeLabel(scope: string, classroomId: string | null): string {
    if (scope === 'school_wide') return 'School-wide'
    if (scope === 'classroom') return classroomId ? `Classroom` : 'Classroom'
    return scope
  }

  // Comment counts per post (for badges on the list)
  const commentCountMap: Record<string, number> = {}
  if (postIds.length > 0) {
    const { data: comments } = await supabase
      .from('newsfeed_comments')
      .select('post_id, deleted_at')
      .in('post_id', postIds)

    for (const c of comments ?? []) {
      if (c.deleted_at) continue
      commentCountMap[c.post_id] = (commentCountMap[c.post_id] ?? 0) + 1
    }
  }

  // Comments this month (for the stat card)
  const { count: commentsThisMonth } = await supabase
    .from('newsfeed_comments')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .gte('created_at', startOfMonth)

  // Map DB rows to display shape
  const recentPosts = posts.map((post) => ({
    id: post.id,
    author: authorMap[post.author_id] ?? 'Unknown',
    scope: scopeLabel(post.scope, post.classroom_id),
    rawScope: (post.scope as 'school_wide' | 'classroom') ?? 'school_wide',
    type: post.post_type as string,
    rawType:
      (post.post_type as 'announcement' | 'reminder' | 'photo' | 'shoutout') ?? 'announcement',
    content: post.content ?? '',
    reactions: reactionCountMap[post.id] ?? 0,
    comments: commentCountMap[post.id] ?? 0,
    pinned: post.pinned ?? false,
    createdAt: post.created_at,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Newsfeed
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Manage school-wide and classroom announcements. Parents see posts for their child&apos;s
            classroom.
          </p>
        </div>
        <ComposePostButton />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
              }}
            >
              <Newspaper size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                {postsThisMonth ?? 0}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                Posts This Month
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: 'var(--color-accent, var(--color-primary))',
                color: 'var(--color-primary-foreground)',
              }}
            >
              <Heart size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                {reactionsThisMonth ?? 0}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                Reactions This Month
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: 'var(--color-secondary, var(--color-primary))',
                color: 'var(--color-primary-foreground)',
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                {commentsThisMonth ?? 0}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                Comments This Month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>All school-wide and classroom posts, newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                No posts yet.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {recentPosts.map((post) => (
                <div key={post.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-medium text-sm"
                          style={{ color: 'var(--color-foreground)' }}
                        >
                          {post.author}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          &middot; {post.scope}
                        </span>
                        {post.pinned && <Pin size={12} style={{ color: 'var(--color-primary)' }} />}
                      </div>
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-foreground)' }}>
                        {post.content}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          <Heart size={12} /> {post.reactions}
                        </span>
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          <MessageSquare size={12} /> {post.comments}
                        </span>
                      </div>
                    </div>
                    <span
                      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                      style={{
                        backgroundColor: 'var(--color-muted)',
                        color: 'var(--color-muted-foreground)',
                      }}
                    >
                      {post.type}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <PostRowActions
                      postId={post.id}
                      pinned={post.pinned}
                      content={post.content}
                      scope={post.rawScope}
                      postType={post.rawType}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        page={page}
        perPage={perPage}
        total={count ?? 0}
        basePath="/portal/admin/newsfeed"
      />
    </div>
  )
}
