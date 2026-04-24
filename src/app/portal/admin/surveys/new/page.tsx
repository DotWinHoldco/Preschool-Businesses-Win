// @anchor: cca.survey.new-page
// Wrapper: creates a new survey (form row with is_survey=true) via server action,
// then redirects to the form builder. Requires explicit user click so we don't
// spawn rows on every page visit.

import { redirect } from 'next/navigation'
import { createSurvey } from '@/lib/actions/surveys/survey-actions'

async function createSurveyAction(formData: FormData) {
  'use server'
  const title = (formData.get('title') as string) || 'Untitled Survey'
  const description = (formData.get('description') as string) || undefined
  const res = await createSurvey({ title, description })
  if (res.ok && res.id) {
    redirect(`/portal/admin/forms/${res.id}/edit`)
  }
  redirect(`/portal/admin/surveys?error=${encodeURIComponent(res.error ?? 'Failed')}`)
}

export default function NewSurveyPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Create Survey
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Start with a title and optional description. You&apos;ll be taken to the builder next to
          add questions.
        </p>
      </div>
      <form action={createSurveyAction} className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
            Survey title
          </span>
          <input
            name="title"
            required
            defaultValue="Untitled Survey"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-foreground)',
            }}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
            Description (optional)
          </span>
          <textarea
            name="description"
            rows={3}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-foreground)',
            }}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
          }}
        >
          Create &amp; Edit
        </button>
      </form>
    </div>
  )
}
