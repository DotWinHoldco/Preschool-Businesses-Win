'use server'

// @anchor: cca.newsfeed.comments
// Add and delete newsfeed_comments on a post.

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import { AddCommentSchema } from '@/lib/schemas/newsfeed'

export type CommentState = {
  ok: boolean
  error?: string
  id?: string
}

export async function addComment(
  post_id: string,
  body: string,
  parent_comment_id?: string | null,
): Promise<CommentState> {
  try {
    await assertRole('lead_teacher')

    const parsed = AddCommentSchema.safeParse({
      post_id,
      body,
      parent_comment_id: parent_comment_id ?? null,
    })
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    // Verify post exists in this tenant
    const { data: post } = await supabase
      .from('newsfeed_posts')
      .select('id')
      .eq('id', parsed.data.post_id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!post) {
      return { ok: false, error: 'Post not found' }
    }

    const { data: comment, error } = await supabase
      .from('newsfeed_comments')
      .insert({
        tenant_id: tenantId,
        post_id: parsed.data.post_id,
        author_id: actorId,
        body: parsed.data.body,
        parent_comment_id: parsed.data.parent_comment_id ?? null,
      })
      .select('id')
      .single()

    if (error || !comment) {
      return { ok: false, error: error?.message ?? 'Failed to add comment' }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'newsfeed.comment.added',
      entityType: 'newsfeed_comment',
      entityId: comment.id,
      after: {
        post_id: parsed.data.post_id,
        parent_comment_id: parsed.data.parent_comment_id ?? null,
      },
    })

    revalidatePath(`/portal/admin/newsfeed/${parsed.data.post_id}`)
    revalidatePath('/portal/admin/newsfeed')

    return { ok: true, id: comment.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}

export async function deleteComment(id: string): Promise<CommentState> {
  try {
    await assertRole('admin')

    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    const { data: before } = await supabase
      .from('newsfeed_comments')
      .select('id, post_id, author_id, body, parent_comment_id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!before) {
      return { ok: false, error: 'Comment not found' }
    }

    // Soft-delete: set deleted_at timestamp (preserves thread structure)
    const { error } = await supabase
      .from('newsfeed_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      return { ok: false, error: error.message }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'newsfeed.comment.deleted',
      entityType: 'newsfeed_comment',
      entityId: id,
      before: before as Record<string, unknown>,
    })

    revalidatePath(`/portal/admin/newsfeed/${before.post_id}`)
    revalidatePath('/portal/admin/newsfeed')

    return { ok: true, id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
