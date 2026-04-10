// @anchor: cca.billing.stripe
// Stripe client initialization
// Platform uses Stripe Connect: each tenant has their own connected account

import Stripe from 'stripe'

// Platform Stripe client (for SaaS billing)
export function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === 'PLACEHOLDER_ADD_AFTER_BUILD') {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  // @ts-expect-error — Stripe SDK types may lag behind available API versions
  return new Stripe(key, { apiVersion: '2025-03-31.basil' })
}

/**
 * Check if Stripe is configured without throwing.
 * Use this in UI code that needs to show/hide Stripe features.
 */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY
  return !!key && key !== 'PLACEHOLDER_ADD_AFTER_BUILD'
}

// Tenant Stripe Connect client (for parent billing)
export function getTenantStripeClient(connectedAccountId: string) {
  const stripe = getStripeClient()
  return {
    stripe,
    connectedAccountId,
  }
}
