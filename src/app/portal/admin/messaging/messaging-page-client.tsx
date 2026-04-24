'use client'

// @anchor: cca.messaging.admin-client
import { useState } from 'react'
import { ConversationList } from '@/components/portal/messaging/conversation-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Megaphone, Send, MessageSquare, ArrowLeft } from 'lucide-react'

interface Conversation {
  id: string
  type: 'direct' | 'classroom' | 'broadcast' | 'staff_only'
  title: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
}

interface Classroom {
  id: string
  name: string
}

const AUDIENCE_OPTIONS = [
  { value: 'all_parents', label: 'All Parents', count: 48 },
  { value: 'classroom', label: 'Classroom', count: 16 },
  { value: 'staff', label: 'Staff', count: 12 },
] as const

interface MessagingPageClientProps {
  conversations: Conversation[]
  classrooms: Classroom[]
}

export function MessagingPageClient({ conversations }: MessagingPageClientProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [sentToast, setSentToast] = useState<string | null>(null)

  // Broadcast form state
  const [audience, setAudience] = useState('all_parents')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const selectedConv = conversations.find((c) => c.id === selectedConversation)

  function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return

    const match = AUDIENCE_OPTIONS.find((a) => a.value === audience)
    const count = match?.count ?? 0
    const label = match?.label ?? audience

    setSentToast(`Broadcast sent to ${count} ${label.toLowerCase()} recipients`)
    setSubject('')
    setBody('')
    setBroadcastOpen(false)

    setTimeout(() => setSentToast(null), 4000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Success toast */}
      {sentToast && (
        <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-[var(--radius,0.75rem)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary)] shadow-lg motion-safe:animate-[fadeIn_200ms_ease-out]">
          <Send className="h-4 w-4" />
          {sentToast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Messaging</h1>
        <Button size="sm" onClick={() => setBroadcastOpen(true)}>
          <Megaphone className="h-4 w-4" /> Send Broadcast
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ConversationList
                conversations={conversations}
                activeId={selectedConversation ?? undefined}
                onSelect={(id) => setSelectedConversation(id)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Conversation detail / placeholder */}
        <div className="lg:col-span-2">
          {selectedConv ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)] transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  </button>
                  <CardTitle className="text-base">{selectedConv.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Show last message as a bubble */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-[var(--radius,0.75rem)] bg-[var(--color-muted)] px-4 py-2.5">
                      <p className="text-sm text-[var(--color-foreground)]">
                        {selectedConv.lastMessage}
                      </p>
                      <p className="mt-1 text-[10px] text-[var(--color-muted-foreground)]">
                        {selectedConv.lastMessageAt
                          ? new Date(selectedConv.lastMessageAt).toLocaleString()
                          : ''}
                      </p>
                    </div>
                  </div>

                  {/* Reply input */}
                  <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
                    <Input inputSize="sm" placeholder="Type a reply..." className="flex-1" />
                    <Button size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="h-12 w-12 text-[var(--color-muted-foreground)] mb-3" />
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Select a conversation to view messages
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogOverlay onClick={() => setBroadcastOpen(false)} />
        <DialogContent
          title="Send Broadcast"
          description="Compose a message to send to multiple recipients at once."
        >
          <DialogClose onClick={() => setBroadcastOpen(false)} />
          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
              >
                {AUDIENCE_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label} ({a.count} recipients)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Subject *
              </label>
              <Input
                inputSize="sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Broadcast subject line"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Message *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your broadcast message..."
                rows={4}
                required
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setBroadcastOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                <Send className="h-4 w-4" /> Send Broadcast
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
