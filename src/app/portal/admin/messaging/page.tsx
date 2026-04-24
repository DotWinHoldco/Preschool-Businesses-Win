// @anchor: cca.messaging.admin
// Admin messaging center with broadcast capability.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { MessagingPageClient } from './messaging-page-client'

export default async function AdminMessagingPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch conversations
  const { data: dbConversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })

  // Fetch the latest message per conversation
  const conversationIds = (dbConversations ?? []).map((c) => c.id)
  const latestMessages: Record<string, { body: string; created_at: string }> = {}

  if (conversationIds.length > 0) {
    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id, body, created_at')
      .eq('tenant_id', tenantId)
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    // Keep only the latest message per conversation
    for (const msg of messages ?? []) {
      if (!latestMessages[msg.conversation_id]) {
        latestMessages[msg.conversation_id] = {
          body: msg.body,
          created_at: msg.created_at,
        }
      }
    }
  }

  // Map to the shape the client component expects
  const conversations = (dbConversations ?? []).map((c) => ({
    id: c.id,
    type: c.type as 'direct' | 'classroom' | 'broadcast' | 'staff_only',
    title: c.title ?? 'Untitled Conversation',
    lastMessage: latestMessages[c.id]?.body,
    lastMessageAt: latestMessages[c.id]?.created_at ?? c.updated_at,
    unreadCount: 0, // TODO: compute unread count per user session
  }))

  // Fetch classrooms for broadcast targeting
  const { data: dbClassrooms } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name')

  const classrooms = (dbClassrooms ?? []).map((cr) => ({
    id: cr.id,
    name: cr.name,
  }))

  if (conversations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Messaging
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Send messages to parents, staff, and classrooms.
          </p>
        </div>
        <div
          className="flex flex-col items-center justify-center rounded-xl py-16"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
            No conversations yet.
          </p>
        </div>
      </div>
    )
  }

  return <MessagingPageClient conversations={conversations} classrooms={classrooms} />
}
