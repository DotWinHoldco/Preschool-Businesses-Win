// @anchor: cca.auth.staff-layout
// Staff layout wrapper — verifies staff-level role.

import { getSession, getUserMembership } from '@/lib/auth/session'
import { requireRole } from '@/lib/auth/permissions'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/portal/login')
  }

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const membership = await getUserMembership(session.user.id, tenantId)

  if (!membership) {
    redirect('/portal/login')
  }

  if (!requireRole(membership.role, 'aide')) {
    redirect('/portal')
  }

  return <>{children}</>
}
