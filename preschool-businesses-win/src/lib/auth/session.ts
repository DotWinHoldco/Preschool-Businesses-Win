// @anchor: cca.auth.session
// Auth session helpers for the portal.
// Next.js 16: cookies() is async. Uses @supabase/ssr createServerClient.

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { type Role, requireRole as checkRole } from './permissions'

const SUPABASE_URL = 'https://oajfxyiqjqymuvevnoui.supabase.co'

/**
 * Build a Supabase server client from async cookies (Next.js 16).
 */
async function buildServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Safe to ignore in Server Components (read-only context)
          }
        },
      },
    }
  )
}

export interface SessionUser {
  id: string
  email: string
}

export interface Session {
  user: SessionUser
  accessToken: string
}

/**
 * Read the current Supabase auth session from cookies.
 * Returns null if no valid session exists.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await buildServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) return null

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? '',
    },
    accessToken: session.access_token,
  }
}

export interface UserMembership {
  id: string
  user_id: string
  tenant_id: string
  role: Role
  status: string
}

/**
 * Fetch the user's membership (role) for a specific tenant.
 * Returns null if no membership exists.
 */
export async function getUserMembership(
  userId: string,
  tenantId: string
): Promise<UserMembership | null> {
  const supabase = await buildServerClient()

  const { data, error } = await supabase
    .from('user_tenant_memberships')
    .select('id, user_id, tenant_id, role, status')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single()

  if (error || !data) return null

  return data as UserMembership
}

/**
 * Require an authenticated session. Redirects to /portal/login if none.
 * Returns the session on success.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    redirect('/portal/login')
  }
  return session
}

/**
 * Require that the current user holds at least `minimumRole` in the
 * tenant identified by the x-tenant-id header. Redirects to /portal/login
 * if not authenticated, or to /portal if authenticated but insufficient role.
 */
export async function requireMinimumRole(minimumRole: Role): Promise<{
  session: Session
  membership: UserMembership
}> {
  const session = await requireAuth()

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) {
    throw new Error('Missing tenant context (x-tenant-id header not set)')
  }

  const membership = await getUserMembership(session.user.id, tenantId)

  if (!membership) {
    redirect('/portal/login')
  }

  if (!checkRole(membership.role, minimumRole)) {
    redirect('/portal')
  }

  return { session, membership }
}

/**
 * Assert that the current user holds at least `minimumRole` in the current tenant.
 * For use in Server Actions — throws instead of redirecting.
 * Returns the session and membership on success.
 */
export async function assertRole(minimumRole: Role): Promise<{
  session: Session
  membership: UserMembership
}> {
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) {
    throw new Error('Missing tenant context')
  }

  const membership = await getUserMembership(session.user.id, tenantId)
  if (!membership) {
    throw new Error('No membership in this tenant')
  }

  if (!checkRole(membership.role, minimumRole)) {
    throw new Error(`Insufficient permissions: requires ${minimumRole}, has ${membership.role}`)
  }

  return { session, membership }
}
