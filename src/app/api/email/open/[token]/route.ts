// @anchor: cca.crm.email-open
// 1x1 transparent GIF that records the open. Uses a literal token in the
// path (with .gif suffix tolerated by trimming).

import { createAdminClient } from '@/lib/supabase/admin'
import { emitEvent } from '@/lib/crm/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PIXEL = Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64')

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params
  const token = raw.replace(/\.gif$/i, '')

  try {
    const supabase = createAdminClient()
    const { data: send } = await supabase
      .from('email_sends')
      .select('id, tenant_id, contact_id, open_count, first_opened_at, subject')
      .eq('open_token', token)
      .maybeSingle()
    if (send) {
      const now = new Date().toISOString()
      await supabase
        .from('email_sends')
        .update({
          open_count: (send.open_count as number) + 1,
          first_opened_at: send.first_opened_at ?? now,
          status: send.first_opened_at ? undefined : 'delivered',
          delivered_at: send.first_opened_at ? undefined : now,
        })
        .eq('id', send.id)

      if (send.contact_id && !send.first_opened_at) {
        await supabase.from('contact_activities').insert({
          tenant_id: send.tenant_id as string,
          contact_id: send.contact_id as string,
          activity_type: 'email_opened',
          title: `Opened: ${send.subject}`,
          related_entity_type: 'email_send',
          related_entity_id: send.id,
        })
        await emitEvent({
          tenantId: send.tenant_id as string,
          contactId: send.contact_id as string,
          kind: 'email.opened',
          payload: { send_id: send.id, subject: send.subject },
          source: 'tracking_pixel',
        })
      }
    }
  } catch {
    // never break the pixel
  }

  return new Response(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, max-age=0',
      'Content-Length': String(PIXEL.length),
    },
  })
}
