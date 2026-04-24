import { createHash } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

let cachedSalt: { value: string; expiresAt: number } | null = null
const SALT_CACHE_MS = 60_000

async function getSalt(): Promise<string> {
  if (cachedSalt && Date.now() < cachedSalt.expiresAt) return cachedSalt.value
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('analytics_ip_salt')
    .select('salt')
    .eq('id', 1)
    .single()
  if (error || !data) {
    throw new Error('analytics_ip_salt is not seeded')
  }
  cachedSalt = { value: data.salt as string, expiresAt: Date.now() + SALT_CACHE_MS }
  return cachedSalt.value
}

export async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null
  const salt = await getSalt()
  return createHash('sha256')
    .update(salt + '|' + ip)
    .digest('hex')
    .slice(0, 32)
}
