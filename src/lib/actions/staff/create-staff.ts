'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

const staffRoleEnum = z.enum([
  'owner',
  'admin',
  'lead_teacher',
  'assistant_teacher',
  'aide',
  'front_desk',
])

export type StaffRole = z.infer<typeof staffRoleEnum>

const CreateStaffSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Valid email is required'),
  phone: z.string().max(30).optional().or(z.literal('')),
  role: staffRoleEnum,
  hire_date: z.string().optional().or(z.literal('')),
})

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>

export type CreateStaffResult = {
  ok: boolean
  id?: string
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createStaff(input: CreateStaffInput): Promise<CreateStaffResult> {
  await assertRole('admin')
  const parsed = CreateStaffSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const data = parsed.data

  try {
    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = createAdminClient()

    // 1. Create auth user (or find existing)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      user_metadata: { full_name: `${data.first_name} ${data.last_name}` },
    })

    if (authError || !authUser.user) {
      return { ok: false, error: authError?.message || 'Failed to create user account' }
    }

    const userId = authUser.user.id

    // 2. Create user_profiles row
    await supabase.from('user_profiles').upsert(
      {
        id: userId,
        tenant_id: tenantId,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || null,
      },
      { onConflict: 'id' },
    )

    // 3. Create user_tenant_memberships row
    await supabase.from('user_tenant_memberships').upsert(
      {
        user_id: userId,
        tenant_id: tenantId,
        role: data.role,
        status: 'active',
      },
      { onConflict: 'user_id,tenant_id' },
    )

    // 4. Create staff_profiles row
    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        hire_date: data.hire_date || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (staffError || !staff) {
      return { ok: false, error: staffError?.message || 'Failed to create staff profile' }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'staff.create',
      entityType: 'staff_profile',
      entityId: staff.id,
      after: { first_name: data.first_name, last_name: data.last_name, role: data.role },
    })

    revalidatePath('/portal/admin/staff')

    return { ok: true, id: staff.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
