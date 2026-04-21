import { describe, it, expect } from 'vitest'
import {
  CheckInSchema,
  CheckOutSchema,
  HealthScreeningSchema,
  PINEntrySchema,
  QRScanSchema,
  CarlineArrivalSchema,
} from './check-in'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

describe('HealthScreeningSchema', () => {
  it('accepts all false (healthy child)', () => {
    const result = HealthScreeningSchema.safeParse({
      has_fever: false,
      has_rash: false,
      has_vomiting: false,
      has_diarrhea: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing fields', () => {
    expect(HealthScreeningSchema.safeParse({ has_fever: false }).success).toBe(false)
  })

  it('accepts optional notes', () => {
    const result = HealthScreeningSchema.safeParse({
      has_fever: false,
      has_rash: false,
      has_vomiting: false,
      has_diarrhea: false,
      notes: 'Mild cough',
    })
    expect(result.success).toBe(true)
  })

  it('rejects notes over 500 chars', () => {
    const result = HealthScreeningSchema.safeParse({
      has_fever: false,
      has_rash: false,
      has_vomiting: false,
      has_diarrhea: false,
      notes: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe('CheckInSchema', () => {
  const validCheckIn = {
    student_id: uuid,
    method: 'qr_scan' as const,
    health_screening: {
      has_fever: false,
      has_rash: false,
      has_vomiting: false,
      has_diarrhea: false,
    },
  }

  it('accepts valid check-in', () => {
    expect(CheckInSchema.safeParse(validCheckIn).success).toBe(true)
  })

  it('rejects missing student_id', () => {
    const { student_id: _, ...rest } = validCheckIn
    expect(CheckInSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects invalid method', () => {
    expect(CheckInSchema.safeParse({ ...validCheckIn, method: 'face_scan' }).success).toBe(false)
  })

  it('accepts all valid methods', () => {
    for (const method of ['qr_scan', 'pin', 'staff_manual', 'kiosk']) {
      expect(CheckInSchema.safeParse({ ...validCheckIn, method }).success).toBe(true)
    }
  })

  it('accepts optional temperature', () => {
    const result = CheckInSchema.safeParse({ ...validCheckIn, temperature_f: 98.6 })
    expect(result.success).toBe(true)
  })

  it('rejects temperature below 90', () => {
    expect(CheckInSchema.safeParse({ ...validCheckIn, temperature_f: 89 }).success).toBe(false)
  })

  it('rejects temperature above 110', () => {
    expect(CheckInSchema.safeParse({ ...validCheckIn, temperature_f: 111 }).success).toBe(false)
  })
})

describe('CheckOutSchema', () => {
  const validCheckOut = {
    student_id: uuid,
    pickup_person_name: 'Jane Doe',
    pickup_person_relationship: 'mother',
    method: 'staff_manual' as const,
  }

  it('accepts valid check-out', () => {
    expect(CheckOutSchema.safeParse(validCheckOut).success).toBe(true)
  })

  it('rejects empty pickup person name', () => {
    expect(CheckOutSchema.safeParse({ ...validCheckOut, pickup_person_name: '' }).success).toBe(false)
  })

  it('rejects empty relationship', () => {
    expect(CheckOutSchema.safeParse({ ...validCheckOut, pickup_person_relationship: '' }).success).toBe(false)
  })
})

describe('PINEntrySchema', () => {
  it('accepts valid 6-digit PIN', () => {
    expect(PINEntrySchema.safeParse({ pin: '123456' }).success).toBe(true)
  })

  it('rejects 5-digit PIN', () => {
    expect(PINEntrySchema.safeParse({ pin: '12345' }).success).toBe(false)
  })

  it('rejects 7-digit PIN', () => {
    expect(PINEntrySchema.safeParse({ pin: '1234567' }).success).toBe(false)
  })

  it('rejects non-numeric PIN', () => {
    expect(PINEntrySchema.safeParse({ pin: 'abcdef' }).success).toBe(false)
  })
})

describe('QRScanSchema', () => {
  it('accepts valid token', () => {
    expect(QRScanSchema.safeParse({ qr_token: 'abc123' }).success).toBe(true)
  })

  it('rejects empty token', () => {
    expect(QRScanSchema.safeParse({ qr_token: '' }).success).toBe(false)
  })
})

describe('CarlineArrivalSchema', () => {
  it('accepts valid arrival', () => {
    const result = CarlineArrivalSchema.safeParse({
      family_id: uuid,
      pickup_person_name: 'John Doe',
      student_ids: [uuid],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty student_ids', () => {
    const result = CarlineArrivalSchema.safeParse({
      family_id: uuid,
      pickup_person_name: 'John Doe',
      student_ids: [],
    })
    expect(result.success).toBe(false)
  })
})
