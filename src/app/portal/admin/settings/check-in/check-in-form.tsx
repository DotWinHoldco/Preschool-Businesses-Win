'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { saveCheckinSettings } from '@/lib/actions/settings/save-actions'
import type { CheckinSettings } from '@/lib/schemas/settings'

interface Props {
  initialValues: CheckinSettings
}

export function CheckinSettingsForm({ initialValues }: Props) {
  const [form, setForm] = useState<CheckinSettings>(initialValues)
  const [newQuestion, setNewQuestion] = useState('')
  const [isPending, startTransition] = useTransition()

  function save(next: CheckinSettings) {
    startTransition(async () => {
      const result = await saveCheckinSettings(next)
      if (result.ok) {
        toast({ variant: 'success', title: 'Check-in settings saved' })
      } else {
        toast({ variant: 'error', title: 'Save failed', description: result.error })
      }
    })
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    save(form)
  }

  function addQuestion() {
    const q = newQuestion.trim()
    if (!q) return
    setForm((f) => ({ ...f, screening_questions: [...f.screening_questions, q] }))
    setNewQuestion('')
  }

  function removeQuestion(index: number) {
    setForm((f) => ({
      ...f,
      screening_questions: f.screening_questions.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal/admin/settings"
          className="text-sm hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          &larr; Back to Settings
        </Link>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Check-in / Kiosk Mode
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          QR code settings, kiosk timeout, and health screening questions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kiosk Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  QR Code Rotation (seconds)
                </label>
                <Input
                  type="number"
                  min={10}
                  max={300}
                  value={form.qr_rotation_seconds}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, qr_rotation_seconds: Number(e.target.value) }))
                  }
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                  How often the check-in QR code refreshes for security
                </p>
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Kiosk Auto-Logout (seconds)
                </label>
                <Input
                  type="number"
                  min={15}
                  max={600}
                  value={form.kiosk_timeout_seconds}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, kiosk_timeout_seconds: Number(e.target.value) }))
                  }
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                  Idle timeout before returning to scan screen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Health Screening Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
            Parents answer these questions during check-in. A &ldquo;Yes&rdquo; answer flags the
            entry for staff review.
          </p>
          <ul className="space-y-2 mb-4">
            {form.screening_questions.map((q, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                  {q}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="ml-2 p-1 rounded hover:bg-[var(--color-muted)]"
                  aria-label="Remove question"
                >
                  <X className="h-3.5 w-3.5" style={{ color: 'var(--color-muted-foreground)' }} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Add a screening question..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addQuestion()
                }
              }}
            />
            <Button type="button" size="sm" onClick={addQuestion} disabled={!newQuestion.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--color-muted-foreground)' }}>
            Questions save when you click &ldquo;Save Changes&rdquo; above.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
