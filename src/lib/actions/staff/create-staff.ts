'use server'

// @anchor: cca.staff.create-action
// Server action: create a staff profile with Zod validation and tenant scoping.

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export type CreateStaffResult = {
  ok: boolean
  id?: string
  error?: string
  fieldErrors?: Record<string, string>
}

const ROLE_DISPLAY: Record<StaffRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  lead_teacher: 'Lead Teacher',
  assistant_teacher: 'Assistant Teacher',
  aide: 'Aide',
  front_desk: 'Front Desk',
}

export async function createStaff(
  input: CreateStaffInput,
): Promise<CreateStaffResult> {
  // 1. Validate
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
    const supabase = createAdminClient()

    // 2. Insert into staff_profiles
    const { data: staff, error } = await supabase
      .from('staff_profiles')
      .insert({
        tenant_id: tenantId,
        first_name: data.first_name,
        last_name: data.last_name,
        title: ROLE_DISPLAY[data.role],
        hire_date: data.hire_date || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (error || !staff) {
      return { ok: false, error: error?.message || 'Failed to create staff member' }
    }

    revalidatePath('/portal/admin/staff')

    return { ok: true, id: staff.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
