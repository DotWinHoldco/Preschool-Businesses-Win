import { describe, it, expect } from 'vitest'
import {
  UpsertConsentSchema,
  PrivacySettingsSchema,
  DataExportRequestSchema,
  AnonymizeFamilySchema,
  ConsentTypeEnum,
} from './compliance'

const uuid = '550e8400-e29b-41d4-a716-446655440000'

describe('ConsentTypeEnum', () => {
  it('accepts all valid types', () => {
    const types = ['photo_use', 'data_sharing', 'marketing', 'directory_inclusion', 'third_party_sharing', 'field_trip_photo']
    for (const t of types) {
      expect(ConsentTypeEnum.safeParse(t).success).toBe(true)
    }
  })

  it('rejects invalid type', () => {
    expect(ConsentTypeEnum.safeParse('video_use').success).toBe(false)
  })
})

describe('UpsertConsentSchema', () => {
  it('accepts valid consent with family only', () => {
    const result = UpsertConsentSchema.safeParse({
      family_id: uuid,
      consent_type: 'photo_use',
      granted: true,
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid consent with student', () => {
    const result = UpsertConsentSchema.safeParse({
      family_id: uuid,
      student_id: uuid,
      consent_type: 'data_sharing',
      granted: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing family_id', () => {
    expect(UpsertConsentSchema.safeParse({
      consent_type: 'photo_use',
      granted: true,
    }).success).toBe(false)
  })
})

describe('PrivacySettingsSchema', () => {
  const valid = {
    retention_days: 730,
    coppa_contact_email: 'admin@school.com',
    auto_delete_withdrawn: false,
    anonymize_after_withdrawal: false,
  }

  it('accepts valid settings', () => {
    expect(PrivacySettingsSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects retention below 90 days', () => {
    expect(PrivacySettingsSchema.safeParse({ ...valid, retention_days: 30 }).success).toBe(false)
  })

  it('rejects retention above 3650 days', () => {
    expect(PrivacySettingsSchema.safeParse({ ...valid, retention_days: 4000 }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(PrivacySettingsSchema.safeParse({ ...valid, coppa_contact_email: 'not-email' }).success).toBe(false)
  })
})

describe('DataExportRequestSchema', () => {
  it('accepts csv format', () => {
    expect(DataExportRequestSchema.safeParse({ export_format: 'csv' }).success).toBe(true)
  })

  it('accepts json format', () => {
    expect(DataExportRequestSchema.safeParse({ export_format: 'json' }).success).toBe(true)
  })

  it('accepts optional family_id', () => {
    expect(DataExportRequestSchema.safeParse({
      export_format: 'csv',
      family_id: uuid,
    }).success).toBe(true)
  })

  it('rejects invalid format', () => {
    expect(DataExportRequestSchema.safeParse({ export_format: 'xml' }).success).toBe(false)
  })
})

describe('AnonymizeFamilySchema', () => {
  it('accepts valid anonymize request', () => {
    expect(AnonymizeFamilySchema.safeParse({
      family_id: uuid,
      confirmation_text: 'Smith Family',
    }).success).toBe(true)
  })

  it('rejects empty confirmation text', () => {
    expect(AnonymizeFamilySchema.safeParse({
      family_id: uuid,
      confirmation_text: '',
    }).success).toBe(false)
  })

  it('rejects invalid family_id', () => {
    expect(AnonymizeFamilySchema.safeParse({
      family_id: 'not-uuid',
      confirmation_text: 'Smith Family',
    }).success).toBe(false)
  })
})
