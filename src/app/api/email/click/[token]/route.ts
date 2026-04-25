// @anchor: cca.crm.email-click
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data: link } = await supabase
    .from('email_links')
    .select('id, send_id, tenant_id, original_url')
    .eq('token', token)
    .maybeSingle()

  if (!link) {
    return NextResponse.redirect('https://crandallchristianacademy.com/', { status: 302 })
  }

  const now = new Date().toISOString()
  // Read-modify-write to bump click_count (Supabase JS doesn't atomic-inc).
  const { data: cur } = await supabase
    .from('email_links')
    .select('click_count, first_clicked_at')
    .eq('id', link.id)
    .single()
  if (cur) {
    await supabase
      .from('email_links')
      .update({
        click_count: (cur.click_count as number) + 1,
        first_clicked_at: cur.first_clicked_at ?? now,
        last_clicked_at: now,
      })
      .eq('id', link.id)
  }

  // Update parent send.
  const { data: send } = await supabase
    .from('email_sends')
    .select('id, contact_id, click_count, first_clicked_at, subject')
    .eq('id', link.send_id)
    .single()
  if (send) {
    await supabase
      .from('email_sends')
      .update({
        click_count: (send.click_count as number) + 1,
        first_clicked_at: send.first_clicked_at ?? now,
      })
      .eq('id', send.id)

    if (send.contact_id) {
      await supabase.from('contact_activities').insert({
        tenant_id: link.tenant_id,
        contact_id: send.contact_id as string,
        activity_type: 'email_clicked',
        title: `Clicked link in: ${send.subject}`,
        related_entity_type: 'email_send',
        related_entity_id: send.id,
        payload: { url: link.original_url },
      })
    }
  }

  return NextResponse.redirect(link.original_url as string, { status: 302 })
}
