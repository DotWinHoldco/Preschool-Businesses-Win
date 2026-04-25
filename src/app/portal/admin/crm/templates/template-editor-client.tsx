'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send, Trash2, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { EmailEditor } from '@/components/crm/email-editor'
import { upsertTemplate, deleteTemplate, sendTestEmail } from '@/lib/actions/crm/templates'

interface InitialTemplate {
  id: string
  name: string
  subject: string
  preheader: string
  html: string
  design_json: Record<string, unknown>
}

interface CustomTagOption {
  key: string
  label: string
}

export function TemplateEditorClient({
  initial,
  customTags = [],
}: {
  initial?: InitialTemplate
  customTags?: CustomTagOption[]
}) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? 'Untitled template')
  const [subject, setSubject] = useState(initial?.subject ?? 'Hi {{contact.first_name}},')
  const [preheader, setPreheader] = useState(initial?.preheader ?? '')
  const [html, setHtml] = useState(initial?.html ?? '<p>Hi {{contact.first_name}},</p><p></p>')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [testEmailModal, setTestEmailModal] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function save(after?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await upsertTemplate({
        id: initial?.id,
        name: name.trim(),
        subject: subject.trim(),
        preheader: preheader.trim() || null,
        html,
        design_json: initial?.design_json ?? {},
      })
      if (!result.ok || !result.id) {
        setError(result.error ?? 'Save failed')
        return
      }
      toast({ variant: 'success', title: initial ? 'Template saved' : 'Template created' })
      if (after) after()
      else if (!initial) router.push(`/portal/admin/crm/templates/${result.id}`)
      else router.refresh()
    })
  }

  function onDelete() {
    if (!initial) return
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    startTransition(async () => {
      const r = await deleteTemplate(initial.id)
      if (!r.ok) {
        toast({ variant: 'error', title: 'Delete failed', description: r.error })
        return
      }
      toast({ variant: 'success', title: 'Template deleted' })
      router.push('/portal/admin/crm/templates')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/admin/crm/templates"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <Input
            inputSize="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xl font-bold w-72"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye size={14} />
            Preview
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTestEmailModal(true)}
            disabled={!initial}
          >
            <Send size={14} />
            Send test
          </Button>
          {initial && (
            <Button variant="ghost" size="sm" onClick={onDelete} disabled={pending}>
              <Trash2 size={14} />
            </Button>
          )}
          <Button onClick={() => save()} loading={pending} disabled={pending}>
            <Save size={14} />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-3">
          <Field label="Subject line">
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="A short, clear subject (use {{contact.first_name}} for personalization)"
            />
          </Field>
          <Field label="Preheader (optional)">
            <Input
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="The little gray preview text shown next to the subject in inboxes"
            />
          </Field>
        </CardContent>
      </Card>

      <EmailEditor initialHtml={html} onChange={setHtml} customTags={customTags} />

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {previewOpen && (
        <PreviewModal
          subject={subject}
          preheader={preheader}
          html={html}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      {testEmailModal && initial && (
        <TestSendModal templateId={initial.id} onClose={() => setTestEmailModal(false)} />
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium mb-1">{label}</span>
      {children}
    </label>
  )
}

function PreviewModal({
  subject,
  preheader,
  html,
  onClose,
}: {
  subject: string
  preheader: string
  html: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <p className="text-xs text-gray-500">Subject</p>
            <p className="font-semibold text-sm">{subject}</p>
            {preheader && <p className="text-xs text-gray-500 mt-0.5">{preheader}</p>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            ✕
          </button>
        </div>
        <div
          className="overflow-y-auto p-6 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="px-4 py-2 text-[11px] text-gray-500 border-t">
          Merge tags shown literally — actual sends substitute live values.
        </div>
      </div>
    </div>
  )
}

function TestSendModal({ templateId, onClose }: { templateId: string; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  function send() {
    setError(null)
    startTransition(async () => {
      const r = await sendTestEmail({ template_id: templateId, to_email: email.trim() })
      if (!r.ok) {
        setError(r.error ?? 'Send failed')
        return
      }
      toast({ variant: 'success', title: `Test email sent to ${email}` })
      onClose()
    })
  }
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !pending && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-3">
        <h2 className="font-semibold">Send a test email</h2>
        <p className="text-xs text-gray-500">
          A real email will be sent. Merge tags will resolve to sample values.
        </p>
        <Input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourschool.com"
        />
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={send} loading={pending} disabled={pending || !email.includes('@')}>
            <Send size={14} />
            Send test
          </Button>
        </div>
      </div>
    </div>
  )
}
