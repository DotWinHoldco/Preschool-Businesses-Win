'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { addFamilyMember, updateFamilyMember, removeFamilyMember } from '@/lib/actions/family/manage-members'
import type { LinkedStudentData } from './family-tree-view'

interface FamilyMemberData {
  id: string
  first_name: string
  last_name: string
  relationship_type: string
  relationship_label?: string | null
  is_primary_contact: boolean
  is_billing_responsible: boolean
  can_pickup_default: boolean
  lives_in_household?: boolean
  custody_notes?: string | null
  phone?: string | null
  email?: string | null
}

const RELATIONSHIP_OPTIONS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'stepmother', label: 'Stepmother' },
  { value: 'stepfather', label: 'Stepfather' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'nanny', label: 'Nanny' },
  { value: 'other', label: 'Other' },
] as const

type FormData = {
  first_name: string
  last_name: string
  email: string
  phone: string
  relationship_type: string
  relationship_label: string
  is_primary_contact: boolean
  is_billing_responsible: boolean
  can_pickup_default: boolean
  lives_in_household: boolean
  custody_notes: string
}

const emptyForm: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  relationship_type: 'mother',
  relationship_label: '',
  is_primary_contact: false,
  is_billing_responsible: false,
  can_pickup_default: true,
  lives_in_household: true,
  custody_notes: '',
}

function formatRelationship(type: string, label?: string | null): string {
  if (label) return label
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface FamilyMembersManagerProps {
  familyId: string
  familyName: string
  members: FamilyMemberData[]
  students: LinkedStudentData[]
  showAdminLabels?: boolean
  className?: string
}

export function FamilyMembersManager({
  familyId,
  familyName,
  members,
  students,
  showAdminLabels = false,
  className,
}: FamilyMembersManagerProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<FamilyMemberData | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditingMember(null)
    setForm(emptyForm)
    setFieldErrors({})
    setServerError(null)
    setDialogOpen(true)
  }

  function openEdit(member: FamilyMemberData) {
    setEditingMember(member)
    setForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email ?? '',
      phone: member.phone ?? '',
      relationship_type: member.relationship_type,
      relationship_label: member.relationship_label ?? '',
      is_primary_contact: member.is_primary_contact,
      is_billing_responsible: member.is_billing_responsible,
      can_pickup_default: member.can_pickup_default,
      lives_in_household: member.lives_in_household ?? true,
      custody_notes: member.custody_notes ?? '',
    })
    setFieldErrors({})
    setServerError(null)
    setDialogOpen(true)
  }

  function handleSubmit() {
    setFieldErrors({})
    setServerError(null)

    startTransition(async () => {
      if (editingMember) {
        const result = await updateFamilyMember({
          id: editingMember.id,
          family_id: familyId,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email || null,
          phone: form.phone || null,
          relationship_type: form.relationship_type as 'mother' | 'father' | 'stepmother' | 'stepfather' | 'grandparent' | 'nanny' | 'other',
          relationship_label: form.relationship_label || null,
          is_primary_contact: form.is_primary_contact,
          is_billing_responsible: form.is_billing_responsible,
          can_pickup_default: form.can_pickup_default,
          lives_in_household: form.lives_in_household,
          custody_notes: form.custody_notes || null,
        })
        if (!result.ok) {
          if (result.fieldErrors) setFieldErrors(result.fieldErrors)
          setServerError(result.error ?? 'Update failed')
          return
        }
      } else {
        const result = await addFamilyMember({
          family_id: familyId,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          relationship_type: form.relationship_type as 'mother' | 'father' | 'stepmother' | 'stepfather' | 'grandparent' | 'nanny' | 'other',
          relationship_label: form.relationship_label || undefined,
          is_primary_contact: form.is_primary_contact,
          is_billing_responsible: form.is_billing_responsible,
          can_pickup_default: form.can_pickup_default,
          lives_in_household: form.lives_in_household,
          custody_notes: form.custody_notes || undefined,
        })
        if (!result.ok) {
          if (result.fieldErrors) setFieldErrors(result.fieldErrors)
          setServerError(result.error ?? 'Failed to add member')
          return
        }
      }
      setDialogOpen(false)
      router.refresh()
    })
  }

  function handleRemove(memberId: string) {
    startTransition(async () => {
      const result = await removeFamilyMember({ id: memberId, family_id: familyId })
      if (!result.ok) {
        setServerError(result.error ?? 'Failed to remove member')
        return
      }
      setConfirmRemoveId(null)
      router.refresh()
    })
  }

  const isBlended = members.some(
    (m) => m.relationship_type === 'stepmother' || m.relationship_type === 'stepfather',
  )

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle>{familyName} Family</CardTitle>
            {showAdminLabels && isBlended && (
              <Badge variant="outline" size="sm">Blended</Badge>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={openAdd}>
            Add Member
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Parents & Guardians */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Parents &amp; Guardians
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="group relative flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-sm font-semibold text-[var(--color-muted-foreground)]">
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-foreground)]">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {formatRelationship(member.relationship_type, member.relationship_label)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {member.is_primary_contact && (
                          <Badge variant="default" size="sm">Primary</Badge>
                        )}
                        {member.is_billing_responsible && (
                          <Badge variant="outline" size="sm">Billing</Badge>
                        )}
                        {member.can_pickup_default && (
                          <Badge variant="success" size="sm">Pickup</Badge>
                        )}
                      </div>
                      {(member.phone || member.email) && (
                        <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                          {member.phone && <span>{member.phone}</span>}
                          {member.phone && member.email && <span> · </span>}
                          {member.email && <span>{member.email}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                        aria-label={`Edit ${member.first_name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(member.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)] transition-colors"
                        aria-label={`Remove ${member.first_name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-sm text-[var(--color-muted-foreground)] col-span-2">
                    No members linked to this family yet
                  </p>
                )}
              </div>
            </div>

            {/* Connecting line */}
            {members.length > 0 && students.length > 0 && (
              <div className="flex justify-center">
                <div className="h-6 w-px bg-[var(--color-border)]" />
              </div>
            )}

            {/* Children */}
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Children
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {students.map((student) => (
                  <a
                    key={student.id}
                    href={`/portal/admin/students/${student.id}`}
                    className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-muted)]/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]">
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-foreground)]">
                        {student.first_name} {student.last_name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                        <Badge variant={student.enrollment_status === 'active' ? 'success' : 'outline'} size="sm">
                          {student.enrollment_status}
                        </Badge>
                        {student.billing_split_pct != null && student.billing_split_pct < 100 && (
                          <span>{student.billing_split_pct}% billing</span>
                        )}
                        {student.is_primary_family && (
                          <Badge variant="default" size="sm">Primary</Badge>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
                {students.length === 0 && (
                  <p className="text-sm text-[var(--color-muted-foreground)] col-span-2">
                    No students linked to this family yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent
          title={editingMember ? 'Edit Family Member' : 'Add Family Member'}
          description={editingMember ? 'Update this family member\'s information.' : 'Add a parent, guardian, or caregiver to this family.'}
          className="max-h-[90vh] overflow-y-auto"
        >
          <DialogClose onClick={() => setDialogOpen(false)} />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="space-y-4"
          >
            {serverError && (
              <div className="rounded-lg border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 p-3 text-sm text-[var(--color-destructive)]">
                {serverError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  First Name *
                </label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  error={!!fieldErrors.first_name}
                  inputSize="sm"
                />
                {fieldErrors.first_name && (
                  <p className="mt-1 text-xs text-[var(--color-destructive)]">{fieldErrors.first_name}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  Last Name *
                </label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  error={!!fieldErrors.last_name}
                  inputSize="sm"
                />
                {fieldErrors.last_name && (
                  <p className="mt-1 text-xs text-[var(--color-destructive)]">{fieldErrors.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                Relationship *
              </label>
              <Select
                value={form.relationship_type}
                onChange={(e) => setForm((f) => ({ ...f, relationship_type: e.target.value }))}
              >
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            {form.relationship_type === 'other' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  Custom Relationship Label
                </label>
                <Input
                  value={form.relationship_label}
                  onChange={(e) => setForm((f) => ({ ...f, relationship_label: e.target.value }))}
                  placeholder="e.g., Foster Parent, Aunt"
                  inputSize="sm"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  Email
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  error={!!fieldErrors.email}
                  inputSize="sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  inputSize="sm"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-[var(--color-border)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Permissions
              </p>
              <Checkbox
                label="Primary contact"
                checked={form.is_primary_contact}
                onChange={(e) => setForm((f) => ({ ...f, is_primary_contact: e.target.checked }))}
              />
              <Checkbox
                label="Billing responsible"
                checked={form.is_billing_responsible}
                onChange={(e) => setForm((f) => ({ ...f, is_billing_responsible: e.target.checked }))}
              />
              <Checkbox
                label="Authorized for pickup"
                checked={form.can_pickup_default}
                onChange={(e) => setForm((f) => ({ ...f, can_pickup_default: e.target.checked }))}
              />
              <Checkbox
                label="Lives in household"
                checked={form.lives_in_household}
                onChange={(e) => setForm((f) => ({ ...f, lives_in_household: e.target.checked }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">
                Custody Notes
              </label>
              <textarea
                value={form.custody_notes}
                onChange={(e) => setForm((f) => ({ ...f, custody_notes: e.target.value }))}
                rows={2}
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                placeholder="Shared custody arrangements, restrictions, etc."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={isPending}>
                {editingMember ? 'Save Changes' : 'Add Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog open={!!confirmRemoveId} onOpenChange={() => setConfirmRemoveId(null)}>
        <DialogOverlay onClick={() => setConfirmRemoveId(null)} />
        <DialogContent title="Remove Family Member">
          <DialogClose onClick={() => setConfirmRemoveId(null)} />
          {serverError && (
            <div className="mb-4 rounded-lg border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 p-3 text-sm text-[var(--color-destructive)]">
              {serverError}
            </div>
          )}
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Are you sure you want to remove{' '}
            <strong className="text-[var(--color-foreground)]">
              {members.find((m) => m.id === confirmRemoveId)?.first_name}{' '}
              {members.find((m) => m.id === confirmRemoveId)?.last_name}
            </strong>{' '}
            from this family? This action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmRemoveId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={isPending}
              onClick={() => confirmRemoveId && handleRemove(confirmRemoveId)}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
