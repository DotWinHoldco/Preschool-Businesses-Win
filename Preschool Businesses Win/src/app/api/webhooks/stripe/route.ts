// @anchor: cca.billing.webhook
// Stripe webhook handler — processes payment events
// See CCA_BUILD_BRIEF.md §12 for billing architecture

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  // TODO: Verify webhook signature with Stripe
  // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)

  try {
    // Parse the event (skip verification for now until API key is set)
    const event = JSON.parse(body)

    switch (event.type) {
      case 'payment_intent.succeeded': {
        // Mark payment as succeeded
        // Update invoice status to 'paid'
        // Generate receipt
        // Send notification to parent
        console.log('[Stripe] Payment succeeded:', event.data.object.id)
        break
      }

      case 'payment_intent.payment_failed': {
        // Mark payment as failed
        // Send failure notification to parent + admin
        // Initiate retry sequence
        console.log('[Stripe] Payment failed:', event.data.object.id)
        break
      }

      case 'invoice.paid': {
        // Update internal invoice status
        // Generate PDF receipt
        console.log('[Stripe] Invoice paid:', event.data.object.id)
        break
      }

      case 'invoice.payment_failed': {
        // Flag family account as past_due
        // Start escalation sequence
        console.log('[Stripe] Invoice payment failed:', event.data.object.id)
        break
      }

      case 'customer.subscription.updated': {
        // Sync subscription status
        console.log('[Stripe] Subscription updated:', event.data.object.id)
        break
      }

      case 'customer.subscription.deleted': {
        // Mark billing enrollment as cancelled
        console.log('[Stripe] Subscription deleted:', event.data.object.id)
        break
      }

      default:
        console.log('[Stripe] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Stripe Webhook Error]', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
