'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send, Plus, Trash2, Layers, Mail } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { upsertCampaign, setCampaignSteps, sendCampaignNow } from '@/lib/actions/crm/campaigns'

interface AudOpt {
  id: string
  name: string
  member_count: number
  color: string
}
interface TplOpt {
  id: string
  name: string
  subject: string
}

interface InitialCampaign {
  id: string
  name: string
  type: 'broadcast' | 'drip'
  audience_id: string | null
  template_id: string | null
  scheduled_at: string | null
  notes: string | null
  status: string
  steps: { template_id: string; delay_minutes: number }[]
}

export function CampaignBuilderClient({
  audiences,
  templates,
  initialAudienceId,
  initial,
}: {
  audiences: AudOpt[]
  templates: TplOpt[]
  initialAudienceId?: string | null
  initial?: InitialCampaign
}) {
  const router = useRouter()
  const [name, setName] = useState(initial?.name ?? 'Untitled campaign')
  const [type, setType] = useState<'broadcast' | 'drip'>(initial?.type ?? 'broadcast')
  const [audienceId, setAudienceId] = useState<string>(
    initial?.audience_id ?? initialAudienceId ?? '',
  )
  const [templateId, setTemplateId] = useState<string>(initial?.template_id ?? '')
  const [steps, setSteps] = useState<{ template_id: string; delay_minutes: number }[]>(
    initial?.steps ?? [{ template_id: '', delay_minutes: 0 }],
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isLocked = initial?.status === 'sent' || initial?.status === 'archived'

  function addStep() {
    setSteps([...steps, { template_id: '', delay_minutes: 60 * 24 }])
  }
  function updateStep(i: number, patch: Partial<(typeof steps)[number]>) {
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }
  function removeStep(i: number) {
    if (steps.length <= 1) return
    setSteps(steps.filter((_, idx) => idx !== i))
  }

  async function persist(opts: { thenSend?: boolean } = {}) {
    setError(null)
    return new Promise<{ id: string } | null>((resolve) => {
      startTransition(async () => {
        const r = await upsertCampaign({
          id: initial?.id,
          name: name.trim(),
          type,
          audience_id: audienceId || null,
          template_id: type === 'broadcast' ? templateId || null : null,
          scheduled_at: null,
          notes: null,
        })
        if (!r.ok || !r.id) {
          setError(r.error ?? 'Save failed')
          resolve(null)
          return
        }

        if (type === 'drip') {
          const cleaned = steps.filter((s) => s.template_id)
          if (cleaned.length === 0) {
            setError('Pick at least one template for the drip.')
            resolve(null)
            return
          }
          const stepRes = await setCampaignSteps({
            campaign_id: r.id,
            steps: cleaned.map((s) => ({
              template_id: s.template_id,
              delay_minutes: s.delay_minutes,
            })),
          })
          if (!stepRes.ok) {
            setError(stepRes.error ?? 'Could not save steps')
            resolve(null)
            return
          }
        }

        if (opts.thenSend) {
          const sendRes = await sendCampaignNow(r.id)
          if (!sendRes.ok) {
            setError(sendRes.error ?? 'Send failed')
            resolve(null)
            return
          }
          toast({
            variant: 'success',
            title:
              type === 'broadcast'
                ? `Sent to ${sendRes.count} recipients`
                : `Drip started for ${sendRes.count} recipients`,
          })
        } else {
          toast({ variant: 'success', title: 'Saved' })
        }

        resolve({ id: r.id })
      })
    })
  }

  async function handleSave() {
    const r = await persist()
    if (r && !initial) router.push(`/portal/admin/crm/campaigns/${r.id}`)
    else if (r) router.refresh()
  }

  async function handleSend() {
    if (!audienceId) {
      setError('Pick an audience first.')
      return
    }
    if (type === 'broadcast' && !templateId) {
      setError('Pick a template first.')
      return
    }
    if (
      !confirm(
        type === 'broadcast'
          ? 'Send this broadcast now to every audience member?'
          : 'Start the drip for every audience member now?',
      )
    )
      return
    const r = await persist({ thenSend: true })
    if (r) router.push(`/portal/admin/crm/campaigns/${r.id}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/admin/crm/campaigns"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <Input
            inputSize="sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xl font-bold w-72"
            disabled={isLocked}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleSave}
            loading={pending}
            disabled={pending || isLocked}
          >
            <Save size={14} />
            Save draft
          </Button>
          <Button onClick={handleSend} loading={pending} disabled={pending || isLocked}>
            <Send size={14} />
            {type === 'broadcast' ? 'Send now' : 'Start drip'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="text-xs font-medium mb-2">Campaign type</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {(['broadcast', 'drip'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={isLocked || (initial && initial.type !== t)}
                  onClick={() => setType(t)}
                  className={`text-left rounded-lg border-2 p-3 transition-all ${type === t ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-foreground)]/30'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-2 font-medium text-sm">
                    {t === 'broadcast' ? <Mail size={14} /> : <Layers size={14} />}
                    {t === 'broadcast' ? 'One-shot broadcast' : 'Multi-step drip'}
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                    {t === 'broadcast'
                      ? 'Send a single email to every audience member right now (or schedule for later).'
                      : 'Send a sequence of emails over days/weeks as contacts enroll.'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Field label="Audience">
            <select
              value={audienceId}
              onChange={(e) => setAudienceId(e.target.value)}
              disabled={isLocked}
              className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 h-12 text-base"
            >
              <option value="">Pick an audience…</option>
              {audiences.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.member_count} member{a.member_count === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      {type === 'broadcast' ? (
        <Card>
          <CardContent className="p-5 space-y-3">
            <Field label="Template">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={isLocked}
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 h-12 text-base"
              >
                <option value="">Pick a template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.subject}
                  </option>
                ))}
              </select>
            </Field>
            {templates.length === 0 && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                No templates yet.{' '}
                <Link
                  href="/portal/admin/crm/templates/new"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Create one →
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Drip steps</h3>
              <Button variant="secondary" size="sm" onClick={addStep} disabled={isLocked}>
                <Plus size={12} />
                Add step
              </Button>
            </div>
            {steps.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border border-[var(--color-border)] p-2 bg-[var(--color-background)]"
              >
                <span className="text-xs font-medium text-[var(--color-muted-foreground)] w-6 text-right">
                  {i + 1}.
                </span>
                <select
                  value={s.template_id}
                  onChange={(e) => updateStep(i, { template_id: e.target.value })}
                  disabled={isLocked}
                  className="flex-1 text-sm rounded-md border border-[var(--color-border)] px-2 h-9 bg-white"
                >
                  <option value="">Pick a template…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                  {i === 0 ? 'after' : 'then wait'}
                </span>
                <Input
                  inputSize="sm"
                  type="number"
                  min={0}
                  value={String(s.delay_minutes)}
                  onChange={(e) =>
                    updateStep(i, { delay_minutes: parseInt(e.target.value, 10) || 0 })
                  }
                  disabled={isLocked}
                  className="w-20"
                />
                <span className="text-xs text-[var(--color-muted-foreground)]">minutes</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(i)}
                  disabled={isLocked || steps.length <= 1}
                  aria-label="Remove step"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Step 1 fires after the listed delay (use 0 for &quot;as soon as the contact
              enrolls&quot;). Each subsequent step fires that many minutes after the previous one.
              The drip cron ticks every minute.
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
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
