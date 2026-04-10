'use server'

// @anchor: cca.messaging.send
// Send a message in an existing conversation.

import { createTenantServerClient } from '@/lib/supabase/server'
import { SendMessageSchema } from '@/lib/schemas/messaging'
import { getTenantId } from '@/lib/actions/get-tenant-id'

export type SendMessageState = {
  ok: boolean
  error?: string
  message_id?: string
}

export async function sendMessage(
  _prev: SendMessageState,
  formData: FormData,
): Promise<SendMessageState> {
  try {
    const raw = Object.fromEntries(formData.entries())
    const parsed = SendMessageSchema.safeParse({
      ...raw,
      urgent: raw.urgent === 'true',
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const tenantId = await getTenantId()
    const supabase = await createTenantServerClient()

    // Verify user is a member of the conversation
    // TODO: Get real user ID from session
    const senderId = raw.sender_id as string

    if (!senderId) {
      return { ok: false, error: 'Sender ID is required' }
    }

    const { data: membership } = await supabase
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', parsed.data.conversation_id)
      .eq('user_id', senderId)
      .single()

    if (!membership) {
      return { ok: false, error: 'Not a member of this conversation' }
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        tenant_id: tenantId,
        conversation_id: parsed.data.conversation_id,
        sender_id: senderId,
        body: parsed.data.body,
        message_type: parsed.data.message_type,
        file_path: parsed.data.file_path ?? null,
        urgent: parsed.data.urgent,
      })
      .select('id')
      .single()

    if (error || !message) {
      return { ok: false, error: error?.message ?? 'Failed to send message' }
    }

    // TODO: Trigger push notification for urgent messages
    // if (parsed.data.urgent) {
    //   await sendNotification({ ... })
    // }

    return { ok: true, message_id: message.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
