'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { saveIntegrationsSettings } from '@/lib/actions/settings/save-actions'
import type { IntegrationsSettings } from '@/lib/schemas/settings'

interface Props {
  initialValues: IntegrationsSettings
}

type IntegrationKey = keyof IntegrationsSettings

interface IntegrationMeta {
  key: IntegrationKey
  id: string
  name: string
  description: string
  // TODO: wire OAuth flows — until then all Connect buttons are placeholders
  oauthReady: boolean
}

const INTEGRATIONS: IntegrationMeta[] = [
  {
    key: 'stripe_connected',
    id: 'stripe',
    name: 'Stripe Connect',
    description: 'Payment processing for tuition and fees',
    oauthReady: false,
  },
  {
    key: 'quickbooks_connected',
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Accounting and bookkeeping sync',
    oauthReady: false,
  },
  {
    key: 'google_connected',
    id: 'google',
    name: 'Google Workspace',
    description: 'Calendar sync and SSO',
    oauthReady: false,
  },
  {
    key: 'twilio_connected',
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS notifications and alerts',
    oauthReady: false,
  },
]

export function IntegrationsSettingsForm({ initialValues }: Props) {
  const [form, setForm] = useState<IntegrationsSettings>(initialValues)
  const [pendingKey, setPendingKey] = useState<IntegrationKey | null>(null)
  const [, startTransition] = useTransition()

  function toggleConnection(key: IntegrationKey) {
    const next = { ...form, [key]: !form[key] }
    setForm(next)
    setPendingKey(key)
    startTransition(async () => {
      const result = await saveIntegrationsSettings(next)
      setPendingKey(null)
      if (result.ok) {
        toast({
          variant: 'success',
          title: next[key] ? 'Marked as connected' : 'Marked as disconnected',
        })
      } else {
        // Roll back on failure
        setForm(form)
        toast({ variant: 'error', title: 'Save failed', description: result.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portal/admin/settings"
          className="text-sm hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          &larr; Back to Settings
        </Link>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Integrations
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Connect third-party services to extend your platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const connected = form[integration.key]
          const isPending = pendingKey === integration.key
          return (
            <Card key={integration.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: connected ? 'var(--color-primary)' : 'var(--color-muted)',
                      color: connected
                        ? 'var(--color-primary-foreground)'
                        : 'var(--color-muted-foreground)',
                    }}
                  >
                    {connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
                  {integration.description}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant={connected ? 'danger' : 'primary'}
                    size="sm"
                    onClick={() => toggleConnection(integration.key)}
                    disabled={isPending}
                  >
                    {isPending ? 'Saving…' : connected ? 'Disconnect' : 'Connect'}
                  </Button>
                  {!integration.oauthReady && (
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      style={{
                        backgroundColor: 'var(--color-muted)',
                        color: 'var(--color-muted-foreground)',
                      }}
                    >
                      Coming Soon
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
