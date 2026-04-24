'use client'

// @anchor: cca.expenses.admin-client

import { useState, useMemo, useTransition } from 'react'
import { Plus, Pencil, Archive, FileText, Check, X, Upload, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { createVendor, updateVendor, deleteVendor } from '@/lib/actions/expenses/manage-vendors'
import {
  submitExpenseForApproval,
  approveExpense,
  rejectExpense,
  addExpenseReceipt,
} from '@/lib/actions/expenses/manage-approvals'
import { createExpense } from '@/lib/actions/expenses/create-expense'

interface Expense {
  id: string
  date: string
  vendor: string
  vendor_id: string | null
  category_id: string | null
  amount_cents: number
  description: string | null
  notes: string | null
}

interface Vendor {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  tax_id: string | null
  default_category_id: string | null
  payment_terms_days: number | null
  is_active: boolean
  notes: string | null
}

interface Category {
  id: string
  name: string
}

interface Approval {
  id: string
  expense_id: string
  status: string
  approver_id: string | null
  comments: string | null
  decided_at: string | null
}

interface Receipt {
  id: string
  expense_id: string
  file_path: string
  file_name: string | null
}

interface Props {
  expenses: Expense[]
  categories: Category[]
  vendors: Vendor[]
  approvals: Approval[]
  receipts: Receipt[]
}

export function ExpensesAdminClient({ expenses, categories, vendors, approvals, receipts }: Props) {
  const [err, setErr] = useState<string | null>(null)
  const [vendorsOpen, setVendorsOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [receiptExpenseId, setReceiptExpenseId] = useState<string | null>(null)

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])
  const vendorMap = useMemo(() => new Map(vendors.map((v) => [v.id, v.name])), [vendors])

  const approvalByExpense = useMemo(() => {
    // latest approval per expense
    const m = new Map<string, Approval>()
    for (const a of approvals) {
      const existing = m.get(a.expense_id)
      if (!existing) m.set(a.expense_id, a)
    }
    return m
  }, [approvals])

  const receiptsByExpense = useMemo(() => {
    const m = new Map<string, Receipt[]>()
    for (const r of receipts) {
      const arr = m.get(r.expense_id) ?? []
      arr.push(r)
      m.set(r.expense_id, arr)
    }
    return m
  }, [receipts])

  const pendingApprovals = approvals.filter((a) => a.status === 'pending')

  const totalExpenses = expenses.reduce((s, e) => s + e.amount_cents, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Expenses</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Track spending, vendors, approvals, and receipts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setVendorsOpen(true)}>
            Manage Vendors
          </Button>
          <Button onClick={() => setExpenseOpen(true)}>
            <Plus size={16} />
            New Expense
          </Button>
        </div>
      </div>

      {err && (
        <div
          className="rounded-xl p-3 text-sm"
          style={{
            backgroundColor: 'var(--color-destructive)',
            color: 'var(--color-destructive-foreground)',
          }}
        >
          {err}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Expenses', value: expenses.length.toString() },
          { label: 'Total (cents)', value: `$${(totalExpenses / 100).toFixed(2)}` },
          { label: 'Vendors', value: vendors.filter((v) => v.is_active).length.toString() },
          { label: 'Pending approvals', value: pendingApprovals.length.toString() },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending approvals */}
      {pendingApprovals.length > 0 && (
        <div
          className="overflow-hidden rounded-xl"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Pending approvals
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Vendor', 'Date', 'Amount', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map((a) => {
                  const exp = expenses.find((e) => e.id === a.expense_id)
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                        {exp?.vendor ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                        {exp?.date ? new Date(exp.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-foreground)]">
                        ${((exp?.amount_cents ?? 0) / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <ApprovalActions approvalId={a.id} onError={setErr} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Recent Expenses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Date', 'Vendor', 'Category', 'Amount', 'Approval', 'Receipts', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]"
                  >
                    No expenses yet.
                  </td>
                </tr>
              )}
              {expenses.map((exp) => {
                const approval = approvalByExpense.get(exp.id)
                const expReceipts = receiptsByExpense.get(exp.id) ?? []
                const vendorName = exp.vendor_id ? vendorMap.get(exp.vendor_id) : exp.vendor
                const catName = exp.category_id ? categoryMap.get(exp.category_id) : null
                return (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {exp.date ? new Date(exp.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                      {vendorName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {catName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground)]">
                      ${(exp.amount_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {approval ? (
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor:
                              approval.status === 'approved'
                                ? 'var(--color-primary)'
                                : approval.status === 'rejected'
                                  ? 'var(--color-destructive)'
                                  : 'var(--color-muted)',
                            color:
                              approval.status === 'approved'
                                ? 'var(--color-primary-foreground)'
                                : approval.status === 'rejected'
                                  ? 'var(--color-destructive-foreground)'
                                  : 'var(--color-muted-foreground)',
                          }}
                        >
                          {approval.status}
                        </span>
                      ) : (
                        <SubmitApprovalButton expenseId={exp.id} onError={setErr} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                      {expReceipts.length}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setReceiptExpenseId(exp.id)}
                        className="inline-flex items-center gap-1 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-muted)]"
                      >
                        <FileText size={12} />
                        Receipts
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {vendorsOpen && (
        <VendorsDialog
          vendors={vendors}
          categories={categories}
          onClose={() => setVendorsOpen(false)}
          onError={setErr}
        />
      )}

      {expenseOpen && (
        <ExpenseDialog
          vendors={vendors}
          categories={categories}
          onClose={() => setExpenseOpen(false)}
          onError={setErr}
        />
      )}

      {receiptExpenseId && (
        <ReceiptsDialog
          expenseId={receiptExpenseId}
          receipts={receiptsByExpense.get(receiptExpenseId) ?? []}
          onClose={() => setReceiptExpenseId(null)}
          onError={setErr}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Submit approval
// ---------------------------------------------------------------------------

function SubmitApprovalButton({
  expenseId,
  onError,
}: {
  expenseId: string
  onError: (e: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await submitExpenseForApproval({ expense_id: expenseId })
          if (!res.ok) onError(res.error ?? 'Submit failed')
        })
      }
      className="inline-flex items-center gap-1 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-muted)]"
    >
      <Send size={12} />
      Submit for approval
    </button>
  )
}

function ApprovalActions({
  approvalId,
  onError,
}: {
  approvalId: string
  onError: (e: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [comments, setComments] = useState('')
  return (
    <div className="flex items-center gap-2">
      <Input
        inputSize="sm"
        placeholder="Comments"
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        className="min-h-[36px] h-9 max-w-[200px]"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await approveExpense({
              approval_id: approvalId,
              comments: comments || null,
            })
            if (!res.ok) onError(res.error ?? 'Approve failed')
          })
        }
        className="inline-flex items-center gap-1 rounded-[var(--radius,0.75rem)] px-2 py-1 text-xs"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-primary-foreground)',
        }}
      >
        <Check size={12} />
        Approve
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await rejectExpense({
              approval_id: approvalId,
              comments: comments || null,
            })
            if (!res.ok) onError(res.error ?? 'Reject failed')
          })
        }
        className="inline-flex items-center gap-1 rounded-[var(--radius,0.75rem)] px-2 py-1 text-xs"
        style={{
          backgroundColor: 'var(--color-destructive)',
          color: 'var(--color-destructive-foreground)',
        }}
      >
        <X size={12} />
        Reject
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Expense dialog (new)
// ---------------------------------------------------------------------------

function ExpenseDialog({
  vendors,
  categories,
  onClose,
  onError,
}: {
  vendors: Vendor[]
  categories: Category[]
  onClose: () => void
  onError: (e: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const activeVendors = vendors.filter((v) => v.is_active)
  const [vendorId, setVendorId] = useState('')
  const [customVendor, setCustomVendor] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')

  const handleSave = () => {
    startTransition(async () => {
      const selectedVendor = vendors.find((v) => v.id === vendorId)
      const vendorName = selectedVendor?.name ?? customVendor
      if (!vendorName) {
        onError('Vendor is required')
        return
      }
      const cents = Math.round(Number(amount) * 100)
      const res = await createExpense({
        category_id: categoryId,
        amount_cents: cents,
        date,
        vendor: vendorName,
        description: description || undefined,
        payment_method: 'card',
        recurring: false,
      })
      if (!res.ok) onError(res.error ?? 'Create failed')
      else onClose()
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent title="New Expense">
        <DialogClose onClick={onClose} />
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Vendor">
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">(Custom / not listed)</option>
              {activeVendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          {!vendorId && (
            <Field label="Vendor name (custom)">
              <Input value={customVendor} onChange={(e) => setCustomVendor(e.target.value)} />
            </Field>
          )}
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount ($)">
              <Input
                type="number"
                step="0.01"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={isPending}
              disabled={isPending || !amount || !categoryId}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Vendors dialog
// ---------------------------------------------------------------------------

function VendorsDialog({
  vendors,
  categories,
  onClose,
  onError,
}: {
  vendors: Vendor[]
  categories: Category[]
  onClose: () => void
  onError: (e: string) => void
}) {
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [adding, setAdding] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent title="Vendors" className="max-w-2xl">
        <DialogClose onClick={onClose} />
        <div className="space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setAdding(true)
                setEditing(null)
              }}
            >
              <Plus size={14} />
              Add vendor
            </Button>
          </div>
          <div className="space-y-2">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] p-3"
                style={{ opacity: v.is_active ? 1 : 0.5 }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--color-foreground)]">{v.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {v.contact_name ?? ''}
                    {v.email && ` · ${v.email}`}
                    {v.phone && ` · ${v.phone}`}
                    {!v.is_active && ' · archived'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(v)
                      setAdding(false)
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
                    aria-label="Edit vendor"
                  >
                    <Pencil size={14} />
                  </button>
                  {v.is_active && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        if (!confirm('Archive this vendor?')) return
                        startTransition(async () => {
                          const res = await deleteVendor({ id: v.id })
                          if (!res.ok) onError(res.error ?? 'Archive failed')
                        })
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
                      aria-label="Archive vendor"
                    >
                      <Archive size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {vendors.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)]">No vendors yet.</p>
            )}
          </div>

          {(adding || editing) && (
            <VendorForm
              categories={categories}
              initial={editing}
              onClose={() => {
                setEditing(null)
                setAdding(false)
              }}
              onError={onError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VendorForm({
  initial,
  categories,
  onClose,
  onError,
}: {
  initial: Vendor | null
  categories: Category[]
  onClose: () => void
  onError: (e: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(initial?.name ?? '')
  const [contactName, setContactName] = useState(initial?.contact_name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [taxId, setTaxId] = useState(initial?.tax_id ?? '')
  const [defaultCategoryId, setDefaultCategoryId] = useState(initial?.default_category_id ?? '')
  const [paymentTerms, setPaymentTerms] = useState(initial?.payment_terms_days?.toString() ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const handleSave = () => {
    startTransition(async () => {
      const payload = {
        name,
        contact_name: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        tax_id: taxId || null,
        default_category_id: defaultCategoryId || null,
        payment_terms_days: paymentTerms ? Number(paymentTerms) : null,
        notes: notes || null,
      }
      if (initial) {
        const res = await updateVendor({ id: initial.id, ...payload })
        if (!res.ok) onError(res.error ?? 'Save failed')
        else onClose()
      } else {
        const res = await createVendor(payload)
        if (!res.ok) onError(res.error ?? 'Create failed')
        else onClose()
      }
    })
  }

  return (
    <div
      className="rounded-[var(--radius,0.75rem)] p-4 space-y-3"
      style={{ backgroundColor: 'var(--color-muted)' }}
    >
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
        {initial ? 'Edit vendor' : 'Add vendor'}
      </h3>
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact name">
          <Input value={contactName ?? ''} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email ?? ''} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          <Input value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Tax ID">
          <Input value={taxId ?? ''} onChange={(e) => setTaxId(e.target.value)} />
        </Field>
      </div>
      <Field label="Address">
        <Input value={address ?? ''} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Default category">
          <Select
            value={defaultCategoryId ?? ''}
            onChange={(e) => setDefaultCategoryId(e.target.value)}
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payment terms (days)">
          <Input
            type="number"
            min={0}
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={notes ?? ''} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" loading={isPending} disabled={!name || isPending} onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Receipts dialog
// ---------------------------------------------------------------------------

function ReceiptsDialog({
  expenseId,
  receipts,
  onClose,
  onError,
}: {
  expenseId: string
  receipts: Receipt[]
  onClose: () => void
  onError: (e: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState('')

  const handleAdd = () => {
    startTransition(async () => {
      const res = await addExpenseReceipt({
        expense_id: expenseId,
        file_path: url,
        file_name: fileName || null,
      })
      if (!res.ok) onError(res.error ?? 'Add failed')
      else {
        setUrl('')
        setFileName('')
      }
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogOverlay onClick={onClose} />
      <DialogContent title="Receipts">
        <DialogClose onClick={onClose} />
        <div className="space-y-4">
          <div className="space-y-2">
            {receipts.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)]">No receipts yet.</p>
            )}
            {receipts.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--color-foreground)]">
                    {r.file_name ?? 'Receipt'}
                  </p>
                  <a
                    href={r.file_path}
                    className="text-xs underline break-all text-[var(--color-muted-foreground)]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.file_path}
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div
            className="rounded-[var(--radius,0.75rem)] p-4 space-y-3"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Add receipt</h3>
            <Field label="URL">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="File name (optional)">
              <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <Button
                size="sm"
                loading={isPending}
                disabled={!url || isPending}
                onClick={handleAdd}
              >
                <Upload size={14} />
                Add
              </Button>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}
