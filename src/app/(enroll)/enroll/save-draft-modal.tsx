'use client'

import { useEffect, useState, useTransition } from 'react'
import { Mail, X, CheckCircle2 } from 'lucide-react'
import { sendDraftMagicLink } from '@/lib/actions/enrollment/drafts'

interface Props {
  tenantName: string
  formId: string
  values: Record<string, unknown>
  step: number
  prefillFirstName: string
  prefillLastName: string
  prefillEmail: string
  onClose: () => void
  onLocalSaveFallback: () => void
  onValuesPatch: (patch: Record<string, unknown>) => void
  onSent: (toastMessage: string) => void
}

export function SaveDraftModal(props: Props) {
  const {
    tenantName,
    formId,
    values,
    step,
    prefillFirstName,
    prefillLastName,
    prefillEmail,
    onClose,
    onLocalSaveFallback,
    onValuesPatch,
    onSent,
  } = props

  const [firstName, setFirstName] = useState(prefillFirstName)
  const [lastName, setLastName] = useState(prefillLastName)
  const [email, setEmail] = useState(prefillEmail)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    if (!firstName.trim()) {
      setError('Please enter your first name.')
      return
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email.')
      return
    }
    // Mirror entered values back into the form so they aren't lost.
    onValuesPatch({
      parent_first_name: firstName.trim(),
      parent_last_name: lastName.trim() || values.parent_last_name,
      parent_email: cleanEmail,
    })

    startTransition(async () => {
      const visitorId =
        typeof document !== 'undefined'
          ? (document.cookie.match(/(?:^|; )_pbwa_vid=([^;]*)/)?.[1] ?? null)
          : null
      const result = await sendDraftMagicLink({
        email: cleanEmail,
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        phone: (values.parent_phone as string | undefined) ?? null,
        values: {
          ...values,
          parent_first_name: firstName.trim(),
          parent_last_name: lastName.trim() || values.parent_last_name,
          parent_email: cleanEmail,
        },
        current_step: step,
        form_id: formId || null,
        analytics_visitor_id: visitorId ? decodeURIComponent(visitorId) : null,
        source: 'save_modal',
      })

      if (!result.ok) {
        setError(
          result.error === 'email_failed'
            ? "Saved your spot, but we couldn't send the email. Try again in a moment."
            : 'Save failed — please try again.',
        )
        // Even on email-only failure, try local save so progress isn't lost.
        if (result.error === 'email_failed') {
          onLocalSaveFallback()
          onSent(`Saved! Email to ${cleanEmail} pending.`)
          onClose()
        }
        return
      }
      onSent(`Resume link sent to ${cleanEmail}`)
      onClose()
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save your application"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-3 sm:px-5 py-6 bg-cca-ink/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose()
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)] overflow-hidden"
      >
        <div
          className="h-1 w-full"
          style={{
            background:
              'linear-gradient(90deg, #3b70b0 0%, #5cb961 25%, #f2b020 50%, #f878af 75%, #4abdac 100%)',
          }}
        />
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cca-blue/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-cca-blue" />
              </div>
              <h2 className="font-kollektif text-xl text-cca-ink">Email me my progress</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              aria-label="Close"
              className="text-cca-ink/40 hover:text-cca-ink/80 transition-colors disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="font-questrial text-sm text-cca-ink/65 mb-5 ml-13">
            We&rsquo;ll save your application and email you a link so you can pick up from any
            device.
          </p>

          <div className="space-y-3">
            <Field label="First name" required>
              <input
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={pending}
                className="w-full rounded-full border border-cca-ink/15 bg-white px-4 h-12 font-questrial text-base text-cca-ink focus:outline-none focus:ring-2 focus:ring-cca-blue/40 focus:border-cca-blue/40 transition"
              />
            </Field>
            <Field label="Last name">
              <input
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={pending}
                className="w-full rounded-full border border-cca-ink/15 bg-white px-4 h-12 font-questrial text-base text-cca-ink focus:outline-none focus:ring-2 focus:ring-cca-blue/40 focus:border-cca-blue/40 transition"
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                className="w-full rounded-full border border-cca-ink/15 bg-white px-4 h-12 font-questrial text-base text-cca-ink focus:outline-none focus:ring-2 focus:ring-cca-blue/40 focus:border-cca-blue/40 transition"
              />
            </Field>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 font-questrial">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onLocalSaveFallback()
                onSent('Saved on this device')
                onClose()
              }}
              disabled={pending}
              className="font-questrial text-sm text-cca-ink/55 hover:text-cca-ink underline-offset-4 hover:underline transition disabled:opacity-30"
            >
              Just save on this device
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 bg-cca-blue text-white font-kollektif px-7 py-3 rounded-full hover:bg-cca-blue/90 transition-all shadow-[0_8px_24px_-8px_rgba(59,112,176,0.5)] enabled:hover:-translate-y-0.5 disabled:opacity-50"
            >
              {pending ? (
                'Sending…'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Email me the link
                </>
              )}
            </button>
          </div>

          <p className="mt-4 font-questrial text-[11px] text-cca-ink/40 text-center">
            We&rsquo;ll never share your information. Link expires in 30 days.
            <br />
            From {tenantName}.
          </p>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block font-kollektif text-sm text-cca-ink mb-1.5">
        {label}
        {required && <span className="text-cca-coral ml-1">*</span>}
      </span>
      {children}
    </label>
  )
}
