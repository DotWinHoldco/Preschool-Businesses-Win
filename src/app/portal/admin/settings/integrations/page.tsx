'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Integration {
  id: string
  name: string
  description: string
  connected: boolean
  status?: string
}

export default function SettingsIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: 'stripe', name: 'Stripe Connect', description: 'Payment processing for tuition and fees', connected: true, status: 'Connected — acct_1ABC...XYZ' },
    { id: 'resend', name: 'Resend', description: 'Transactional email delivery', connected: true, status: 'Connected — verified domain' },
    { id: 'twilio', name: 'Twilio', description: 'SMS notifications and alerts', connected: false },
    { id: 'hardware', name: 'Hardware (Doors & Cameras)', description: 'Access control and camera integrations', connected: false },
    { id: 'quickbooks', name: 'QuickBooks', description: 'Accounting and bookkeeping sync', connected: false },
    { id: 'google', name: 'Google Workspace', description: 'Calendar sync and SSO', connected: false },
  ])

  function toggleConnection(id: string) {
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, connected: !i.connected, status: !i.connected ? 'Connected' : undefined } : i
    ))
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
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{integration.name}</CardTitle>
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: integration.connected ? 'var(--color-primary)' : 'var(--color-muted)',
                    color: integration.connected ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
                  }}
                >
                  {integration.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
                {integration.description}
              </p>
              {integration.status && (
                <p className="text-xs mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
                  {integration.status}
                </p>
              )}
              <Button
                variant={integration.connected ? 'danger' : 'primary'}
                size="sm"
                onClick={() => toggleConnection(integration.id)}
              >
                {integration.connected ? 'Disconnect' : 'Connect'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
