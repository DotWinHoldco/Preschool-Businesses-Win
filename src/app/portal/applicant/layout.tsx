import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireAuth, getUserMembership } from '@/lib/auth/session'

export default async function ApplicantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) redirect('/portal/login')

  const membership = await getUserMembership(session.user.id, tenantId)
  if (!membership) redirect('/portal/login')

  if (membership.role === 'parent') redirect('/portal/parent')

  if (membership.role !== 'applicant_parent') redirect('/portal')

  return <>{children}</>
}
