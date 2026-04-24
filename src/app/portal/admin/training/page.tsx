// @anchor: cca.training.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { TrainingAdminClient } from '@/components/portal/training/training-admin-client'

export default async function AdminTrainingPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const [recordsRes, profilesRes, requirementsRes] = await Promise.all([
    supabase
      .from('training_records')
      .select(
        'id, user_id, training_name, provider, training_type, topic_category, hours, completed_date, certificate_path, verified_by, verified_at, year, notes, created_at',
      )
      .eq('tenant_id', tenantId)
      .order('completed_date', { ascending: false }),
    supabase.from('user_profiles').select('id, full_name, role').eq('tenant_id', tenantId),
    supabase
      .from('training_requirements')
      .select('id, title, topic_category, cadence, required_hours, required_for_roles, description')
      .eq('tenant_id', tenantId)
      .order('title', { ascending: true }),
  ])

  const records = (recordsRes.data ?? []).map((r) => ({
    id: r.id as string,
    user_id: (r.user_id as string) ?? '',
    training_name: (r.training_name as string) ?? '',
    provider: (r.provider as string) ?? null,
    training_type: (r.training_type as string) ?? null,
    topic_category: (r.topic_category as string) ?? null,
    hours: (r.hours as number) ?? 0,
    completed_date: (r.completed_date as string) ?? null,
    certificate_path: (r.certificate_path as string) ?? null,
    verified_by: (r.verified_by as string) ?? null,
    verified_at: (r.verified_at as string) ?? null,
    notes: (r.notes as string) ?? null,
  }))

  const profiles = (profilesRes.data ?? []).map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string) ?? 'Unknown',
    role: (p.role as string) ?? '',
  }))

  const requirements = (requirementsRes.data ?? []).map((q) => ({
    id: q.id as string,
    title: (q.title as string) ?? '',
    topic_category: (q.topic_category as string) ?? 'other',
    cadence: (q.cadence as string) ?? 'annual',
    required_hours: (q.required_hours as number) ?? 0,
    required_for_roles: (q.required_for_roles as string[]) ?? [],
    description: (q.description as string) ?? null,
  }))

  return <TrainingAdminClient records={records} profiles={profiles} requirements={requirements} />
}
