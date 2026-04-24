'use server'

// @anchor: cca.newsfeed.delete-post
// Delete a newsfeed post (cascades comments + reactions via FK).

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type DeletePostState = {
  ok: boolean
  error?: string
  id?: string
}

export async function deletePost(id: string): Promise<DeletePostState> {
  try {
    await assertRole('admin')

    const tenantId = await getTenantId()
    const actorId = await getActorId()
    const supabase = await createTenantAdminClient(tenantId)

    const { data: before } = await supabase
      .from('newsfeed_posts')
      .select('id, author_id, content, scope, classroom_id, post_type, pinned')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (!before) {
      return { ok: false, error: 'Post not found' }
    }

    const { error } = await supabase
      .from('newsfeed_posts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      return { ok: false, error: error.message }
    }

    await writeAudit(supabase, {
      tenantId,
      actorId,
      action: 'newsfeed.post.deleted',
      entityType: 'newsfeed_post',
      entityId: id,
      before: before as Record<string, unknown>,
    })

    revalidatePath('/portal/admin/newsfeed')
    return { ok: true, id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' }
  }
}
