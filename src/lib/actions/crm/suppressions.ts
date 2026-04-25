'use server'

// @anchor: cca.crm.suppressions
// Admin actions for managing the email suppression list. Re-subscribe
// removes a row + flips the contact's email_subscribed back to true.
// Hard-block adds a manual suppression that survives re-subscribe attempts.

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'

interface Result {
  ok: boolean
  error?: string
}

async function authedAdmin() {
  const { session } = await assertRole('admin')
  const tenantId = await getTenantId()
  return { session, tenantId, supabase: createAdminClient() }
}

const EmailField = z.string().trim().toLowerCase().email().max(254)

export async function unblockEmail(input: { email: string }): Promise<Result> {
  const parsed = EmailField.safeParse(input.email)
  if (!parsed.success) return { ok: false, error: 'Invalid email' }

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const email = parsed.data
  const { error: delErr } = await supabase
    .from('email_suppressions')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('email_normalized', email)
  if (delErr) return { ok: false, error: delErr.message }

  // If a contact exists for this email, flip them back to subscribed.
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('email_normalized', email)
    .maybeSingle()
  if (contact) {
    await supabase
      .from('contacts')
      .update({
        email_subscribed: true,
        email_unsubscribed_at: null,
        email_unsubscribe_reason: null,
      })
      .eq('id', contact.id)
    await supabase.from('contact_activities').insert({
      tenant_id: tenantId,
      contact_id: contact.id,
      activity_type: 'custom',
      title: 'Re-subscribed by admin',
      actor_user_id: session.user.id,
    })
  }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.suppression.unblocked',
    entityType: 'email_suppression',
    entityId: email,
    after: { email },
  })

  revalidatePath('/portal/admin/crm/suppressions')
  return { ok: true }
}

export async function blockEmail(input: { email: string; notes?: string }): Promise<Result> {
  const parsed = EmailField.safeParse(input.email)
  if (!parsed.success) return { ok: false, error: 'Invalid email' }

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const email = parsed.data
  const { error } = await supabase.from('email_suppressions').upsert(
    {
      tenant_id: tenantId,
      email_normalized: email,
      reason: 'manual_block',
      notes: input.notes?.slice(0, 500) ?? null,
    },
    { onConflict: 'tenant_id,email_normalized' },
  )
  if (error) return { ok: false, error: error.message }

  // If a contact exists, also unsubscribe them.
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('email_normalized', email)
    .maybeSingle()
  if (contact) {
    await supabase
      .from('contacts')
      .update({
        email_subscribed: false,
        email_unsubscribed_at: new Date().toISOString(),
        email_unsubscribe_reason: 'admin_block',
      })
      .eq('id', contact.id)
  }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.suppression.blocked',
    entityType: 'email_suppression',
    entityId: email,
    after: { email, notes: input.notes ?? null },
  })

  revalidatePath('/portal/admin/crm/suppressions')
  return { ok: true }
}
