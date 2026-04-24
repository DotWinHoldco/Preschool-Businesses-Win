// @anchor: cca.curriculum.activity-library-page
// Activity Library — manage reusable activities for lesson plans.

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import ActivityLibraryClient from '@/components/portal/activity-library-client'

export const dynamic = 'force-dynamic'

export default async function ActivityLibraryPage() {
  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  const [activitiesRes, domainsRes] = await Promise.all([
    supabase
      .from('curriculum_activities')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_archived', false)
      .order('title'),
    supabase
      .from('learning_domains')
      .select('id, domain_name, framework')
      .eq('tenant_id', tenantId)
      .order('domain_name'),
  ])

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin/curriculum"
        className="inline-flex items-center gap-1 text-xs font-medium"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        <ChevronLeft size={14} />
        Back to Curriculum
      </Link>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Activity Library
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Reusable classroom activities. Add to lesson plans from the plan detail page.
        </p>
      </div>

      <ActivityLibraryClient
        activities={(activitiesRes.data ?? []).map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          subject_area: a.subject_area,
          age_range_min_months: a.age_range_min_months,
          age_range_max_months: a.age_range_max_months,
          duration_minutes: a.duration_minutes,
          materials: a.materials,
          instructions: a.instructions,
          domain_ids: a.domain_ids ?? [],
          tags: a.tags ?? [],
        }))}
        domains={(domainsRes.data ?? []).map((d) => ({
          id: d.id,
          name: d.domain_name,
          framework: d.framework,
        }))}
      />
    </div>
  )
}
