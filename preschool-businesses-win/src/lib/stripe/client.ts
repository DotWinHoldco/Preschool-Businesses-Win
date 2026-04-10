// @anchor: cca.billing.stripe
// Stripe client initialization
// Platform uses Stripe Connect: each tenant has their own connected account

import Stripe from 'stripe'

// Platform Stripe client (for SaaS billing)
export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === 'PLACEHOLDER_ADD_AFTER_BUILD') {
    console.warn('[Stripe] No API key configured — using mock mode')
    return null
  }
  // @ts-expect-error — Stripe SDK types may lag behind available API versions
  return new Stripe(key, { apiVersion: '2025-03-31.basil' as string })
}

// Tenant Stripe Connect client (for parent billing)
export function getTenantStripeClient(connectedAccountId: string) {
  const stripe = getStripeClient()
  if (!stripe) return null
  // Use the connected account for all operations
  return {
    stripe,
    connectedAccountId,
  }
}
