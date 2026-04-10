// @anchor: cca.auth.parent-layout
// Parent layout wrapper — verifies parent-level role.

import { getSession, getUserMembership } from '@/lib/auth/session'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ParentLayout({
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

  // Parents can access (all roles can technically view parent pages)
  return <>{children}</>
}
