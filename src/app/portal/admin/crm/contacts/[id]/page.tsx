// @anchor: cca.crm.contact-detail
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ContactDetailClient } from './contact-detail-client'

export const dynamic = 'force-dynamic'

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!contact) notFound()

  const [
    { data: activities },
    { data: assignments },
    { data: allTags },
    { data: lead },
    { data: application },
    { data: family },
  ] = await Promise.all([
    supabase
      .from('contact_activities')
      .select(
        'id, activity_type, title, body, occurred_at, actor_user_id, payload, related_entity_type, related_entity_id',
      )
      .eq('tenant_id', tenantId)
      .eq('contact_id', id)
      .order('occurred_at', { ascending: false })
      .limit(200),
    supabase
      .from('contact_tag_assignments')
      .select('tag_id')
      .eq('tenant_id', tenantId)
      .eq('contact_id', id),
    supabase
      .from('contact_tags')
      .select('id, slug, label, color, description, is_system')
      .eq('tenant_id', tenantId)
      .order('label'),
    contact.primary_lead_id
      ? supabase
          .from('enrollment_leads')
          .select('id, status, priority, source, child_name, program_interest, notes, created_at')
          .eq('id', contact.primary_lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    contact.primary_application_id
      ? supabase
          .from('enrollment_applications')
          .select(
            'id, pipeline_stage, student_first_name, student_last_name, program_type, desired_start_date, created_at',
          )
          .eq('id', contact.primary_application_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    contact.family_id
      ? supabase
          .from('families')
          .select('id, family_name, created_at')
          .eq('id', contact.family_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return (
    <ContactDetailClient
      contact={contact as Record<string, unknown>}
      activities={activities ?? []}
      assignments={(assignments ?? []).map((a) => a.tag_id as string)}
      tags={allTags ?? []}
      lead={lead}
      application={application}
      family={family}
    />
  )
}
