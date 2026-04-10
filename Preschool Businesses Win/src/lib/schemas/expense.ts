// @anchor: cca.expenses.schema
// Zod schemas for expense tracking, categories, and accounting exports.
// Matches expenses, expense_categories, and accounting_exports tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Payment method enum
// ---------------------------------------------------------------------------

export const expensePaymentMethodEnum = z.enum([
  'card',
  'check',
  'cash',
  'ach',
  'auto',
])

export type ExpensePaymentMethod = z.infer<typeof expensePaymentMethodEnum>

// ---------------------------------------------------------------------------
// Export type enum
// ---------------------------------------------------------------------------

export const exportTypeEnum = z.enum([
  'quickbooks_csv',
  'xero_csv',
  'general_ledger',
])

export type ExportType = z.infer<typeof exportTypeEnum>

// ---------------------------------------------------------------------------
// Create Expense
// ---------------------------------------------------------------------------

export const CreateExpenseSchema = z.object({
  category_id: z.string().uuid('Invalid category ID'),
  amount_cents: z.number().int().min(1, 'Amount must be at least $0.01'),
  date: z.string().min(1, 'Date is required'),
  vendor: z.string().min(1, 'Vendor is required').max(300),
  description: z.string().max(2000).optional(),
  receipt_path: z.string().optional(),
  payment_method: expensePaymentMethodEnum.default('card'),
  classroom_id: z.string().uuid().optional().nullable(),
  recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['weekly', 'monthly', 'quarterly', 'annually']).optional(),
  notes: z.string().max(2000).optional(),
})

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>

// ---------------------------------------------------------------------------
// Update Expense
// ---------------------------------------------------------------------------

export const UpdateExpenseSchema = z.object({
  id: z.string().uuid('Invalid expense ID'),
  category_id: z.string().uuid().optional(),
  amount_cents: z.number().int().min(1).optional(),
  date: z.string().optional(),
  vendor: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional().nullable(),
  receipt_path: z.string().optional().nullable(),
  payment_method: expensePaymentMethodEnum.optional(),
  classroom_id: z.string().uuid().optional().nullable(),
  recurring: z.boolean().optional(),
  recurring_frequency: z.enum(['weekly', 'monthly', 'quarterly', 'annually']).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>

// ---------------------------------------------------------------------------
// Create Expense Category
// ---------------------------------------------------------------------------

export const CreateExpenseCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  parent_category_id: z.string().uuid().optional().nullable(),
  gl_code: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
})

export type CreateExpenseCategoryInput = z.infer<typeof CreateExpenseCategorySchema>

// ---------------------------------------------------------------------------
// Export Accounting
// ---------------------------------------------------------------------------

export const ExportAccountingSchema = z.object({
  export_type: exportTypeEnum,
  period_start: z.string().min(1, 'Start date is required'),
  period_end: z.string().min(1, 'End date is required'),
})

export type ExportAccountingInput = z.infer<typeof ExportAccountingSchema>
