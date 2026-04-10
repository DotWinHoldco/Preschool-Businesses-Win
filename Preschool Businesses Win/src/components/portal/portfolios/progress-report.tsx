// @anchor: cca.portfolio.progress-report
'use client'

import { cn } from '@/lib/cn'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { Download, Printer, Share2 } from 'lucide-react'

const RATING_VALUES: Record<string, number> = {
  not_yet: 1,
  emerging: 2,
  developing: 3,
  proficient: 4,
  exceeding: 5,
}

const RATING_LABELS: Record<string, string> = {
  not_yet: 'Not Yet',
  emerging: 'Emerging',
  developing: 'Developing',
  proficient: 'Proficient',
  exceeding: 'Exceeding',
}

interface DomainRating {
  domain_name: string
  subdomain_name: string | null
  framework: string
  rating: string
  evidence_notes: string | null
}

interface PortfolioSample {
  id: string
  title: string
  entry_type: string
  narrative: string
  created_at: string
}

interface ProgressReportProps {
  studentName: string
  dateOfBirth: string
  periodStart: string
  periodEnd: string
  domains: DomainRating[]
  portfolioSamples: PortfolioSample[]
}

export function ProgressReport({
  studentName,
  dateOfBirth,
  periodStart,
  periodEnd,
  domains,
  portfolioSamples,
}: ProgressReportProps) {
  // Aggregate by domain for charts
  const domainAverages = Object.entries(
    domains.reduce<Record<string, { sum: number; count: number }>>((acc, d) => {
      if (!acc[d.domain_name]) acc[d.domain_name] = { sum: 0, count: 0 }
      acc[d.domain_name].sum += RATING_VALUES[d.rating] ?? 0
      acc[d.domain_name].count += 1
      return acc
    }, {})
  ).map(([name, { sum, count }]) => ({
    domain: name,
    average: Math.round((sum / count) * 10) / 10,
    fullMark: 5,
  }))

  const barData = domainAverages.map((d) => ({
    name: d.domain.length > 20 ? d.domain.slice(0, 18) + '...' : d.domain,
    rating: d.average,
  }))

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 print:border-none print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              Progress Report
            </h1>
            <p className="mt-1 text-lg text-[var(--color-foreground)]">{studentName}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Date of Birth: {dateOfBirth}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Assessment Period: {periodStart} to {periodEnd}
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button className="rounded-[var(--radius)] border border-[var(--color-border)] p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors">
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-[var(--radius)] border border-[var(--color-border)] p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button className="rounded-[var(--radius)] border border-[var(--color-border)] p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overview chart */}
      {domainAverages.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Domain Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip
                    formatter={(value: unknown) => { const v = Number(value ?? 0); return [RATING_LABELS[Object.entries(RATING_VALUES).find(([, rv]) => Math.round(rv) === Math.round(v))?.[0] ?? ''] ?? v.toFixed(1), 'Rating'] }}
                  />
                  <Bar dataKey="rating" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {domainAverages.length >= 3 && (
            <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Development Profile</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={domainAverages}>
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis dataKey="domain" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                    <Radar
                      dataKey="average"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed ratings */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Detailed Ratings</h3>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {domains.map((d, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    {d.subdomain_name ?? d.domain_name}
                  </span>
                  {d.subdomain_name && (
                    <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">({d.domain_name})</span>
                  )}
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    d.rating === 'exceeding' && 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
                    d.rating === 'proficient' && 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
                    d.rating === 'developing' && 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]',
                    d.rating === 'emerging' && 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
                    d.rating === 'not_yet' && 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                  )}
                >
                  {RATING_LABELS[d.rating] ?? d.rating}
                </span>
              </div>

              {/* Rating bar */}
              <div className="flex gap-0.5 my-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'h-1.5 flex-1 rounded-full',
                      level <= (RATING_VALUES[d.rating] ?? 0)
                        ? 'bg-[var(--color-primary)]'
                        : 'bg-[var(--color-border)]'
                    )}
                  />
                ))}
              </div>

              {d.evidence_notes && (
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{d.evidence_notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio samples */}
      {portfolioSamples.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Portfolio Highlights</h3>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {portfolioSamples.map((sample) => (
              <div key={sample.id} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted-foreground)]">
                    {sample.entry_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-[var(--color-muted-foreground)]">{sample.created_at}</span>
                </div>
                <h4 className="text-sm font-medium text-[var(--color-foreground)]">{sample.title}</h4>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-2">
                  {sample.narrative}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
