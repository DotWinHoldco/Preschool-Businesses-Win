// @anchor: cca.training.admin-page

import { TrainingClient } from '@/components/portal/training/training-client'

export default function AdminTrainingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Staff Training Overview
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Track certifications, expirations, and compliance across your team.
        </p>
      </div>
      <TrainingClient />
    </div>
  )
}
