'use client'

// @anchor: cca.enrollment.application-extras-ui

import { useState, useTransition } from 'react'
import { FileText, Trash2, Plus, DollarSign, CheckCircle2, Mail, FileSignature } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import {
  addApplicationDocument,
  deleteApplicationDocument,
  setEnrollmentDeposit,
  markDepositPaid,
  waiveDeposit,
  generateAcceptanceLetter,
  markLetterSent,
  markLetterAccepted,
} from '@/lib/actions/enrollment/application-extras'

export interface ApplicationDocument {
  id: string
  document_type: string
  file_path: string
  file_name: string | null
  notes: string | null
  created_at: string
}

export interface EnrollmentDeposit {
  id: string
  amount_cents: number
  status: string
  due_date: string | null
  paid_at: string | null
}

export interface AcceptanceLetter {
  id: string
  classroom_id: string | null
  start_date: string
  tuition_summary: string | null
  body: string
  sent_at: string | null
  accepted_at: string | null
  accepted_by_name: string | null
}

export interface Classroom {
  id: string
  name: string
}

interface Props {
  applicationId: string
  documents: ApplicationDocument[]
  deposit: EnrollmentDeposit | null
  letter: AcceptanceLetter | null
  classrooms: Classroom[]
}

const DOCUMENT_TYPES = [
  { value: 'tour_summary', label: 'Tour Summary' },
  { value: 'immunization', label: 'Immunization' },
  { value: 'enrollment_agreement', label: 'Enrollment Agreement' },
  { value: 'custody', label: 'Custody' },
  { value: 'other', label: 'Other' },
] as const

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function ApplicationExtras({
  applicationId,
  documents,
  deposit,
  letter,
  classrooms,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Document upload
  const [docOpen, setDocOpen] = useState(false)
  const [docType, setDocType] = useState<string>('other')
  const [docUrl, setDocUrl] = useState('')
  const [docName, setDocName] = useState('')
  const [docNotes, setDocNotes] = useState('')

  // Deposit
  const [depositOpen, setDepositOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositDue, setDepositDue] = useState('')

  // Letter
  const [letterOpen, setLetterOpen] = useState(false)
  const [letterClassroom, setLetterClassroom] = useState('')
  const [letterStart, setLetterStart] = useState('')
  const [letterTuition, setLetterTuition] = useState('')
  const [letterBody, setLetterBody] = useState('')

  // Accepted-by
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [acceptedBy, setAcceptedBy] = useState('')

  const run = <T,>(fn: () => Promise<{ ok: boolean; error?: string } & T>, onOk?: () => void) => {
    setError(null)
    startTransition(async () => {
      const r = await fn()
      if (!r.ok) setError(r.error ?? 'Action failed')
      else onOk?.()
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {error && (
        <div className="lg:col-span-2 rounded-[var(--radius)] border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 px-4 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      {/* Documents */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </CardTitle>
            <Button size="sm" variant="secondary" onClick={() => setDocOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add document
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
                      run(() => deleteApplicationDocument({ id: d.id }))
                    }}
                    disabled={pending}
                    className="text-[var(--color-destructive)] hover:opacity-80 disabled:opacity-50"
                    aria-label="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Deposit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Enrollment Deposit
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deposit ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted-foreground)]">Amount</span>
                <span className="font-medium text-[var(--color-foreground)]">
                  {formatCents(deposit.amount_cents)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted-foreground)]">Status</span>
                <Badge
                  variant={
                    deposit.status === 'paid'
                      ? 'success'
                      : deposit.status === 'waived'
                        ? 'outline'
                        : 'warning'
                  }
                  size="sm"
                >
                  {deposit.status}
                </Badge>
              </div>
              {deposit.due_date && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-muted-foreground)]">Due</span>
                  <span className="text-[var(--color-foreground)]">
                    {new Date(deposit.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {deposit.paid_at && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-muted-foreground)]">Paid at</span>
                  <span className="text-[var(--color-foreground)]">
                    {new Date(deposit.paid_at).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {deposit.status !== 'paid' && (
                  <Button
                    size="sm"
                    loading={pending}
                    onClick={() => run(() => markDepositPaid({ deposit_id: deposit.id }))}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark paid
                  </Button>
                )}
                {deposit.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={pending}
                    onClick={() => run(() => waiveDeposit({ deposit_id: deposit.id }))}
                  >
                    Waive
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setDepositOpen(true)}>
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No deposit has been set for this application.
              </p>
              <Button size="sm" onClick={() => setDepositOpen(true)}>
                Set deposit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acceptance Letter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            Acceptance Letter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {letter ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted-foreground)]">Start date</span>
                <span className="font-medium text-[var(--color-foreground)]">
                  {new Date(letter.start_date).toLocaleDateString()}
                </span>
              </div>
              {letter.tuition_summary && (
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Tuition summary</p>
                  <p className="mt-0.5 text-[var(--color-foreground)] whitespace-pre-wrap">
                    {letter.tuition_summary}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Body</p>
                <p className="mt-0.5 max-h-32 overflow-auto rounded border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-2 text-xs text-[var(--color-foreground)] whitespace-pre-wrap">
                  {letter.body}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {letter.sent_at ? (
                  <Badge variant="outline" size="sm">
                    Sent {new Date(letter.sent_at).toLocaleDateString()}
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    Not sent
                  </Badge>
                )}
                {letter.accepted_at ? (
                  <Badge variant="success" size="sm">
                    Accepted by {letter.accepted_by_name}
                  </Badge>
                ) : null}
              </div>
              <div className="flex gap-2 pt-1">
                {!letter.sent_at && (
                  <Button
                    size="sm"
                    loading={pending}
                    onClick={() => run(() => markLetterSent({ letter_id: letter.id }))}
                  >
                    <Mail className="h-3.5 w-3.5 mr-1" /> Mark sent
                  </Button>
                )}
                {!letter.accepted_at && (
                  <Button size="sm" variant="secondary" onClick={() => setAcceptOpen(true)}>
                    Mark accepted
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No acceptance letter has been generated yet.
              </p>
              <Button size="sm" onClick={() => setLetterOpen(true)}>
                Generate letter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Document Dialog */}
      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogOverlay onClick={() => setDocOpen(false)} />
        <DialogContent
          title="Add document"
          description="Paste a URL to attach a document to this application."
        >
          <DialogClose onClick={() => setDocOpen(false)} />
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={docType} onChange={(e) => setDocType(e.target.value)} className="mt-1">
                {DOCUMENT_TYPES.map((t) => (
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
              <Button variant="secondary" size="sm" onClick={() => setDocOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                loading={pending}
                onClick={() =>
                  run(
                    () =>
                      addApplicationDocument({
                        application_id: applicationId,
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

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogOverlay onClick={() => setDepositOpen(false)} />
        <DialogContent title="Set deposit" description="Set the enrollment deposit amount.">
          <DialogClose onClick={() => setDepositOpen(false)} />
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Amount (USD)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 250.00"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Due date (optional)</label>
              <Input
                type="date"
                value={depositDue}
                onChange={(e) => setDepositDue(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setDepositOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                loading={pending}
                onClick={() => {
                  const dollars = parseFloat(depositAmount)
                  if (isNaN(dollars) || dollars < 0) {
                    setError('Amount must be a non-negative number')
                    return
                  }
                  run(
                    () =>
                      setEnrollmentDeposit({
                        application_id: applicationId,
                        amount_cents: Math.round(dollars * 100),
                        due_date: depositDue || undefined,
                      }),
                    () => {
                      setDepositOpen(false)
                      setDepositAmount('')
                      setDepositDue('')
                    },
                  )
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Letter Dialog */}
      <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
        <DialogOverlay onClick={() => setLetterOpen(false)} />
        <DialogContent title="Generate acceptance letter">
          <DialogClose onClick={() => setLetterOpen(false)} />
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Classroom</label>
              <Select
                value={letterClassroom}
                onChange={(e) => setLetterClassroom(e.target.value)}
                className="mt-1"
              >
                <option value="">Select a classroom</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Start date</label>
              <Input
                type="date"
                value={letterStart}
                onChange={(e) => setLetterStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tuition summary (optional)</label>
              <Textarea
                value={letterTuition}
                onChange={(e) => setLetterTuition(e.target.value)}
                className="mt-1"
                placeholder="e.g. $1,200/mo full-time"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Body</label>
              <Textarea
                value={letterBody}
                onChange={(e) => setLetterBody(e.target.value)}
                className="mt-1"
                rows={6}
                placeholder="Letter content"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setLetterOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                loading={pending}
                onClick={() =>
                  run(
                    () =>
                      generateAcceptanceLetter({
                        application_id: applicationId,
                        classroom_id: letterClassroom,
                        start_date: letterStart,
                        tuition_summary: letterTuition || undefined,
                        body: letterBody,
                      }),
                    () => {
                      setLetterOpen(false)
                      setLetterClassroom('')
                      setLetterStart('')
                      setLetterTuition('')
                      setLetterBody('')
                    },
                  )
                }
              >
                Generate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Accept letter dialog */}
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogOverlay onClick={() => setAcceptOpen(false)} />
        <DialogContent title="Mark letter accepted">
          <DialogClose onClick={() => setAcceptOpen(false)} />
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Accepted by (name)</label>
              <Input
                value={acceptedBy}
                onChange={(e) => setAcceptedBy(e.target.value)}
                className="mt-1"
                placeholder="Parent's full name"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setAcceptOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                loading={pending}
                onClick={() => {
                  if (!letter) return
                  run(
                    () =>
                      markLetterAccepted({
                        letter_id: letter.id,
                        accepted_by_name: acceptedBy,
                      }),
                    () => {
                      setAcceptOpen(false)
                      setAcceptedBy('')
                    },
                  )
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
