import { describe, it, expect } from 'vitest'
import {
  ProcessPaymentSchema,
  BillingPlanSchema,
  GenerateInvoicesSchema,
  GenerateTaxStatementSchema,
  invoiceStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
} from './billing'

describe('ProcessPaymentSchema', () => {
  const valid = {
    invoice_id: '550e8400-e29b-41d4-a716-446655440000',
    amount_cents: 15000,
    method: 'card' as const,
  }

  it('accepts valid payment', () => {
    expect(ProcessPaymentSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects zero amount', () => {
    expect(ProcessPaymentSchema.safeParse({ ...valid, amount_cents: 0 }).success).toBe(false)
  })

  it('rejects negative amount', () => {
    expect(ProcessPaymentSchema.safeParse({ ...valid, amount_cents: -100 }).success).toBe(false)
  })

  it('rejects invalid UUID', () => {
    expect(ProcessPaymentSchema.safeParse({ ...valid, invoice_id: 'not-a-uuid' }).success).toBe(
      false,
    )
  })

  it('rejects invalid payment method', () => {
    expect(ProcessPaymentSchema.safeParse({ ...valid, method: 'bitcoin' }).success).toBe(false)
  })

  it('accepts all valid payment methods', () => {
    for (const method of ['card', 'ach', 'cash', 'check', 'other']) {
      expect(ProcessPaymentSchema.safeParse({ ...valid, method }).success).toBe(true)
    }
  })

  it('accepts optional stripe_payment_intent_id', () => {
    const result = ProcessPaymentSchema.safeParse({ ...valid, stripe_payment_intent_id: 'pi_123' })
    expect(result.success).toBe(true)
  })

  it('accepts optional notes', () => {
    const result = ProcessPaymentSchema.safeParse({ ...valid, notes: 'Paid in office' })
    expect(result.success).toBe(true)
  })
})

describe('BillingPlanSchema', () => {
  const valid = {
    name: 'Full Day Pre-K',
    amount_cents: 120000,
    frequency: 'monthly' as const,
  }

  it('accepts valid plan', () => {
    expect(BillingPlanSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(BillingPlanSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects negative amount', () => {
    expect(BillingPlanSchema.safeParse({ ...valid, amount_cents: -1 }).success).toBe(false)
  })

  it('accepts zero amount (e.g. staff child)', () => {
    expect(BillingPlanSchema.safeParse({ ...valid, amount_cents: 0 }).success).toBe(true)
  })

  it('defaults discount percentages to 0', () => {
    const result = BillingPlanSchema.parse(valid)
    expect(result.sibling_discount_pct).toBe(0)
    expect(result.staff_discount_pct).toBe(0)
    expect(result.military_discount_pct).toBe(0)
    expect(result.church_member_discount_pct).toBe(0)
  })

  it('rejects discount over 100%', () => {
    expect(BillingPlanSchema.safeParse({ ...valid, sibling_discount_pct: 101 }).success).toBe(false)
  })
})

describe('GenerateInvoicesSchema', () => {
  it('accepts valid period', () => {
    const result = GenerateInvoicesSchema.safeParse({
      period_start: '2026-04-01',
      period_end: '2026-04-30',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing period_start', () => {
    expect(GenerateInvoicesSchema.safeParse({ period_end: '2026-04-30' }).success).toBe(false)
  })

  it('accepts optional family_ids', () => {
    const result = GenerateInvoicesSchema.safeParse({
      period_start: '2026-04-01',
      period_end: '2026-04-30',
      family_ids: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    expect(result.success).toBe(true)
  })
})

describe('GenerateTaxStatementSchema', () => {
  it('accepts valid input', () => {
    const result = GenerateTaxStatementSchema.safeParse({
      family_id: '550e8400-e29b-41d4-a716-446655440000',
      tax_year: 2025,
    })
    expect(result.success).toBe(true)
  })

  it('rejects year before 2020', () => {
    expect(
      GenerateTaxStatementSchema.safeParse({
        family_id: '550e8400-e29b-41d4-a716-446655440000',
        tax_year: 2019,
      }).success,
    ).toBe(false)
  })

  it('rejects year after 2100', () => {
    expect(
      GenerateTaxStatementSchema.safeParse({
        family_id: '550e8400-e29b-41d4-a716-446655440000',
        tax_year: 2101,
      }).success,
    ).toBe(false)
  })
})

describe('Enums', () => {
  it('invoiceStatusEnum has all expected values', () => {
    const values = invoiceStatusEnum.options
    expect(values).toContain('draft')
    expect(values).toContain('paid')
    expect(values).toContain('overdue')
    expect(values).toContain('voided')
  })

  it('paymentMethodEnum has all expected values', () => {
    expect(paymentMethodEnum.options).toEqual(['card', 'ach', 'cash', 'check', 'other'])
  })

  it('paymentStatusEnum has all expected values', () => {
    expect(paymentStatusEnum.options).toEqual(['succeeded', 'pending', 'failed', 'refunded'])
  })
})
