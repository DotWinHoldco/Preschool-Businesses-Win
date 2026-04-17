'use client'

// @anchor: platform.form-builder.create-page

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createForm } from '@/lib/actions/forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CreateFormInput } from '@/lib/schemas/form'

export default function NewFormPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<'conversational' | 'document'>('conversational')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string>()

  async function handleCreate() {
    if (!title.trim()) return
    setIsCreating(true)
    setError(undefined)

    const result = await createForm({ title, mode } as CreateFormInput)
    setIsCreating(false)

    if (result.ok && result.id) {
      router.push(`/portal/admin/forms/${result.id}/edit`)
    } else {
      setError(result.error || 'Failed to create form')
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>New Form</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Choose a name and mode to get started.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Form title</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Enrollment Application" autoFocus />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Mode</label>
          <div className="grid grid-cols-2 gap-3">
            {(['conversational', 'document'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className="p-4 rounded-lg border-2 text-left transition-all"
                style={{ borderColor: mode === m ? 'var(--color-primary)' : 'var(--color-border)' }}>
                <p className="text-sm font-semibold capitalize">{m}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                  {m === 'conversational' ? 'One question at a time, Typeform-style' : 'Multi-section scrollable form'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>{error}</p>}

      <Button onClick={handleCreate} disabled={isCreating || !title.trim()}>
        {isCreating ? 'Creating...' : 'Create Form'}
      </Button>
    </div>
  )
}
