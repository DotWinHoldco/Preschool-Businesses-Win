'use server'

// @anchor: cca.checkin.verify-pickup
// Pickup person verification — checks authorized_pickups table + custody schedule.
// See CCA_BUILD_BRIEF.md §7

import { VerifyPickupSchema, type VerifyPickupInput } from '@/lib/schemas/check-in'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getCustodyScheduleForToday } from './helpers'

export interface VerifyPickupResult {
  authorized: boolean
  reason?: string
  pickup_person?: {
    person_name: string
    relationship: string
    photo_path: string | null
    photo_verified: boolean
    family_id: string
  }
  custody_info?: {
    has_custody_today: boolean
    schedule_type: string | null
  }
}

export async function verifyPickupPerson(
  input: VerifyPickupInput,
): Promise<VerifyPickupResult> {
  // ── Validate with Zod ──────────────────────────────────────────────────
  const parsed = VerifyPickupSchema.safeParse(input)
  if (!parsed.success) {
    return {
      authorized: false,
      reason: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  // ── Look up authorized pickups for this student ────────────────────────
  const today = new Date().toISOString().split('T')[0]

  const { data: pickups, error } = await supabase
    .from('authorized_pickups')
    .select('id, family_id, person_name, relationship, phone, photo_path, photo_verified, valid_from, valid_to')
    .eq('student_id', data.student_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return {
      authorized: false,
      reason: 'Failed to verify pickup authorization. Please contact admin.',
    }
  }

  if (!pickups || pickups.length === 0) {
    return {
      authorized: false,
      reason: 'No authorized pickup persons found for this student.',
    }
  }

  // ── Find matching pickup person by name ────────────────────────────────
  const normalizedInput = data.pickup_person_name.toLowerCase().trim()
  const matchingPickup = pickups.find((p) => {
    const normalizedName = (p.person_name as string).toLowerCase().trim()
    return (
      normalizedName === normalizedInput ||
      normalizedName.includes(normalizedInput) ||
      normalizedInput.includes(normalizedName)
    )
  })

  if (!matchingPickup) {
    return {
      authorized: false,
      reason: `"${data.pickup_person_name}" is not on the authorized pickup list for this student.`,
    }
  }

  // ── Check validity dates ───────────────────────────────────────────────
  const validFrom = matchingPickup.valid_from as string | null
  const validTo = matchingPickup.valid_to as string | null

  if (validFrom && today < validFrom) {
    return {
      authorized: false,
      reason: `Pickup authorization for "${data.pickup_person_name}" is not yet active (starts ${validFrom}).`,
    }
  }

  if (validTo && today > validTo) {
    return {
      authorized: false,
      reason: `Pickup authorization for "${data.pickup_person_name}" has expired (ended ${validTo}).`,
    }
  }

  // ── Check custody schedule ─────────────────────────────────────────────
  const familyId = (data.family_id ?? matchingPickup.family_id) as string
  const custody = await getCustodyScheduleForToday(
    data.student_id,
    familyId,
  )

  if (!custody.hasCustody) {
    return {
      authorized: false,
      reason: `Today is not a scheduled custody day for this family. Contact admin for override.`,
      pickup_person: {
        person_name: matchingPickup.person_name as string,
        relationship: matchingPickup.relationship as string,
        photo_path: matchingPickup.photo_path as string | null,
        photo_verified: (matchingPickup.photo_verified as boolean) ?? false,
        family_id: familyId,
      },
      custody_info: {
        has_custody_today: false,
        schedule_type: custody.schedule
          ? (custody.schedule.type as string)
          : null,
      },
    }
  }

  // ── All checks passed ──────────────────────────────────────────────────
  return {
    authorized: true,
    pickup_person: {
      person_name: matchingPickup.person_name as string,
      relationship: matchingPickup.relationship as string,
      photo_path: matchingPickup.photo_path as string | null,
      photo_verified: (matchingPickup.photo_verified as boolean) ?? false,
      family_id: familyId,
    },
    custody_info: {
      has_custody_today: true,
      schedule_type: custody.schedule
        ? (custody.schedule.type as string)
        : null,
    },
  }
}
