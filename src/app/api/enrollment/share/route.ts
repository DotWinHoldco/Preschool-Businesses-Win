import { NextRequest, NextResponse } from 'next/server'
import { assertRole } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { generateShareToken } from '@/lib/enrollment-share'

export async function POST(request: NextRequest) {
  try {
    await assertRole('admin')
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const applicationId = body.applicationId as string
  if (!applicationId) {
    return NextResponse.json({ error: 'applicationId required' }, { status: 400 })
  }

  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data } = await supabase
    .from('enrollment_applications')
    .select('id')
    .eq('id', applicationId)
    .eq('tenant_id', tenantId)
    .single()

  if (!data) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const token = generateShareToken(applicationId)
  const origin = request.headers.get('origin') ?? request.nextUrl.origin
  const shareUrl = `${origin}/enrollment/shared/${token}`

  return NextResponse.json({ url: shareUrl, token })
}
