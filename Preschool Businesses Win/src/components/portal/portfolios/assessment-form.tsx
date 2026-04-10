// @anchor: cca.assessment.form
'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Save, ChevronDown, ChevronUp } from 'lucide-react'

const RATINGS = [
  { value: 'not_yet', label: 'Not Yet', color: 'var(--color-muted-foreground)' },
  { value: 'emerging', label: 'Emerging', color: 'var(--color-warning)' },
  { value: 'developing', label: 'Developing', color: 'var(--color-secondary)' },
  { value: 'proficient', label: 'Proficient', color: 'var(--color-primary)' },
  { value: 'exceeding', label: 'Exceeding', color: 'var(--color-accent)' },
] as const

interface Domain {
  id: string
  domain_name: string
  subdomain_name: string | null
  framework: string
}

interface RatingEntry {
  learning_domain_id: string
  rating: string
  evidence_notes: string
  linked_portfolio_entry_ids: string[]
}

interface AssessmentFormProps {
  studentId: string
  studentName: string
  domains: Domain[]
  onSubmit: (data: {
    assessment_period_start: string
    assessment_period_end: string
    ratings: RatingEntry[]
  }) => void
}

export function AssessmentForm({ studentId, studentName, domains, onSubmit }: AssessmentFormProps) {
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [ratings, setRatings] = useState<Record<string, RatingEntry>>({})
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  const updateRating = (domainId: string, field: keyof RatingEntry, value: string | string[]) => {
    setRatings((prev) => ({
      ...prev,
      [domainId]: {
        ...prev[domainId],
        learning_domain_id: domainId,
        rating: prev[domainId]?.rating ?? '',
        evidence_notes: prev[domainId]?.evidence_notes ?? '',
        linked_portfolio_entry_ids: prev[domainId]?.linked_portfolio_entry_ids ?? [],
        [field]: value,
      },
    }))
  }

  const toggleExpand = (id: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Group domains by framework and domain_name
  const grouped: Record<string, Record<string, Domain[]>> = {}
  for (const d of domains) {
    if (!grouped[d.framework]) grouped[d.framework] = {}
    if (!grouped[d.framework][d.domain_name]) grouped[d.framework][d.domain_name] = []
    grouped[d.framework][d.domain_name].push(d)
  }

  const handleSubmit = async () => {
    if (!periodStart || !periodEnd) return
    setSubmitting(true)
    try {
      const ratingsList = Object.values(ratings).filter((r) => r.rating)
      onSubmit({
        assessment_period_start: periodStart,
        assessment_period_end: periodEnd,
        ratings: ratingsList,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const ratedCount = Object.values(ratings).filter((r) => r.rating).length

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 md:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">
          Developmental Assessment
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
          Assessing <span className="font-medium text-[var(--color-foreground)]">{studentName}</span>
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Period Start</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Period End</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      {/* Domains with ratings */}
      {Object.entries(grouped).map(([framework, domainGroups]) => (
        <div key={framework} className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-muted)]">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              {framework.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </h3>
          </div>

          {Object.entries(domainGroups).map(([domainName, subDomains]) => (
            <div key={domainName} className="border-b last:border-b-0 border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => toggleExpand(`${framework}-${domainName}`)}
                className="flex w-full items-center justify-between p-3 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/50 transition-colors"
              >
                <span>{domainName}</span>
                {expandedDomains.has(`${framework}-${domainName}`) ? (
                  <ChevronUp className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                )}
              </button>

              {expandedDomains.has(`${framework}-${domainName}`) && (
                <div className="px-3 pb-3 space-y-3">
                  {subDomains.map((domain) => (
                    <div key={domain.id} className="rounded-[var(--radius)] border border-[var(--color-border)] p-3">
                      <div className="text-xs font-medium text-[var(--color-foreground)] mb-2">
                        {domain.subdomain_name ?? domain.domain_name}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {RATINGS.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => updateRating(domain.id, 'rating', r.value)}
                            className={cn(
                              'rounded-full px-2.5 py-1 text-[10px] font-medium border transition-all',
                              ratings[domain.id]?.rating === r.value
                                ? 'border-transparent text-white'
                                : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-current'
                            )}
                            style={
                              ratings[domain.id]?.rating === r.value
                                ? { backgroundColor: r.color, borderColor: r.color }
                                : undefined
                            }
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={ratings[domain.id]?.evidence_notes ?? ''}
                        onChange={(e) => updateRating(domain.id, 'evidence_notes', e.target.value)}
                        rows={2}
                        placeholder="Evidence notes..."
                        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Submit */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-muted-foreground)]">
          {ratedCount} of {domains.length} domains rated
        </span>
        <button
          onClick={handleSubmit}
          disabled={!periodStart || !periodEnd || ratedCount === 0 || submitting}
          className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {submitting ? 'Saving...' : 'Complete Assessment'}
        </button>
      </div>
    </div>
  )
}
