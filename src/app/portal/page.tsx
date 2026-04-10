// @anchor: portal.entry
// Portal entry — redirects to the appropriate dashboard by user role.

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { getSession, getUserMembership } from '@/lib/auth/session'

export default async function PortalEntryPage() {
  const session = await getSession()

  if (!session) {
    redirect('/portal/login')
  }

  // Read tenant from proxy-injected header
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  // Check user's role in tenant
  const membership = await getUserMembership(
    session.user.id,
    tenantId
  )

  const role = membership?.role ?? 'parent'

  // Redirect based on role
  switch (role) {
    case 'owner':
    case 'admin':
    case 'director':
      redirect('/portal/admin')
    case 'lead_teacher':
    case 'assistant_teacher':
    case 'aide':
    case 'front_desk':
      redirect('/portal/staff')
    case 'parent':
    default:
      redirect('/portal/parent')
  }
}
