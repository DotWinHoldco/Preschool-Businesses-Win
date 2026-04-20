'use server'

// @anchor: cca.newsfeed.create-post
// Server action to create a new newsfeed post.

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import { CreateNewsfeedPostSchema } from '@/lib/schemas/newsfeed'

export type CreatePostState = {
  ok: boolean
  error?: string
  post_id?: string
}

export async function createNewsfeedPost(
  raw: Record<string, unknown>,
): Promise<CreatePostState> {
  try {
    // Require at least aide-level role (staff)
    await assertRole('aide')

    const parsed = CreateNewsfeedPostSchema.safeParse(raw)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const { title, body, audience, pinned } = parsed.data
    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantServerClient()

    const { data: post, error } = await supabase
      .from('newsfeed_posts')
      .insert({
        tenant_id: tenantId,
        author_id: actorId,
        title,
        body: body || null,
        audience,
        pinned,
      })
      .select('id')
      .single()

    if (error || !post) {
      return { ok: false, error: error?.message ?? 'Failed to create post' }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'newsfeed.create_post',
      entityType: 'newsfeed_post',
      entityId: post.id,
      after: { title, audience, pinned },
    })

    revalidatePath('/portal/admin/newsfeed')

    return { ok: true, post_id: post.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
