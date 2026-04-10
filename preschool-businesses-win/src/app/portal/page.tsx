// @anchor: portal.entry
// Portal entry — redirects to the appropriate dashboard by user role.

import { redirect } from 'next/navigation'
import { getSession, getUserMembership } from '@/lib/auth/session'

export default async function PortalEntryPage() {
  const session = await getSession()

  if (!session) {
    redirect('/portal/login')
  }

  // Check user's role in CCA tenant
  const membership = await getUserMembership(
    session.user.id,
    'a0a0a0a0-cca0-4000-8000-000000000001'
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
