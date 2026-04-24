'use client'

// @anchor: cca.billing.plan-manager
// Admin CRUD client for billing_plans — list, add, edit, archive.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import {
  createBillingPlan,
  updateBillingPlan,
  deleteBillingPlan,
} from '@/lib/actions/billing/manage-plans'
import type { BillingPlanInput } from '@/lib/schemas/billing'

export interface PlanRow {
  id: string
  name: string
  description: string | null
  amount_cents: number
  frequency: string
  program_type: string | null
  age_group: string | null
  registration_fee_cents: number
  supply_fee_cents: number
  late_fee_cents: number
  late_fee_grace_days: number
  sibling_discount_pct: number
  staff_discount_pct: number
  military_discount_pct: number
  church_member_discount_pct: number
  is_active: boolean
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

type FormState = {
  name: string
  description: string
  amount: string
  frequency: string
  program_type: string
  age_group: string
  registration_fee: string
  supply_fee: string
  late_fee: string
  late_fee_grace_days: string
  sibling_discount_pct: string
  staff_discount_pct: string
  military_discount_pct: string
  church_member_discount_pct: string
  is_active: boolean
}

function emptyForm(): FormState {
  return {
    name: '',
    description: '',
    amount: '',
    frequency: 'monthly',
    program_type: '',
    age_group: '',
    registration_fee: '0',
    supply_fee: '0',
    late_fee: '0',
    late_fee_grace_days: '5',
    sibling_discount_pct: '0',
    staff_discount_pct: '0',
    military_discount_pct: '0',
    church_member_discount_pct: '0',
    is_active: true,
  }
}

function planToForm(plan: PlanRow): FormState {
  return {
    name: plan.name,
    description: plan.description ?? '',
    amount: (plan.amount_cents / 100).toFixed(2),
    frequency: plan.frequency,
    program_type: plan.program_type ?? '',
    age_group: plan.age_group ?? '',
    registration_fee: (plan.registration_fee_cents / 100).toFixed(2),
    supply_fee: (plan.supply_fee_cents / 100).toFixed(2),
    late_fee: (plan.late_fee_cents / 100).toFixed(2),
    late_fee_grace_days: String(plan.late_fee_grace_days),
    sibling_discount_pct: String(plan.sibling_discount_pct),
    staff_discount_pct: String(plan.staff_discount_pct),
    military_discount_pct: String(plan.military_discount_pct),
    church_member_discount_pct: String(plan.church_member_discount_pct),
    is_active: plan.is_active,
  }
}

function formToInput(form: FormState): BillingPlanInput | { error: string } {
  const amount = Math.round(parseFloat(form.amount) * 100)
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Amount must be a positive number' }
  const regFee = Math.round(parseFloat(form.registration_fee || '0') * 100)
  const supplyFee = Math.round(parseFloat(form.supply_fee || '0') * 100)
  const lateFee = Math.round(parseFloat(form.late_fee || '0') * 100)
  const grace = parseInt(form.late_fee_grace_days || '0', 10)
  const sibling = parseFloat(form.sibling_discount_pct || '0')
  const staff = parseFloat(form.staff_discount_pct || '0')
  const military = parseFloat(form.military_discount_pct || '0')
  const church = parseFloat(form.church_member_discount_pct || '0')

  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    amount_cents: amount,
    frequency: form.frequency as BillingPlanInput['frequency'],
    program_type: form.program_type.trim() || undefined,
    age_group: form.age_group.trim() || undefined,
    registration_fee_cents: regFee,
    supply_fee_cents: supplyFee,
    late_fee_cents: lateFee,
    late_fee_grace_days: grace,
    sibling_discount_pct: sibling,
    staff_discount_pct: staff,
    military_discount_pct: military,
    church_member_discount_pct: church,
    is_active: form.is_active,
  }
}

export function PlanManager({ plans }: { plans: PlanRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<
    { type: 'create' } | { type: 'edit'; plan: PlanRow } | { type: 'delete'; plan: PlanRow } | null
  >(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setForm(emptyForm())
    setError(null)
    setMode({ type: 'create' })
  }

  function openEdit(plan: PlanRow) {
    setForm(planToForm(plan))
    setError(null)
    setMode({ type: 'edit', plan })
  }

  function openDelete(plan: PlanRow) {
    setError(null)
    setMode({ type: 'delete', plan })
  }

  function close() {
    setMode(null)
    setError(null)
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = formToInput(form)
    if ('error' in parsed) {
      setError(parsed.error)
      return
    }
    startTransition(async () => {
      let res
      if (mode?.type === 'create') {
        res = await createBillingPlan(parsed)
      } else if (mode?.type === 'edit') {
        res = await updateBillingPlan({ id: mode.plan.id, ...parsed })
      } else {
        return
      }
      if (!res.ok) {
        setError(res.error ?? 'Failed to save plan')
        return
      }
      close()
      router.refresh()
    })
  }

  function confirmDelete() {
    if (mode?.type !== 'delete') return
    startTransition(async () => {
      const res = await deleteBillingPlan(mode.plan.id)
      if (!res.ok) {
        setError(res.error ?? 'Failed to archive plan')
        return
      }
      close()
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <Button type="button" onClick={openCreate}>
          Add Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-[var(--radius,0.75rem)] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No plans yet. Add one to start billing families.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)]">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-[var(--color-foreground)]">
                    {plan.name}
                  </h3>
                  {!plan.is_active && (
                    <span className="inline-flex items-center rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs text-[var(--color-muted-foreground)]">
                      Archived
                    </span>
                  )}
                  {plan.program_type && (
                    <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs text-[var(--color-primary)]">
                      {plan.program_type}
                    </span>
                  )}
                  {plan.age_group && (
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {plan.age_group}
                    </span>
                  )}
                </div>
                {plan.description && (
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {plan.description}
                  </p>
                )}
                <p className="mt-1 text-sm text-[var(--color-foreground)]">
                  <span className="font-semibold">{formatCurrency(plan.amount_cents)}</span>{' '}
                  <span className="text-[var(--color-muted-foreground)]">/ {plan.frequency}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(plan)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => openDelete(plan)}
                  disabled={!plan.is_active}
                >
                  {plan.is_active ? 'Archive' : 'Archived'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={mode?.type === 'create' || mode?.type === 'edit'}
        onOpenChange={(v) => !v && close()}
      >
        <DialogOverlay onClick={close} />
        <DialogContent
          title={mode?.type === 'edit' ? 'Edit Plan' : 'Add Plan'}
          description="Configure tuition pricing, fees, and discounts."
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogClose onClick={close} />
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Name
              </label>
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Description
              </label>
              <Textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Amount (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => update('amount', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Frequency
                </label>
                <Select
                  value={form.frequency}
                  onChange={(e) => update('frequency', e.target.value)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Program type
                </label>
                <Input
                  value={form.program_type}
                  onChange={(e) => update('program_type', e.target.value)}
                  placeholder="full-day, half-day…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Age group
                </label>
                <Input
                  value={form.age_group}
                  onChange={(e) => update('age_group', e.target.value)}
                  placeholder="infant, toddler, pre-k…"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Registration fee (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.registration_fee}
                  onChange={(e) => update('registration_fee', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Supply fee (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.supply_fee}
                  onChange={(e) => update('supply_fee', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Late fee (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.late_fee}
                  onChange={(e) => update('late_fee', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Late fee grace (days)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.late_fee_grace_days}
                  onChange={(e) => update('late_fee_grace_days', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Sibling discount %
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.sibling_discount_pct}
                  onChange={(e) => update('sibling_discount_pct', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Staff discount %
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.staff_discount_pct}
                  onChange={(e) => update('staff_discount_pct', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Military discount %
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.military_discount_pct}
                  onChange={(e) => update('military_discount_pct', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Church member discount %
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.church_member_discount_pct}
                  onChange={(e) => update('church_member_discount_pct', e.target.value)}
                />
              </div>
            </div>
            <Checkbox
              label="Active"
              checked={form.is_active}
              onChange={(e) => update('is_active', (e.target as HTMLInputElement).checked)}
            />
            {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={pending}>
                {mode?.type === 'edit' ? 'Save Changes' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mode?.type === 'delete'} onOpenChange={(v) => !v && close()}>
        <DialogOverlay onClick={close} />
        <DialogContent
          title="Archive Plan"
          description="This plan will be hidden from new enrollments. Existing invoices are not affected."
        >
          <DialogClose onClick={close} />
          <div className="space-y-4">
            {mode?.type === 'delete' && (
              <p className="text-sm text-[var(--color-foreground)]">
                Archive <strong>{mode.plan.name}</strong>?
              </p>
            )}
            {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={confirmDelete}
                loading={pending}
              >
                Archive Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
