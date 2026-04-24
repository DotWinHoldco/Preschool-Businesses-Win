'use client'

// @anchor: cca.family.extras-ui

import { useState, useTransition } from 'react'
import { FileText, Plus, Trash2, ShieldCheck, BadgeCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import {
  addFamilyDocument,
  deleteFamilyDocument,
  saveFamilyBillingPreferences,
  verifyPickupPhoto,
  verifyPickupId,
} from '@/lib/actions/family/family-extras'

export interface FamilyDocument {
  id: string
  document_type: string
  file_path: string
  file_name: string | null
  notes: string | null
  created_at: string
}

export interface BillingPrefs {
  autopay: boolean
  channel: 'email' | 'sms' | 'in_app'
  frequency: 'monthly' | 'weekly'
}

export interface PickupRow {
  id: string
  person_name: string
  photo_verified: boolean | null
  government_id_verified_at: string | null
}

interface Props {
  familyId: string
  documents: FamilyDocument[]
  billingPrefs: BillingPrefs
  pickups: PickupRow[]
}

const FAMILY_DOC_TYPES = [
  { value: 'insurance', label: 'Insurance' },
  { value: 'tax_form', label: 'Tax form' },
  { value: 'subsidy_docs', label: 'Subsidy docs' },
  { value: 'custody', label: 'Custody' },
  { value: 'other', label: 'Other' },
] as const

export function FamilyExtras({ familyId, documents, billingPrefs, pickups }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Document add
  const [docOpen, setDocOpen] = useState(false)
  const [docType, setDocType] = useState<string>('other')
  const [docUrl, setDocUrl] = useState('')
  const [docName, setDocName] = useState('')
  const [docNotes, setDocNotes] = useState('')

  // Billing prefs (in-card)
  const [autopay, setAutopay] = useState(billingPrefs.autopay)
  const [channel, setChannel] = useState<BillingPrefs['channel']>(billingPrefs.channel)
  const [frequency, setFrequency] = useState<BillingPrefs['frequency']>(billingPrefs.frequency)

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) => {
    setError(null)
    startTransition(async () => {
      const r = await fn()
      if (!r.ok) setError(r.error ?? 'Action failed')
      else onOk?.()
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[var(--radius)] border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 px-4 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      {/* Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Family Documents
            </CardTitle>
            <Button size="sm" variant="secondary" onClick={() => setDocOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No documents on file.</p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {documents.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a
                        href={d.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {d.file_name || d.file_path}
                      </a>
                      <Badge variant="outline" size="sm">
                        {d.document_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {d.notes && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                        {d.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (!confirm('Delete this document?')) return
                      run(() => deleteFamilyDocument({ id: d.id }))
                    }}
                    disabled={pending}
                    className="text-[var(--color-destructive)] hover:opacity-80 disabled:opacity-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Billing preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autopay}
                onChange={(e) => setAutopay(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border)]"
              />
              Autopay enabled
            </label>
            <div>
              <label className="text-sm font-medium">Preferred channel</label>
              <Select
                value={channel}
                onChange={(e) => setChannel(e.target.value as BillingPrefs['channel'])}
                className="mt-1"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="in_app">In-app</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Invoice frequency</label>
              <Select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as BillingPrefs['frequency'])}
                className="mt-1"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                loading={pending}
                onClick={() =>
                  run(() =>
                    saveFamilyBillingPreferences({
                      family_id: familyId,
                      autopay,
                      channel,
                      frequency,
                    }),
                  )
                }
              >
                Save preferences
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pickup verification */}
      {pickups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pickup Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-[var(--color-border)]">
              {pickups.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {p.person_name}
                    </p>
                    <div className="mt-1 flex gap-1.5">
                      <Badge variant={p.photo_verified ? 'success' : 'warning'} size="sm">
                        {p.photo_verified ? 'Photo verified' : 'Photo not verified'}
                      </Badge>
                      <Badge
                        variant={p.government_id_verified_at ? 'success' : 'warning'}
                        size="sm"
                      >
                        {p.government_id_verified_at ? 'ID verified' : 'ID not verified'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!p.photo_verified && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={pending}
                        onClick={() => run(() => verifyPickupPhoto({ pickup_id: p.id }))}
                      >
                        <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                        Mark photo verified
                      </Button>
                    )}
                    {!p.government_id_verified_at && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={pending}
                        onClick={() => run(() => verifyPickupId({ pickup_id: p.id }))}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        Mark ID verified
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Add family document dialog */}
      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogOverlay onClick={() => setDocOpen(false)} />
        <DialogContent title="Add family document">
          <DialogClose onClick={() => setDocOpen(false)} />
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={docType} onChange={(e) => setDocType(e.target.value)} className="mt-1">
                {FAMILY_DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">URL or file path</label>
              <Input
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">File name (optional)</label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={() => setDocOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                loading={pending}
                onClick={() =>
                  run(
                    () =>
                      addFamilyDocument({
                        family_id: familyId,
                        document_type: docType as 'other',
                        file_path: docUrl,
                        file_name: docName || undefined,
                        notes: docNotes || undefined,
                      }),
                    () => {
                      setDocOpen(false)
                      setDocUrl('')
                      setDocName('')
                      setDocNotes('')
                      setDocType('other')
                    },
                  )
                }
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
