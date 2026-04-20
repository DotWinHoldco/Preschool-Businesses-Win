'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SettingsDangerZone() {
  const [showSuspend, setShowSuspend] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [exporting, setExporting] = useState(false)

  function handleExport() {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      alert('Data export complete. A ZIP file with all school data has been prepared.')
    }, 2000)
  }

  function handleSuspend() {
    if (confirmText === 'cca') {
      alert('Account suspended. All users have been signed out.')
      setShowSuspend(false)
      setConfirmText('')
    }
  }

  return (
    <div className="rounded-xl p-6" style={{ border: '1px solid var(--color-destructive)' }}>
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-destructive)' }}>
        Danger Zone
      </h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        Actions here are irreversible. Proceed with extreme caution.
      </p>
      <div className="mt-4 flex gap-3 flex-wrap">
        <Button variant="secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Preparing...' : 'Export All Data'}
        </Button>
        <Button variant="danger" onClick={() => setShowSuspend(true)}>
          Suspend School Account
        </Button>
      </div>
      {showSuspend && (
        <div className="mt-4 rounded-lg border p-4 space-y-3" style={{ borderColor: 'var(--color-destructive)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
            This will immediately sign out all users and disable access. Type <strong>cca</strong> to confirm.
          </p>
          <div className="flex gap-2">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type school slug to confirm"
            />
            <Button variant="danger" disabled={confirmText !== 'cca'} onClick={handleSuspend}>
              Confirm Suspend
            </Button>
            <Button variant="secondary" onClick={() => { setShowSuspend(false); setConfirmText('') }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
