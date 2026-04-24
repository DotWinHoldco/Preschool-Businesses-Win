import { sendEmail } from '@/lib/email/resend'
import { createAdminClient } from '@/lib/supabase/admin'

interface BrandingData {
  school_name: string
  logo_url: string
  portal_url: string
  tagline: string
}

async function getTenantBrandingForEmail(tenantId: string): Promise<BrandingData> {
  const supabase = createAdminClient()
  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('school_name, logo_path')
    .eq('tenant_id', tenantId)
    .maybeSingle()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug, name, domain')
    .eq('id', tenantId)
    .single()

  const domain = tenant?.domain ?? `${tenant?.slug}.preschool.businesses.win`
  const baseUrl = `https://${domain}`

  return {
    school_name: branding?.school_name ?? tenant?.name ?? 'Our School',
    logo_url: branding?.logo_path ? `${baseUrl}${branding.logo_path}` : '',
    portal_url: `${baseUrl}/portal`,
    tagline: 'Where Little Minds Shine',
  }
}

function emailWrapper(branding: BrandingData, content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
      ${branding.logo_url ? `<img src="${branding.logo_url}" alt="${branding.school_name}" style="height: 56px; margin-bottom: 28px;" />` : `<h2 style="font-size: 20px; color: #1a1a1a; margin: 0 0 28px;">${branding.school_name}</h2>`}
      ${content}
      <hr style="border: none; border-top: 1px solid #eee; margin: 36px 0 16px;" />
      <p style="font-size: 12px; color: #bbb; margin: 0;">
        ${branding.school_name} · ${branding.tagline}
      </p>
    </div>
  `
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function detailsBlock(details: { label: string; value: string }[]): string {
  return `
    <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
      ${details
        .map(
          (d) => `
        <div style="margin-bottom: 8px;">
          <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">${d.label}</span><br/>
          <span style="font-size: 15px; color: #1a1a1a; font-weight: 500;">${d.value}</span>
        </div>
      `,
        )
        .join('')}
    </div>
  `
}

function ctaButton(text: string, href: string): string {
  return `
    <a href="${href}" style="display: inline-block; background: #3B70B0; color: #fff; font-size: 15px; font-weight: 600; padding: 12px 28px; border-radius: 999px; text-decoration: none; margin-top: 8px;">
      ${text}
    </a>
  `
}

export async function sendBookingConfirmationEmail(params: {
  tenantId: string
  to: string
  bookerName: string
  appointmentTypeName: string
  startAt: string
  endAt: string
  location: string | null
  confirmationToken: string | null
}) {
  const branding = await getTenantBrandingForEmail(params.tenantId)
  const details = [
    { label: 'Appointment', value: params.appointmentTypeName },
    { label: 'Date', value: formatDate(params.startAt) },
    { label: 'Time', value: `${formatTime(params.startAt)} – ${formatTime(params.endAt)}` },
  ]
  if (params.location) {
    details.push({ label: 'Location', value: params.location })
  }

  const html = emailWrapper(
    branding,
    `
    <h1 style="font-size: 22px; color: #1a1a1a; margin: 0 0 8px;">Appointment Confirmed</h1>
    <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 4px;">
      Hi ${params.bookerName}, your appointment has been booked!
    </p>
    ${detailsBlock(details)}
    <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 16px;">
      We look forward to seeing you. If you need to reschedule or cancel, please contact us.
    </p>
    ${ctaButton('View Your Portal', branding.portal_url)}
  `,
  )

  await sendEmail({
    to: params.to,
    subject: `Appointment Confirmed — ${params.appointmentTypeName}`,
    html,
    from: `${branding.school_name} <noreply@crandallchristianacademy.com>`,
  })
}

export async function sendInterviewInvitationEmail(params: {
  tenantId: string
  to: string
  parentName: string
  studentName: string
  bookingUrl: string
}) {
  const branding = await getTenantBrandingForEmail(params.tenantId)

  const html = emailWrapper(
    branding,
    `
    <h1 style="font-size: 22px; color: #1a1a1a; margin: 0 0 8px;">You're Invited to Interview!</h1>
    <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 16px;">
      Hi ${params.parentName}, great news! We've reviewed ${params.studentName}'s application and would love to meet your family.
    </p>
    <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 20px;">
      Please schedule your school tour and interview at a time that works for you:
    </p>
    ${ctaButton('Book Your Interview', params.bookingUrl)}
    <p style="font-size: 14px; color: #777; line-height: 1.6; margin: 20px 0 0;">
      During your visit, you'll meet our team, tour the classrooms, complete a family intake interview, and ask any questions about enrollment.
    </p>
  `,
  )

  await sendEmail({
    to: params.to,
    subject: `Interview Invitation — ${branding.school_name}`,
    html,
    from: `${branding.school_name} <noreply@crandallchristianacademy.com>`,
  })
}

export async function sendAppointmentCancelledEmail(params: {
  tenantId: string
  to: string
  bookerName: string
  appointmentTypeName: string
  startAt: string
  reason: string | null
  cancelledBy: 'parent' | 'staff'
}) {
  const branding = await getTenantBrandingForEmail(params.tenantId)

  const html = emailWrapper(
    branding,
    `
    <h1 style="font-size: 22px; color: #1a1a1a; margin: 0 0 8px;">Appointment Cancelled</h1>
    <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 4px;">
      Hi ${params.bookerName}, your ${params.appointmentTypeName} on ${formatDate(params.startAt)} at ${formatTime(params.startAt)} has been cancelled${params.cancelledBy === 'staff' ? ' by the school' : ''}.
    </p>
    ${
      params.reason
        ? `
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <span style="font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Reason</span><br/>
        <span style="font-size: 14px; color: #78350f;">${params.reason}</span>
      </div>
    `
        : ''
    }
    <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 16px 0;">
      If you'd like to rebook, please visit your portal or contact us.
    </p>
    ${ctaButton('Visit Your Portal', branding.portal_url)}
  `,
  )

  await sendEmail({
    to: params.to,
    subject: `Appointment Cancelled — ${params.appointmentTypeName}`,
    html,
    from: `${branding.school_name} <noreply@crandallchristianacademy.com>`,
  })
}

export async function sendAppointmentReminderEmail(params: {
  tenantId: string
  to: string
  bookerName: string
  appointmentTypeName: string
  startAt: string
  location: string | null
}) {
  const branding = await getTenantBrandingForEmail(params.tenantId)
  const details = [
    { label: 'Appointment', value: params.appointmentTypeName },
    { label: 'Date', value: formatDate(params.startAt) },
    { label: 'Time', value: formatTime(params.startAt) },
  ]
  if (params.location) {
    details.push({ label: 'Location', value: params.location })
  }

  const html = emailWrapper(
    branding,
    `
    <h1 style="font-size: 22px; color: #1a1a1a; margin: 0 0 8px;">Appointment Reminder</h1>
    <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 4px;">
      Hi ${params.bookerName}, just a friendly reminder about your upcoming appointment.
    </p>
    ${detailsBlock(details)}
    <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0;">
      We look forward to seeing you!
    </p>
  `,
  )

  await sendEmail({
    to: params.to,
    subject: `Reminder: ${params.appointmentTypeName} — ${formatDate(params.startAt)}`,
    html,
    from: `${branding.school_name} <noreply@crandallchristianacademy.com>`,
  })
}
