'use client'

import { useState, useTransition } from 'react'
import { unsubscribeViaToken } from '@/lib/actions/crm/unsubscribe'

export function UnsubForm({
  token,
  email,
  tenantName,
}: {
  token: string
  email: string
  tenantName: string
}) {
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    startTransition(async () => {
      const r = await unsubscribeViaToken(token)
      if (!r.ok) {
        setError(r.error ?? 'Could not process your request.')
        return
      }
      setDone(true)
    })
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 space-y-3">
          <h1 className="font-bold text-xl">You&rsquo;re unsubscribed</h1>
          <p className="text-sm text-gray-600">
            We&rsquo;ve removed <b>{email}</b> from {tenantName}&rsquo;s marketing emails.
            We&rsquo;re sorry to see you go.
          </p>
          <p className="text-xs text-gray-500">
            You may still receive transactional messages (booking confirmations, account updates).
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 space-y-4">
        <h1 className="font-bold text-xl">Unsubscribe from {tenantName}</h1>
        <p className="text-sm text-gray-600">
          We&rsquo;ll stop sending marketing emails to <b>{email}</b>. Confirm to opt out.
        </p>
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <button
          onClick={submit}
          disabled={pending}
          className="w-full bg-[#3b70b0] text-white font-semibold py-3 rounded-full hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Working…' : 'Yes, unsubscribe'}
        </button>
        <p className="text-xs text-gray-500 text-center">
          If you got here by mistake, just close this tab.
        </p>
      </div>
    </main>
  )
}
