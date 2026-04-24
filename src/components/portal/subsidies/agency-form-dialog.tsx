'use client'

// @anchor: cca.subsidy.agency-form-dialog
import { useState, useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { createSubsidyAgency, updateSubsidyAgency } from '@/lib/actions/subsidies/manage-agency'

export interface AgencyFormValues {
  id?: string
  name: string
  agency_type: string
  state: string
  county: string
  contact_email: string
  contact_phone: string
  billing_format: string
  payment_terms_days: number
}

const AGENCY_TYPES: { value: string; label: string }[] = [
  { value: 'state', label: 'State' },
  { value: 'county', label: 'County' },
  { value: 'federal', label: 'Federal' },
  { value: 'tribal', label: 'Tribal' },
  { value: 'private', label: 'Private' },
]

const BILLING_FORMATS: { value: string; label: string }[] = [
  { value: 'edr', label: 'EDR' },
  { value: 'manual', label: 'Manual' },
  { value: 'api', label: 'API' },
  { value: 'standard_csv', label: 'Standard CSV' },
  { value: 'custom', label: 'Custom' },
]

const EMPTY: AgencyFormValues = {
  name: '',
  agency_type: 'state',
  state: '',
  county: '',
  contact_email: '',
  contact_phone: '',
  billing_format: 'manual',
  payment_terms_days: 30,
}

interface AgencyFormDialogProps {
  mode?: 'create' | 'edit'
  initial?: AgencyFormValues
  trigger: (openDialog: () => void) => ReactNode
}

export function AgencyFormDialog({ mode = 'create', initial, trigger }: AgencyFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<AgencyFormValues>(initial ?? EMPTY)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(initial ?? EMPTY)
    }
  }, [open, initial])

  function set<K extends keyof AgencyFormValues>(key: K, value: AgencyFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      const payload = {
        name: values.name.trim(),
        agency_type: values.agency_type as 'state' | 'county' | 'federal' | 'tribal' | 'private',
        state: values.state.trim(),
        county: values.county.trim() || undefined,
        contact_email: values.contact_email.trim() || undefined,
        contact_phone: values.contact_phone.trim() || undefined,
        billing_format: values.billing_format as
          | 'edr'
          | 'manual'
          | 'api'
          | 'standard_csv'
          | 'custom',
        payment_terms_days: Number(values.payment_terms_days) || 30,
      }

      const result =
        mode === 'edit' && values.id
          ? await updateSubsidyAgency({ id: values.id, ...payload })
          : await createSubsidyAgency(payload)

      if (!result.ok) {
        toast({
          variant: 'error',
          title: mode === 'edit' ? 'Failed to update agency' : 'Failed to add agency',
          description: result.error ?? 'Validation failed',
        })
        return
      }

      toast({
        variant: 'success',
        title: mode === 'edit' ? 'Agency updated' : 'Agency added',
        description: values.name,
      })
      setOpen(false)
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Request failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay onClick={() => setOpen(false)} />
        <DialogContent
          title={mode === 'edit' ? 'Edit Subsidy Agency' : 'Add Subsidy Agency'}
          description="Agencies are the funding sources for subsidized care."
        >
          <DialogClose onClick={() => setOpen(false)} />
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Name *
              </label>
              <Input
                inputSize="sm"
                value={values.name}
                onChange={(e) => set('name', e.target.value)}
                required
                placeholder="e.g. Texas Workforce Commission"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Type
                </label>
                <select
                  value={values.agency_type}
                  onChange={(e) => set('agency_type', e.target.value)}
                  className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                >
                  {AGENCY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  State *
                </label>
                <Input
                  inputSize="sm"
                  value={values.state}
                  onChange={(e) => set('state', e.target.value)}
                  required
                  placeholder="TX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                County
              </label>
              <Input
                inputSize="sm"
                value={values.county}
                onChange={(e) => set('county', e.target.value)}
                placeholder="Kaufman"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Contact email
                </label>
                <Input
                  inputSize="sm"
                  type="email"
                  value={values.contact_email}
                  onChange={(e) => set('contact_email', e.target.value)}
                  placeholder="claims@agency.gov"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Contact phone
                </label>
                <Input
                  inputSize="sm"
                  value={values.contact_phone}
                  onChange={(e) => set('contact_phone', e.target.value)}
                  placeholder="512-555-0100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Billing format
                </label>
                <select
                  value={values.billing_format}
                  onChange={(e) => set('billing_format', e.target.value)}
                  className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                >
                  {BILLING_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Payment terms (days)
                </label>
                <Input
                  inputSize="sm"
                  type="number"
                  min={1}
                  max={365}
                  value={values.payment_terms_days}
                  onChange={(e) => set('payment_terms_days', Number(e.target.value) || 30)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={submitting}>
                {mode === 'edit' ? 'Save changes' : 'Add agency'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
