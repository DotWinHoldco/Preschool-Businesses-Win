import { NextRequest, NextResponse } from 'next/server'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getStripeClient, isStripeConfigured } from '@/lib/stripe/client'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { getSession } from '@/lib/auth/session'
import { rateLimitGuard } from '@/lib/rate-limit-guard'

export async function POST(request: NextRequest) {
  const blocked = rateLimitGuard(request, 10)
  if (blocked) return blocked

  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payments are not yet configured. Please contact the school.' },
        { status: 503 },
      )
    }

    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getTenantId()
    const supabase = await createTenantServerClient()

    const body = await request.json()
    const { invoice_id, amount_cents, method } = body

    if (!invoice_id || !amount_cents || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('id, family_id, total_cents, status')
      .eq('id', invoice_id)
      .single()

    if (invErr || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
    }

    if (invoice.status === 'voided') {
      return NextResponse.json({ error: 'Invoice has been voided' }, { status: 400 })
    }

    const stripe = getStripeClient()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount_cents,
      currency: 'usd',
      payment_method_types: method === 'ach' ? ['us_bank_account'] : ['card'],
      metadata: {
        invoice_id,
        tenant_id: tenantId,
        family_id: invoice.family_id,
      },
    })

    await supabase.from('payments').insert({
      tenant_id: tenantId,
      family_id: invoice.family_id,
      invoice_id,
      amount_cents,
      method,
      stripe_payment_intent_id: paymentIntent.id,
      status: 'pending',
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('[billing/pay] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment setup failed' },
      { status: 500 },
    )
  }
}
