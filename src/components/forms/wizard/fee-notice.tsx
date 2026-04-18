import { cn } from '@/lib/cn'
import { ShieldCheck, Sparkles } from 'lucide-react'

export function WizardFeeNotice({
  feeEnabled,
  feeAmountCents,
  feeDescription = 'Application Fee',
  hideFeeNotice = false,
  variant = 'banner',
}: {
  feeEnabled: boolean
  feeAmountCents?: number | null
  feeDescription?: string
  hideFeeNotice?: boolean
  variant?: 'banner' | 'inline'
}) {
  if (hideFeeNotice) return null

  const isBanner = variant === 'banner'

  if (feeEnabled && feeAmountCents) {
    const price = `$${(feeAmountCents / 100).toFixed(0)}`
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)]',
          isBanner && 'mb-8',
        )}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-primary)]"
        />
        <div className="flex items-center gap-5 p-5 md:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
            <ShieldCheck className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
              {feeDescription}
            </span>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span
                className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-foreground)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {price}
              </span>
              <span className="text-xs text-[var(--color-muted-foreground)]">charged at submission</span>
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)] leading-relaxed">
              Non-refundable. Secures your spot in our review queue. Processed securely via Stripe — no card
              information is stored on our servers.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(92,185,97,0.24)]',
        isBanner && 'mb-8',
      )}
      style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]">
        <svg className="absolute -right-8 -top-8 h-48 w-48 text-white" viewBox="0 0 200 200" fill="currentColor">
          <circle cx="100" cy="100" r="100" />
        </svg>
        <svg className="absolute -left-6 -bottom-10 h-36 w-36 text-white" viewBox="0 0 200 200" fill="currentColor">
          <circle cx="100" cy="100" r="100" />
        </svg>
      </div>
      <div className="relative flex items-center gap-5 p-5 md:p-6 text-[var(--color-primary-foreground)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
              Limited time
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white ring-1 ring-white/25">
              Fee waived
            </span>
          </div>
          <h3
            className="mt-0.5 text-2xl md:text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Application fees waived
          </h3>
          <p className="mt-1.5 text-sm text-white/90 leading-relaxed">
            For a limited time, your application is completely free — no payment required. Submit yours today
            and we&rsquo;ll be in touch within 1&ndash;2 business days.
          </p>
        </div>
      </div>
    </div>
  )
}
