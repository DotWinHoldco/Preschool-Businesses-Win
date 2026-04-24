'use server'

// @anchor: cca.newsfeed.update-post
// Update a newsfeed post's content/scope/type/pinned state.

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import { UpdateNewsfeedPostSchema, type UpdateNewsfeedPostInput } from '@/lib/schemas/newsfeed'

export type UpdatePostState = {
  ok: boolean
  error?: string
  id?: string
}

export async function updatePost(
  id: string,
  input: UpdateNewsfeedPostInput,
): Promise<UpdatePostState> {
  try {
    await assertRole('admin')

    const parsed = UpdateNewsfeedPostSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    const { data: before } = await supabase
      .from('newsfeed_posts')
      .select('id, content, scope, classroom_id, post_type, pinned')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!before) {
      return { ok: false, error: 'Post not found' }
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (parsed.data.content !== undefined) patch.content = parsed.data.content
    if (parsed.data.scope !== undefined) patch.scope = parsed.data.scope
    if (parsed.data.classroom_id !== undefined) patch.classroom_id = parsed.data.classroom_id
    if (parsed.data.post_type !== undefined) patch.post_type = parsed.data.post_type
    if (parsed.data.pinned !== undefined) patch.pinned = parsed.data.pinned

    const { error } = await supabase
      .from('newsfeed_posts')
      .update(patch)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      return { ok: false, error: error.message }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'newsfeed.post.updated',
      entityType: 'newsfeed_post',
      entityId: id,
      before: before as Record<string, unknown>,
      after: patch,
    })

    revalidatePath('/portal/admin/newsfeed')
    revalidatePath(`/portal/admin/newsfeed/${id}`)

    return { ok: true, id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function togglePostPinned(id: string): Promise<UpdatePostState> {
  try {
    await assertRole('admin')

    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    const { data: post } = await supabase
      .from('newsfeed_posts')
      .select('id, pinned')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!post) {
      return { ok: false, error: 'Post not found' }
    }

    const next = !(post.pinned ?? false)
    const { error } = await supabase
      .from('newsfeed_posts')
      .update({ pinned: next, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      return { ok: false, error: error.message }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'newsfeed.post.pinned',
      entityType: 'newsfeed_post',
      entityId: id,
      before: { pinned: post.pinned ?? false },
      after: { pinned: next },
    })

    revalidatePath('/portal/admin/newsfeed')
    return { ok: true, id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
