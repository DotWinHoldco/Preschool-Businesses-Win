'use client'

// @anchor: platform.form-builder.row-actions
// Per-row action buttons (Edit / Duplicate / Archive / Delete) for the forms list.

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { duplicateForm, archiveForm, deleteFormHard } from '@/lib/actions/forms/admin'

type Props = {
  formId: string
  isArchived: boolean
  isSystemPrimary: boolean
}

export function FormRowActions({ formId, isArchived, isSystemPrimary }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) {
        setError(res.error ?? 'Failed')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/portal/admin/forms/${formId}/edit`}>
        <Button size="sm" variant="secondary" type="button">
          Edit
        </Button>
      </Link>
      <Button
        size="sm"
        variant="secondary"
        type="button"
        disabled={isPending}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          run(() => duplicateForm(formId))
        }}
      >
        Duplicate
      </Button>
      {!isArchived && (
        <Button
          size="sm"
          variant="ghost"
          type="button"
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            run(() => archiveForm(formId))
          }}
        >
          Archive
        </Button>
      )}
      {!isSystemPrimary && (
        <Button
          size="sm"
          variant="danger"
          type="button"
          disabled={isPending}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (typeof window !== 'undefined') {
              const ok = window.confirm(
                'Delete this form and all responses? This cannot be undone.',
              )
              if (!ok) return
            }
            run(() => deleteFormHard(formId))
          }}
        >
          Delete
        </Button>
      )}
      {error && (
        <span className="text-xs" style={{ color: 'var(--color-destructive)' }}>
          {error}
        </span>
      )}
    </div>
  )
}
