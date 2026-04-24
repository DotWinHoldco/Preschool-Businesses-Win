'use server'

// @anchor: cca.messaging.send
// Send a message in an existing conversation.

import { assertRole } from '@/lib/auth/session'
import { createTenantServerClient } from '@/lib/supabase/server'
import { SendMessageSchema } from '@/lib/schemas/messaging'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

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
    await assertRole('aide')
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
    const senderId = await getActorId()

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

    const actorId = await getActorId()
    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'messaging.send',
      entityType: 'message',
      entityId: message.id,
      after: {
        conversation_id: parsed.data.conversation_id,
        message_type: parsed.data.message_type,
        urgent: parsed.data.urgent,
      },
    })

    // TODO: Trigger push notification for urgent messages
    // if (parsed.data.urgent) {
    //   await sendNotification({ ... })
    // }

    return { ok: true, message_id: message.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
