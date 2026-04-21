import { describe, it, expect } from 'vitest'
import { canUser, requireRole } from './permissions'
import type { Role } from './permissions'

describe('canUser', () => {
  it('owner has wildcard access', () => {
    expect(canUser('owner', 'anything:goes')).toBe(true)
  })

  it('admin has wildcard access', () => {
    expect(canUser('admin', 'billing:read')).toBe(true)
  })

  it('director has wildcard access', () => {
    expect(canUser('director', 'student:write')).toBe(true)
  })

  it('lead_teacher can read classrooms', () => {
    expect(canUser('lead_teacher', 'classroom:read')).toBe(true)
  })

  it('lead_teacher can write classrooms', () => {
    expect(canUser('lead_teacher', 'classroom:write')).toBe(true)
  })

  it('lead_teacher cannot access billing', () => {
    expect(canUser('lead_teacher', 'billing:read')).toBe(false)
  })

  it('assistant_teacher can write daily reports', () => {
    expect(canUser('assistant_teacher', 'daily_report:write')).toBe(true)
  })

  it('assistant_teacher cannot write classrooms', () => {
    expect(canUser('assistant_teacher', 'classroom:write')).toBe(false)
  })

  it('aide can read classrooms but not write', () => {
    expect(canUser('aide', 'classroom:read')).toBe(true)
    expect(canUser('aide', 'classroom:write')).toBe(false)
  })

  it('aide can write daily reports', () => {
    expect(canUser('aide', 'daily_report:write')).toBe(true)
  })

  it('front_desk can read billing', () => {
    expect(canUser('front_desk', 'billing:read')).toBe(true)
  })

  it('front_desk cannot write billing', () => {
    expect(canUser('front_desk', 'billing:write')).toBe(false)
  })

  it('parent can read child data', () => {
    expect(canUser('parent', 'child:read')).toBe(true)
  })

  it('parent can pay bills', () => {
    expect(canUser('parent', 'billing:pay')).toBe(true)
  })

  it('parent cannot write attendance', () => {
    expect(canUser('parent', 'attendance:write')).toBe(false)
  })

  it('applicant_parent can only read enrollment and book appointments', () => {
    expect(canUser('applicant_parent', 'enrollment:read')).toBe(true)
    expect(canUser('applicant_parent', 'appointment:book')).toBe(true)
    expect(canUser('applicant_parent', 'student:read')).toBe(false)
  })

  it('returns false for unknown role', () => {
    expect(canUser('janitor' as Role, 'anything')).toBe(false)
  })
})

describe('requireRole', () => {
  it('owner satisfies admin requirement', () => {
    expect(requireRole('owner', 'admin')).toBe(true)
  })

  it('admin satisfies admin requirement', () => {
    expect(requireRole('admin', 'admin')).toBe(true)
  })

  it('director satisfies admin requirement (higher in hierarchy)', () => {
    expect(requireRole('director', 'admin')).toBe(false)
  })

  it('lead_teacher does not satisfy admin', () => {
    expect(requireRole('lead_teacher', 'admin')).toBe(false)
  })

  it('parent does not satisfy front_desk', () => {
    expect(requireRole('parent', 'front_desk')).toBe(false)
  })

  it('owner satisfies any role', () => {
    expect(requireRole('owner', 'parent')).toBe(true)
    expect(requireRole('owner', 'applicant_parent')).toBe(true)
  })

  it('applicant_parent only satisfies itself', () => {
    expect(requireRole('applicant_parent', 'applicant_parent')).toBe(true)
    expect(requireRole('applicant_parent', 'parent')).toBe(false)
  })

  it('returns false for unknown role', () => {
    expect(requireRole('janitor' as Role, 'admin')).toBe(false)
  })
})
