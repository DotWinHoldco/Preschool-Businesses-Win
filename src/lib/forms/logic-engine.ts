// @anchor: platform.form-builder.logic-engine

export type LogicOperator =
  | 'equals' | 'not_equals' | 'contains' | 'not_contains'
  | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  | 'starts_with' | 'ends_with'

export interface LogicCondition {
  field_key: string
  operator: LogicOperator
  value?: unknown
}

export interface LogicRule {
  conditions: LogicCondition[]
  logic: 'and' | 'or'
  action: 'show' | 'hide' | 'jump_to'
  target_field_key?: string
}

function evaluateCondition(condition: LogicCondition, fieldValues: Record<string, unknown>): boolean {
  const val = fieldValues[condition.field_key]
  const cmpVal = condition.value

  switch (condition.operator) {
    case 'equals': return val === cmpVal
    case 'not_equals': return val !== cmpVal
    case 'contains': return String(val ?? '').includes(String(cmpVal ?? ''))
    case 'not_contains': return !String(val ?? '').includes(String(cmpVal ?? ''))
    case 'greater_than': return Number(val) > Number(cmpVal)
    case 'less_than': return Number(val) < Number(cmpVal)
    case 'is_empty': return val === null || val === undefined || val === ''
    case 'is_not_empty': return val !== null && val !== undefined && val !== ''
    case 'starts_with': return String(val ?? '').startsWith(String(cmpVal ?? ''))
    case 'ends_with': return String(val ?? '').endsWith(String(cmpVal ?? ''))
    default: return true
  }
}

interface ShowIfRule {
  show_if: { field: string; equals: unknown }
}

function isShowIfRule(rule: unknown): rule is ShowIfRule {
  return (
    typeof rule === 'object' &&
    rule !== null &&
    'show_if' in rule &&
    typeof (rule as ShowIfRule).show_if === 'object'
  )
}

export function evaluateLogicRules(
  rules: unknown[],
  fieldValues: Record<string, unknown>
): { visible: boolean; jumpTo?: string } {
  let visible = true
  let jumpTo: string | undefined

  for (const rule of rules) {
    if (isShowIfRule(rule)) {
      const { field, equals } = rule.show_if
      visible = fieldValues[field] === equals
      continue
    }

    const typed = rule as LogicRule
    if (!typed.conditions) continue

    const results = typed.conditions.map(c => evaluateCondition(c, fieldValues))
    const passes = typed.logic === 'and'
      ? results.every(Boolean)
      : results.some(Boolean)

    if (typed.action === 'show') visible = passes
    else if (typed.action === 'hide') visible = !passes
    else if (typed.action === 'jump_to' && passes) jumpTo = typed.target_field_key
  }

  return { visible, jumpTo }
}

export function evaluateFormula(
  formula: string,
  fieldValues: Record<string, unknown>
): number {
  const resolved = formula.replace(/\{([^}]+)\}/g, (_, key) => {
    const v = fieldValues[key]
    return typeof v === 'number' ? String(v) : '0'
  })

  try {
    const sanitized = resolved.replace(/[^0-9+\-*/().% ]/g, '')
    return Function(`"use strict"; return (${sanitized})`)() as number
  } catch {
    return 0
  }
}
