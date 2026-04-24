'use client'

// @anchor: cca.compliance.incident-involved-form

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { addIncidentInvolved } from '@/lib/actions/compliance/incidents'

export function IncidentInvolvedForm({ incidentId }: { incidentId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    party_type: 'witness_staff' as
      | 'injured_student'
      | 'injured_staff'
      | 'witness_student'
      | 'witness_staff'
      | 'other',
    other_name: '',
    statement: '',
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await addIncidentInvolved({
        incident_id: incidentId,
        party_type: form.party_type,
        other_name: form.other_name || null,
        statement: form.statement || null,
      })
      if (!res.ok) {
        setError(res.error ?? 'Failed to add party')
        return
      }
      setForm({ party_type: 'witness_staff', other_name: '', statement: '' })
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Select
          value={form.party_type}
          onChange={(e) =>
            setForm((s) => ({ ...s, party_type: e.target.value as typeof form.party_type }))
          }
        >
          <option value="injured_student">Injured student</option>
          <option value="injured_staff">Injured staff</option>
          <option value="witness_student">Witness (student)</option>
          <option value="witness_staff">Witness (staff)</option>
          <option value="other">Other</option>
        </Select>
        <Input
          placeholder="Name"
          value={form.other_name}
          onChange={(e) => setForm((s) => ({ ...s, other_name: e.target.value }))}
        />
      </div>
      <Textarea
        rows={2}
        placeholder="Statement (optional)"
        value={form.statement}
        onChange={(e) => setForm((s) => ({ ...s, statement: e.target.value }))}
      />
      {error && (
        <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" size="sm" loading={pending}>
          Add party
        </Button>
      </div>
    </form>
  )
}
