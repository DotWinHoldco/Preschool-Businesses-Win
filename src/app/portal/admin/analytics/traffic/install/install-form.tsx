'use client'

import { useMemo, useState, useTransition } from 'react'
import { Check, Copy, Plus, Trash2, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { updateAnalyticsSite } from '@/lib/actions/analytics/update-site'

interface Site {
  id: string
  name: string
  site_key: string
  origins: string[]
  is_active: boolean
  consent_banner_enabled: boolean
  meta_pixel_id: string | null
  meta_capi_token: string | null
  meta_test_event_code: string | null
  ga4_measurement_id: string | null
  ga4_api_secret: string | null
  tiktok_pixel_id: string | null
  tiktok_access_token: string | null
}

interface Props {
  site: Site
  collectorBase: string
}

export function InstallForm({ site, collectorBase }: Props) {
  const [form, setForm] = useState<Site>(site)
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState<string | null>(null)

  const snippet = useMemo(() => {
    const analyticsTag = form.consent_banner_enabled
      ? `<script\n  src="${collectorBase}/pbw-analytics.js"\n  data-site-key="${form.site_key}"\n  async\n></script>`
      : `<script\n  src="${collectorBase}/pbw-analytics.js"\n  data-site-key="${form.site_key}"\n  data-consent="off"\n  async\n></script>`
    const consentTag = form.consent_banner_enabled
      ? `\n<script\n  src="${collectorBase}/pbw-consent.js"\n  data-privacy-url="/privacy"\n  async\n></script>`
      : ''
    return analyticsTag + consentTag
  }, [form.site_key, form.consent_banner_enabled, collectorBase])

  function update<K extends keyof Site>(key: K, value: Site[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function copy(value: string, id: string) {
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(id)
        setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800)
      },
      () => toast({ variant: 'error', title: 'Copy failed' }),
    )
  }

  function addOrigin() {
    update('origins', [...form.origins, ''])
  }
  function changeOrigin(i: number, value: string) {
    update(
      'origins',
      form.origins.map((o, idx) => (idx === i ? value : o)),
    )
  }
  function removeOrigin(i: number) {
    update(
      'origins',
      form.origins.filter((_, idx) => idx !== i),
    )
  }

  function save() {
    const clean = {
      ...form,
      origins: form.origins.map((o) => o.trim()).filter((o) => o.length > 0),
    }
    startTransition(async () => {
      const result = await updateAnalyticsSite(clean)
      if (result.ok) {
        toast({
          variant: 'success',
          title: 'Saved',
          description: result.debug ?? 'Analytics site updated.',
        })
      } else {
        toast({ variant: 'error', title: 'Save failed', description: result.error })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Site key */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Site key</h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Public identifier for{' '}
                <span className="font-medium text-[var(--color-foreground)]">{form.name}</span>.
                Safe to paste anywhere.
              </p>
            </div>
            <Badge variant={form.is_active ? 'success' : 'outline'}>
              {form.is_active ? 'Active' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Input inputSize="sm" readOnly value={form.site_key} className="font-mono text-xs" />
            <Button variant="secondary" size="sm" onClick={() => copy(form.site_key, 'site_key')}>
              {copied === 'site_key' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'site_key' ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Snippet */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                Paste this on your marketing site
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Wix Studio → Settings → Custom Code → Add Custom Code. Place in{' '}
                <span className="font-medium text-[var(--color-foreground)]">Body — end</span>, on
                all pages.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => copy(snippet, 'snippet')}>
              {copied === 'snippet' ? <Check size={14} /> : <Copy size={14} />}
              {copied === 'snippet' ? 'Copied' : 'Copy snippet'}
            </Button>
          </div>
          <pre className="text-xs bg-[var(--color-muted)] text-[var(--color-foreground)] rounded-md p-4 overflow-x-auto leading-relaxed">
            {snippet}
          </pre>
          <ol className="text-xs text-[var(--color-muted-foreground)] space-y-1 list-decimal pl-5">
            <li>Paste the snippet above into Wix Studio Custom Code.</li>
            <li>
              Add each marketing domain below (including <span className="font-mono">https://</span>
              , no trailing slash). Only listed origins can post events.
            </li>
            <li>
              Publish the Wix site. Check the Overview tab — your first visitor should appear within
              seconds.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Consent banner */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                Consent banner
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                Shows a TDPSA-compliant Accept / Opt out banner on first visit. When off, the site
                still honors DNT and Global Privacy Control headers but never shows a prompt —
                appropriate if your marketing site already has its own consent layer, or if you
                operate only in jurisdictions without a banner requirement.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.consent_banner_enabled}
                onChange={(e) => update('consent_banner_enabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-[var(--color-muted)] rounded-full peer peer-checked:bg-[var(--color-primary)] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5" />
            </label>
          </div>
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-3 text-xs text-[var(--color-muted-foreground)] space-y-1">
            <p className="text-[var(--color-foreground)] font-medium">
              {form.consent_banner_enabled
                ? 'Banner is on — visitors see Accept / Opt out on first visit.'
                : 'Banner is off — only DNT / GPC browser signals opt users out.'}
            </p>
            <p>
              The generated snippet above reflects this setting.
              {form.consent_banner_enabled
                ? ' Re-copy and re-paste it in Wix after saving if you just flipped the toggle.'
                : ' pbw-consent.js is omitted and pbw-analytics.js runs with data-consent="off".'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Origins */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Allowed origins
            </h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Full origins the collector will accept events from. Include both{' '}
              <span className="font-mono">https://example.com</span> and{' '}
              <span className="font-mono">https://www.example.com</span> if both are live.
            </p>
          </div>
          <div className="space-y-2">
            {form.origins.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  inputSize="sm"
                  value={o}
                  onChange={(e) => changeOrigin(i, e.target.value)}
                  placeholder="https://yourdomain.com"
                  className="font-mono text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOrigin(i)}
                  aria-label="Remove origin"
                >
                  <Trash2 size={14} />
                  Remove
                </Button>
              </div>
            ))}
            {form.origins.length === 0 && (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                No origins yet — add at least one.
              </p>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={addOrigin}>
            <Plus size={14} />
            Add origin
          </Button>
        </CardContent>
      </Card>

      {/* Meta CAPI */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                Meta (Facebook / Instagram) CAPI
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Server-side event forwarding to the Meta Conversions API. Mapping: enrollment click
                → AddToCart · started → InitiateCheckout · completed → Lead.
              </p>
            </div>
            <a
              href="https://www.facebook.com/events_manager2"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              Events Manager <ExternalLink size={12} />
            </a>
          </div>
          <Field label="Meta Pixel ID" hint="From Events Manager → Data sources → your pixel.">
            <Input
              value={form.meta_pixel_id ?? ''}
              onChange={(e) => update('meta_pixel_id', e.target.value)}
              placeholder="1234567890"
              className="font-mono text-sm"
            />
          </Field>
          <Field
            label="CAPI Access Token"
            hint="Events Manager → Settings → Conversions API → Generate access token. Stored server-side only."
          >
            <Input
              type="password"
              autoComplete="off"
              value={form.meta_capi_token ?? ''}
              onChange={(e) => update('meta_capi_token', e.target.value)}
              placeholder="EAAB..."
              className="font-mono text-sm"
            />
          </Field>
          <Field
            label="Test event code (optional)"
            hint="Used only while verifying in Events Manager → Test events. Remove once live."
          >
            <Input
              value={form.meta_test_event_code ?? ''}
              onChange={(e) => update('meta_test_event_code', e.target.value)}
              placeholder="TEST12345"
              className="font-mono text-sm"
            />
          </Field>
        </CardContent>
      </Card>

      {/* GA4 */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                Google Analytics 4 · Measurement Protocol
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Server-side GA4 ingestion for conversions. Events land with the original name
                (truncated to 40 chars).
              </p>
            </div>
            <a
              href="https://analytics.google.com/analytics/web/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              GA4 Admin <ExternalLink size={12} />
            </a>
          </div>
          <Field
            label="Measurement ID"
            hint="Admin → Data streams → Web → Measurement ID (starts with G-)."
          >
            <Input
              value={form.ga4_measurement_id ?? ''}
              onChange={(e) => update('ga4_measurement_id', e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="font-mono text-sm"
            />
          </Field>
          <Field
            label="API Secret"
            hint="Admin → Data streams → Web → Measurement Protocol API secrets → Create."
          >
            <Input
              type="password"
              autoComplete="off"
              value={form.ga4_api_secret ?? ''}
              onChange={(e) => update('ga4_api_secret', e.target.value)}
              placeholder="xxx_xxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </Field>
        </CardContent>
      </Card>

      {/* TikTok */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                TikTok Events API
              </h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Mapping: enrollment click → ClickButton · started → InitiateCheckout · completed →
                CompleteRegistration.
              </p>
            </div>
            <a
              href="https://ads.tiktok.com/i18n/events_manager"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              Events Manager <ExternalLink size={12} />
            </a>
          </div>
          <Field
            label="Pixel / Event Source ID"
            hint="TikTok Ads Manager → Events → Web Event → Pixel ID."
          >
            <Input
              value={form.tiktok_pixel_id ?? ''}
              onChange={(e) => update('tiktok_pixel_id', e.target.value)}
              placeholder="CXXXXXXXXXXXXXXXXXXX"
              className="font-mono text-sm"
            />
          </Field>
          <Field
            label="Access Token"
            hint="TikTok Ads Manager → Events API → Setup → Generate Access Token."
          >
            <Input
              type="password"
              autoComplete="off"
              value={form.tiktok_access_token ?? ''}
              onChange={(e) => update('tiktok_access_token', e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Site settings */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Site settings</h2>
          </div>
          <Field label="Display name" hint="Shown on the traffic dashboard.">
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Tenant marketing site"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
              className="h-5 w-5 rounded border-[var(--color-border)]"
            />
            <span className="text-[var(--color-foreground)]">Active</span>
            <span className="text-xs text-[var(--color-muted-foreground)]">
              When unchecked, the collector rejects all events for this site.
            </span>
          </label>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="sticky bottom-0 pt-2 pb-4 bg-gradient-to-t from-[var(--color-background)] to-transparent">
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-[var(--color-muted-foreground)]">
            Credentials are stored server-side only. Secrets are never returned in full to the
            browser after save.
          </span>
          <Button onClick={save} loading={pending} disabled={pending}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[var(--color-foreground)]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>}
    </div>
  )
}
