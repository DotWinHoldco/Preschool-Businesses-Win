'use server'

// @anchor: cca.door.unlock-action
// Send unlock/lock commands to doors via the hardware abstraction layer
// See CCA_BUILD_BRIEF.md §14

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { createDoorController } from '@/lib/hardware/door-control'
import { assertRole } from '@/lib/auth/session'

const UnlockDoorSchema = z.object({
  door_id: z.string().uuid(),
  reason: z.string().min(1).max(500),
})

const LockDoorSchema = z.object({
  door_id: z.string().uuid(),
})

export async function unlockDoor(input: z.infer<typeof UnlockDoorSchema>) {
  await assertRole('admin')

  const parsed = UnlockDoorSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Fetch door config
  const { data: door, error: doorError } = await supabase
    .from('door_locks')
    .select('id, name, api_endpoint, api_key_encrypted, status')
    .eq('id', parsed.data.door_id)
    .eq('tenant_id', tenantId)
    .single()

  if (doorError || !door) {
    return { ok: false as const, error: { _form: ['Door not found'] } }
  }

  if (door.status === 'offline') {
    return { ok: false as const, error: { _form: ['Door is offline'] } }
  }

  // TODO: Check access rules (role, time window, active shift)
  // For now, any authenticated user with access to this action can unlock

  const controller = createDoorController()
  const result = await controller.unlock(
    parsed.data.door_id,
    actorId,
    parsed.data.reason,
  )

  // Log the access attempt
  await supabase.from('door_access_log').insert({
    tenant_id: tenantId,
    door_lock_id: parsed.data.door_id,
    user_id: actorId,
    action: result.success ? 'unlock' : 'denied',
    method: 'app',
    timestamp: new Date().toISOString(),
    notes: parsed.data.reason,
  })

  if (!result.success) {
    return { ok: false as const, error: { _form: [result.error ?? 'Unlock failed'] } }
  }

  return { ok: true as const }
}

export async function lockDoor(input: z.infer<typeof LockDoorSchema>) {
  await assertRole('admin')

  const parsed = LockDoorSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const controller = createDoorController()
  const result = await controller.lock(parsed.data.door_id, actorId)

  await supabase.from('door_access_log').insert({
    tenant_id: tenantId,
    door_lock_id: parsed.data.door_id,
    user_id: actorId,
    action: result.success ? 'lock' : 'denied',
    method: 'app',
    timestamp: new Date().toISOString(),
    notes: null,
  })

  if (!result.success) {
    return { ok: false as const, error: { _form: [result.error ?? 'Lock failed'] } }
  }

  return { ok: true as const }
}
