// @anchor: cca.messaging.admin
// Admin messaging center with broadcast capability.

import { ConversationList } from '@/components/portal/messaging/conversation-list'
import { BroadcastComposer } from '@/components/portal/messaging/broadcast-composer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminMessagingPage() {
  // TODO: Fetch conversations and classrooms from Supabase
  const conversations = [
    { id: '1', type: 'direct' as const, title: 'Sarah Martinez (Parent)', lastMessage: 'Thank you for the update!', lastMessageAt: '2026-04-08T14:30:00Z', unreadCount: 0 },
    { id: '2', type: 'classroom' as const, title: 'Butterfly Room Parents', lastMessage: 'Pajama day is Friday!', lastMessageAt: '2026-04-08T10:00:00Z', unreadCount: 3 },
    { id: '3', type: 'broadcast' as const, title: 'Spring Break Reminder', lastMessage: 'School will be closed April 14-18', lastMessageAt: '2026-04-07T16:00:00Z', unreadCount: 0 },
    { id: '4', type: 'staff_only' as const, title: 'Staff Meeting Notes', lastMessage: 'Updated ratios for next week', lastMessageAt: '2026-04-07T15:00:00Z', unreadCount: 1 },
  ]

  const classrooms = [
    { id: 'c1', name: 'Butterfly Room' },
    { id: 'c2', name: 'Sunshine Room' },
    { id: 'c3', name: 'Rainbow Room' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Messaging</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ConversationList conversations={conversations} />
            </CardContent>
          </Card>
        </div>

        {/* Broadcast composer */}
        <div className="lg:col-span-2">
          <BroadcastComposer
            classrooms={classrooms}
            senderId="admin-1"
          />
        </div>
      </div>
    </div>
  )
}
