// @anchor: cca.analytics.traffic-page
// Website traffic dashboard: visitors, conversions, funnel, attribution,
// devices, and geo for the tenant marketing site. Data source is the
// analytics_events / analytics_sessions / analytics_visitors tables
// populated by /api/collect.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RealtimeVisitors } from '@/components/portal/analytics/realtime-visitors'
import { TrafficTabs } from '@/components/portal/analytics/traffic-tabs'
import { Users, MousePointerClick, Target, Percent, Globe2, Smartphone } from 'lucide-react'

interface SearchParams {
  range?: string
}

type RangeKey = 'today' | '7d' | '30d' | '90d'

function rangeStart(key: RangeKey): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  if (key === 'today') return d
  const days = key === '7d' ? 7 : key === '30d' ? 30 : 90
  d.setUTCDate(d.getUTCDate() - days + 1)
  return d
}

function rangeLabel(key: RangeKey): string {
  if (key === 'today') return 'Today'
  if (key === '7d') return 'Last 7 days'
  if (key === '30d') return 'Last 30 days'
  return 'Last 90 days'
}

function isRangeKey(v: string | undefined): v is RangeKey {
  return v === 'today' || v === '7d' || v === '30d' || v === '90d'
}

function hostOf(url: string | null | undefined): string {
  if (!url) return '(direct)'
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return '(direct)'
  }
}

export default async function TrafficAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const range: RangeKey = isRangeKey(sp.range) ? sp.range : '7d'

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const startIso = rangeStart(range).toISOString()

  const [eventsRes, sessionsRes, sitesRes] = await Promise.all([
    supabase
      .from('analytics_events')
      .select(
        'event_type, event_name, visitor_id, session_id, page_path, referrer, utm_source, utm_medium, utm_campaign, device_type, browser, os, country, city, created_at',
      )
      .eq('tenant_id', tenantId)
      .gte('created_at', startIso)
      .order('created_at', { ascending: false })
      .limit(50000),
    supabase
      .from('analytics_sessions')
      .select('id, is_bounce, duration_seconds, converted, started_at')
      .eq('tenant_id', tenantId)
      .gte('started_at', startIso)
      .limit(50000),
    supabase
      .from('analytics_sites')
      .select('site_key, name, origins, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .limit(5),
  ])

  const events = eventsRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const sites = sitesRes.data ?? []

  // --- Overview aggregates ---
  const visitors = new Set<string>()
  const sessionIds = new Set<string>()
  let pageViews = 0
  const funnel = {
    page_view: new Set<string>(),
    enrollment_click: new Set<string>(),
    enrollment_started: new Set<string>(),
    enrollment_completed: new Set<string>(),
  }
  const pathCounts = new Map<string, number>()
  const referrerCounts = new Map<string, number>()
  const utmSourceCounts = new Map<string, number>()
  const utmCampaignCounts = new Map<string, number>()
  const deviceCounts = new Map<string, number>()
  const countryCounts = new Map<string, number>()
  const cityCounts = new Map<string, number>()
  const dailyMap = new Map<
    string,
    { visitors: Set<string>; sessions: Set<string>; pageviews: number; conversions: number }
  >()

  for (const e of events) {
    const vid = e.visitor_id as string
    visitors.add(vid)
    sessionIds.add(e.session_id as string)

    if (e.event_type === 'page_view') {
      pageViews += 1
      funnel.page_view.add(vid)
      const p = (e.page_path as string | null) ?? '/'
      pathCounts.set(p, (pathCounts.get(p) ?? 0) + 1)
    }

    if (e.event_name === 'enrollment_click') funnel.enrollment_click.add(vid)
    if (e.event_name === 'enrollment_started') funnel.enrollment_started.add(vid)
    if (e.event_name === 'enrollment_completed') funnel.enrollment_completed.add(vid)

    const host = hostOf(e.referrer as string | null)
    referrerCounts.set(host, (referrerCounts.get(host) ?? 0) + 1)

    if (e.utm_source)
      utmSourceCounts.set(
        e.utm_source as string,
        (utmSourceCounts.get(e.utm_source as string) ?? 0) + 1,
      )
    if (e.utm_campaign)
      utmCampaignCounts.set(
        e.utm_campaign as string,
        (utmCampaignCounts.get(e.utm_campaign as string) ?? 0) + 1,
      )

    if (e.device_type)
      deviceCounts.set(
        e.device_type as string,
        (deviceCounts.get(e.device_type as string) ?? 0) + 1,
      )
    if (e.country)
      countryCounts.set(e.country as string, (countryCounts.get(e.country as string) ?? 0) + 1)
    if (e.city) {
      const k = `${e.city}, ${e.country ?? ''}`
      cityCounts.set(k, (cityCounts.get(k) ?? 0) + 1)
    }

    const day = (e.created_at as string).slice(0, 10)
    const bucket = dailyMap.get(day) ?? {
      visitors: new Set(),
      sessions: new Set(),
      pageviews: 0,
      conversions: 0,
    }
    bucket.visitors.add(vid)
    bucket.sessions.add(e.session_id as string)
    if (e.event_type === 'page_view') bucket.pageviews += 1
    if (e.event_type === 'conversion') bucket.conversions += 1
    dailyMap.set(day, bucket)
  }

  const bouncedSessions = sessions.filter((s) => s.is_bounce).length
  const bounceRate = sessions.length ? (bouncedSessions / sessions.length) * 100 : 0
  const avgDuration = sessions.length
    ? Math.round(
        sessions.reduce((sum, s) => sum + (s.duration_seconds as number), 0) / sessions.length,
      )
    : 0
  const convertedSessions = sessions.filter((s) => s.converted).length
  const conversionRate = sessions.length ? (convertedSessions / sessions.length) * 100 : 0

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({
      date,
      visitors: b.visitors.size,
      sessions: b.sessions.size,
      pageviews: b.pageviews,
      conversions: b.conversions,
    }))

  const topPaths = Array.from(pathCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
  const topReferrers = Array.from(referrerCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
  const topUtmSources = Array.from(utmSourceCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
  const topUtmCampaigns = Array.from(utmCampaignCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
  const devices = Array.from(deviceCounts.entries()).sort(([, a], [, b]) => b - a)
  const countries = Array.from(countryCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
  const cities = Array.from(cityCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  const funnelRows = [
    { label: 'Page view', value: funnel.page_view.size },
    { label: 'Enrollment click', value: funnel.enrollment_click.size },
    { label: 'Enrollment started', value: funnel.enrollment_started.size },
    { label: 'Enrollment completed', value: funnel.enrollment_completed.size },
  ]
  const topFunnel = funnelRows[0].value
  const activeSite = sites[0] as
    | { site_key?: string; name?: string; origins?: string[] }
    | undefined

  return (
    <div className="space-y-6">
      {/* Header + range toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Website Traffic</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {activeSite?.name ?? 'Marketing site'} · {rangeLabel(range)}
            {activeSite?.origins && activeSite.origins.length > 0 && (
              <span className="ml-2 text-[var(--color-muted-foreground)]">
                · {activeSite.origins.map((o) => o.replace(/^https?:\/\//, '')).join(', ')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <RealtimeVisitors />
          <div className="flex items-center gap-1 rounded-full border border-[var(--color-border)] p-1">
            {(['today', '7d', '30d', '90d'] as RangeKey[]).map((r) => (
              <a
                key={r}
                href={`/portal/admin/analytics/traffic?range=${r}`}
                className={`px-3 py-1.5 text-xs rounded-full min-h-[36px] flex items-center ${
                  r === range
                    ? 'bg-[var(--color-primary)] text-white font-semibold'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                }`}
              >
                {r === 'today' ? 'Today' : r.toUpperCase()}
              </a>
            ))}
          </div>
        </div>
      </div>

      <TrafficTabs active="overview" />

      {/* KPI grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Users}
          label="Unique visitors"
          value={visitors.size.toLocaleString()}
          color="var(--color-primary)"
        />
        <Kpi
          icon={MousePointerClick}
          label="Page views"
          value={pageViews.toLocaleString()}
          color="var(--color-primary)"
        />
        <Kpi
          icon={Target}
          label="Enrollments completed"
          value={funnel.enrollment_completed.size.toLocaleString()}
          color="var(--color-success)"
        />
        <Kpi
          icon={Percent}
          label="Conversion rate"
          value={conversionRate.toFixed(1) + '%'}
          color="var(--color-success)"
        />
        <Kpi
          icon={Users}
          label="Sessions"
          value={sessionIds.size.toLocaleString()}
          color="var(--color-primary)"
        />
        <Kpi
          icon={Percent}
          label="Bounce rate"
          value={bounceRate.toFixed(1) + '%'}
          color="var(--color-warning, var(--color-primary))"
        />
        <Kpi
          icon={Target}
          label="Enrollment clicks"
          value={funnel.enrollment_click.size.toLocaleString()}
          color="var(--color-primary)"
        />
        <Kpi
          icon={MousePointerClick}
          label="Avg session duration"
          value={formatDuration(avgDuration)}
          color="var(--color-primary)"
        />
      </div>

      {/* Funnel */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Conversion funnel
            </h2>
            <span className="text-xs text-[var(--color-muted-foreground)]">
              Unique visitors at each step
            </span>
          </div>
          <div className="space-y-2">
            {funnelRows.map((row, i) => {
              const pct = topFunnel ? (row.value / topFunnel) * 100 : 0
              const dropPct =
                i > 0 && funnelRows[i - 1].value
                  ? (1 - row.value / funnelRows[i - 1].value) * 100
                  : 0
              return (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-foreground)] font-medium">{row.label}</span>
                    <span className="text-[var(--color-muted-foreground)]">
                      {row.value.toLocaleString()}
                      {i > 0 && dropPct > 0 && (
                        <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
                          ↓ {dropPct.toFixed(1)}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--color-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-[width]"
                      style={{ width: `${Math.max(pct, row.value ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sparkline: daily */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Daily trend</h2>
          {daily.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No data for this range yet.
            </p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {daily.map((d) => {
                const maxV = Math.max(...daily.map((x) => x.visitors), 1)
                const h = Math.max(4, (d.visitors / maxV) * 100)
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div
                      className="w-full bg-[var(--color-primary)] rounded-sm"
                      style={{ height: `${h}%` }}
                      title={`${d.date}: ${d.visitors} visitors`}
                    />
                    <span className="text-[10px] text-[var(--color-muted-foreground)] truncate w-full text-center">
                      {d.date.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attribution + top pages grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <List
          title="Top pages"
          icon={MousePointerClick}
          rows={topPaths}
          empty="No page views yet."
        />
        <List title="Top referrers" icon={Globe2} rows={topReferrers} empty="No referrers yet." />
        <List
          title="UTM sources"
          icon={Target}
          rows={topUtmSources}
          empty="No campaign traffic yet."
        />
        <List
          title="UTM campaigns"
          icon={Target}
          rows={topUtmCampaigns}
          empty="No campaign traffic yet."
        />
      </div>

      {/* Devices + geo */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-[var(--color-muted-foreground)]" />
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">Devices</h2>
            </div>
            <div className="space-y-2">
              {devices.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">No data.</p>
              ) : (
                devices.map(([label, count]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <Badge variant="outline">{label}</Badge>
                    <span className="text-[var(--color-muted-foreground)]">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Globe2 size={18} className="text-[var(--color-muted-foreground)]" />
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                Top countries
              </h2>
            </div>
            {countries.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">No geo data.</p>
            ) : (
              <ul className="space-y-2">
                {countries.map(([label, count]) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-foreground)]">{label}</span>
                    <span className="text-[var(--color-muted-foreground)]">
                      {count.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Globe2 size={18} className="text-[var(--color-muted-foreground)]" />
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">Top cities</h2>
            </div>
            {cities.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">No geo data.</p>
            ) : (
              <ul className="space-y-2">
                {cities.map(([label, count]) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-foreground)]">{label}</span>
                    <span className="text-[var(--color-muted-foreground)]">
                      {count.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users
  label: string
  value: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: color + '18' }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[var(--color-muted-foreground)] truncate">{label}</p>
          <p className="text-xl font-bold text-[var(--color-foreground)] truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function List({
  title,
  icon: Icon,
  rows,
  empty,
}: {
  title: string
  icon: typeof Users
  rows: [string, number][]
  empty: string
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-[var(--color-muted-foreground)]" />
          <h2 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map(([label, count]) => (
              <li key={label} className="flex items-center justify-between text-sm gap-3">
                <span className="text-[var(--color-foreground)] truncate" title={label}>
                  {label}
                </span>
                <span className="text-[var(--color-muted-foreground)] shrink-0">
                  {count.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}
