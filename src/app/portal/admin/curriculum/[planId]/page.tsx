// @anchor: cca.curriculum.plan-detail
// Lesson plan detail — days, activities, standards, status controls.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import LessonPlanDetailClient from '@/components/portal/lesson-plan-detail-client'

export const dynamic = 'force-dynamic'

export default async function LessonPlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const { planId } = await params
  const tenantId = await getTenantId()
  const supabase = await createTenantAdminClient(tenantId)

  const [
    planRes,
    daysRes,
    activitiesRes,
    mappedStandardsRes,
    classroomsRes,
    standardsRes,
    libraryRes,
  ] = await Promise.all([
    supabase.from('lesson_plans').select('*').eq('tenant_id', tenantId).eq('id', planId).single(),
    supabase
      .from('lesson_plan_days')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('lesson_plan_id', planId)
      .order('day_of_week'),
    supabase
      .from('lesson_plan_activities')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('lesson_plan_id', planId)
      .order('day_of_week')
      .order('time_slot'),
    supabase
      .from('lesson_plan_standards')
      .select('*, learning_standards(id, code, title, framework)')
      .eq('tenant_id', tenantId)
      .eq('lesson_plan_id', planId),
    supabase.from('classrooms').select('id, name').eq('tenant_id', tenantId).order('name'),
    supabase
      .from('learning_standards')
      .select('id, framework, code, title')
      .eq('tenant_id', tenantId)
      .order('code'),
    supabase
      .from('curriculum_activities')
      .select('id, title, description, subject_area, duration_minutes, materials, instructions')
      .eq('tenant_id', tenantId)
      .eq('is_archived', false)
      .order('title'),
  ])

  const plan = planRes.data
  if (!plan) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/portal/admin/curriculum"
        className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        <ChevronLeft size={14} />
        Back to Curriculum
      </Link>

      <LessonPlanDetailClient
        plan={{
          id: plan.id,
          title: plan.title,
          theme: plan.theme,
          classroom_id: plan.classroom_id,
          week_start_date: plan.week_start_date,
          objectives: plan.objectives,
          materials: plan.materials,
          faith_component: plan.faith_component,
          status: plan.status,
        }}
        classrooms={classroomsRes.data ?? []}
        days={(daysRes.data ?? []).map((d) => ({
          id: d.id,
          day_of_week: d.day_of_week,
          title: d.title,
          body: d.body,
          reflection: d.reflection,
        }))}
        activities={(activitiesRes.data ?? []).map((a) => ({
          id: a.id,
          day_of_week: a.day_of_week,
          time_slot: a.time_slot,
          activity_name: a.activity_name,
          description: a.description,
          materials_needed: a.materials_needed,
          duration_minutes: a.duration_minutes,
          standards_addressed: a.standards_addressed ?? [],
          completed: a.completed,
        }))}
        mappedStandards={(mappedStandardsRes.data ?? [])
          .map(
            (m: {
              learning_standards: {
                id: string
                code: string
                title: string
                framework: string
              } | null
              coverage_level: string
            }) => {
              const s = m.learning_standards
              if (!s) return null
              return {
                standard_id: s.id,
                code: s.code,
                title: s.title,
                framework: s.framework,
                coverage_level: m.coverage_level as 'introduced' | 'practiced' | 'assessed',
              }
            },
          )
          .filter((x): x is NonNullable<typeof x> => x !== null)}
        allStandards={standardsRes.data ?? []}
        activityLibrary={libraryRes.data ?? []}
      />
    </div>
  )
}
