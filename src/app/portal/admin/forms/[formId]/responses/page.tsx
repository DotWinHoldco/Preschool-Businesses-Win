// @anchor: platform.form-builder.responses-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'

export default async function FormResponsesPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  const { formId } = await params
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: form } = await supabase.from('forms')
    .select('id, title').eq('id', formId).single()
  if (!form) notFound()

  const { data: responses } = await supabase.from('form_responses')
    .select('id, respondent_email, respondent_name, status, completed_at, created_at, ip_address')
    .eq('form_id', formId)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{form.title} — Responses</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          {responses?.length || 0} total responses
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Respondent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(!responses || responses.length === 0) ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8" style={{ color: 'var(--color-muted-foreground)' }}>
                No responses yet.
              </TableCell>
            </TableRow>
          ) : responses.map(r => (
            <TableRow key={r.id}>
              <TableCell>
                <p className="text-sm font-medium">{r.respondent_name || r.respondent_email || 'Anonymous'}</p>
                {r.respondent_email && r.respondent_name && (
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{r.respondent_email}</p>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={r.status === 'completed' ? 'success' : 'warning'}>{r.status}</Badge>
              </TableCell>
              <TableCell className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                {r.completed_at ? new Date(r.completed_at).toLocaleString() : '—'}
              </TableCell>
              <TableCell className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                {r.ip_address || '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
