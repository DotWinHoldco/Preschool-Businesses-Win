// @anchor: cca.crm.merge-tags
// Registry of dynamic data placeholders allowed in TipTap email/SMS bodies.
// Each tag declares its label, sample value, and a resolver that pulls a
// safe string from a contact + tenant context. Custom fields plug in here
// once Phase 6's custom-field surfacing lands.

export interface MergeTag {
  key: string // e.g. "contact.first_name"
  label: string // human label
  sample: string // shown in editor preview
  description?: string
  resolve: (ctx: MergeContext) => string
}

export interface MergeContext {
  contact: {
    id: string
    first_name?: string | null
    last_name?: string | null
    full_name?: string | null
    email?: string | null
    phone?: string | null
    custom_fields?: Record<string, unknown>
  }
  tenant: {
    name: string
    from_name: string
    mailing_address?: string | null
    support_email?: string | null
    support_phone?: string | null
  }
  child?: { first_name?: string | null; last_name?: string | null }
  unsubscribeUrl: string
  preferencesUrl?: string
  resumeUrl?: string
}

export const STANDARD_MERGE_TAGS: MergeTag[] = [
  {
    key: 'contact.first_name',
    label: 'First name',
    sample: 'Sarah',
    resolve: (c) => safe(c.contact.first_name) || 'there',
  },
  {
    key: 'contact.last_name',
    label: 'Last name',
    sample: 'Johnson',
    resolve: (c) => safe(c.contact.last_name) || '',
  },
  {
    key: 'contact.full_name',
    label: 'Full name',
    sample: 'Sarah Johnson',
    resolve: (c) =>
      safe(c.contact.full_name) ||
      [c.contact.first_name, c.contact.last_name].filter(Boolean).join(' ') ||
      'friend',
  },
  {
    key: 'contact.email',
    label: 'Email',
    sample: 'sarah@example.com',
    resolve: (c) => safe(c.contact.email) || '',
  },
  {
    key: 'contact.phone',
    label: 'Phone',
    sample: '(555) 123-4567',
    resolve: (c) => safe(c.contact.phone) || '',
  },
  {
    key: 'tenant.name',
    label: 'School name',
    sample: 'Crandall Christian Academy',
    resolve: (c) => safe(c.tenant.name),
  },
  {
    key: 'tenant.support_email',
    label: 'School email',
    sample: 'admin@crandallchristianacademy.com',
    resolve: (c) => safe(c.tenant.support_email) || '',
  },
  {
    key: 'tenant.support_phone',
    label: 'School phone',
    sample: '(945) 226-6584',
    resolve: (c) => safe(c.tenant.support_phone) || '',
  },
  {
    key: 'tenant.mailing_address',
    label: 'School address',
    sample: '123 Main St, Crandall, TX',
    resolve: (c) => safe(c.tenant.mailing_address) || '',
  },
  {
    key: 'child.first_name',
    label: "Child's first name",
    sample: 'Emma',
    resolve: (c) => safe(c.child?.first_name) || 'your child',
  },
  {
    key: 'child.full_name',
    label: "Child's full name",
    sample: 'Emma Johnson',
    resolve: (c) =>
      [c.child?.first_name, c.child?.last_name].filter(Boolean).join(' ') || 'your child',
  },
  {
    key: 'links.unsubscribe',
    label: 'Unsubscribe link',
    sample: 'https://example.com/unsubscribe',
    resolve: (c) => c.unsubscribeUrl,
  },
  {
    key: 'links.preferences',
    label: 'Preferences link',
    sample: 'https://example.com/preferences',
    resolve: (c) => c.preferencesUrl ?? c.unsubscribeUrl,
  },
]

/**
 * Replace every {{tag.key}} occurrence in a string with the resolved value.
 * Unknown tags are left alone (so admins see them and notice the typo).
 */
export function renderMergeTags(input: string, ctx: MergeContext, extra: MergeTag[] = []): string {
  const all = new Map<string, MergeTag>()
  for (const t of STANDARD_MERGE_TAGS) all.set(t.key, t)
  for (const t of extra) all.set(t.key, t)

  return input.replace(/\{\{\s*([a-z0-9_.]+)\s*\}\}/gi, (full, key: string) => {
    const tag = all.get(key)
    if (!tag) return full
    try {
      return tag.resolve(ctx)
    } catch {
      return ''
    }
  })
}

function safe(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}
