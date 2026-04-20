// @anchor: cca.profile.admin-page
// Server Component: Admin profile page — fetches session, renders client form.

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProfileForm } from '@/components/portal/profile/profile-form'

export const metadata: Metadata = {
  title: 'My Profile | Admin Portal',
  description: 'View and update your profile information',
}

export default async function AdminProfilePage() {
  const session = await getSession()
  if (!session) {
    redirect('/portal/login')
  }

  // Fetch full user metadata via admin client
  const supabase = createAdminClient()
  const { data } = await supabase.auth.admin.getUserById(session.user.id)
  const meta = data?.user?.user_metadata ?? {}

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-foreground)' }}
        >
          My Profile
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          Manage your account details.
        </p>
      </div>

      <div
        className="mx-auto max-w-lg rounded-xl p-6"
        style={{
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <ProfileForm
          initialName={(meta.full_name as string) ?? ''}
          initialEmail={session.user.email}
          initialPhone={(meta.phone as string) ?? ''}
        />
      </div>
    </div>
  )
}
