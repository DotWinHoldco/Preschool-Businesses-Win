'use server'

// @anchor: cca.classroom.roster-actions
// Server actions: assign/remove students and staff from classrooms.
// Enforces capacity limits. Validates with Zod. Writes audit log.

import {
  AssignStudentSchema,
  RemoveStudentSchema,
  AssignStaffSchema,
  RemoveStaffSchema,
  type AssignStudentInput,
  type AssignStaffInput,
} from '@/lib/schemas/classroom'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type RosterResult = {
  ok: boolean
  assignmentId?: string
  error?: string
  fieldErrors?: Record<string, string>
}

// ---------------------------------------------------------------------------
// Assign student to classroom
// ---------------------------------------------------------------------------

export async function assignStudent(input: AssignStudentInput): Promise<RosterResult> {
  const parsed = AssignStudentSchema.safeParse(input)
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

  // Check classroom capacity
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, capacity')
    .eq('id', data.classroom_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!classroom) {
    return { ok: false, error: 'Classroom not found' }
  }

  const { count } = await supabase
    .from('student_classroom_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('classroom_id', data.classroom_id)
    .eq('tenant_id', tenantId)
    .is('assigned_to', null)

  if (count !== null && count >= classroom.capacity) {
    return {
      ok: false,
      error: `Classroom is at capacity (${classroom.capacity}). Cannot assign more students.`,
    }
  }

  // Insert assignment
  const { data: assignment, error } = await supabase
    .from('student_classroom_assignments')
    .insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      classroom_id: data.classroom_id,
      program_type: data.program_type,
      assigned_from: data.assigned_from || new Date().toISOString(),
      assigned_to: data.assigned_to || null,
    })
    .select('id')
    .single()

  if (error || !assignment) {
    return { ok: false, error: error?.message || 'Failed to assign student' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'create',
    entity_type: 'student_classroom_assignment',
    entity_id: assignment.id,
    after: data as unknown as Record<string, unknown>,
  })

  return { ok: true, assignmentId: assignment.id }
}

// ---------------------------------------------------------------------------
// Remove student from classroom
// ---------------------------------------------------------------------------

export async function removeStudent(
  input: { assignment_id: string; classroom_id: string },
): Promise<RosterResult> {
  const parsed = RemoveStudentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // End the assignment instead of deleting (set assigned_to to now)
  const { data: before } = await supabase
    .from('student_classroom_assignments')
    .select('*')
    .eq('id', input.assignment_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Assignment not found' }
  }

  const { error } = await supabase
    .from('student_classroom_assignments')
    .update({ assigned_to: new Date().toISOString() })
    .eq('id', input.assignment_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'update',
    entity_type: 'student_classroom_assignment',
    entity_id: input.assignment_id,
    before: before as unknown as Record<string, unknown>,
    after: { assigned_to: new Date().toISOString() },
  })

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Assign staff to classroom
// ---------------------------------------------------------------------------

export async function assignStaff(input: AssignStaffInput): Promise<RosterResult> {
  const parsed = AssignStaffSchema.safeParse(input)
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

  const { data: assignment, error } = await supabase
    .from('classroom_staff_assignments')
    .insert({
      tenant_id: tenantId,
      classroom_id: data.classroom_id,
      user_id: data.user_id,
      role: data.role,
      is_primary: data.is_primary,
      assigned_from: data.assigned_from || new Date().toISOString(),
      assigned_to: data.assigned_to || null,
    })
    .select('id')
    .single()

  if (error || !assignment) {
    return { ok: false, error: error?.message || 'Failed to assign staff' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'create',
    entity_type: 'classroom_staff_assignment',
    entity_id: assignment.id,
    after: data as unknown as Record<string, unknown>,
  })

  return { ok: true, assignmentId: assignment.id }
}

// ---------------------------------------------------------------------------
// Remove staff from classroom
// ---------------------------------------------------------------------------

export async function removeStaff(
  input: { assignment_id: string; classroom_id: string },
): Promise<RosterResult> {
  const parsed = RemoveStaffSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('classroom_staff_assignments')
    .select('*')
    .eq('id', input.assignment_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Assignment not found' }
  }

  const { error } = await supabase
    .from('classroom_staff_assignments')
    .update({ assigned_to: new Date().toISOString() })
    .eq('id', input.assignment_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'update',
    entity_type: 'classroom_staff_assignment',
    entity_id: input.assignment_id,
    before: before as unknown as Record<string, unknown>,
    after: { assigned_to: new Date().toISOString() },
  })

  return { ok: true }
}
