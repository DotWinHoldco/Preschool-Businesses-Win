'use server'

// @anchor: platform.surveys.actions
// Survey management: create (thin wrapper over forms), close, and CSV export alias.

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import { archiveForm } from '@/lib/actions/forms/admin'
import { exportResponsesCSV } from '@/lib/actions/forms/response-actions'

export type SurveyActionResult = {
  ok: boolean
  id?: string
  slug?: string
  error?: string
  csv?: string
  filename?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export async function createSurvey(input: {
  title: string
  description?: string
}): Promise<SurveyActionResult> {
  await assertRole('admin')
  const parsed = z
    .object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const slug = slugify(parsed.data.title) + '-' + Date.now().toString(36)

  const insertPayload: Record<string, unknown> = {
    tenant_id: tenantId,
    title: parsed.data.title,
    slug,
    description: parsed.data.description ?? null,
    mode: 'conversational',
    status: 'draft',
    access_control: 'public',
    created_by: actorId,
  }

  // Some tenants have an is_survey / post_type column — tolerate either or both.
  // We try with is_survey first; fall back to plain insert on error.
  let form: { id: string; slug: string } | null = null
  {
    const { data, error } = await supabase
      .from('forms')
      .insert({ ...insertPayload, is_survey: true })
      .select('id, slug')
      .single()
    if (!error && data) form = data as { id: string; slug: string }
  }
  if (!form) {
    const { data, error } = await supabase
      .from('forms')
      .insert(insertPayload)
      .select('id, slug')
      .single()
    if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create survey' }
    form = data as { id: string; slug: string }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'survey.create',
    entityType: 'form',
    entityId: form.id,
    after: { title: parsed.data.title, slug: form.slug },
  })

  revalidatePath('/portal/admin/surveys')
  revalidatePath('/portal/admin/forms')
  return { ok: true, id: form.id, slug: form.slug }
}

export async function closeSurvey(id: string): Promise<SurveyActionResult> {
  await assertRole('admin')
  const res = await archiveForm(id)
  revalidatePath('/portal/admin/surveys')
  return res
}

export async function exportSurveyCSV(id: string): Promise<SurveyActionResult> {
  await assertRole('admin')
  return exportResponsesCSV(id)
}
