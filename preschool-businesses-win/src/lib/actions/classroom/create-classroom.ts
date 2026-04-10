'use server'

// @anchor: cca.classroom.create-action
// Server action: create a classroom with capacity and ratio settings.
// Validates with Zod, inserts into Supabase, writes audit log.

import { CreateClassroomSchema, type CreateClassroomInput } from '@/lib/schemas/classroom'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type CreateClassroomResult = {
  ok: boolean
  classroomId?: string
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createClassroom(
  input: CreateClassroomInput,
): Promise<CreateClassroomResult> {
  // 1. Validate
  const parsed = CreateClassroomSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // 2. Insert classroom
  const { data: classroom, error } = await supabase
    .from('classrooms')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      slug: data.slug,
      age_range_min_months: data.age_range_min_months,
      age_range_max_months: data.age_range_max_months,
      capacity: data.capacity,
      ratio_required: data.ratio_required || null,
      room_number: data.room_number || null,
      description: data.description || null,
      status: data.status,
      created_by: actorId,
      updated_by: actorId,
    })
    .select('id')
    .single()

  if (error || !classroom) {
    return { ok: false, error: error?.message || 'Failed to create classroom' }
  }

  // 3. Audit log
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'create',
    entity_type: 'classroom',
    entity_id: classroom.id,
    after: data as unknown as Record<string, unknown>,
  })

  return { ok: true, classroomId: classroom.id }
}
