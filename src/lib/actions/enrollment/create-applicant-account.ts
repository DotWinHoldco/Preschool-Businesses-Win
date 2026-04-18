'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'

interface CreateApplicantAccountInput {
  tenantId: string
  parentEmail: string
  parentFirstName: string
  parentLastName: string
  applicationIds: string[]
}

interface CreateApplicantAccountResult {
  userId?: string
  magicLinkSent?: boolean
}

export async function createApplicantAccount(
  input: CreateApplicantAccountInput,
): Promise<CreateApplicantAccountResult> {
  const { tenantId, parentEmail, parentFirstName, parentLastName, applicationIds } = input
  const supabase = createAdminClient()

  let userId: string | undefined

  // Try to create first — if user already exists, Supabase returns an error
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: parentEmail,
    email_confirm: true,
    user_metadata: {
      first_name: parentFirstName,
      last_name: parentLastName,
    },
  })

  if (createError) {
    if (createError.message.includes('already been registered') || createError.status === 422) {
      // User exists — look them up by paginating through users
      let page = 1
      while (!userId) {
        const { data: batch } = await supabase.auth.admin.listUsers({ page, perPage: 50 })
        const users = batch?.users ?? []
        if (users.length === 0) break
        const match = users.find((u) => u.email?.toLowerCase() === parentEmail.toLowerCase())
        if (match) { userId = match.id; break }
        page++
      }
      if (!userId) {
        console.error('[CreateApplicantAccount] User exists but could not be found by email')
        return {}
      }
    } else {
      console.error('[CreateApplicantAccount] Failed to create auth user:', createError.message)
      return {}
    }
  } else {
    userId = newUser.user.id
  }

  if (!userId) return {}

  const { data: existingMembership } = await supabase
    .from('user_tenant_memberships')
    .select('id, role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!existingMembership) {
    await supabase.from('user_tenant_memberships').insert({
      user_id: userId,
      tenant_id: tenantId,
      role: 'applicant_parent',
      status: 'active',
    })
  }

  if (applicationIds.length > 0) {
    await supabase
      .from('enrollment_applications')
      .update({ parent_user_id: userId })
      .in('id', applicationIds)
      .eq('tenant_id', tenantId)
  }

  let magicLinkSent = false
  try {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: parentEmail,
    })

    const token = linkData?.properties?.hashed_token
    const loginUrl = token
      ? `https://crandallchristian.cc/portal/login/callback?token_hash=${token}&type=magiclink`
      : 'https://crandallchristian.cc/portal/login'

    await sendEmail({
      to: parentEmail,
      subject: 'Application Received — Crandall Christian Academy',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <img src="https://crandallchristian.cc/marketing/shared/cca-logo-full.png" alt="CCA" style="height: 48px; margin-bottom: 24px;" />
          <h1 style="font-size: 22px; color: #1a1a1a; margin: 0 0 12px;">Welcome, ${parentFirstName}!</h1>
          <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 20px;">
            We've received your enrollment application for Crandall Christian Academy.
            Our team will review it within 1–2 business days.
          </p>
          <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 24px;">
            You can track your application status and book your tour when invited by logging into your portal:
          </p>
          <a href="${loginUrl}" style="display: inline-block; background: #3B70B0; color: #fff; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 999px; text-decoration: none;">
            Log into Your Portal
          </a>
          <p style="font-size: 13px; color: #999; margin-top: 32px; line-height: 1.5;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${loginUrl}" style="color: #3B70B0;">${loginUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="font-size: 12px; color: #bbb;">
            Crandall Christian Academy · Where Little Minds Shine
          </p>
        </div>
      `,
    })

    magicLinkSent = true
  } catch (err) {
    console.error('[CreateApplicantAccount] Email send failed:', err)
  }

  return { userId, magicLinkSent }
}
