'use server'

// @anchor: cca.profile.update-action
// Server action: update current user's profile metadata.

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  phone: z.string().optional(),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

export type UpdateProfileResult = {
  ok: boolean
  error?: string
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  // 1. Auth check
  const session = await getSession()
  if (!session) {
    return { ok: false, error: 'Not authenticated' }
  }

  // 2. Validate
  const parsed = UpdateProfileSchema.safeParse(input)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed'
    return { ok: false, error: firstError }
  }

  const { name, phone } = parsed.data

  // 3. Update user metadata via admin client
  const supabase = createAdminClient()
  const { error } = await supabase.auth.admin.updateUserById(session.user.id, {
    user_metadata: { full_name: name, phone },
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  // 4. Revalidate
  revalidatePath('/portal/admin/profile')

  return { ok: true }
}
