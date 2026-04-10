// @anchor: cca.survey.results-dashboard
// Survey results overview with response counts and breakdown

import { NPSGauge } from './nps-gauge'

interface QuestionResult { id: string; question_text: string; question_type: string; responses: Array<{ value: string; count: number }> }
interface ResultsDashboardProps { surveyTitle: string; totalResponses: number; npsScore?: number; questionResults: QuestionResult[] }

export function ResultsDashboard({ surveyTitle, totalResponses, npsScore, questionResults }: ResultsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>{surveyTitle}</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>{totalResponses} total responses</p>
      </div>
      {npsScore !== undefined && <NPSGauge score={npsScore} responseCount={totalResponses} />}
      {questionResults.map((q) => {
        const maxCount = Math.max(...q.responses.map((r) => r.count), 1)
        return (
          <div key={q.id} className="rounded-lg border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-foreground)' }}>{q.question_text}</h3>
            <div className="space-y-2">
              {q.responses.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm w-20 text-right flex-shrink-0" style={{ color: 'var(--color-foreground)' }}>{r.value}</span>
                  <div className="flex-1 h-6 rounded overflow-hidden" style={{ backgroundColor: 'var(--color-muted)' }}>
                    <div className="h-full rounded transition-all duration-500" style={{ width: `${(r.count / maxCount) * 100}%`, backgroundColor: 'var(--color-primary)' }} />
                  </div>
                  <span className="text-sm w-10 flex-shrink-0" style={{ color: 'var(--color-muted-foreground)' }}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
