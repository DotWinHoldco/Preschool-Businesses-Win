'use server'

// @anchor: cca.crm.unsubscribe
import { createAdminClient } from '@/lib/supabase/admin'
import { emitEvent } from '@/lib/crm/events'

export async function unsubscribeViaToken(token: string): Promise<{ ok: boolean; error?: string }> {
  if (!token || token.length < 8) return { ok: false, error: 'invalid_token' }
  const supabase = createAdminClient()
  const { data: send } = await supabase
    .from('email_sends')
    .select('id, tenant_id, to_email, contact_id')
    .eq('unsubscribe_token', token)
    .maybeSingle()
  if (!send) return { ok: false, error: 'not_found' }

  const now = new Date().toISOString()
  const emailNorm = (send.to_email as string).toLowerCase()

  await supabase.from('email_sends').update({ unsubscribed_at: now }).eq('id', send.id)

  await supabase.from('email_suppressions').upsert(
    {
      tenant_id: send.tenant_id,
      email_normalized: emailNorm,
      reason: 'unsubscribed',
      source_send_id: send.id,
    },
    { onConflict: 'tenant_id,email_normalized' },
  )

  if (send.contact_id) {
    await supabase
      .from('contacts')
      .update({
        email_subscribed: false,
        email_unsubscribed_at: now,
        email_unsubscribe_reason: 'one_click_unsubscribe',
      })
      .eq('id', send.contact_id)
    await supabase.from('contact_activities').insert({
      tenant_id: send.tenant_id,
      contact_id: send.contact_id,
      activity_type: 'email_unsubscribed',
      title: 'Unsubscribed from emails',
      related_entity_type: 'email_send',
      related_entity_id: send.id,
    })
    await emitEvent({
      tenantId: send.tenant_id as string,
      contactId: send.contact_id as string,
      kind: 'email.unsubscribed',
      payload: { send_id: send.id, reason: 'one_click_unsubscribe' },
      source: 'unsubscribe_link',
    })
  }
  return { ok: true }
}
