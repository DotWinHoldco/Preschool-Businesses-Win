// @anchor: cca.messaging.cron-logic
// Cron: process and send scheduled messages.

import { createAdminClient } from '@/lib/supabase/admin'

interface ScheduledMessagesSummary {
  processed: number
  sent: number
  failed: number
}

export async function runScheduledMessagesForAllTenants(): Promise<ScheduledMessagesSummary> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const summary: ScheduledMessagesSummary = {
    processed: 0,
    sent: 0,
    failed: 0,
  }

  // ── 1. Fetch due scheduled messages ──
  const { data: schedules, error: fetchErr } = await supabase
    .from('message_schedules')
    .select('id, conversation_id, message_body, created_by, tenant_id')
    .lte('scheduled_for', now)
    .eq('status', 'scheduled')
    .order('scheduled_for', { ascending: true })
    .limit(50)

  if (fetchErr) {
    return summary
  }

  if (!schedules || schedules.length === 0) {
    return summary
  }

  // ── 2. Process each scheduled message ──
  for (const schedule of schedules) {
    summary.processed++

    try {
      // ── 2a. Immediately mark as 'sending' to prevent double-processing ──
      const { error: lockErr } = await supabase
        .from('message_schedules')
        .update({ status: 'sending' })
        .eq('id', schedule.id)
        .eq('status', 'scheduled') // Optimistic lock: only update if still 'scheduled'

      if (lockErr) {
        summary.failed++
        continue
      }

      // ── 2b. Insert into messages table ──
      const { error: insertErr } = await supabase.from('messages').insert({
        conversation_id: schedule.conversation_id,
        body: schedule.message_body,
        sender_id: schedule.created_by,
        message_type: 'text',
        tenant_id: schedule.tenant_id,
      })

      if (insertErr) {
        // ── 2d. Mark as failed ──
        await supabase.from('message_schedules').update({ status: 'failed' }).eq('id', schedule.id)

        summary.failed++
      } else {
        // ── 2c. Mark as sent ──
        await supabase
          .from('message_schedules')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', schedule.id)

        summary.sent++
      }
    } catch {
      // Best-effort mark as failed
      await supabase.from('message_schedules').update({ status: 'failed' }).eq('id', schedule.id)

      summary.failed++
    }
  }

  return summary
}
