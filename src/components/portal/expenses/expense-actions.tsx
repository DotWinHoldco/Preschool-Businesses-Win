'use client'

import { useState } from 'react'
import { Receipt, Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog'

interface Expense {
  id: string
  date: string
  vendor: string
  category_name: string
  amount_cents: number
  memo: string
}

interface ExpenseActionsProps {
  categories: { id: string; name: string }[]
  onAddExpense: (expense: Expense) => void
}

const DEFAULT_CATEGORIES = [
  'Supplies',
  'Food',
  'Rent',
  'Utilities',
  'Insurance',
  'Payroll',
  'Maintenance',
  'Other',
]

export function ExpenseActions({ categories, onAddExpense }: ExpenseActionsProps) {
  const [open, setOpen] = useState(false)

  const [date, setDate] = useState('')
  const [category, setCategory] = useState('')
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  const categoryList = categories.length > 0
    ? categories.map((c) => c.name)
    : DEFAULT_CATEGORIES

  function close() {
    setOpen(false)
  }

  function resetForm() {
    setDate('')
    setCategory('')
    setVendor('')
    setAmount('')
    setMemo('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountCents = Math.round(parseFloat(amount) * 100)
    const newExpense: Expense = {
      id: `local-${Date.now()}`,
      date,
      vendor,
      category_name: category,
      amount_cents: amountCents,
      memo,
    }
    onAddExpense(newExpense)
    alert(`Expense added: $${amount} to ${vendor} (${category})`)
    resetForm()
    close()
  }

  function handleExport() {
    alert('CSV export coming soon')
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Expenses</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Track expenses, manage budgets, and export to your accounting software
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && close()}>
        <DialogOverlay onClick={close} />
        <DialogContent
          title="Add Expense"
          description="Record a new expense."
        >
          <DialogClose onClick={close} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Category</label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Select category</option>
                {categoryList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Vendor</label>
              <Input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Office Depot"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Memo</label>
              <Input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={close}>Cancel</Button>
              <Button type="submit" size="sm">Add Expense</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
