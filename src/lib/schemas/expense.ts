// @anchor: cca.expenses.schema
// Zod schemas for expense tracking, categories, and accounting exports.
// Matches expenses, expense_categories, and accounting_exports tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Payment method enum
// ---------------------------------------------------------------------------

export const expensePaymentMethodEnum = z.enum(['card', 'check', 'cash', 'ach', 'auto'])

export type ExpensePaymentMethod = z.infer<typeof expensePaymentMethodEnum>

// ---------------------------------------------------------------------------
// Export type enum
// ---------------------------------------------------------------------------

export const exportTypeEnum = z.enum(['quickbooks_csv', 'xero_csv', 'general_ledger'])

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

// ---------------------------------------------------------------------------
// Vendor
// ---------------------------------------------------------------------------

export const CreateVendorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(300),
  contact_name: z.string().max(300).optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  tax_id: z.string().max(50).optional().nullable(),
  default_category_id: z.string().uuid().optional().nullable(),
  payment_terms_days: z.number().int().min(0).max(365).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>

export const UpdateVendorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(300).optional(),
  contact_name: z.string().max(300).optional().nullable(),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  tax_id: z.string().max(50).optional().nullable(),
  default_category_id: z.string().uuid().optional().nullable(),
  payment_terms_days: z.number().int().min(0).max(365).optional().nullable(),
  is_active: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
})
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>

export const DeleteVendorSchema = z.object({ id: z.string().uuid() })
export type DeleteVendorInput = z.infer<typeof DeleteVendorSchema>

// ---------------------------------------------------------------------------
// Expense approval
// ---------------------------------------------------------------------------

export const SubmitExpenseForApprovalSchema = z.object({
  expense_id: z.string().uuid(),
})
export type SubmitExpenseForApprovalInput = z.infer<typeof SubmitExpenseForApprovalSchema>

export const ApproveExpenseSchema = z.object({
  approval_id: z.string().uuid(),
  comments: z.string().max(2000).optional().nullable(),
})
export type ApproveExpenseInput = z.infer<typeof ApproveExpenseSchema>

export const RejectExpenseSchema = z.object({
  approval_id: z.string().uuid(),
  comments: z.string().max(2000).optional().nullable(),
})
export type RejectExpenseInput = z.infer<typeof RejectExpenseSchema>

// ---------------------------------------------------------------------------
// Expense receipt
// ---------------------------------------------------------------------------

export const AddExpenseReceiptSchema = z.object({
  expense_id: z.string().uuid(),
  file_path: z.string().min(1, 'URL is required').max(1000),
  file_name: z.string().max(300).optional().nullable(),
})
export type AddExpenseReceiptInput = z.infer<typeof AddExpenseReceiptSchema>
