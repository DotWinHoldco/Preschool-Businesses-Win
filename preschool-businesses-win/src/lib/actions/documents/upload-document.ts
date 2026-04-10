'use server'

// @anchor: cca.documents.upload
// Upload a document to the entity-scoped vault
// See CCA_BUILD_BRIEF.md §35

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { UploadDocumentSchema, type UploadDocumentInput } from '@/lib/schemas/document'

export async function uploadDocument(input: UploadDocumentInput) {
  const parsed = UploadDocumentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Check if a previous version of this document type exists for this entity
  const { data: existingDoc } = await supabase
    .from('documents')
    .select('id, version')
    .eq('entity_type', parsed.data.entity_type)
    .eq('entity_id', parsed.data.entity_id)
    .eq('document_type', parsed.data.document_type)
    .eq('status', 'active')
    .eq('tenant_id', tenantId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  const newVersion = existingDoc ? ((existingDoc.version as number) + 1) : 1
  const previousVersionId = existingDoc ? (existingDoc.id as string) : null

  // If there's a previous version, mark it as superseded
  if (previousVersionId) {
    await supabase
      .from('documents')
      .update({ status: 'superseded', updated_at: new Date().toISOString() })
      .eq('id', previousVersionId)
      .eq('tenant_id', tenantId)
  }

  // Insert the new document
  const { data, error } = await supabase
    .from('documents')
    .insert({
      tenant_id: tenantId,
      entity_type: parsed.data.entity_type,
      entity_id: parsed.data.entity_id,
      document_type: parsed.data.document_type,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      file_path: parsed.data.file_path,
      file_size_bytes: parsed.data.file_size_bytes,
      mime_type: parsed.data.mime_type,
      version: newVersion,
      previous_version_id: previousVersionId,
      uploaded_by: actorId,
      uploaded_at: new Date().toISOString(),
      expiry_date: parsed.data.expiry_date ?? null,
      status: 'active',
      tags: parsed.data.tags ?? [],
      checklist_response_id: parsed.data.checklist_response_id ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const, documentId: data.id as string, version: newVersion }
}
