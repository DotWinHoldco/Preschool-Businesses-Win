export type Role =
  | 'owner'
  | 'admin'
  | 'director'
  | 'lead_teacher'
  | 'assistant_teacher'
  | 'aide'
  | 'front_desk'
  | 'parent'
  | 'applicant_parent'

/** Ordered from highest privilege to lowest */
const ROLE_HIERARCHY: Role[] = [
  'owner',
  'admin',
  'director',
  'lead_teacher',
  'assistant_teacher',
  'aide',
  'front_desk',
  'parent',
  'applicant_parent',
]

/**
 * Permission map: each role lists the action prefixes it can perform.
 * A wildcard '*' means full access.
 */
const PERMISSION_MAP: Record<Role, string[]> = {
  owner: ['*'],
  admin: ['*'],
  director: ['*'],
  lead_teacher: [
    'classroom:read',
    'classroom:write',
    'student:read',
    'student:write',
    'daily_report:read',
    'daily_report:write',
    'attendance:read',
    'attendance:write',
    'incident:read',
    'incident:write',
    'messaging:read',
    'messaging:write',
    'schedule:read',
  ],
  assistant_teacher: [
    'classroom:read',
    'student:read',
    'student:write',
    'daily_report:read',
    'daily_report:write',
    'attendance:read',
    'attendance:write',
    'incident:read',
    'incident:write',
    'messaging:read',
    'messaging:write',
  ],
  aide: [
    'classroom:read',
    'student:read',
    'daily_report:read',
    'daily_report:write',
    'attendance:read',
    'messaging:read',
  ],
  front_desk: [
    'student:read',
    'attendance:read',
    'attendance:write',
    'enrollment:read',
    'enrollment:write',
    'messaging:read',
    'messaging:write',
    'billing:read',
    'schedule:read',
  ],
  parent: [
    'child:read',
    'daily_report:read',
    'attendance:read',
    'messaging:read',
    'messaging:write',
    'billing:read',
    'billing:pay',
    'enrollment:read',
    'enrollment:submit',
  ],
  applicant_parent: [
    'enrollment:read',
    'appointment:book',
  ],
}

/**
 * Check if a role has permission to perform a given action.
 * Actions use colon-separated namespaces (e.g., 'student:write').
 */
export function canUser(role: Role, action: string): boolean {
  const permissions = PERMISSION_MAP[role]
  if (!permissions) return false
  if (permissions.includes('*')) return true
  return permissions.some(
    (p) => p === action || action.startsWith(`${p}:`)
  )
}

/**
 * Check if a role is at or above the minimum required role in the hierarchy.
 * Returns true if `role` has equal or higher privilege than `minimumRole`.
 */
export function requireRole(role: Role, minimumRole: Role): boolean {
  const roleIndex = ROLE_HIERARCHY.indexOf(role)
  const minIndex = ROLE_HIERARCHY.indexOf(minimumRole)
  if (roleIndex === -1 || minIndex === -1) return false
  return roleIndex <= minIndex
}
