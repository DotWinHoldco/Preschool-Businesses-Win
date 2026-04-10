// @anchor: cca.newsfeed.admin-page
// Admin newsfeed — manage school-wide and classroom announcements, posts, and activity stream.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Newspaper, Heart, MessageSquare, Pin } from 'lucide-react'

export default function AdminNewsfeedPage() {
  // TODO: Fetch newsfeed posts from Supabase
  const recentPosts = [
    {
      id: '1',
      author: 'Mrs. Johnson',
      scope: 'Butterfly Room',
      type: 'announcement',
      content: 'Pajama Day is this Friday! Students can wear their favorite pajamas to school.',
      reactions: 12,
      comments: 3,
      pinned: true,
      createdAt: '2026-04-08T09:00:00Z',
    },
    {
      id: '2',
      author: 'Admin',
      scope: 'School-wide',
      type: 'reminder',
      content: 'Spring Break is April 14-18. School will be closed. Normal schedule resumes April 21.',
      reactions: 24,
      comments: 1,
      pinned: true,
      createdAt: '2026-04-07T15:00:00Z',
    },
    {
      id: '3',
      author: 'Ms. Davis',
      scope: 'Sunshine Room',
      type: 'photo',
      content: 'What an amazing art project today! The kids made spring flowers using tissue paper and watercolors.',
      reactions: 18,
      comments: 5,
      pinned: false,
      createdAt: '2026-04-07T14:30:00Z',
    },
    {
      id: '4',
      author: 'Admin',
      scope: 'School-wide',
      type: 'shoutout',
      content: 'Big shoutout to the Johnson family for donating new books to our classroom library!',
      reactions: 31,
      comments: 8,
      pinned: false,
      createdAt: '2026-04-06T10:00:00Z',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Newsfeed
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Manage school-wide and classroom announcements. Parents see posts for their child&apos;s classroom.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              <Newspaper size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>24</p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Posts This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--color-accent, var(--color-primary))', color: 'var(--color-primary-foreground)' }}
            >
              <Heart size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>156</p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Reactions This Month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--color-secondary, var(--color-primary))', color: 'var(--color-primary-foreground)' }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>38</p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Comments This Month</p>
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
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {recentPosts.map((post) => (
              <div key={post.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                        {post.author}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        &middot; {post.scope}
                      </span>
                      {post.pinned && (
                        <Pin size={12} style={{ color: 'var(--color-primary)' }} />
                      )}
                    </div>
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-foreground)' }}>
                      {post.content}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        <Heart size={12} /> {post.reactions}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        <MessageSquare size={12} /> {post.comments}
                      </span>
                    </div>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                    style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
                  >
                    {post.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
