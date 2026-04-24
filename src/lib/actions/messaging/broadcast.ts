'use server'

// @anchor: cca.messaging.broadcast
// Send a broadcast message to a classroom or the entire school.

import { assertRole } from '@/lib/auth/session'
import { createTenantServerClient } from '@/lib/supabase/server'
import { BroadcastMessageSchema } from '@/lib/schemas/messaging'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type BroadcastState = {
  ok: boolean
  error?: string
  conversation_id?: string
  recipients_count?: number
}

export async function broadcastMessage(
  _prev: BroadcastState,
  formData: FormData,
): Promise<BroadcastState> {
  try {
    await assertRole('admin')
    const raw = Object.fromEntries(formData.entries())
    const parsed = BroadcastMessageSchema.safeParse({
      ...raw,
      urgent: raw.urgent === 'true',
    })

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { scope, classroom_id, title, body, urgent } = parsed.data
    const tenantId = await getTenantId()
    const supabase = await createTenantServerClient()

    const senderId = await getActorId()

    // Create broadcast conversation
    const { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .insert({
        tenant_id: tenantId,
        type: 'broadcast',
        classroom_id: scope === 'classroom' ? classroom_id : null,
        title,
        created_by: senderId,
      })
      .select('id')
      .single()

    if (convErr || !conversation) {
      return { ok: false, error: convErr?.message ?? 'Failed to create broadcast' }
    }

    // Determine recipients based on scope
    let recipientIds: string[] = []

    if (scope === 'classroom' && classroom_id) {
      // Get all parents of students in this classroom
      const { data: assignments } = await supabase
        .from('student_classroom_assignments')
        .select('student_id')
        .eq('classroom_id', classroom_id)

      if (assignments && assignments.length > 0) {
        const studentIds = assignments.map((a) => a.student_id)
        const { data: familyLinks } = await supabase
          .from('student_family_links')
          .select('family_id')
          .in('student_id', studentIds)

        if (familyLinks && familyLinks.length > 0) {
          const familyIds = [...new Set(familyLinks.map((fl) => fl.family_id))]
          const { data: members } = await supabase
            .from('family_members')
            .select('user_id')
            .in('family_id', familyIds)

          recipientIds = [...new Set((members ?? []).map((m) => m.user_id))]
        }
      }
    } else if (scope === 'staff') {
      // Get all staff members
      const { data: staff } = await supabase.from('staff_profiles').select('user_id')

      recipientIds = (staff ?? []).map((s) => s.user_id)
    } else {
      // School-wide: get all family members
      const { data: members } = await supabase.from('family_members').select('user_id')

      recipientIds = [...new Set((members ?? []).map((m) => m.user_id))]
    }

    // Add sender + recipients as conversation members
    const memberRows = [
      {
        tenant_id: tenantId,
        conversation_id: conversation.id,
        user_id: senderId,
        role: 'admin' as const,
      },
      ...recipientIds.map((uid) => ({
        tenant_id: tenantId,
        conversation_id: conversation.id,
        user_id: uid,
        role: 'recipient' as const,
      })),
    ]

    if (memberRows.length > 0) {
      await supabase.from('conversation_members').insert(memberRows)
    }

    // Send the broadcast message
    const { error: msgErr } = await supabase.from('messages').insert({
      tenant_id: tenantId,
      conversation_id: conversation.id,
      sender_id: senderId,
      body,
      message_type: 'text',
      urgent,
    })

    if (msgErr) {
      return { ok: false, error: msgErr.message }
    }

    const actorId = await getActorId()
    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'messaging.broadcast',
      entityType: 'conversation',
      entityId: conversation.id,
      after: {
        scope,
        classroom_id: classroom_id ?? null,
        title,
        urgent,
        recipients_count: recipientIds.length,
      },
    })

    // TODO: Trigger notifications for all recipients
    // For urgent broadcasts, bypass quiet hours

    return { ok: true, conversation_id: conversation.id, recipients_count: recipientIds.length }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
