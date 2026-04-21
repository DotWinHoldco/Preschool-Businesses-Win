'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import {
  linkStudentToFamily,
  updateStudentFamilyLink,
  unlinkStudentFromFamily,
} from '@/lib/actions/family/manage-student-links'

// ---- Types ----

export interface LinkData {
  id: string
  student_id: string
  family_id: string
  billing_split_pct: number
  is_primary_family: boolean
  notes?: string | null
  student_name?: string
  family_name?: string
}

export interface SearchOption {
  id: string
  label: string
  sublabel?: string
}

type LinkFormData = {
  billing_split_pct: number
  is_primary_family: boolean
  notes: string
}

const defaultLinkForm: LinkFormData = {
  billing_split_pct: 100,
  is_primary_family: false,
  notes: '',
}

// ---- Student's Family Links (used on student detail page) ----

interface StudentFamilyLinksProps {
  studentId: string
  links: LinkData[]
  availableFamilies: SearchOption[]
}

export function StudentFamilyLinks({ studentId, links, availableFamilies }: StudentFamilyLinksProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<LinkData | null>(null)
  const [confirmUnlinkId, setConfirmUnlinkId] = useState<string | null>(null)
  const [selectedFamilyId, setSelectedFamilyId] = useState('')
  const [form, setForm] = useState<LinkFormData>(defaultLinkForm)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const linkedFamilyIds = new Set(links.map((l) => l.family_id))
  const unlinkedFamilies = availableFamilies.filter((f) => !linkedFamilyIds.has(f.id))

  function openAdd() {
    setEditingLink(null)
    setSelectedFamilyId(unlinkedFamilies[0]?.id ?? '')
    setForm(defaultLinkForm)
    setServerError(null)
    setDialogOpen(true)
  }

  function openEdit(link: LinkData) {
    setEditingLink(link)
    setForm({
      billing_split_pct: link.billing_split_pct,
      is_primary_family: link.is_primary_family,
      notes: link.notes ?? '',
    })
    setServerError(null)
    setDialogOpen(true)
  }

  function handleSubmit() {
    setServerError(null)
    startTransition(async () => {
      if (editingLink) {
        const result = await updateStudentFamilyLink({
          id: editingLink.id,
          billing_split_pct: form.billing_split_pct,
          is_primary_family: form.is_primary_family,
          notes: form.notes || null,
        })
        if (!result.ok) { setServerError(result.error ?? 'Update failed'); return }
      } else {
        const result = await linkStudentToFamily({
          student_id: studentId,
          family_id: selectedFamilyId,
          billing_split_pct: form.billing_split_pct,
          is_primary_family: form.is_primary_family,
          notes: form.notes || undefined,
        })
        if (!result.ok) { setServerError(result.error ?? 'Link failed'); return }
      }
      setDialogOpen(false)
      router.refresh()
    })
  }

  function handleUnlink(linkId: string) {
    startTransition(async () => {
      const result = await unlinkStudentFromFamily({ id: linkId })
      if (!result.ok) { setServerError(result.error ?? 'Unlink failed'); return }
      setConfirmUnlinkId(null)
      router.refresh()
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Family</CardTitle>
          {unlinkedFamilies.length > 0 && (
            <Button variant="primary" size="sm" onClick={openAdd}>
              Link Family
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted-foreground)]">Not linked to any family</p>
              {unlinkedFamilies.length > 0 && (
                <Button variant="secondary" size="sm" onClick={openAdd}>
                  Link to Family
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="group flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3"
                >
                  <a
                    href={`/portal/admin/families/${link.family_id}`}
                    className="min-w-0 flex-1 hover:underline"
                  >
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {link.family_name ?? 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                      {link.is_primary_family && <Badge variant="default" size="sm">Primary</Badge>}
                      {link.billing_split_pct < 100 && (
                        <span>{link.billing_split_pct}% billing</span>
                      )}
                    </div>
                  </a>
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(link)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                      aria-label="Edit link"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmUnlinkId(link.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)] transition-colors"
                      aria-label="Unlink"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Link Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent
          title={editingLink ? 'Edit Family Link' : 'Link to Family'}
          description={editingLink ? 'Update billing and custody details for this link.' : 'Associate this student with an existing family.'}
        >
          <DialogClose onClick={() => setDialogOpen(false)} />
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
            {serverError && (
              <div className="rounded-lg border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 p-3 text-sm text-[var(--color-destructive)]">
                {serverError}
              </div>
            )}

            {!editingLink && (
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">Family *</label>
                <Select value={selectedFamilyId} onChange={(e) => setSelectedFamilyId(e.target.value)}>
                  {unlinkedFamilies.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </Select>
              </div>
            )}

            {editingLink && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Linked to: <strong className="text-[var(--color-foreground)]">{editingLink.family_name}</strong>
              </p>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">Billing Split %</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.billing_split_pct}
                onChange={(e) => setForm((f) => ({ ...f, billing_split_pct: Number(e.target.value) }))}
                inputSize="sm"
              />
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Percentage of tuition billed to this family. Use less than 100% for split custody billing.
              </p>
            </div>

            <Checkbox
              label="Primary family"
              checked={form.is_primary_family}
              onChange={(e) => setForm((f) => ({ ...f, is_primary_family: e.target.checked }))}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">Custody / Link Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                placeholder="Shared custody schedule, pickup restrictions, etc."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" loading={isPending}>
                {editingLink ? 'Save Changes' : 'Link Family'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Unlink Dialog */}
      <Dialog open={!!confirmUnlinkId} onOpenChange={() => setConfirmUnlinkId(null)}>
        <DialogOverlay onClick={() => setConfirmUnlinkId(null)} />
        <DialogContent title="Unlink Family">
          <DialogClose onClick={() => setConfirmUnlinkId(null)} />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Remove the link between this student and{' '}
            <strong className="text-[var(--color-foreground)]">
              {links.find((l) => l.id === confirmUnlinkId)?.family_name}
            </strong>
            ? This does not delete either record.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmUnlinkId(null)}>Cancel</Button>
            <Button type="button" variant="danger" size="sm" loading={isPending} onClick={() => confirmUnlinkId && handleUnlink(confirmUnlinkId)}>
              Unlink
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ---- Family's Student Links (used on family detail page) ----

interface FamilyStudentLinksProps {
  familyId: string
  links: LinkData[]
  availableStudents: SearchOption[]
}

export function FamilyStudentLinks({ familyId, links, availableStudents }: FamilyStudentLinksProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<LinkData | null>(null)
  const [confirmUnlinkId, setConfirmUnlinkId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [form, setForm] = useState<LinkFormData>(defaultLinkForm)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const linkedStudentIds = new Set(links.map((l) => l.student_id))
  const unlinkedStudents = availableStudents.filter((s) => !linkedStudentIds.has(s.id))

  function openAdd() {
    setEditingLink(null)
    setSelectedStudentId(unlinkedStudents[0]?.id ?? '')
    setForm(defaultLinkForm)
    setServerError(null)
    setDialogOpen(true)
  }

  function openEdit(link: LinkData) {
    setEditingLink(link)
    setForm({
      billing_split_pct: link.billing_split_pct,
      is_primary_family: link.is_primary_family,
      notes: link.notes ?? '',
    })
    setServerError(null)
    setDialogOpen(true)
  }

  function handleSubmit() {
    setServerError(null)
    startTransition(async () => {
      if (editingLink) {
        const result = await updateStudentFamilyLink({
          id: editingLink.id,
          billing_split_pct: form.billing_split_pct,
          is_primary_family: form.is_primary_family,
          notes: form.notes || null,
        })
        if (!result.ok) { setServerError(result.error ?? 'Update failed'); return }
      } else {
        const result = await linkStudentToFamily({
          student_id: selectedStudentId,
          family_id: familyId,
          billing_split_pct: form.billing_split_pct,
          is_primary_family: form.is_primary_family,
          notes: form.notes || undefined,
        })
        if (!result.ok) { setServerError(result.error ?? 'Link failed'); return }
      }
      setDialogOpen(false)
      router.refresh()
    })
  }

  function handleUnlink(linkId: string) {
    startTransition(async () => {
      const result = await unlinkStudentFromFamily({ id: linkId })
      if (!result.ok) { setServerError(result.error ?? 'Unlink failed'); return }
      setConfirmUnlinkId(null)
      router.refresh()
    })
  }

  return (
    <>
      {/* Header with Link Student button */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Children
        </h4>
        {unlinkedStudents.length > 0 && (
          <Button variant="secondary" size="sm" onClick={openAdd}>
            Link Student
          </Button>
        )}
      </div>

      {/* Student cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <div
            key={link.id}
            className="group relative flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3"
          >
            <a
              href={`/portal/admin/students/${link.student_id}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]"
            >
              {link.student_name?.split(' ').map((n) => n[0]).join('') ?? '?'}
            </a>
            <div className="min-w-0 flex-1">
              <a href={`/portal/admin/students/${link.student_id}`} className="hover:underline">
                <p className="text-sm font-medium text-[var(--color-foreground)]">
                  {link.student_name ?? 'Unknown'}
                </p>
              </a>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                {link.is_primary_family && <Badge variant="default" size="sm">Primary</Badge>}
                {link.billing_split_pct < 100 && (
                  <span>{link.billing_split_pct}% billing</span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => openEdit(link)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                aria-label={`Edit ${link.student_name} link`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setConfirmUnlinkId(link.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)] transition-colors"
                aria-label={`Unlink ${link.student_name}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {links.length === 0 && (
          <div className="col-span-2 space-y-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">No students linked to this family yet</p>
            {unlinkedStudents.length > 0 && (
              <Button variant="secondary" size="sm" onClick={openAdd}>Link Student</Button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent
          title={editingLink ? 'Edit Student Link' : 'Link Student'}
          description={editingLink ? 'Update billing and custody details.' : 'Associate an existing student with this family.'}
        >
          <DialogClose onClick={() => setDialogOpen(false)} />
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
            {serverError && (
              <div className="rounded-lg border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 p-3 text-sm text-[var(--color-destructive)]">
                {serverError}
              </div>
            )}

            {!editingLink && (
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">Student *</label>
                <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                  {unlinkedStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}{s.sublabel ? ` — ${s.sublabel}` : ''}</option>
                  ))}
                </Select>
              </div>
            )}

            {editingLink && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Linked to: <strong className="text-[var(--color-foreground)]">{editingLink.student_name}</strong>
              </p>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">Billing Split %</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.billing_split_pct}
                onChange={(e) => setForm((f) => ({ ...f, billing_split_pct: Number(e.target.value) }))}
                inputSize="sm"
              />
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Percentage of tuition billed to this family for this student.
              </p>
            </div>

            <Checkbox
              label="Primary family"
              checked={form.is_primary_family}
              onChange={(e) => setForm((f) => ({ ...f, is_primary_family: e.target.checked }))}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">Custody / Link Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                placeholder="Shared custody schedule, pickup restrictions, etc."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" loading={isPending}>
                {editingLink ? 'Save Changes' : 'Link Student'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Unlink Dialog */}
      <Dialog open={!!confirmUnlinkId} onOpenChange={() => setConfirmUnlinkId(null)}>
        <DialogOverlay onClick={() => setConfirmUnlinkId(null)} />
        <DialogContent title="Unlink Student">
          <DialogClose onClick={() => setConfirmUnlinkId(null)} />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Remove the link between{' '}
            <strong className="text-[var(--color-foreground)]">
              {links.find((l) => l.id === confirmUnlinkId)?.student_name}
            </strong>
            {' '}and this family? This does not delete either record.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmUnlinkId(null)}>Cancel</Button>
            <Button type="button" variant="danger" size="sm" loading={isPending} onClick={() => confirmUnlinkId && handleUnlink(confirmUnlinkId)}>
              Unlink
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
