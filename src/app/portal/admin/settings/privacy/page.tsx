'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPrivacyPage() {
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [form, setForm] = useState({
    retention_days: 730,
    coppa_contact_email: 'privacy@crandallchristianacademy.com',
    auto_delete_withdrawn: true,
    anonymize_after_withdrawal: false,
  })

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleExport() {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      alert('Data export complete. Download will start automatically.')
    }, 2000)
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
          Data &amp; Privacy
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Retention policies, data export, and COPPA compliance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Retention Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-foreground)' }}>Data Retention Period (days)</label>
                <Input type="number" min={90} value={form.retention_days} onChange={(e) => setForm(f => ({ ...f, retention_days: Number(e.target.value) }))} />
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Student records are retained for this period after withdrawal (min 90 days)</p>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-foreground)' }}>COPPA Contact Email</label>
                <Input type="email" value={form.coppa_contact_email} onChange={(e) => setForm(f => ({ ...f, coppa_contact_email: e.target.value }))} />
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Published as the data controller contact per COPPA requirements</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto-delete"
                  checked={form.auto_delete_withdrawn}
                  onChange={(e) => setForm(f => ({ ...f, auto_delete_withdrawn: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="auto-delete" className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                  Auto-delete records after retention period expires
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymize"
                  checked={form.anonymize_after_withdrawal}
                  onChange={(e) => setForm(f => ({ ...f, anonymize_after_withdrawal: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="anonymize" className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                  Anonymize PII immediately on withdrawal (keeps aggregate data)
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit">Save Changes</Button>
              {saved && <span className="text-sm" style={{ color: 'var(--color-primary)' }}>Saved successfully</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
            Export all school data as a ZIP archive of CSV files. This includes students, families, staff, attendance, billing, and messaging records.
          </p>
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Preparing export...' : 'Export All Data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
