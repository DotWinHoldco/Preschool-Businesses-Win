// @anchor: cca.messaging.staff
// Staff messaging page — real Supabase data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ConversationList } from '@/components/portal/messaging/conversation-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default async function StaffMessagingPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Try to find conversations the staff member participates in.
  // First attempt: conversation_participants table
  const { data: participantRows, error: participantError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId)

  let conversations: Array<{
    id: string
    type: 'direct' | 'classroom' | 'broadcast' | 'staff_only'
    title: string
    lastMessage?: string
    lastMessageAt?: string
    unreadCount: number
  }> = []

  if (!participantError && participantRows && participantRows.length > 0) {
    // We have participant tracking — use it
    const conversationIds = participantRows.map((p: Record<string, unknown>) => p.conversation_id as string)

    const { data: convRows } = await supabase
      .from('conversations')
      .select('id, type, title')
      .eq('tenant_id', tenantId)
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    conversations = await Promise.all(
      (convRows ?? []).map(async (conv: Record<string, unknown>) => {
        // Get latest message for this conversation
        const { data: latestMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', conv.id as string)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          id: conv.id as string,
          type: (conv.type as 'direct' | 'classroom' | 'broadcast' | 'staff_only') ?? 'direct',
          title: (conv.title as string) ?? 'Conversation',
          lastMessage: latestMsg?.content as string | undefined,
          lastMessageAt: latestMsg?.created_at as string | undefined,
          unreadCount: 0,
        }
      }),
    )
  } else {
    // Fallback: show all tenant conversations of type staff_only or direct
    const { data: convRows } = await supabase
      .from('conversations')
      .select('id, type, title')
      .eq('tenant_id', tenantId)
      .in('type', ['staff_only', 'direct'])
      .order('updated_at', { ascending: false })
      .limit(20)

    conversations = await Promise.all(
      (convRows ?? []).map(async (conv: Record<string, unknown>) => {
        const { data: latestMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', conv.id as string)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          id: conv.id as string,
          type: (conv.type as 'direct' | 'classroom' | 'broadcast' | 'staff_only') ?? 'direct',
          title: (conv.title as string) ?? 'Conversation',
          lastMessage: latestMsg?.content as string | undefined,
          lastMessageAt: latestMsg?.created_at as string | undefined,
          unreadCount: 0,
        }
      }),
    )
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
    </div>
  )
}
