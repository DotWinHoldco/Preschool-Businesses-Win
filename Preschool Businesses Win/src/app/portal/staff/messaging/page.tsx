// @anchor: cca.messaging.staff
// Staff messaging page.

import { ConversationList } from '@/components/portal/messaging/conversation-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default async function StaffMessagingPage() {
  // TODO: Fetch staff conversations from Supabase
  const conversations = [
    { id: '1', type: 'direct' as const, title: 'Sarah Martinez (Parent)', lastMessage: 'Sophia had a great day!', lastMessageAt: '2026-04-08T15:30:00Z', unreadCount: 1 },
    { id: '2', type: 'classroom' as const, title: 'Butterfly Room Parents', lastMessage: 'Pajama day is Friday!', lastMessageAt: '2026-04-08T10:00:00Z', unreadCount: 0 },
    { id: '3', type: 'staff_only' as const, title: 'Staff Chat', lastMessage: 'Supplies order placed', lastMessageAt: '2026-04-07T14:00:00Z', unreadCount: 2 },
  ]

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
