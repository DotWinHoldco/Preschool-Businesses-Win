'use client'

// @anchor: portal.sidebar
// Portal sidebar — tenant logo, feature-flag-gated navigation, role-aware sections.
// "Powered by .win" badge at bottom (removable on premium plan).
// See PLATFORM_ARCHITECTURE.md §5 and CCA_BUILD_BRIEF.md §6 for nav structure.

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  School,
  LogIn,
  ClipboardList,
  FileText,
  UserCog,
  CreditCard,
  MessageSquare,
  BookOpen,
  UtensilsCrossed,
  Receipt,
  UserPlus,
  CalendarDays,
  FolderOpen,
  CheckSquare,
  BarChart3,
  AlertTriangle,
  ShieldCheck,
  DoorOpen,
  Camera,
  Settings,
  ChevronLeft,
  ChevronRight,
  PieChart,
  GraduationCap,
  Car,
  CalendarClock,
  Banknote,
  ClipboardCheck,
  Newspaper,
  FilePlus2,
  CalendarCheck,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  PLATFORM_SHORT_NAME,
  PLATFORM_LOGO_ICON_WHITE,
} from '@/lib/constants'
import type { TenantFeature } from '@/lib/tenant/features'
import { hasTenantFeature } from '@/lib/tenant/features'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type UserRole =
  | 'cca_owner'
  | 'cca_admin'
  | 'lead_teacher'
  | 'teacher'
  | 'aide'
  | 'parent'
  | 'guardian'
  | 'applicant_parent'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  /** Roles allowed to see this item. Empty = all roles. */
  roles?: UserRole[]
  /** Feature key required. Null = always visible. */
  featureKey?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

interface SidebarProps {
  /** Tenant logo URL from branding */
  logoUrl?: string | null
  /** School name for text fallback */
  schoolName?: string
  /** Current user's role in this tenant */
  userRole: UserRole
  /** Tenant's enabled features */
  features: TenantFeature[]
  /** Whether to show "Powered by .win" */
  showPoweredBy?: boolean
}

/* ------------------------------------------------------------------ */
/* Navigation config — role-gated, feature-flag-gated                  */
/* ------------------------------------------------------------------ */

const ADMIN_STAFF_ROLES: UserRole[] = [
  'cca_owner', 'cca_admin', 'lead_teacher', 'teacher', 'aide',
]
const ADMIN_ROLES: UserRole[] = ['cca_owner', 'cca_admin']
const PARENT_ROLES: UserRole[] = ['parent', 'guardian']
const APPLICANT_ROLES: UserRole[] = ['applicant_parent']

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/portal', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Manage',
    items: [
      { href: '/portal/admin/students', label: 'Students', icon: Users, roles: ADMIN_ROLES },
      { href: '/portal/admin/families', label: 'Families', icon: UserCircle, roles: ADMIN_ROLES },
      { href: '/portal/admin/classrooms', label: 'Classrooms', icon: School, roles: ADMIN_ROLES },
      { href: '/portal/admin/staff', label: 'Staff', icon: UserCog, roles: ADMIN_ROLES },
    ],
  },
  {
    title: 'Daily',
    items: [
      { href: '/portal/staff/check-in', label: 'Check-in', icon: LogIn, roles: ADMIN_STAFF_ROLES, featureKey: 'check_in' },
      { href: '/portal/admin/attendance', label: 'Attendance', icon: ClipboardList, roles: ADMIN_STAFF_ROLES, featureKey: 'attendance_tracking' },
      { href: '/portal/staff/daily-reports', label: 'Daily Reports', icon: FileText, roles: ADMIN_STAFF_ROLES, featureKey: 'daily_reports' },
      { href: '/portal/staff/carline', label: 'Carline', icon: Car, roles: ADMIN_STAFF_ROLES, featureKey: 'carline' },
    ],
  },
  {
    title: 'Programs',
    items: [
      { href: '/portal/admin/curriculum', label: 'Curriculum', icon: BookOpen, roles: ADMIN_STAFF_ROLES, featureKey: 'curriculum' },
      { href: '/portal/admin/food-program', label: 'Food Program', icon: UtensilsCrossed, roles: ADMIN_ROLES, featureKey: 'cacfp' },
      { href: '/portal/admin/portfolios', label: 'Portfolios', icon: GraduationCap, roles: ADMIN_STAFF_ROLES, featureKey: 'portfolios' },
    ],
  },
  {
    title: 'Business',
    items: [
      { href: '/portal/admin/billing', label: 'Billing', icon: CreditCard, roles: ADMIN_ROLES, featureKey: 'billing' },
      { href: '/portal/admin/expenses', label: 'Expenses', icon: Receipt, roles: ADMIN_ROLES, featureKey: 'expense_tracking' },
      { href: '/portal/admin/subsidies', label: 'Subsidies', icon: Banknote, roles: ADMIN_ROLES, featureKey: 'subsidy_tracking' },
      { href: '/portal/admin/enrollment', label: 'Enrollment', icon: UserPlus, roles: ADMIN_ROLES },
      { href: '/portal/admin/leads', label: 'Leads', icon: PieChart, roles: ADMIN_ROLES, featureKey: 'enrollment_crm' },
      { href: '/portal/admin/appointments', label: 'Appointments', icon: CalendarCheck, roles: ADMIN_ROLES },
      { href: '/portal/admin/forms', label: 'Forms', icon: FilePlus2, roles: ADMIN_ROLES, featureKey: 'form_builder' },
      { href: '/portal/admin/drop-in', label: 'Drop-in', icon: CalendarClock, roles: ADMIN_ROLES, featureKey: 'drop_in' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { href: '/portal/admin/messaging', label: 'Messaging', icon: MessageSquare, featureKey: 'messaging' },
      { href: '/portal/admin/newsfeed', label: 'Newsfeed', icon: Newspaper, featureKey: 'newsfeed' },
      { href: '/portal/admin/surveys', label: 'Surveys', icon: ClipboardCheck, roles: ADMIN_ROLES, featureKey: 'surveys' },
      { href: '/portal/admin/calendar', label: 'Calendar', icon: CalendarDays, featureKey: 'calendar_events' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/portal/admin/documents', label: 'Documents', icon: FolderOpen, featureKey: 'document_vault' },
      { href: '/portal/admin/checklists', label: 'Checklists', icon: CheckSquare, featureKey: 'checklists' },
      { href: '/portal/admin/training', label: 'Training', icon: GraduationCap, roles: ADMIN_ROLES, featureKey: 'training_tracker' },
      { href: '/portal/admin/analytics', label: 'Analytics', icon: BarChart3, roles: ADMIN_ROLES, featureKey: 'analytics' },
    ],
  },
  {
    title: 'Safety',
    items: [
      { href: '/portal/admin/doors', label: 'Door Control', icon: DoorOpen, roles: ADMIN_ROLES, featureKey: 'door_control' },
      { href: '/portal/admin/cameras', label: 'Cameras', icon: Camera, roles: ADMIN_ROLES, featureKey: 'camera_feeds' },
      { href: '/portal/admin/emergency', label: 'Emergency', icon: AlertTriangle, roles: ADMIN_ROLES, featureKey: 'emergency_system' },
      { href: '/portal/admin/compliance', label: 'Compliance', icon: ShieldCheck, roles: ADMIN_ROLES, featureKey: 'dfps_compliance' },
    ],
  },
  {
    title: 'My Application',
    items: [
      { href: '/portal/applicant', label: 'Application Status', icon: ClipboardList, roles: APPLICANT_ROLES },
      { href: '/portal/applicant#book-tour', label: 'Book Tour', icon: CalendarCheck, roles: APPLICANT_ROLES },
    ],
  },
  {
    title: 'My Family',
    items: [
      { href: '/portal/parent', label: 'Dashboard', icon: LayoutDashboard, roles: PARENT_ROLES },
      { href: '/portal/parent/children', label: 'My Children', icon: Users, roles: PARENT_ROLES },
      { href: '/portal/parent/check-in', label: 'Check-in', icon: LogIn, roles: PARENT_ROLES, featureKey: 'check_in' },
      { href: '/portal/parent/billing', label: 'Billing', icon: CreditCard, roles: PARENT_ROLES, featureKey: 'billing' },
      { href: '/portal/parent/messaging', label: 'Messages', icon: MessageSquare, roles: PARENT_ROLES, featureKey: 'messaging' },
      { href: '/portal/parent/calendar', label: 'Calendar', icon: CalendarDays, roles: PARENT_ROLES, featureKey: 'calendar_events' },
      { href: '/portal/parent/documents', label: 'Documents', icon: FolderOpen, roles: PARENT_ROLES, featureKey: 'document_vault' },
      { href: '/portal/parent/drop-in', label: 'Book Drop-in', icon: CalendarClock, roles: PARENT_ROLES, featureKey: 'drop_in' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/portal/admin/settings', label: 'Settings', icon: Settings, roles: ADMIN_ROLES },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function PortalSidebar({
  logoUrl,
  schoolName = 'Preschool',
  userRole,
  features,
  showPoweredBy = true,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  /** Check if a nav item is visible for the current user/tenant. */
  function isItemVisible(item: NavItem): boolean {
    // Role check: if roles are specified, the user must match
    if (item.roles && item.roles.length > 0 && !item.roles.includes(userRole)) {
      return false
    }
    // Feature flag check: if a feature key is specified, the tenant must have it enabled
    if (item.featureKey && !hasTenantFeature(features, item.featureKey)) {
      return false
    }
    return true
  }

  /** Check if a section has any visible items. */
  function isSectionVisible(section: NavSection): boolean {
    return section.items.some(isItemVisible)
  }

  /** Check if a nav item is active based on the current pathname. */
  function isActive(href: string): boolean {
    if (href === '/portal') return pathname === '/portal'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-r transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo area */}
      <div
        className={cn(
          'flex items-center justify-between border-b shrink-0 px-4',
          logoUrl && !collapsed ? 'py-4' : 'h-16',
        )}
        style={{ borderColor: 'var(--color-border)' }}
      >
        {!collapsed && (
          <Link href="/portal" className="flex items-center gap-2 min-w-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={schoolName}
                width={160}
                height={160}
                className="h-auto w-full max-w-[140px] object-contain"
                priority
              />
            ) : (
              <span
                className="text-sm font-bold truncate"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-foreground)',
                }}
              >
                {schoolName}
              </span>
            )}
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md transition-colors hover:bg-[var(--color-muted)]"
          style={{ color: 'var(--color-muted-foreground)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-3 px-2 space-y-5"
        aria-label="Portal navigation"
      >
        {NAV_SECTIONS.filter(isSectionVisible).map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p
                className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.filter(isItemVisible).map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-[var(--color-primary)]/10'
                          : 'hover:bg-[var(--color-muted)]',
                        collapsed && 'justify-center',
                      )}
                      style={{
                        color: active
                          ? 'var(--color-primary)'
                          : 'var(--color-foreground)',
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — Powered by .win */}
      {showPoweredBy && (
        <div
          className="shrink-0 px-4 py-3 border-t flex items-center gap-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {!collapsed && (
            <>
              <Image
                src={PLATFORM_LOGO_ICON_WHITE}
                alt={PLATFORM_SHORT_NAME}
                width={16}
                height={16}
                className="h-4 w-4 opacity-40"
              />
              <span
                className="text-xs"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                Powered by {PLATFORM_SHORT_NAME}
              </span>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
