// @anchor: cca.auth.staff-layout
// Staff layout wrapper — verifies staff-level role.

import { getSession, getUserMembership } from '@/lib/auth/session'
import { requireRole } from '@/lib/auth/permissions'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // In development without auth, allow access
  if (!session) {
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

  // Staff roles: aide and above (not parent/guardian)
  if (!requireRole(membership.role, 'parent')) {
    redirect('/portal')
  }

  return <>{children}</>
}
