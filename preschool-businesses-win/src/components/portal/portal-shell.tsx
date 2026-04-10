'use client'

// @anchor: portal.shell
// Portal shell — combines sidebar + topbar into a responsive app shell.
// Mobile: sidebar is a slide-over toggled from the topbar hamburger.
// Desktop: sidebar is always visible, collapsible.

import { useState, useCallback } from 'react'
import { PortalSidebar } from '@/components/portal/sidebar'
import { PortalTopbar } from '@/components/portal/topbar'
import type { TenantFeature } from '@/lib/tenant/features'

interface Classroom {
  id: string
  name: string
}

interface UserInfo {
  name: string
  email: string
  avatarUrl?: string | null
  role: string
}

type UserRole =
  | 'cca_owner'
  | 'cca_admin'
  | 'lead_teacher'
  | 'teacher'
  | 'aide'
  | 'parent'
  | 'guardian'
  | 'applicant_parent'

interface PortalShellProps {
  logoUrl?: string | null
  schoolName?: string
  userRole: UserRole
  user: UserInfo
  features: TenantFeature[]
  classrooms?: Classroom[]
  showPoweredBy?: boolean
  children: React.ReactNode
}

export function PortalShell({
  logoUrl,
  schoolName,
  userRole,
  user,
  features,
  classrooms = [],
  showPoweredBy = true,
  children,
}: PortalShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeClassroomId, setActiveClassroomId] = useState<string | null>(null)

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar (always visible) */}
      <div className="hidden md:flex">
        <PortalSidebar
          logoUrl={logoUrl}
          schoolName={schoolName}
          userRole={userRole}
          features={features}
          showPoweredBy={showPoweredBy}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Slide-over sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
            <PortalSidebar
              logoUrl={logoUrl}
              schoolName={schoolName}
              userRole={userRole}
              features={features}
              showPoweredBy={showPoweredBy}
            />
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        <PortalTopbar
          user={user}
          classrooms={classrooms}
          activeClassroomId={activeClassroomId}
          onClassroomChange={setActiveClassroomId}
          notificationCount={0}
          onMobileMenuToggle={handleMobileMenuToggle}
        />
        {children}
      </div>
    </div>
  )
}
