// @anchor: cca.billing.webhook
// Stripe webhook handler — processes payment events
// See CCA_BUILD_BRIEF.md §12 for billing architecture

import { NextRequest, NextResponse } from 'next/server'
import { verifyStripeWebhook } from '@/lib/stripe/webhooks'
import { createAdminClient } from '@/lib/supabase/admin'

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
        const pi = event.data.object as { id: string; metadata?: Record<string, string> }
        await supabase
          .from('payments')
          .update({ status: 'succeeded', paid_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', pi.id)

        // Mark linked invoice as paid
        const { data: payment } = await supabase
          .from('payments')
          .select('invoice_id, amount_cents')
          .eq('stripe_payment_intent_id', pi.id)
          .single()

        if (payment?.invoice_id) {
          await supabase
            .from('invoices')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', payment.invoice_id)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string }
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', pi.id)
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
        // Unhandled event types are OK — just acknowledge receipt
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook handler failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
