'use client'

import { useState, useTransition } from 'react'
import { Save, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { saveTenantEmailSettings } from '@/lib/actions/crm/email-settings'

interface Initial {
  from_name: string
  from_email: string
  reply_to: string | null
  resend_domain: string | null
  domain_verified: boolean
  mailing_address: string
  unsubscribe_text: string
}

export function SettingsClient({ initial }: { initial: Initial }) {
  const [s, setS] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  function save() {
    setError(null)
    startTransition(async () => {
      const r = await saveTenantEmailSettings({
        from_name: s.from_name,
        from_email: s.from_email,
        reply_to: s.reply_to ?? null,
        resend_domain: s.resend_domain ?? null,
        domain_verified: s.domain_verified,
        mailing_address: s.mailing_address,
        unsubscribe_text: s.unsubscribe_text,
      })
      if (!r.ok) {
        setError(r.error ?? 'Save failed')
        return
      }
      toast({ variant: 'success', title: 'Settings saved' })
      setSavedAt(new Date().toLocaleTimeString())
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">CRM settings</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Sender identity, mailing address (CAN-SPAM), and unsubscribe footer copy. Required before
          any campaign or automation can send.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Sender</h2>
            {s.domain_verified ? (
              <Badge variant="success">
                <ShieldCheck size={11} />
                Domain verified
              </Badge>
            ) : (
              <Badge variant="warning">
                <ShieldAlert size={11} />
                Domain not verified
              </Badge>
            )}
          </div>
          <Field label="From name">
            <Input
              value={s.from_name}
              onChange={(e) => setS({ ...s, from_name: e.target.value })}
            />
          </Field>
          <Field label="From email" hint="Must be on a domain you have verified in Resend.">
            <Input
              type="email"
              value={s.from_email}
              onChange={(e) => setS({ ...s, from_email: e.target.value })}
              placeholder="hello@mail.yourschool.com"
            />
          </Field>
          <Field label="Reply-to (optional)">
            <Input
              type="email"
              value={s.reply_to ?? ''}
              onChange={(e) => setS({ ...s, reply_to: e.target.value || null })}
              placeholder="admin@yourschool.com"
            />
          </Field>
          <Field label="Resend domain" hint="The verified domain you set up in Resend.">
            <Input
              value={s.resend_domain ?? ''}
              onChange={(e) => setS({ ...s, resend_domain: e.target.value || null })}
              placeholder="mail.yourschool.com"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.domain_verified}
              onChange={(e) => setS({ ...s, domain_verified: e.target.checked })}
              className="h-4 w-4"
            />
            Mark domain verified (sets the green badge)
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Footer (CAN-SPAM)</h2>
          <Field
            label="Mailing address"
            hint="US law requires a valid physical postal address in every commercial email. Appears in the footer of every send."
          >
            <textarea
              value={s.mailing_address}
              onChange={(e) => setS({ ...s, mailing_address: e.target.value })}
              rows={2}
              className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              placeholder="123 Main St · Crandall, TX 75114"
            />
          </Field>
          <Field label="Unsubscribe link text">
            <Input
              value={s.unsubscribe_text}
              onChange={(e) => setS({ ...s, unsubscribe_text: e.target.value })}
            />
          </Field>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between sticky bottom-0 bg-gradient-to-t from-[var(--color-background)] to-transparent pt-3 pb-2">
        <span className="text-xs text-[var(--color-muted-foreground)]">
          {savedAt ? `Saved at ${savedAt}` : 'Unsaved changes'}
        </span>
        <Button onClick={save} loading={pending} disabled={pending}>
          <Save size={14} />
          Save settings
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--color-foreground)]">{label}</span>
      {hint && (
        <span className="block text-[11px] text-[var(--color-muted-foreground)] mb-1.5 mt-0.5">
          {hint}
        </span>
      )}
      {!hint && <span className="block mb-1" />}
      {children}
    </label>
  )
}
