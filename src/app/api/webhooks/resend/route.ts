// @anchor: cca.crm.resend-webhook
// Receives delivery / bounce / complaint / open / click events from Resend
// and updates the email_sends + email_suppressions tables.
// Resend payload reference: https://resend.com/docs/dashboard/webhooks/event-types

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emitEvent } from '@/lib/crm/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ResendEvent {
  type: string
  data: {
    email_id?: string
    to?: string[] | string
    subject?: string
    bounce?: { type?: string; message?: string }
    click?: { link?: string; ipAddress?: string; userAgent?: string }
    [k: string]: unknown
  }
}

export async function POST(req: Request) {
  let payload: ResendEvent
  try {
    payload = (await req.json()) as ResendEvent
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const messageId = payload.data?.email_id
  if (!messageId) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const supabase = createAdminClient()
  const { data: send } = await supabase
    .from('email_sends')
    .select('id, tenant_id, contact_id, to_email, subject, status')
    .eq('message_id', messageId)
    .maybeSingle()
  if (!send) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const now = new Date().toISOString()
  switch (payload.type) {
    case 'email.delivered': {
      await supabase
        .from('email_sends')
        .update({ status: 'delivered', delivered_at: now })
        .eq('id', send.id)
      if (send.contact_id) {
        await supabase.from('contact_activities').insert({
          tenant_id: send.tenant_id,
          contact_id: send.contact_id,
          activity_type: 'email_delivered',
          title: `Delivered: ${send.subject}`,
          related_entity_type: 'email_send',
          related_entity_id: send.id,
        })
      }
      break
    }
    case 'email.bounced': {
      const reason = payload.data?.bounce?.message?.slice(0, 500) ?? 'bounced'
      await supabase
        .from('email_sends')
        .update({ status: 'bounced', bounced_at: now, bounce_reason: reason })
        .eq('id', send.id)
      await supabase.from('email_suppressions').upsert(
        {
          tenant_id: send.tenant_id,
          email_normalized: (send.to_email as string).toLowerCase(),
          reason: 'bounced',
          source_send_id: send.id,
          notes: reason,
        },
        { onConflict: 'tenant_id,email_normalized' },
      )
      if (send.contact_id) {
        await supabase
          .from('contacts')
          .update({
            email_subscribed: false,
            email_unsubscribed_at: now,
            email_unsubscribe_reason: 'bounced',
          })
          .eq('id', send.contact_id)
        await supabase.from('contact_activities').insert({
          tenant_id: send.tenant_id,
          contact_id: send.contact_id,
          activity_type: 'email_bounced',
          title: `Bounced: ${send.subject}`,
          body: reason,
          related_entity_type: 'email_send',
          related_entity_id: send.id,
        })
        await emitEvent({
          tenantId: send.tenant_id as string,
          contactId: send.contact_id as string,
          kind: 'email.bounced',
          payload: { send_id: send.id, subject: send.subject, reason },
          source: 'resend_webhook',
        })
      }
      break
    }
    case 'email.complained': {
      await supabase
        .from('email_sends')
        .update({ status: 'complained', complained_at: now })
        .eq('id', send.id)
      await supabase.from('email_suppressions').upsert(
        {
          tenant_id: send.tenant_id,
          email_normalized: (send.to_email as string).toLowerCase(),
          reason: 'complained',
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
            email_unsubscribe_reason: 'spam_complaint',
          })
          .eq('id', send.contact_id)
        await supabase.from('contact_activities').insert({
          tenant_id: send.tenant_id,
          contact_id: send.contact_id,
          activity_type: 'email_complained',
          title: `Complaint: ${send.subject}`,
          related_entity_type: 'email_send',
          related_entity_id: send.id,
        })
        await emitEvent({
          tenantId: send.tenant_id as string,
          contactId: send.contact_id as string,
          kind: 'email.unsubscribed',
          payload: { send_id: send.id, reason: 'spam_complaint' },
          source: 'resend_webhook',
        })
      }
      break
    }
    case 'email.opened': {
      // Pixel beats this in real time; webhook is the fallback.
      await supabase
        .from('email_sends')
        .update({ first_opened_at: now })
        .eq('id', send.id)
        .is('first_opened_at', null)
      break
    }
    case 'email.clicked': {
      // Click tracker beats this; webhook only confirms.
      await supabase
        .from('email_sends')
        .update({ first_clicked_at: now })
        .eq('id', send.id)
        .is('first_clicked_at', null)
      break
    }
    default:
      break
  }

  return NextResponse.json({ ok: true })
}
