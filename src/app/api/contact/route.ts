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
    const { firstName, lastName, email, message } = body

    if (body.company) {
      return NextResponse.json({ success: true })
    }

    if (!email || !email.includes('@') || !message) {
      return NextResponse.json({ error: 'Email and message are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from('enrollment_leads').insert({
      tenant_id: tenantId,
      parent_first_name: firstName || null,
      parent_last_name: lastName || null,
      parent_email: email.toLowerCase().trim(),
      notes: message,
      source: 'marketing_contact_form',
      source_detail: '/contact',
      status: 'new',
      priority: 'medium',
    })

    if (error) {
      console.error('Contact form error:', error)
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
