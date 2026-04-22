'use client'

// @anchor: cca.enrollment.application-toolbar
// Print (opens dedicated print page) + Share (generates signed link with redacted PII).

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Printer, Share2, Check, Copy, Link2, ExternalLink } from 'lucide-react'

export function ApplicationToolbar({ applicationId }: { applicationId: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handlePrint() {
    window.open(
      `/api/enrollment/print/${applicationId}`,
      '_blank',
      'noopener',
    )
  }

  function handleShare() {
    setError(null)
    setCopied(false)
    startTransition(async () => {
      try {
        const res = await fetch('/api/enrollment/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Failed to generate link' }))
          setError(body.error ?? 'Failed to generate link')
          return
        }
        const data = await res.json()
        setShareUrl(data.url)
        setShareOpen(true)
      } catch {
        setError('Network error')
      }
    })
  }

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = shareUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
      <div className="flex gap-2 print:hidden">
        <Button variant="secondary" size="sm" onClick={handlePrint}>
          <Printer className="mr-1.5 h-3.5 w-3.5" />
          Print
        </Button>
        <Button variant="secondary" size="sm" onClick={handleShare} loading={isPending}>
          <Share2 className="mr-1.5 h-3.5 w-3.5" />
          Share
        </Button>
      </div>

      {error && (
        <p className="mt-1 text-xs text-[var(--color-destructive)]">{error}</p>
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogOverlay onClick={() => setShareOpen(false)} />
        <DialogContent title="Share Application" description="Anyone with this link can view a redacted version of the application. The link expires in 7 days.">
          <DialogClose onClick={() => setShareOpen(false)} />
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
              <Link2 className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                readOnly
                value={shareUrl ?? ''}
                className="flex-1 bg-transparent text-sm text-[var(--color-foreground)] outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Driver&apos;s license, full address, and contact details are redacted.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => window.open(shareUrl!, '_blank')}>
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Preview
                </Button>
                <Button variant="primary" size="sm" onClick={copyLink}>
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
