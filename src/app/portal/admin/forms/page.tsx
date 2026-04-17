// @anchor: platform.form-builder.list-page

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

const statusVariant: Record<string, 'success' | 'warning' | 'outline'> = {
  published: 'success',
  draft: 'warning',
  archived: 'outline',
}

export default async function FormsListPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: forms } = await supabase
    .from('forms')
    .select('id, title, slug, status, mode, access_control, created_at, published_at, is_system_form, system_form_key, fee_enabled, fee_amount_cents, parent_form_id, instance_label')
    .order('created_at', { ascending: false })

  const { data: responseCounts } = await supabase
    .from('form_responses')
    .select('form_id')

  const countMap = new Map<string, number>()
  for (const r of responseCounts || []) {
    countMap.set(r.form_id, (countMap.get(r.form_id) || 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Forms</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
            Build and manage forms for enrollment, surveys, waivers, and more.
          </p>
        </div>
        <Link href="/portal/admin/forms/new">
          <Button>+ New Form</Button>
        </Link>
      </div>

      {(!forms || forms.length === 0) ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No forms created yet.</p>
          <Link href="/portal/admin/forms/new">
            <Button className="mt-4">Create your first form</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map(form => (
            <Link key={form.id} href={`/portal/admin/forms/${form.id}/edit`}
              className="flex items-center justify-between p-4 rounded-lg border transition-colors hover:shadow-sm"
              style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{form.title}</p>
                  <Badge variant={statusVariant[form.status] || 'outline'}>{form.status}</Badge>
                  <Badge variant="outline" className="text-xs">{form.mode}</Badge>
                  {form.is_system_form && (
                    <Badge variant="success" className="text-xs inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      System
                    </Badge>
                  )}
                  {form.parent_form_id && form.instance_label && (
                    <Badge variant="outline" className="text-xs">{form.instance_label}</Badge>
                  )}
                  {form.fee_enabled && form.fee_amount_cents !== null && (
                    <Badge variant="success" className="text-xs">
                      ${((form.fee_amount_cents ?? 0) / 100).toFixed(2)} fee
                    </Badge>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                  {countMap.get(form.id) || 0} responses · {form.access_control} · /{form.slug}
                </p>
              </div>
              <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                {form.published_at ? `Published ${new Date(form.published_at).toLocaleDateString()}` : 'Draft'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
