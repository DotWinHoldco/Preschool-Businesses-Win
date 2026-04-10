// @anchor: cca.survey.detail-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Survey Detail | Admin Portal',
  description: 'View survey details, responses, and analytics',
}

export default async function AdminSurveyDetailPage({
  params,
}: {
  params: Promise<{ surveyId: string }>
}) {
  const { surveyId } = await params

  const mockSurvey = {
    id: surveyId,
    title: 'Spring 2026 Parent Satisfaction Survey',
    status: 'active' as const,
    anonymous: true,
    targetAudience: 'All Parents',
    opens: '2026-04-01',
    closes: '2026-04-30',
    totalResponses: 47,
    questions: [
      { id: '1', text: 'How satisfied are you with the overall quality of care?', type: 'rating_1_5', avgRating: 4.6 },
      { id: '2', text: 'How likely are you to recommend our school?', type: 'nps', avgRating: 8.7 },
      { id: '3', text: 'How satisfied are you with communication from teachers?', type: 'rating_1_5', avgRating: 4.3 },
      { id: '4', text: 'What could we improve?', type: 'text', avgRating: null },
    ],
  }

  const npsScore = 72

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {mockSurvey.title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {mockSurvey.targetAudience} &middot; {mockSurvey.opens} to {mockSurvey.closes}
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: mockSurvey.status === 'active' ? 'var(--color-primary)' : 'var(--color-muted)',
              color: mockSurvey.status === 'active' ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
            }}
          >
            {mockSurvey.status === 'active' ? 'Active' : 'Closed'}
          </span>
          {mockSurvey.anonymous && (
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
            >
              Anonymous
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Responses', value: mockSurvey.totalResponses.toString() },
          { label: 'NPS Score', value: npsScore.toString() },
          { label: 'Avg Satisfaction', value: '4.6 / 5' },
          { label: 'Response Rate', value: '78%' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* NPS gauge */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Net Promoter Score
        </h2>
        <div className="mt-4 flex items-center gap-6">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            {npsScore}
          </div>
          <div className="flex-1 space-y-2">
            {[
              { label: 'Promoters (9-10)', pct: 82, color: 'var(--color-primary)' },
              { label: 'Passives (7-8)', pct: 12, color: 'var(--color-warning)' },
              { label: 'Detractors (0-6)', pct: 6, color: 'var(--color-destructive)' },
            ].map((seg) => (
              <div key={seg.label} className="flex items-center gap-3">
                <span className="w-32 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{seg.label}</span>
                <div className="flex-1 rounded-full" style={{ backgroundColor: 'var(--color-muted)', height: 8 }}>
                  <div className="rounded-full" style={{ backgroundColor: seg.color, width: `${seg.pct}%`, height: 8 }} />
                </div>
                <span className="w-10 text-right text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{seg.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Questions + results */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Question Results
        </h2>
        {mockSurvey.questions.map((q, i) => (
          <div
            key={q.id}
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  {i + 1}. {q.text}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  Type: {q.type.replace(/_/g, ' ')}
                </p>
              </div>
              {q.avgRating !== null && (
                <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {q.avgRating}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Export Results (PDF)
        </button>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
        >
          Export Results (CSV)
        </button>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-destructive)', color: 'var(--color-primary-foreground)' }}
        >
          Close Survey
        </button>
      </div>
    </div>
  )
}
