'use client'

// @anchor: cca.auth.impersonation-banner
// Red banner shown when an admin is impersonating a user.
// Fixed at top of viewport, z-50. Shows target name + role + exit button.

import { useRouter } from 'next/navigation'
import { ShieldAlert, X } from 'lucide-react'

interface ImpersonationBannerProps {
  targetUserName: string
  targetUserRole: string
}

export function ImpersonationBanner({
  targetUserName,
  targetUserRole,
}: ImpersonationBannerProps) {
  const router = useRouter()

  async function handleExit() {
    // Call server action to end impersonation
    const response = await fetch('/api/auth/end-impersonation', {
      method: 'POST',
    })
    if (response.ok) {
      router.push('/portal/admin')
      router.refresh()
    }
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium"
      style={{
        backgroundColor: 'var(--color-destructive)',
        color: 'var(--color-destructive-foreground, #fff)',
      }}
      role="alert"
    >
      <ShieldAlert size={16} />
      <span>
        Acting as{' '}
        <strong>
          {targetUserName} ({targetUserRole})
        </strong>
      </span>
      <button
        type="button"
        onClick={handleExit}
        className="ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors hover:bg-white/20"
      >
        <X size={12} />
        Exit
      </button>
    </div>
  )
}
