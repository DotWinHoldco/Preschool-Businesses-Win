// @anchor: cca.billing.schema
// Zod schemas for billing, invoicing, payments, and tax statements.
// Matches invoices, payments, billing_plans, tuition_agreements, family_billing_enrollments tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Invoice status enum
// ---------------------------------------------------------------------------

export const invoiceStatusEnum = z.enum([
  'draft',
  'sent',
  'paid',
  'overdue',
  'voided',
  'refunded',
])

export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>

// ---------------------------------------------------------------------------
// Payment method enum
// ---------------------------------------------------------------------------

export const paymentMethodEnum = z.enum([
  'card',
  'ach',
  'cash',
  'check',
  'other',
])

export type PaymentMethod = z.infer<typeof paymentMethodEnum>

// ---------------------------------------------------------------------------
// Payment status enum
// ---------------------------------------------------------------------------

export const paymentStatusEnum = z.enum([
  'succeeded',
  'pending',
  'failed',
  'refunded',
])

export type PaymentStatus = z.infer<typeof paymentStatusEnum>

// ---------------------------------------------------------------------------
// Billing frequency enum
// ---------------------------------------------------------------------------

export const billingFrequencyEnum = z.enum(['weekly', 'monthly', 'annually'])
export type BillingFrequency = z.infer<typeof billingFrequencyEnum>

// ---------------------------------------------------------------------------
// Billing plan
// ---------------------------------------------------------------------------

export const BillingPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(200),
  description: z.string().max(2000).optional(),
  amount_cents: z.number().int().min(0),
  frequency: billingFrequencyEnum,
  program_type: z.string().max(100).optional(),
  age_group: z.string().max(100).optional(),
  registration_fee_cents: z.number().int().min(0).default(0),
  supply_fee_cents: z.number().int().min(0).default(0),
  late_fee_cents: z.number().int().min(0).default(0),
  late_fee_grace_days: z.number().int().min(0).default(5),
  sibling_discount_pct: z.number().min(0).max(100).default(0),
  staff_discount_pct: z.number().min(0).max(100).default(0),
  military_discount_pct: z.number().min(0).max(100).default(0),
  church_member_discount_pct: z.number().min(0).max(100).default(0),
})

export type BillingPlanInput = z.infer<typeof BillingPlanSchema>

// ---------------------------------------------------------------------------
// Generate invoices
// ---------------------------------------------------------------------------

export const GenerateInvoicesSchema = z.object({
  period_start: z.string().min(1, 'Period start date is required'),
  period_end: z.string().min(1, 'Period end date is required'),
  family_ids: z.array(z.string().uuid()).optional(),
})

export type GenerateInvoicesInput = z.infer<typeof GenerateInvoicesSchema>

// ---------------------------------------------------------------------------
// Process payment
// ---------------------------------------------------------------------------

export const ProcessPaymentSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice ID'),
  amount_cents: z.number().int().min(1, 'Amount must be at least 1 cent'),
  method: paymentMethodEnum,
  stripe_payment_intent_id: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>

// ---------------------------------------------------------------------------
// Manage subscription / enrollment
// ---------------------------------------------------------------------------

export const enrollmentStatusBillingEnum = z.enum([
  'active',
  'paused',
  'cancelled',
])

export const ManageSubscriptionSchema = z.object({
  family_id: z.string().uuid('Invalid family ID'),
  student_id: z.string().uuid('Invalid student ID'),
  billing_plan_id: z.string().uuid('Invalid billing plan ID'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  custom_amount_cents: z.number().int().min(0).optional(),
  discount_type: z.string().max(100).optional(),
  discount_pct: z.number().min(0).max(100).optional(),
  status: enrollmentStatusBillingEnum.default('active'),
})

export type ManageSubscriptionInput = z.infer<typeof ManageSubscriptionSchema>

// ---------------------------------------------------------------------------
// Generate tax statement
// ---------------------------------------------------------------------------

export const GenerateTaxStatementSchema = z.object({
  family_id: z.string().uuid('Invalid family ID'),
  tax_year: z.number().int().min(2020).max(2100),
})

export type GenerateTaxStatementInput = z.infer<typeof GenerateTaxStatementSchema>

// ---------------------------------------------------------------------------
// Tuition agreement
// ---------------------------------------------------------------------------

export const tuitionAgreementStatusEnum = z.enum([
  'draft',
  'sent',
  'signed',
  'expired',
  'cancelled',
])

export const TuitionAgreementSchema = z.object({
  family_id: z.string().uuid('Invalid family ID'),
  student_id: z.string().uuid('Invalid student ID'),
  plan_id: z.string().uuid('Invalid plan ID'),
  terms_text: z.string().min(1, 'Terms text is required'),
  custom_terms: z.string().optional(),
  amount_cents: z.number().int().min(0),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
})

export type TuitionAgreementInput = z.infer<typeof TuitionAgreementSchema>

// ---------------------------------------------------------------------------
// Invoice line item category
// ---------------------------------------------------------------------------

export const invoiceLineCategoryEnum = z.enum([
  'tuition',
  'registration',
  'supplies',
  'late_fee',
  'field_trip',
  'other',
])

export type InvoiceLineCategory = z.infer<typeof invoiceLineCategoryEnum>
