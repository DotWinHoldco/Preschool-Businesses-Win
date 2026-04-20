// @anchor: cca.messaging.parent
// Parent messaging page.
// Real Supabase queries replace placeholder data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ConversationList } from '@/components/portal/messaging/conversation-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default async function ParentMessagingPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Get conversations where this user is a member
  const { data: memberRows } = await supabase
    .from('conversation_members')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)

  const conversationIds = (memberRows ?? []).map(m => m.conversation_id)
  const lastReadMap = new Map((memberRows ?? []).map(m => [m.conversation_id, m.last_read_at]))

  // Fetch conversation details
  const { data: conversationsRaw } = conversationIds.length > 0
    ? await supabase
        .from('conversations')
        .select('id, type, title, updated_at')
        .in('id', conversationIds)
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
    : { data: [] }

  // Get latest message per conversation
  const conversations: {
    id: string
    type: 'direct' | 'classroom' | 'broadcast' | 'staff_only'
    title: string
    lastMessage?: string
    lastMessageAt?: string
    unreadCount: number
  }[] = []

  for (const conv of conversationsRaw ?? []) {
    const { data: latestMessages } = await supabase
      .from('messages')
      .select('body, created_at')
      .eq('conversation_id', conv.id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)

    const latestMsg = (latestMessages ?? [])[0]
    const lastReadAt = lastReadMap.get(conv.id)

    // Count unread messages
    let unreadCount = 0
    if (lastReadAt) {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .gt('created_at', lastReadAt)
        .neq('sender_id', userId)
      unreadCount = count ?? 0
    } else if (latestMsg) {
      // No last_read_at means all messages are unread
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .neq('sender_id', userId)
      unreadCount = count ?? 0
    }

    conversations.push({
      id: conv.id,
      type: conv.type as 'direct' | 'classroom' | 'broadcast' | 'staff_only',
      title: conv.title ?? 'Conversation',
      lastMessage: latestMsg?.body,
      lastMessageAt: latestMsg?.created_at,
      unreadCount,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Messages</h1>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2 text-sm font-semibold min-h-[44px] hover:brightness-110 transition-all"
        >
          <MessageSquare size={16} />
          New Message
        </button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ConversationList conversations={conversations} />
        </CardContent>
      </Card>

      <p className="text-xs text-[var(--color-muted-foreground)] text-center">
        Contact your child&apos;s teacher or school administration directly.
        For privacy, parent-to-parent messaging is not available.
      </p>
    </div>
  )
}
