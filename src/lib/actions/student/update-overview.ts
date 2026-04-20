'use server'

// @anchor: cca.student.update-overview-action
// Server action: update student overview fields (name, DOB, gender).
// Validates with Zod, updates Supabase, writes audit log, revalidates page.

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { genderEnum } from '@/lib/schemas/student'

const UpdateOverviewSchema = z.object({
  id: z.string().uuid('Invalid student ID'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: genderEnum.nullable().optional(),
})

export type UpdateOverviewInput = z.infer<typeof UpdateOverviewSchema>
export type UpdateOverviewResult = { ok: true } | { ok: false; error: string }

export async function updateOverview(
  input: UpdateOverviewInput,
): Promise<UpdateOverviewResult> {
  await assertRole('admin')

  const parsed = UpdateOverviewSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ')
    return { ok: false, error: msg }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Fetch current state for audit
  const { data: before } = await supabase
    .from('students')
    .select('*')
    .eq('id', data.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Student not found' }
  }

  const { error } = await supabase
    .from('students')
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      gender: data.gender ?? null,
      updated_by: actorId,
    })
    .eq('id', data.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  // Audit log
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'update',
    entity_type: 'student',
    entity_id: data.id,
    before: before as unknown as Record<string, unknown>,
    after: data as unknown as Record<string, unknown>,
  })

  revalidatePath(`/portal/admin/students/${data.id}`)
  return { ok: true }
}
