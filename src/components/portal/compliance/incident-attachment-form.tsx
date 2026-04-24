'use client'

// @anchor: cca.compliance.incident-attachment-form

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addIncidentAttachment } from '@/lib/actions/compliance/incidents'

export function IncidentAttachmentForm({ incidentId }: { incidentId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ file_path: '', file_name: '', attachment_type: '' })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await addIncidentAttachment({
        incident_id: incidentId,
        file_path: form.file_path,
        file_name: form.file_name || null,
        attachment_type: form.attachment_type || null,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed to add attachment')
        return
      }
      setForm({ file_path: '', file_name: '', attachment_type: '' })
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Input
          required
          placeholder="File path (storage)"
          value={form.file_path}
          onChange={(e) => setForm((s) => ({ ...s, file_path: e.target.value }))}
        />
        <Input
          placeholder="Display name"
          value={form.file_name}
          onChange={(e) => setForm((s) => ({ ...s, file_name: e.target.value }))}
        />
        <Input
          placeholder="Type (e.g. photo, pdf)"
          value={form.attachment_type}
          onChange={(e) => setForm((s) => ({ ...s, attachment_type: e.target.value }))}
        />
      </div>
      {error && (
        <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" size="sm" loading={pending}>
          Add attachment
        </Button>
      </div>
    </form>
  )
}
