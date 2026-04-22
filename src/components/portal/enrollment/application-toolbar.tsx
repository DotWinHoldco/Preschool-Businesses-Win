'use client'

// @anchor: cca.enrollment.application-toolbar
// Print + share buttons for the application detail page.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Share2, Check, Copy } from 'lucide-react'

interface ApplicationSummary {
  studentName: string
  parentName: string
  parentEmail: string
  dob: string
  program: string | null
  stage: string
  triageScore: number | null
  appliedDate: string
  howHeard: string | null
}

function buildShareText(summary: ApplicationSummary): string {
  return [
    `Enrollment Application — ${summary.studentName}`,
    ``,
    `Parent: ${summary.parentName}`,
    `DOB: ${summary.dob}`,
    `Program: ${summary.program?.replace(/_/g, ' ') ?? 'N/A'}`,
    `Pipeline Stage: ${summary.stage.replace(/_/g, ' ')}`,
    summary.triageScore !== null ? `Triage Score: ${summary.triageScore}` : null,
    `Applied: ${new Date(summary.appliedDate).toLocaleDateString()}`,
    summary.howHeard ? `How Heard: ${summary.howHeard.replace(/_/g, ' ')}` : null,
    ``,
    `(Contact info redacted for privacy)`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

export function ApplicationToolbar({ summary }: { summary: ApplicationSummary }) {
  const [copied, setCopied] = useState(false)

  function handlePrint() {
    window.print()
  }

  async function handleShare() {
    const text = buildShareText(summary)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="secondary" size="sm" onClick={handlePrint}>
        <Printer className="mr-1.5 h-3.5 w-3.5" />
        Print
      </Button>
      <Button variant="secondary" size="sm" onClick={handleShare}>
        {copied ? (
          <>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Copied
          </>
        ) : (
          <>
            <Share2 className="mr-1.5 h-3.5 w-3.5" />
            Share
          </>
        )}
      </Button>
    </div>
  )
}
