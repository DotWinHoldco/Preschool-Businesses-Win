// @anchor: cca.crm.campaigns-list
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Send, Mail, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const { data: campaigns } = await supabase
    .from('email_campaigns')
    .select(
      'id, name, type, status, recipient_count, opened_count, clicked_count, scheduled_at, sent_at, created_at',
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            One-shot broadcasts and multi-step drip sequences. Sends use your verified Resend
            domain.
          </p>
        </div>
        <Link href="/portal/admin/crm/campaigns/new">
          <Button>
            <Plus size={16} />
            New campaign
          </Button>
        </Link>
      </div>
      {(campaigns ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-full bg-[var(--color-muted)] flex items-center justify-center">
              <Send size={20} className="text-[var(--color-muted-foreground)]" />
            </div>
            <p className="font-semibold">No campaigns yet</p>
            <p className="text-sm text-[var(--color-muted-foreground)] max-w-md mx-auto">
              Send a one-shot broadcast or build a multi-step drip. Every campaign uses an audience
              and one or more templates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(campaigns ?? []).map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <Link href={`/portal/admin/crm/campaigns/${c.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold truncate">{c.name as string}</h2>
                    <StatusBadge status={c.status as string} type={c.type as string} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                    <span className="inline-flex items-center gap-1">
                      <Mail size={11} />
                      {c.type === 'drip' ? 'Drip' : 'Broadcast'}
                    </span>
                    <span>·</span>
                    <span>{(c.recipient_count as number).toLocaleString()} recipients</span>
                    {c.opened_count != null &&
                      c.recipient_count != null &&
                      (c.recipient_count as number) > 0 && (
                        <>
                          <span>·</span>
                          <span>
                            {Math.round(
                              ((c.opened_count as number) / (c.recipient_count as number)) * 100,
                            )}
                            % open
                          </span>
                        </>
                      )}
                    {c.scheduled_at && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={10} />
                          Scheduled {new Date(c.scheduled_at as string).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, type }: { status: string; type: string }) {
  const variant: 'success' | 'secondary' | 'warning' | 'default' | 'outline' =
    status === 'sent'
      ? 'success'
      : status === 'sending'
        ? 'default'
        : status === 'paused'
          ? 'warning'
          : status === 'archived'
            ? 'outline'
            : 'secondary'
  const label = type === 'drip' && status === 'sending' ? 'Running' : status
  return <Badge variant={variant}>{label}</Badge>
}
