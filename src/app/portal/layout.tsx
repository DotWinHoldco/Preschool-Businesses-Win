// @anchor: portal.layout
// Portal surface layout — sidebar + topbar shell for the tenant portal.
// Feature-flag-aware navigation. Role-aware sections.
// See PLATFORM_ARCHITECTURE.md §5 and CCA_BUILD_BRIEF.md §6 for structure.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getTenantBranding } from '@/lib/tenant/branding'
import { getSession, getUserMembership } from '@/lib/auth/session'
import { getImpersonationState } from '@/lib/auth/impersonation'
import { PortalShell } from '@/components/portal/portal-shell'
import { ImpersonationBanner } from '@/components/portal/impersonation-banner'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read tenant context from proxy-injected headers (Next.js 16: async headers)
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')

  // Fetch branding for the sidebar logo and theming
  const branding = tenantId ? await getTenantBranding(tenantId) : null

  // Fetch real user session and role
  const session = await getSession()
  if (!tenantId) notFound()
  const effectiveTenantId = tenantId

  // Default to admin for dev when no session exists
  type PortalRole = 'cca_owner' | 'cca_admin' | 'lead_teacher' | 'teacher' | 'aide' | 'parent' | 'guardian' | 'applicant_parent'
  let userRole: PortalRole = 'cca_admin'
  let user = {
    name: 'Admin User',
    email: 'admin@school.com',
    avatarUrl: null as string | null,
    role: 'Admin',
  }

  if (session) {
    const membership = await getUserMembership(session.user.id, effectiveTenantId)
    if (membership) {
      const roleMap: Record<string, PortalRole> = {
        owner: 'cca_owner',
        admin: 'cca_admin',
        director: 'cca_admin',
        lead_teacher: 'lead_teacher',
        assistant_teacher: 'teacher',
        aide: 'aide',
        front_desk: 'aide',
        parent: 'parent',
      }
      userRole = roleMap[membership.role] ?? 'parent'
      user = {
        name: session.user.email.split('@')[0] ?? 'User',
        email: session.user.email,
        avatarUrl: null,
        role: membership.role.replace(/_/g, ' '),
      }
    }
  }

  // Check impersonation state
  const impersonation = await getImpersonationState()

  // Tenant features — fetched from DB (tenant_features table).
  const supabase = createAdminClient()
  const { data: featureRows } = await supabase
    .from('tenant_features')
    .select('feature_key, enabled, config')
    .eq('tenant_id', effectiveTenantId)

  const features = (featureRows ?? []).map((f) => ({
    feature_key: f.feature_key as string,
    enabled: f.enabled as boolean,
    config: (f.config as Record<string, unknown>) ?? {},
  }))

  // TODO (Phase 2): Fetch real classroom assignments for staff
  const classrooms = [
    { id: 'placeholder-1', name: 'Butterfly Room' },
    { id: 'placeholder-2', name: 'Sunshine Room' },
  ]

  // Determine if "Powered by .win" should show
  const showPoweredBy = true // TODO: read from tenants.plan

  return (
    <>
      {impersonation && (
        <ImpersonationBanner
          targetUserName={impersonation.targetUserName}
          targetUserRole={impersonation.targetUserRole}
        />
      )}
      <div style={impersonation ? { paddingTop: '2.5rem' } : undefined}>
        <PortalShell
          logoUrl={branding?.logo_url ?? null}
          schoolName={branding?.tagline?.split(' — ')[0] ?? 'Preschool'}
          userRole={userRole}
          user={user}
          features={features}
          classrooms={classrooms}
          showPoweredBy={showPoweredBy}
        >
          <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </PortalShell>
      </div>
    </>
  )
}
