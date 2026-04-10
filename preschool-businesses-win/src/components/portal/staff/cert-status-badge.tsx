// @anchor: cca.staff.cert-badge
// Shows certification status: valid, expiring soon, or expired.

import { cn } from '@/lib/cn'
import { ShieldCheck, AlertTriangle, ShieldX } from 'lucide-react'

type CertStatus = 'valid' | 'expiring' | 'expired'

interface CertStatusBadgeProps {
  certName: string
  expiryDate?: string | null
  className?: string
}

function getCertStatus(expiryDate?: string | null): CertStatus {
  if (!expiryDate) return 'valid' // No expiry = always valid
  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 30) return 'expiring'
  return 'valid'
}

const STATUS_CONFIG: Record<CertStatus, { icon: typeof ShieldCheck; color: string; bg: string; label: string }> = {
  valid: {
    icon: ShieldCheck,
    color: 'text-[var(--color-success)]',
    bg: 'bg-[var(--color-success)]/10',
    label: 'Valid',
  },
  expiring: {
    icon: AlertTriangle,
    color: 'text-[var(--color-warning)]',
    bg: 'bg-[var(--color-warning)]/10',
    label: 'Expiring soon',
  },
  expired: {
    icon: ShieldX,
    color: 'text-[var(--color-destructive)]',
    bg: 'bg-[var(--color-destructive)]/10',
    label: 'Expired',
  },
}

export function CertStatusBadge({ certName, expiryDate, className }: CertStatusBadgeProps) {
  const status = getCertStatus(expiryDate)
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5',
        config.bg,
        className,
      )}
    >
      <Icon size={14} className={config.color} />
      <span className={cn('text-xs font-medium', config.color)}>
        {certName}
      </span>
      <span className={cn('text-xs', config.color)}>
        {config.label}
      </span>
    </div>
  )
}
