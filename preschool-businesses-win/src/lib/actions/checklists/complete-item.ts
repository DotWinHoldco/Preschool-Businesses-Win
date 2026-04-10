'use server'

// @anchor: cca.checklist.complete-item
// Complete a checklist item (with e-signature support)
// See CCA_BUILD_BRIEF.md §34

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { CompleteChecklistItemSchema, type CompleteChecklistItemInput } from '@/lib/schemas/checklist'
import { assertRole } from '@/lib/auth/session'
import { headers } from 'next/headers'

export async function completeChecklistItem(input: CompleteChecklistItemInput) {
  await assertRole('parent')
  const parsed = CompleteChecklistItemSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const headerStore = await headers()
  const clientIp = headerStore.get('x-forwarded-for') ?? 'unknown'

  // Verify the response record exists and is pending
  const { data: response, error: fetchError } = await supabase
    .from('checklist_responses')
    .select('id, status, assignment_id, item_id')
    .eq('assignment_id', parsed.data.assignment_id)
    .eq('item_id', parsed.data.item_id)
    .eq('tenant_id', tenantId)
    .single()

  if (fetchError || !response) {
    return { ok: false as const, error: { _form: ['Checklist response not found'] } }
  }

  if (response.status === 'completed') {
    return { ok: false as const, error: { _form: ['Item already completed'] } }
  }

  const now = new Date().toISOString()

  // Update the response
  const updateData: Record<string, unknown> = {
    status: 'completed',
    completed_at: now,
    completed_by: actorId,
  }

  if (parsed.data.response_value) {
    updateData.response_value = parsed.data.response_value
  }
  if (parsed.data.file_path) {
    updateData.file_path = parsed.data.file_path
  }
  if (parsed.data.signature_data) {
    // Store the signature as a value; the client IP is recorded for legal validity
    updateData.response_value = JSON.stringify({
      type: 'e_signature',
      data: parsed.data.signature_data,
      signed_at: now,
      ip: clientIp,
    })
    updateData.signed_at = now
  }

  const { error: updateError } = await supabase
    .from('checklist_responses')
    .update(updateData)
    .eq('id', response.id)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { ok: false as const, error: { _form: [updateError.message] } }
  }

  // Check if all items in the assignment are now completed
  const { data: allResponses } = await supabase
    .from('checklist_responses')
    .select('status')
    .eq('assignment_id', parsed.data.assignment_id)
    .eq('tenant_id', tenantId)

  const allCompleted = allResponses?.every((r) => r.status === 'completed')

  if (allCompleted) {
    await supabase
      .from('checklist_assignments')
      .update({ status: 'completed', completed_at: now })
      .eq('id', parsed.data.assignment_id)
      .eq('tenant_id', tenantId)
  } else {
    // Update to in_progress if not already
    await supabase
      .from('checklist_assignments')
      .update({ status: 'in_progress' })
      .eq('id', parsed.data.assignment_id)
      .eq('status', 'pending')
      .eq('tenant_id', tenantId)
  }

  return { ok: true as const, allCompleted: allCompleted ?? false }
}
