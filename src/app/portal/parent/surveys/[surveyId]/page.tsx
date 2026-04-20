// @anchor: cca.survey.take-page
// Parent survey response page — dynamic route with async params (Next.js 16)

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'

interface PageProps {
  params: Promise<{ surveyId: string }>
}

export default async function TakeSurveyPage({ params }: PageProps) {
  const { surveyId } = await params

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch survey
  const { data: survey } = await supabase
    .from('surveys')
    .select('id, title, description, status, anonymous, opens_at, closes_at')
    .eq('id', surveyId)
    .eq('tenant_id', tenantId)
    .single()

  if (!survey) notFound()

  // Check if survey is active
  const now = new Date()
  const isOpen = survey.status === 'active'
    && (!survey.opens_at || new Date(survey.opens_at) <= now)
    && (!survey.closes_at || new Date(survey.closes_at) >= now)

  // Check if user already responded
  const { data: existingResponse } = await supabase
    .from('survey_responses')
    .select('id')
    .eq('survey_id', surveyId)
    .eq('respondent_id', userId)
    .eq('tenant_id', tenantId)
    .limit(1)
    .single()

  const alreadyResponded = !!existingResponse

  // Fetch questions
  const { data: questions } = await supabase
    .from('survey_questions')
    .select('id, question_text, question_type, options, required, sort_order')
    .eq('survey_id', surveyId)
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  if (alreadyResponded) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
              {survey.description}
            </p>
          )}
        </div>
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            You&apos;ve already submitted a response.
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Thank you for your feedback!
          </p>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
              {survey.description}
            </p>
          )}
        </div>
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            This survey is not currently accepting responses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          {survey.title}
        </h1>
        {survey.description && (
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
            {survey.description}
          </p>
        )}
        {survey.anonymous && (
          <p className="mt-2 text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
            This survey is anonymous. Your identity will not be linked to your responses.
          </p>
        )}
      </div>

      {(questions ?? []).length > 0 ? (
        <form className="space-y-6">
          {(questions ?? []).map((q, idx) => (
            <div
              key={q.id}
              className="rounded-xl p-5"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <label className="block">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  {idx + 1}. {q.question_text}
                  {q.required && (
                    <span style={{ color: 'var(--color-destructive)' }}> *</span>
                  )}
                </span>
              </label>

              <div className="mt-3">
                {q.question_type === 'text' && (
                  <textarea
                    name={`question_${q.id}`}
                    required={q.required}
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                    }}
                    placeholder="Type your response..."
                  />
                )}

                {q.question_type === 'single_choice' && q.options && (
                  <div className="space-y-2">
                    {(q.options as string[]).map((option: string) => (
                      <label key={option} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name={`question_${q.id}`}
                          value={option}
                          required={q.required}
                          className="h-4 w-4"
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.question_type === 'multiple_choice' && q.options && (
                  <div className="space-y-2">
                    {(q.options as string[]).map((option: string) => (
                      <label key={option} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name={`question_${q.id}`}
                          value={option}
                          className="h-4 w-4"
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.question_type === 'rating' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <label key={n} className="flex flex-col items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`question_${q.id}`}
                          value={n}
                          required={q.required}
                          className="h-4 w-4"
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{n}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Fallback for unknown question types */}
                {!['text', 'single_choice', 'multiple_choice', 'rating'].includes(q.question_type) && (
                  <textarea
                    name={`question_${q.id}`}
                    required={q.required}
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                    }}
                    placeholder="Type your response..."
                  />
                )}
              </div>
            </div>
          ))}

          <button
            type="submit"
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Submit Response
          </button>
        </form>
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No questions found for this survey.
          </p>
        </div>
      )}
    </div>
  )
}
