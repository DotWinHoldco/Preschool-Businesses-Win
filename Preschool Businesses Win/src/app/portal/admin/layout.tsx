// @anchor: cca.auth.admin-layout
// Admin layout wrapper — verifies admin role.
// Falls back gracefully during dev when no session exists.

import { getSession, getUserMembership } from '@/lib/auth/session'
import { requireRole } from '@/lib/auth/permissions'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // In development without auth, allow access (placeholder until wired)
  if (!session) {
    // TODO: enforce redirect once auth is fully wired
    return <>{children}</>
  }

  const headerStore = await headers()
  const tenantId =
    headerStore.get('x-tenant-id') ??
    'a0a0a0a0-cca0-4000-8000-000000000001'

  const membership = await getUserMembership(session.user.id, tenantId)

  if (!membership) {
    redirect('/portal/login')
  }

  // Check admin-level role (director or above)
  if (!requireRole(membership.role, 'director')) {
    redirect('/portal')
  }

  return <>{children}</>
}
