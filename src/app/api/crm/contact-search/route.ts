// @anchor: cca.crm.contact-search
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await assertRole('admin')
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
  if (q.length < 2) return NextResponse.json({ contacts: [] })

  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) return NextResponse.json({ error: 'missing_tenant' }, { status: 400 })
  const supabase = await createTenantAdminClient(tenantId)

  const { data } = await supabase
    .from('contacts')
    .select('id, full_name, email')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .or(`email.ilike.%${q}%,full_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    .limit(20)

  return NextResponse.json({ contacts: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}
