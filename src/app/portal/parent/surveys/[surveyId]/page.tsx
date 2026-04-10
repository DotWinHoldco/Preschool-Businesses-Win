// @anchor: cca.survey.take-page
// Parent survey response page — dynamic route with async params (Next.js 16)

interface PageProps {
  params: Promise<{ surveyId: string }>
}

export default async function TakeSurveyPage({ params }: PageProps) {
  const { surveyId } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Take Survey
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Survey ID: {surveyId}
        </p>
      </div>
    </div>
  )
}
