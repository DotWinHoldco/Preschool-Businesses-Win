'use server'

// @anchor: platform.forms.admin-actions
// Forms list management: duplicate, archive, delete.

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import { duplicateForm as duplicateFormBase } from '@/lib/actions/forms'

export type FormAdminResult = {
  ok: boolean
  id?: string
  slug?: string
  error?: string
}

const IdSchema = z.object({ id: z.string().uuid('Invalid form id') })

export async function duplicateForm(id: string): Promise<FormAdminResult> {
  await assertRole('admin')
  const parsed = IdSchema.safeParse({ id })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form id' }
  }
  const result = await duplicateFormBase(parsed.data.id)
  revalidatePath('/portal/admin/forms')
  return result
}

export async function archiveForm(id: string): Promise<FormAdminResult> {
  await assertRole('admin')
  const parsed = IdSchema.safeParse({ id })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form id' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('forms')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'form.archive',
    entityType: 'form',
    entityId: parsed.data.id,
    after: { status: 'archived' },
  })

  revalidatePath('/portal/admin/forms')
  return { ok: true, id: parsed.data.id }
}

export async function deleteFormHard(id: string): Promise<FormAdminResult> {
  await assertRole('admin')
  const parsed = IdSchema.safeParse({ id })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form id' }
  }
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  // Block deletion of primary system forms.
  const { data: form } = await supabase
    .from('forms')
    .select('id, is_system_form, parent_form_id, system_form_key')
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!form) return { ok: false, error: 'Form not found' }

  if (form.is_system_form && !form.parent_form_id) {
    return {
      ok: false,
      error: `Core system form (${form.system_form_key}) cannot be deleted. Use Revert instead.`,
    }
  }

  // Cascade-safe: remove dependent rows before the form itself.
  const { data: responseIds } = await supabase
    .from('form_responses')
    .select('id')
    .eq('form_id', parsed.data.id)

  if (responseIds && responseIds.length > 0) {
    const ids = responseIds.map((r) => r.id)
    await supabase.from('form_response_values').delete().in('response_id', ids)
    await supabase.from('form_response_annotations').delete().in('response_id', ids)
    await supabase.from('form_responses').delete().in('id', ids)
  }

  await supabase.from('form_fields').delete().eq('form_id', parsed.data.id)
  await supabase.from('form_sections').delete().eq('form_id', parsed.data.id)
  await supabase.from('form_submission_actions').delete().eq('form_id', parsed.data.id)

  const { error } = await supabase
    .from('forms')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'form.delete',
    entityType: 'form',
    entityId: parsed.data.id,
  })

  revalidatePath('/portal/admin/forms')
  return { ok: true, id: parsed.data.id }
}
