'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'

const SettingsSchema = z.object({
  from_name: z.string().trim().min(1).max(80),
  from_email: z.string().trim().toLowerCase().email().max(254),
  reply_to: z.string().trim().toLowerCase().email().max(254).optional().nullable(),
  resend_domain: z.string().trim().max(120).optional().nullable(),
  domain_verified: z.boolean().optional(),
  mailing_address: z.string().trim().min(5).max(400),
  unsubscribe_text: z.string().trim().min(1).max(160).optional(),
})

export async function saveTenantEmailSettings(
  input: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = SettingsSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  const data = parsed.data

  let session, tenantId, supabase
  try {
    const { session: s } = await assertRole('admin')
    session = s
    tenantId = await getTenantId()
    supabase = createAdminClient()
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { error } = await supabase.from('tenant_email_settings').upsert(
    {
      tenant_id: tenantId,
      from_name: data.from_name,
      from_email: data.from_email,
      reply_to: data.reply_to ?? null,
      resend_domain: data.resend_domain ?? null,
      domain_verified: data.domain_verified ?? false,
      mailing_address: data.mailing_address,
      unsubscribe_text: data.unsubscribe_text ?? 'Unsubscribe from these emails',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'tenant_id' },
  )
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.email_settings.updated',
    entityType: 'tenant_email_settings',
    entityId: tenantId,
    after: {
      from_email: data.from_email,
      resend_domain: data.resend_domain,
      domain_verified: data.domain_verified,
    },
  })

  revalidatePath('/portal/admin/crm/settings')
  return { ok: true }
}
