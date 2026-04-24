// @anchor: cca.leads.detail-page
// Next.js 16: params is a Promise, must await

import { createTenantServerClient } from '@/lib/supabase/server'
import { LeadDetail } from '@/components/portal/enrollment/lead-detail'
import { LeadActions } from '@/components/portal/enrollment/lead-actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params
  const supabase = await createTenantServerClient()

  const { data: lead } = await supabase
    .from('enrollment_leads')
    .select('*')
    .eq('id', leadId)
    .single()

  const { data: activities } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('performed_at', { ascending: false })

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[var(--color-muted-foreground)]">Lead not found</p>
        <Link
          href="/portal/admin/leads"
          className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block"
        >
          Back to pipeline
        </Link>
      </div>
    )
  }

  const mappedActivities = (activities ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    activity_type: a.activity_type as string,
    description: a.description as string,
    performed_at: (a.performed_at ?? a.created_at) as string,
    performed_by_name: undefined,
  }))

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin/leads"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to pipeline
      </Link>

      <LeadDetail
        lead={{
          id: lead.id,
          parent_first_name: lead.parent_first_name,
          parent_last_name: lead.parent_last_name,
          parent_email: lead.parent_email,
          parent_phone: lead.parent_phone,
          child_name: lead.child_name,
          child_age_months: lead.child_age_months,
          program_interest: lead.program_interest,
          status: lead.status ?? 'new',
          priority: lead.priority ?? 'warm',
          source: lead.source ?? 'website',
          source_detail: lead.source_detail,
          notes: lead.notes,
          utm_source: lead.utm_source,
          utm_medium: lead.utm_medium,
          utm_campaign: lead.utm_campaign,
          created_at: lead.created_at,
        }}
        activities={mappedActivities}
      />

      <LeadActions
        lead={{
          id: lead.id,
          parent_first_name: lead.parent_first_name,
          parent_last_name: lead.parent_last_name,
          parent_email: lead.parent_email,
          parent_phone: lead.parent_phone,
          child_name: lead.child_name,
          child_age_months: lead.child_age_months,
          program_interest: lead.program_interest,
          priority: lead.priority ?? 'warm',
          status: lead.status ?? 'new',
          notes: lead.notes,
        }}
      />
    </div>
  )
}
