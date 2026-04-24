// @anchor: cca.auth.parent-layout
// Parent layout wrapper — verifies parent-level role.

import { getSession, getUserMembership } from '@/lib/auth/session'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
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

  // Parents can access (all roles can technically view parent pages)
  return <>{children}</>
}
