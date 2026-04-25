// @anchor: cca.crm.audience-filter
// Compiles a JSON filter tree into a Supabase query against contacts.
// Supports the conditions every preschool actually needs without becoming
// a Turing-complete query language.

import type { SupabaseClient } from '@supabase/supabase-js'

export type FilterMatch = 'all' | 'any'

export type FilterField =
  | 'lifecycle_stage'
  | 'source'
  | 'tag'
  | 'owner_user_id'
  | 'has_email'
  | 'has_phone'
  | 'email_subscribed'
  | 'created_within_days'
  | 'last_activity_within_days'
  | 'utm_source'
  | 'utm_campaign'

export type FilterOperator = 'eq' | 'neq' | 'in' | 'not_in' | 'lt' | 'gt' | 'is_true' | 'is_false'

export interface FilterCondition {
  field: FilterField
  operator: FilterOperator
  value?: string | number | boolean | string[] | number[] | null
}

export interface FilterTree {
  match: FilterMatch
  conditions: FilterCondition[]
}

export const EMPTY_FILTER: FilterTree = { match: 'all', conditions: [] }

/**
 * Resolve the contact_ids matching a filter tree. Returns ALL matches —
 * caller should apply pagination if needed.
 */
export async function resolveFilterContacts(
  supabase: SupabaseClient,
  tenantId: string,
  filter: FilterTree,
): Promise<string[]> {
  // Tag conditions need a join — we fetch tag-matched contact ids first
  // and then intersect/union with the rest.
  const tagConditions = filter.conditions.filter((c) => c.field === 'tag')
  const directConditions = filter.conditions.filter((c) => c.field !== 'tag')

  let directIds: string[] | null = null
  if (directConditions.length > 0 || filter.conditions.length === 0) {
    let q = supabase.from('contacts').select('id').eq('tenant_id', tenantId).is('deleted_at', null)
    for (const c of directConditions) {
      q = applyDirect(q, c)
    }
    const { data, error } = await q.limit(50000)
    if (error) throw error
    directIds = (data ?? []).map((r) => r.id as string)
  }

  if (tagConditions.length === 0) {
    return directIds ?? []
  }

  // Resolve tag contact ids per condition.
  const tagSets: Set<string>[] = []
  for (const c of tagConditions) {
    const tagIds = Array.isArray(c.value) ? (c.value as string[]) : [c.value as string]
    if (tagIds.length === 0 || !tagIds.every((t) => typeof t === 'string')) continue
    const { data, error } = await supabase
      .from('contact_tag_assignments')
      .select('contact_id')
      .eq('tenant_id', tenantId)
      .in('tag_id', tagIds)
      .limit(50000)
    if (error) throw error
    const ids = new Set((data ?? []).map((r) => r.contact_id as string))
    if (c.operator === 'not_in' || c.operator === 'neq') {
      // "doesn't have tag" = full set minus matches.
      const all = await supabase
        .from('contacts')
        .select('id')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .limit(50000)
      const allIds = new Set((all.data ?? []).map((r) => r.id as string))
      for (const id of ids) allIds.delete(id)
      tagSets.push(allIds)
    } else {
      tagSets.push(ids)
    }
  }

  let combined: Set<string>
  if (filter.match === 'all') {
    combined = directIds ? new Set(directIds) : (tagSets[0] ?? new Set())
    for (const s of tagSets) {
      const next = new Set<string>()
      for (const id of combined) if (s.has(id)) next.add(id)
      combined = next
    }
  } else {
    combined = new Set(directIds ?? [])
    for (const s of tagSets) for (const id of s) combined.add(id)
  }
  return Array.from(combined)
}

// Loosely typed because we chain conditional .eq/.neq/.in/etc and the
// Supabase generic-builder typings get noisy fast. Behavior is hand-tested.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Q = any

function applyDirect(q: Q, c: FilterCondition): Q {
  switch (c.field) {
    case 'lifecycle_stage':
      if (c.operator === 'in' && Array.isArray(c.value))
        return q.in('lifecycle_stage', c.value as string[])
      if (c.operator === 'eq') return q.eq('lifecycle_stage', String(c.value))
      if (c.operator === 'neq') return q.neq('lifecycle_stage', String(c.value))
      return q
    case 'source':
      if (c.operator === 'in' && Array.isArray(c.value)) return q.in('source', c.value as string[])
      if (c.operator === 'eq') return q.eq('source', String(c.value))
      if (c.operator === 'neq') return q.neq('source', String(c.value))
      return q
    case 'owner_user_id':
      if (c.operator === 'eq') return q.eq('owner_user_id', String(c.value))
      if (c.operator === 'is_true') return q.not('owner_user_id', 'is', null)
      if (c.operator === 'is_false') return q.is('owner_user_id', null)
      return q
    case 'has_email':
      return c.operator === 'is_false' ? q.is('email', null) : q.not('email', 'is', null)
    case 'has_phone':
      return c.operator === 'is_false' ? q.is('phone', null) : q.not('phone', 'is', null)
    case 'email_subscribed':
      return q.eq('email_subscribed', c.operator !== 'is_false')
    case 'created_within_days': {
      const days = Number(c.value) || 30
      const since = new Date(Date.now() - days * 86400000).toISOString()
      return q.gte('created_at', since)
    }
    case 'last_activity_within_days': {
      const days = Number(c.value) || 30
      const since = new Date(Date.now() - days * 86400000).toISOString()
      return q.gte('last_activity_at', since)
    }
    case 'utm_source':
      if (c.operator === 'eq')
        return q.or(`utm_source_first.eq.${c.value},utm_source_last.eq.${c.value}`)
      return q
    case 'utm_campaign':
      if (c.operator === 'eq')
        return q.or(`utm_campaign_first.eq.${c.value},utm_campaign_last.eq.${c.value}`)
      return q
    default:
      return q
  }
}

export function describeFilter(filter: FilterTree, tagLabels: Map<string, string>): string {
  if (filter.conditions.length === 0) return 'All contacts'
  const parts = filter.conditions.map((c) => describeCondition(c, tagLabels))
  return parts.join(filter.match === 'all' ? ' AND ' : ' OR ')
}

function describeCondition(c: FilterCondition, tagLabels: Map<string, string>): string {
  switch (c.field) {
    case 'lifecycle_stage':
      return `Stage ${c.operator === 'neq' ? 'is not' : 'is'} ${valStr(c.value)}`
    case 'source':
      return `Source ${c.operator === 'neq' ? 'is not' : 'is'} ${valStr(c.value)}`
    case 'tag': {
      const ids = Array.isArray(c.value) ? c.value : [c.value]
      const labels = (ids as string[]).map((id) => tagLabels.get(id) ?? id).join(', ')
      return `${c.operator === 'not_in' || c.operator === 'neq' ? 'Does not have tag' : 'Has tag'}: ${labels}`
    }
    case 'has_email':
      return c.operator === 'is_false' ? 'No email' : 'Has email'
    case 'has_phone':
      return c.operator === 'is_false' ? 'No phone' : 'Has phone'
    case 'email_subscribed':
      return c.operator === 'is_false' ? 'Unsubscribed' : 'Email subscribed'
    case 'created_within_days':
      return `Created in last ${c.value} days`
    case 'last_activity_within_days':
      return `Active in last ${c.value} days`
    case 'utm_source':
      return `UTM source = ${c.value}`
    case 'utm_campaign':
      return `UTM campaign = ${c.value}`
    case 'owner_user_id':
      return c.operator === 'is_false' ? 'Unassigned' : `Owner = ${c.value}`
  }
  return ''
}

function valStr(v: FilterCondition['value']): string {
  if (Array.isArray(v)) return v.join(', ')
  return String(v ?? '')
}
