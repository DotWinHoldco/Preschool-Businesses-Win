// @anchor: cca.billing.stripe-webhooks
// Stripe webhook verification + event handling helpers

import type Stripe from 'stripe'
import { getStripeClient } from './client'

export function verifyStripeWebhook(
  body: string,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripeClient()
  if (!stripe) {
    throw new Error('Stripe is not configured — cannot verify webhook')
  }
  return stripe.webhooks.constructEvent(body, signature, secret)
}

export type StripeEventHandler = {
  'payment_intent.succeeded': (data: Stripe.PaymentIntent) => Promise<void>
  'payment_intent.payment_failed': (data: Stripe.PaymentIntent) => Promise<void>
  'invoice.paid': (data: Stripe.Invoice) => Promise<void>
  'invoice.payment_failed': (data: Stripe.Invoice) => Promise<void>
  'customer.subscription.updated': (data: Stripe.Subscription) => Promise<void>
  'customer.subscription.deleted': (data: Stripe.Subscription) => Promise<void>
}
