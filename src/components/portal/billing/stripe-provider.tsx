'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import type { ReactNode } from 'react'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== 'PLACEHOLDER_ADD_AFTER_BUILD'
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

export function StripeProvider({
  clientSecret,
  children,
}: {
  clientSecret: string
  children: ReactNode
}) {
  if (!stripePromise) return null

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: 'stripe' } }}
    >
      {children}
    </Elements>
  )
}

export function isStripeAvailable(): boolean {
  return stripePromise !== null
}
