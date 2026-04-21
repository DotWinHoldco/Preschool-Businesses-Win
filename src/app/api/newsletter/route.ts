import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimitGuard } from '@/lib/rate-limit-guard'

export async function POST(request: NextRequest) {
  const blocked = rateLimitGuard(request, 5)
  if (blocked) return blocked

  try {
    const tenantId = request.headers.get('x-tenant-id')
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 400 })
    }

    const body = await request.json()
    const { email } = body

    if (body.website) {
      return NextResponse.json({ success: true })
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          tenant_id: tenantId,
          email: email.toLowerCase().trim(),
          consent_at: new Date().toISOString(),
          source_page: 'home',
          ip_address: ip,
        },
        { onConflict: 'tenant_id,email' },
      )

    if (error) {
      console.error('Newsletter subscribe error:', error)
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Newsletter route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
