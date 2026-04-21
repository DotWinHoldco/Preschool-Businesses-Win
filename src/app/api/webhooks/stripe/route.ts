// @anchor: cca.billing.webhook
// Stripe webhook handler — processes payment events

import { NextRequest, NextResponse } from 'next/server'
import { verifyStripeWebhook } from '@/lib/stripe/webhooks'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/send'
import * as Sentry from '@sentry/nextjs'

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event
  try {
    event = verifyStripeWebhook(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as { id: string; metadata?: Record<string, string>; amount?: number }
        await supabase
          .from('payments')
          .update({ status: 'succeeded', paid_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', pi.id)

        const { data: payment } = await supabase
          .from('payments')
          .select('id, invoice_id, amount_cents, tenant_id, family_id')
          .eq('stripe_payment_intent_id', pi.id)
          .single()

        if (payment?.invoice_id) {
          await supabase
            .from('invoices')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', payment.invoice_id)

          const { data: invoice } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('id', payment.invoice_id)
            .single()

          if (payment.tenant_id && payment.family_id) {
            const { data: familyMembers } = await supabase
              .from('family_members')
              .select('user_id')
              .eq('family_id', payment.family_id)
              .eq('tenant_id', payment.tenant_id)

            const userIds = (familyMembers ?? []).map((m) => m.user_id).filter(Boolean) as string[]
            if (userIds.length > 0) {
              await sendNotification({
                tenantId: payment.tenant_id,
                to: userIds,
                template: 'payment_received',
                payload: {
                  amount: ((payment.amount_cents ?? 0) / 100).toFixed(2),
                  invoice_number: invoice?.invoice_number ?? payment.invoice_id,
                },
                channels: ['in_app'],
                urgency: 'normal',
              })
            }

            await writeAudit(supabase, {
              tenantId: payment.tenant_id,
              actorId: SYSTEM_ACTOR_ID,
              action: 'billing.payment_succeeded',
              entityType: 'payment',
              entityId: payment.id,
              after: { stripe_pi: pi.id, amount_cents: payment.amount_cents, status: 'succeeded' },
            })
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string }
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', pi.id)

        const { data: payment } = await supabase
          .from('payments')
          .select('id, invoice_id, amount_cents, tenant_id, family_id')
          .eq('stripe_payment_intent_id', pi.id)
          .single()

        if (payment?.tenant_id && payment.family_id) {
          const { data: familyMembers } = await supabase
            .from('family_members')
            .select('user_id')
            .eq('family_id', payment.family_id)
            .eq('tenant_id', payment.tenant_id)

          const userIds = (familyMembers ?? []).map((m) => m.user_id).filter(Boolean) as string[]
          if (userIds.length > 0) {
            await sendNotification({
              tenantId: payment.tenant_id,
              to: userIds,
              template: 'payment_failed',
              payload: {
                amount: ((payment.amount_cents ?? 0) / 100).toFixed(2),
                invoice_number: payment.invoice_id ?? '',
              },
              channels: ['in_app'],
              urgency: 'high',
            })
          }

          await writeAudit(supabase, {
            tenantId: payment.tenant_id,
            actorId: SYSTEM_ACTOR_ID,
            action: 'billing.payment_failed',
            entityType: 'payment',
            entityId: payment.id,
            after: { stripe_pi: pi.id, status: 'failed' },
          })
        }
        break
      }

      case 'invoice.paid': {
        const inv = event.data.object as { id: string }
        await supabase
          .from('invoices')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('stripe_invoice_id', inv.id)
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as { id: string }
        await supabase
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('stripe_invoice_id', inv.id)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as { id: string; status: string }
        await supabase
          .from('family_billing_enrollments')
          .update({ status: sub.status === 'active' ? 'active' : 'paused' })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as { id: string }
        await supabase
          .from('family_billing_enrollments')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    Sentry.captureException(err, { tags: { subsystem: 'stripe_webhook' } })
    const message = err instanceof Error ? err.message : 'Webhook handler failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
