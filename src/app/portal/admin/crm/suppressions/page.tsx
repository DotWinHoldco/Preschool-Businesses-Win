// @anchor: cca.crm.suppressions-list
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { Shield } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ManualBlockForm } from './manual-block-form'
import { UnblockButton } from './unblock-button'

export const dynamic = 'force-dynamic'

export default async function SuppressionsPage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const { data: rows } = await supabase
    .from('email_suppressions')
    .select('id, email_normalized, reason, notes, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email suppressions</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            People who have unsubscribed, bounced, complained, or been hard-blocked. They are
            skipped automatically by every send.
          </p>
        </div>
      </div>

      <ManualBlockForm />

      {(rows ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-2">
            <div className="h-12 w-12 mx-auto rounded-full bg-[var(--color-muted)] flex items-center justify-center">
              <Shield size={20} className="text-[var(--color-muted-foreground)]" />
            </div>
            <p className="font-semibold">Nothing suppressed yet</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Bounces, complaints, and unsubscribes will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-[var(--color-border)]">
              {(rows ?? []).map((r) => (
                <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.email_normalized as string}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                      Added {new Date(r.created_at as string).toLocaleString()}
                      {r.notes && ` · ${r.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">{(r.reason as string).replace(/_/g, ' ')}</Badge>
                    <UnblockButton email={r.email_normalized as string} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
