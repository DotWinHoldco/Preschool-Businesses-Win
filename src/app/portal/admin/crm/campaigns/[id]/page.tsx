// @anchor: cca.crm.campaign-detail
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Mail, Eye, MousePointer, AlertCircle, UserMinus } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CampaignActions } from './campaign-actions'

export const dynamic = 'force-dynamic'

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  if (!campaign) notFound()

  const [{ data: steps }, { data: sends }] = await Promise.all([
    supabase
      .from('email_campaign_steps')
      .select(
        'id, step_index, template_id, delay_minutes, email_templates:template_id(name, subject)',
      )
      .eq('campaign_id', id)
      .order('step_index'),
    supabase
      .from('email_sends')
      .select('id, status, opened_count, click_count, bounced_at, unsubscribed_at')
      .eq('campaign_id', id),
  ])

  const totalSent = sends?.length ?? 0
  const opened = (sends ?? []).filter((s) => (s.opened_count as number) > 0).length
  const clicked = (sends ?? []).filter((s) => (s.click_count as number) > 0).length
  const bounced = (sends ?? []).filter((s) => s.bounced_at).length
  const unsubscribed = (sends ?? []).filter((s) => s.unsubscribed_at).length
  const pct = (n: number) => (totalSent > 0 ? `${Math.round((n / totalSent) * 100)}%` : '0%')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/admin/crm/campaigns"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name as string}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-[var(--color-muted-foreground)]">
              <Badge>{campaign.type as string}</Badge>
              <Badge variant={campaign.status === 'sent' ? 'success' : 'secondary'}>
                {campaign.status as string}
              </Badge>
              {campaign.sent_at && (
                <span>· Sent {new Date(campaign.sent_at as string).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
        <CampaignActions
          campaignId={id}
          status={campaign.status as string}
          type={campaign.type as string}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon={Mail} label="Sent" value={totalSent.toLocaleString()} />
        <StatCard icon={Eye} label="Opened" value={`${opened.toLocaleString()} (${pct(opened)})`} />
        <StatCard
          icon={MousePointer}
          label="Clicked"
          value={`${clicked.toLocaleString()} (${pct(clicked)})`}
        />
        <StatCard
          icon={AlertCircle}
          label="Bounced"
          value={`${bounced.toLocaleString()} (${pct(bounced)})`}
        />
        <StatCard
          icon={UserMinus}
          label="Unsub'd"
          value={`${unsubscribed.toLocaleString()} (${pct(unsubscribed)})`}
        />
      </div>

      {campaign.type === 'drip' && (steps ?? []).length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3">Drip steps</h3>
            <ol className="space-y-2">
              {(steps ?? []).map((s) => {
                const t = s.email_templates as unknown as { name: string; subject: string } | null
                return (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="h-6 w-6 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center text-xs font-semibold">
                      {(s.step_index as number) + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{t?.name ?? '—'}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                        {t?.subject}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                      {(s.step_index as number) === 0 ? 'after' : 'then wait'}{' '}
                      {s.delay_minutes as number}m
                    </span>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Send
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-wider">
          <Icon size={11} />
          {label}
        </div>
        <p className="text-lg font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}
