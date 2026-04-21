'use client'

// @anchor: cca.compliance.privacy-form
// Client form for privacy settings. Receives initial values from server component.
// Calls savePrivacySettings server action and exportTenantData for data download.

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { savePrivacySettings } from '@/lib/actions/compliance/privacy-settings'
import { exportTenantData } from '@/lib/actions/compliance/data-export'
import type { PrivacySettings } from '@/lib/actions/compliance/privacy-settings'

interface PrivacySettingsFormProps {
  initialSettings: PrivacySettings
}

export function PrivacySettingsForm({ initialSettings }: PrivacySettingsFormProps) {
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(initialSettings)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const fd = new FormData()
    fd.set('retention_days', String(form.retention_days))
    fd.set('coppa_contact_email', form.coppa_contact_email)
    fd.set('auto_delete_withdrawn', String(form.auto_delete_withdrawn))
    fd.set('anonymize_after_withdrawal', String(form.anonymize_after_withdrawal))

    startTransition(async () => {
      const result = await savePrivacySettings(fd)
      if (result.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error ?? 'Failed to save')
      }
    })
  }

  async function handleExport() {
    setExporting(true)
    setError(null)

    try {
      const fd = new FormData()
      fd.set('export_format', 'csv')

      const result = await exportTenantData(fd)

      if (result.ok && result.csv) {
        // Trigger browser download
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `data-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        setError(result.error ?? 'Export failed')
      }
    } catch {
      setError('Export failed unexpectedly')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Retention Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Data Retention Period (days)
                </label>
                <Input
                  type="number"
                  min={90}
                  max={3650}
                  value={form.retention_days}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, retention_days: Number(e.target.value) }))
                  }
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  Student records are retained for this period after withdrawal (min 90 days)
                </p>
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-1"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  COPPA Contact Email
                </label>
                <Input
                  type="email"
                  value={form.coppa_contact_email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coppa_contact_email: e.target.value }))
                  }
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  Published as the data controller contact per COPPA requirements
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto-delete"
                  checked={form.auto_delete_withdrawn}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      auto_delete_withdrawn: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <label
                  htmlFor="auto-delete"
                  className="text-sm"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Auto-delete records after retention period expires
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymize"
                  checked={form.anonymize_after_withdrawal}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      anonymize_after_withdrawal: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <label
                  htmlFor="anonymize"
                  className="text-sm"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  Anonymize PII immediately on withdrawal (keeps aggregate data)
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              {saved && (
                <span className="text-sm" style={{ color: 'var(--color-primary)' }}>
                  Saved successfully
                </span>
              )}
              {error && (
                <span className="text-sm text-red-600">{error}</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Export all school data as a CSV archive. This includes students, families, staff,
            attendance, billing, and document records. Required for FERPA right-to-inspect compliance.
          </p>
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Preparing export...' : 'Export All Data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
