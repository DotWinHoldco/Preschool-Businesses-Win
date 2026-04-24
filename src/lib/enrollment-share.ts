import { createHmac } from 'crypto'

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getSigningSecret(): string {
  const s = process.env.CRON_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!s)
    throw new Error('CRON_SECRET or NEXTAUTH_SECRET must be configured for enrollment share tokens')
  return s
}

export function generateShareToken(applicationId: string, ttlMs = DEFAULT_TTL_MS): string {
  const expiresAt = Date.now() + ttlMs
  const payload = `${applicationId}:${expiresAt}`
  const signature = createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 16)
  return Buffer.from(`${payload}:${signature}`).toString('base64url')
}

export function verifyShareToken(token: string): { applicationId: string; valid: boolean } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length < 3) return { applicationId: '', valid: false }

    const signature = parts.pop()!
    const expiresAtStr = parts.pop()!
    const applicationId = parts.join(':')
    const expiresAt = parseInt(expiresAtStr, 10)

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { applicationId, valid: false }
    }

    const expected = createHmac('sha256', getSigningSecret())
      .update(`${applicationId}:${expiresAt}`)
      .digest('hex')
      .slice(0, 16)

    if (signature !== expected) return { applicationId: '', valid: false }

    return { applicationId, valid: true }
  } catch {
    return { applicationId: '', valid: false }
  }
}

const PII_FIELDS = ['drivers_license', 'parent_drivers_license'] as const

export function redactPII(value: string | null | undefined, field?: string): string {
  if (!value) return ''
  if (field && PII_FIELDS.some((f) => field.includes(f))) {
    return '***REDACTED***'
  }
  return value
}

export function redactEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***@***'
  const visible = local.slice(0, 3)
  return `${visible}***@${domain}`
}

export function redactPhone(phone: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '***'
  return `***-***-${digits.slice(-4)}`
}

export function redactMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...meta }

  if (redacted.parent && typeof redacted.parent === 'object') {
    const parent = { ...(redacted.parent as Record<string, unknown>) }
    if (parent.drivers_license) parent.drivers_license = '***REDACTED***'
    if (parent.address_street) parent.address_street = '***REDACTED***'
    redacted.parent = parent
  }

  if (redacted.other_parent && typeof redacted.other_parent === 'object') {
    const other = { ...(redacted.other_parent as Record<string, unknown>) }
    if (other.drivers_license) other.drivers_license = '***REDACTED***'
    if (other.address_street) other.address_street = '***REDACTED***'
    redacted.other_parent = other
  }

  if (redacted.parent_signature) {
    redacted.parent_signature = '[Signature on file]'
  }

  return redacted
}
