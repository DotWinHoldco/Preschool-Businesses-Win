// @anchor: cca.expenses.entry
'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Camera, DollarSign, Save } from 'lucide-react'

interface ExpenseCategory {
  id: string
  name: string
  gl_code: string | null
}

interface ExpenseEntryProps {
  categories: ExpenseCategory[]
  classrooms?: Array<{ id: string; name: string }>
  onSubmit: (data: {
    category_id: string
    amount_cents: number
    date: string
    vendor: string
    description: string
    payment_method: string
    classroom_id: string | null
    receipt_path: string | null
  }) => void
}

export function ExpenseEntry({ categories, classrooms = [], onSubmit }: ExpenseEntryProps) {
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [vendor, setVendor] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [classroomId, setClassroomId] = useState('')
  const [receiptPath, setReceiptPath] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!categoryId || !amount || !vendor) return
    setSubmitting(true)
    try {
      onSubmit({
        category_id: categoryId,
        amount_cents: Math.round(parseFloat(amount) * 100),
        date,
        vendor,
        description,
        payment_method: paymentMethod,
        classroom_id: classroomId || null,
        receipt_path: receiptPath,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 md:p-6">
      <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">New Expense</h3>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.gl_code ? ` (${c.gl_code})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
              <DollarSign className="h-3.5 w-3.5" /> Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Vendor</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g., Amazon, Costco"
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="card">Card</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="ach">ACH</option>
            </select>
          </div>
          {classrooms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Classroom (optional)</label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">School-wide</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What was purchased..."
            className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
        </div>

        {/* Receipt capture */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Receipt</label>
          <button
            type="button"
            onClick={() => setReceiptPath(`receipts/${Date.now()}.jpg`)}
            className={cn(
              'flex items-center gap-2 rounded-[var(--radius)] border px-3 py-2 text-sm transition-colors',
              receiptPath
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                : 'border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]'
            )}
          >
            <Camera className="h-4 w-4" />
            {receiptPath ? 'Receipt attached' : 'Capture receipt photo'}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!categoryId || !amount || !vendor || submitting}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}
