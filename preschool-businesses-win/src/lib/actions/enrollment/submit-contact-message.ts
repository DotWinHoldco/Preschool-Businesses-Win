'use server'

// @anchor: cca.contact.submit
// Server action for the marketing contact form.
// Honeypot check → Zod validate → Supabase insert → return success.

import { ContactMessageSchema, type ContactMessageData } from '@/lib/schemas/contact-message'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

interface SubmitResult {
  ok: boolean
  error?: string
}

export async function submitContactMessage(
  raw: ContactMessageData,
): Promise<SubmitResult> {
  // --- Honeypot check ---
  if (raw.website && raw.website.length > 0) {
    return { ok: true }
  }

  // --- Zod validation ---
  const parsed = ContactMessageSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  try {
    // Public action — no auth required (contact form)

    // Auto-create a lead if it's a prospective parent
    if (data.inquiry_type === 'prospective_parent') {
      const nameParts = data.name.split(' ')
      const firstName = nameParts[0] || data.name
      const lastName = nameParts.slice(1).join(' ') || ''

      await supabase.from('enrollment_leads').insert({
        tenant_id: tenantId,
        source: 'website',
        source_detail: 'contact_form',
        parent_first_name: firstName,
        parent_last_name: lastName,
        parent_email: data.email,
        parent_phone: data.phone || null,
        status: 'new',
        priority: 'warm',
        notes: `Contact form inquiry: ${data.message}`,
      })
    }

    await writeAudit(supabase, {
      tenantId: tenantId,
      actorId: 'anonymous',
      action: 'contact.submit',
      entityType: 'contact_message',
      entityId: crypto.randomUUID(),
      after: { name: data.name, email: data.email, inquiry_type: data.inquiry_type },
    })

    // TODO: Send email via Resend to director
    // await resend.emails.send({
    //   from: 'CCA Website <noreply@crandallchristianacademy.com>',
    //   to: process.env.DIRECTOR_NOTIFICATION_EMAIL!,
    //   subject: `New contact: ${data.name} (${data.inquiry_type})`,
    //   text: `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nType: ${data.inquiry_type}\n\n${data.message}`,
    // })

    return { ok: true }
  } catch (err) {
    console.error('Contact message error:', err)
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}
