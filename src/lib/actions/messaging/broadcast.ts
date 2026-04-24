'use server'

// @anchor: cca.messaging.broadcast
// Broadcast a message to an audience (all parents, classroom parents, staff).
// Writes to: broadcasts, conversations, messages, notifications, audit_log.

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  BroadcastMessageSchema,
  SendBroadcastSchema,
  type SendBroadcastInput,
} from '@/lib/schemas/messaging'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type BroadcastState = {
  ok: boolean
  error?: string
  id?: string
  conversation_id?: string
  recipients_count?: number
}

// ---------------------------------------------------------------------------
// sendBroadcast — new admin messaging broadcast action
// ---------------------------------------------------------------------------

export async function sendBroadcast(input: SendBroadcastInput): Promise<BroadcastState> {
  try {
    await assertRole('admin')

    const parsed = SendBroadcastSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { audience, classroom_id, subject, body, channels } = parsed.data
    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    // ---- Resolve recipients ------------------------------------------------
    let recipientIds: string[] = []

    if (audience === 'classroom' && classroom_id) {
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

        const familyIds = [...new Set((familyLinks ?? []).map((fl) => fl.family_id))]
        if (familyIds.length > 0) {
          const { data: members } = await supabase
            .from('family_members')
            .select('user_id, is_primary_contact')
            .in('family_id', familyIds)

          recipientIds = [
            ...new Set(
              (members ?? [])
                .filter((m) => m.is_primary_contact !== false)
                .map((m) => m.user_id)
                .filter(Boolean) as string[],
            ),
          ]
        }
      }
    } else if (audience === 'all_staff') {
      const { data: memberships } = await supabase
        .from('user_tenant_memberships')
        .select('user_id, role, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .in('role', [
          'owner',
          'admin',
          'director',
          'lead_teacher',
          'assistant_teacher',
          'aide',
          'front_desk',
        ])

      recipientIds = [
        ...new Set((memberships ?? []).map((m) => m.user_id).filter(Boolean) as string[]),
      ]
    } else if (audience === 'all_parents') {
      // Primary guardians across all families in tenant
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id, is_primary_contact')
        .eq('tenant_id', tenantId)

      recipientIds = [
        ...new Set(
          (members ?? [])
            .filter((m) => m.is_primary_contact !== false)
            .map((m) => m.user_id)
            .filter(Boolean) as string[],
        ),
      ]
    }

    // ---- Insert broadcast row ---------------------------------------------
    const { data: broadcast, error: bErr } = await supabase
      .from('broadcasts')
      .insert({
        tenant_id: tenantId,
        sender_id: actorId,
        audience,
        classroom_id: audience === 'classroom' ? classroom_id : null,
        subject: subject ?? null,
        body,
        channels,
        recipient_count: recipientIds.length,
      })
      .select('id')
      .single()

    if (bErr || !broadcast) {
      return { ok: false, error: bErr?.message ?? 'Failed to create broadcast' }
    }

    // ---- Create broadcast conversation + system message --------------------
    const title =
      subject?.trim() ||
      (audience === 'classroom'
        ? 'Classroom broadcast'
        : audience === 'all_staff'
          ? 'Staff broadcast'
          : 'School broadcast')

    const { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .insert({
        tenant_id: tenantId,
        type: 'broadcast',
        classroom_id: audience === 'classroom' ? classroom_id : null,
        title,
        created_by: actorId,
      })
      .select('id')
      .single()

    if (convErr || !conversation) {
      return { ok: false, error: convErr?.message ?? 'Failed to create conversation' }
    }

    // Add sender + recipients to conversation_members (best-effort)
    if (recipientIds.length > 0) {
      const memberRows = [
        {
          tenant_id: tenantId,
          conversation_id: conversation.id,
          user_id: actorId,
          role: 'admin' as const,
        },
        ...recipientIds.map((uid) => ({
          tenant_id: tenantId,
          conversation_id: conversation.id,
          user_id: uid,
          role: 'recipient' as const,
        })),
      ]
      await supabase.from('conversation_members').insert(memberRows)
    }

    // System message containing the broadcast body
    await supabase.from('messages').insert({
      tenant_id: tenantId,
      conversation_id: conversation.id,
      sender_id: actorId,
      body,
      message_type: 'system',
    })

    // ---- Notifications row per recipient ----------------------------------
    if (recipientIds.length > 0) {
      const notifTitle = subject?.trim() || title
      const notifRows = recipientIds.map((uid) => ({
        tenant_id: tenantId,
        user_id: uid,
        title: notifTitle,
        body,
        template: 'messaging.broadcast',
        urgency: 'normal',
        data: {
          broadcast_id: broadcast.id,
          conversation_id: conversation.id,
          audience,
          classroom_id: classroom_id ?? null,
        },
        read: false,
      }))

      // Chunk inserts to avoid payload limits
      const CHUNK = 500
      for (let i = 0; i < notifRows.length; i += CHUNK) {
        await supabase.from('notifications').insert(notifRows.slice(i, i + CHUNK))
      }
    }

    // ---- Audit ------------------------------------------------------------
    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'messaging.broadcast.sent',
      entityType: 'broadcast',
      entityId: broadcast.id,
      after: {
        audience,
        classroom_id: classroom_id ?? null,
        subject: subject ?? null,
        channels,
        recipients_count: recipientIds.length,
        conversation_id: conversation.id,
      },
    })

    revalidatePath('/portal/admin/messaging')

    return {
      ok: true,
      id: broadcast.id,
      conversation_id: conversation.id,
      recipients_count: recipientIds.length,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

// ---------------------------------------------------------------------------
// Legacy broadcastMessage — retained for existing form-action callers.
// ---------------------------------------------------------------------------

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
    const audience =
      scope === 'classroom' ? 'classroom' : scope === 'staff' ? 'all_staff' : 'all_parents'

    const result = await sendBroadcast({
      audience,
      classroom_id: audience === 'classroom' ? (classroom_id ?? null) : null,
      subject: title,
      body,
      channels: urgent ? ['in_app', 'push'] : ['in_app'],
    })

    return result
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
