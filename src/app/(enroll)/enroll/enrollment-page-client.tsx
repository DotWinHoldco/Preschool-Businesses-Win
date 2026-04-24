'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  Save,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { WizardFeeNotice } from '@/components/forms/wizard/fee-notice'
import { evaluateLogicRules } from '@/lib/forms/logic-engine'
import { submitSystemEnrollment } from '@/lib/actions/enrollment/submit-system-enrollment'
import type { SystemEnrollmentData } from '@/lib/schemas/enrollment'

const WEBSITE_URL = 'https://crandallchristianacademy.com'
const PHONE = '(945) 226-6584'
const PHONE_TEL = 'tel:+19452266584'
const EMAIL = 'admin@crandallchristianacademy.com'
const STORAGE_KEY = 'cca-enrollment-draft'

interface WizardField {
  id: string
  field_key: string
  field_type: string
  label: string | null
  description: string | null
  placeholder: string | null
  config: Record<string, unknown>
  validation_rules: Record<string, unknown>
  logic_rules: Record<string, unknown>[]
  is_required: boolean
  is_locked?: boolean
  is_system_field?: boolean
  sort_order: number
  page_number: number
  section_id: string | null
}

interface WizardSection {
  id: string
  title: string | null
  description: string | null
  sort_order: number
  page_number: number
  iterate_over_field_key?: string | null
}

interface Props {
  formId: string
  title: string
  feeEnabled: boolean
  feeAmountCents: number | null | undefined
  feeDescription: string
  hideFeeNotice: boolean
  thankYouTitle: string
  thankYouMessage: string
  sections: WizardSection[]
  fields: WizardField[]
  tenantName: string
  analyticsSiteKey?: string | null
}

const LAYOUT_TYPES = new Set([
  'section_header',
  'description_block',
  'divider',
  'image_banner',
  'video_banner',
  'spacer',
])

export function EnrollmentPageClient(props: Props) {
  const {
    formId,
    title,
    feeEnabled,
    feeAmountCents,
    feeDescription,
    hideFeeNotice,
    thankYouTitle,
    thankYouMessage,
    sections,
    fields,
    tenantName,
    analyticsSiteKey,
  } = props

  const [analyticsIds, setAnalyticsIds] = useState<{
    visitor_id: string
    session_id: string
  } | null>(null)

  useEffect(() => {
    if (!analyticsSiteKey) return
    try {
      const params = new URLSearchParams(window.location.search)
      const avFromUrl = params.get('_av')
      const sidStored = sessionStorage.getItem('_pbwa_sid')
      const vidStored =
        (document.cookie.match(/(?:^|; )_pbwa_vid=([^;]*)/)?.[1] &&
          decodeURIComponent(document.cookie.match(/(?:^|; )_pbwa_vid=([^;]*)/)![1])) ||
        null
      const visitor_id = avFromUrl || vidStored || crypto.randomUUID()
      const session_id = sidStored || crypto.randomUUID()
      if (avFromUrl) {
        // Persist the stitched identity for the duration of this browser tab
        try {
          document.cookie = `_pbwa_vid=${encodeURIComponent(visitor_id)}; path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
          sessionStorage.setItem('_pbwa_sid', session_id)
          sessionStorage.setItem('_pbwa_sid_last', String(Date.now()))
        } catch {}
      }
      setAnalyticsIds({ visitor_id, session_id })
      fetch('/api/collect', {
        method: 'POST',
        credentials: 'omit',
        keepalive: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          site_key: analyticsSiteKey,
          events: [
            {
              event_id: crypto.randomUUID(),
              event_type: 'conversion',
              event_name: 'enrollment_started',
              visitor_id,
              session_id,
              client_ts: Date.now(),
              page_url: window.location.href.slice(0, 2000),
              page_path: window.location.pathname + window.location.search,
              page_title: document.title.slice(0, 500),
              referrer: document.referrer ? document.referrer.slice(0, 2000) : null,
              screen_width: screen.width,
              screen_height: screen.height,
              viewport_width: window.innerWidth,
              viewport_height: window.innerHeight,
              language: navigator.language,
              properties: { stitched: !!avFromUrl },
            },
          ],
        }),
      }).catch(() => {})
    } catch {
      // analytics failures never block enrollment
    }
  }, [analyticsSiteKey])

  const steps = useMemo(() => {
    if (sections.length > 0) {
      return sections
        .slice()
        .sort((a, b) => a.page_number - b.page_number || a.sort_order - b.sort_order)
        .map((s, i) => ({
          id: s.id,
          label: s.title ?? `Step ${i + 1}`,
          title: s.title,
          description: s.description,
          page_number: s.page_number,
          iterate_over_field_key: s.iterate_over_field_key ?? null,
        }))
    }
    const pages = Array.from(new Set(fields.map((f) => f.page_number))).sort((a, b) => a - b)
    return pages.map((p, i) => ({
      id: `page-${p}`,
      label: `Step ${i + 1}`,
      title: `Step ${i + 1}`,
      description: null,
      page_number: p,
      iterate_over_field_key: null as string | null,
    }))
  }, [sections, fields])

  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saveToast, setSaveToast] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const noForm = !formId

  useEffect(() => {
    if (noForm) return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.formId === formId && draft.values) {
          setHasDraft(true)
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId])

  const resumeDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.formId === formId) {
          setValues(draft.values ?? {})
          setStep(Math.min(draft.step ?? 0, steps.length - 1))
        }
      }
    } catch {
      /* ignore */
    }
    setHasDraft(false)
  }, [formId, steps.length])

  const discardDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setHasDraft(false)
  }, [])

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ formId, step, values, savedAt: new Date().toISOString() }),
      )
      setSaveToast(true)
      setTimeout(() => setSaveToast(false), 2500)
    } catch {
      /* ignore */
    }
  }, [formId, step, values])

  const currentStep = steps[step]
  const isLast = step === steps.length - 1

  const currentFields = useMemo(() => {
    if (!currentStep) return []
    return fields
      .filter((f) => f.page_number === currentStep.page_number)
      .sort((a, b) => a.sort_order - b.sort_order)
  }, [fields, currentStep])

  const isFieldVisible = (field: WizardField, scope: Record<string, unknown> = values): boolean => {
    if (!field.logic_rules || field.logic_rules.length === 0) return true
    const { visible } = evaluateLogicRules(field.logic_rules as unknown[], scope)
    return visible
  }

  const fieldSatisfied = (f: WizardField, scope: Record<string, unknown>): boolean => {
    if (!f.is_required || LAYOUT_TYPES.has(f.field_type)) return true
    if (!isFieldVisible(f, scope)) return true
    const v = scope[f.field_key]
    if (f.field_type === 'yes_no') return typeof v === 'boolean'
    if (f.field_type === 'legal_acceptance') return v === true
    if (f.field_type === 'repeater_group') return Array.isArray(v) && v.length > 0
    return v !== undefined && v !== null && v !== ''
  }

  const canAdvance = (): boolean => {
    if (!currentStep) return true
    const iterKey = currentStep.iterate_over_field_key
    if (iterKey) {
      const items = Array.isArray(values[iterKey])
        ? (values[iterKey] as Array<Record<string, unknown>>)
        : []
      if (items.length === 0) return true
      return items.every((item) => currentFields.every((f) => fieldSatisfied(f, item)))
    }
    return currentFields.every((f) => fieldSatisfied(f, values))
  }

  const handleSubmit = async () => {
    setError(null)
    setPending(true)
    try {
      const payload = {
        ...values,
        form_id: formId,
        analytics_visitor_id: analyticsIds?.visitor_id,
        analytics_session_id: analyticsIds?.session_id,
      } as unknown as SystemEnrollmentData
      const result = await submitSystemEnrollment(payload)
      if (!result.ok) {
        setError(result.error ?? 'Submission failed.')
        return
      }
      localStorage.removeItem(STORAGE_KEY)
      setSubmitted(true)
    } catch (err) {
      console.error('[Enrollment] Submit error:', err)
      setError('Something went wrong. Please try again or contact us.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {/* === DECORATIVE BACKGROUND === */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(242,176,32,0.08), transparent 60%), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(248,120,175,0.06), transparent 60%), radial-gradient(ellipse 60% 40% at 10% 5%, rgba(74,189,172,0.05), transparent 60%), linear-gradient(180deg, #faf9f5 0%, #ffffff 40%)',
        }}
      />
      <Image
        src="/cca-assets/crandall-sunshine.png"
        alt=""
        aria-hidden
        width={320}
        height={320}
        className="pointer-events-none fixed -top-16 -right-16 w-64 md:w-80 opacity-[0.14] -z-10 select-none"
      />

      {/* === STICKY MINI-HEADER (compact, always present) === */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-cca-ink/5">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <a href={WEBSITE_URL} className="flex-shrink-0 flex items-center gap-2">
            <Image
              src="/marketing/shared/cca-logo-small.png"
              alt="Crandall Christian Academy"
              width={48}
              height={48}
              className="h-10 w-auto"
              priority
            />
            <span className="hidden sm:inline font-kollektif text-sm text-cca-ink/70">
              Crandall Christian Academy
            </span>
          </a>
          {!submitted && !noForm && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-cca-blue text-white font-kollektif text-sm px-5 py-2.5 rounded-full hover:bg-cca-blue/90 transition-all shadow-[0_4px_14px_-4px_rgba(59,112,176,0.4)] hover:shadow-[0_6px_20px_-4px_rgba(59,112,176,0.5)] hover:-translate-y-0.5"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save Progress</span>
              <span className="sm:hidden">Save</span>
            </button>
          )}
        </div>
      </header>

      {/* === HERO === */}
      {!submitted && !noForm && (
        <section className="relative pt-8 md:pt-14 pb-4 md:pb-6 px-5">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block relative mb-4 md:mb-6">
              <Image
                src="/marketing/shared/cca-logo-full.png"
                alt="Crandall Christian Academy"
                width={338}
                height={118}
                className="h-32 md:h-44 w-auto mx-auto drop-shadow-[0_8px_24px_rgba(59,112,176,0.12)]"
                priority
              />
            </div>
            <p className="font-[family-name:var(--font-signature)] text-lg md:text-2xl text-cca-blue/80 mb-3 md:mb-4">
              Where Little Minds Shine
            </p>
            <h1 className="font-kollektif text-2xl md:text-4xl text-cca-ink mb-3 text-balance">
              We&rsquo;re so glad you&rsquo;re here.
            </h1>
            <p className="font-questrial text-base md:text-lg text-cca-ink/65 max-w-lg mx-auto text-pretty leading-relaxed">
              Choosing a preschool is a big decision. The next few minutes help us get to know your
              family so we can make sure CCA is the right fit.
            </p>
            <div className="mt-5 md:mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs md:text-sm font-questrial text-cca-ink/55">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cca-green" />
                About 5–10 minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cca-blue" />
                Your progress saves as you go
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cca-pink" />
                No commitment — we reach out to you
              </span>
            </div>
          </div>
        </section>
      )}

      {/* === SAVE TOAST === */}
      <div
        className={cn(
          'fixed top-20 right-4 z-[60] bg-cca-green text-white font-questrial text-sm px-5 py-3 rounded-xl shadow-lg transition-all duration-300',
          saveToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none',
        )}
      >
        <span className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Progress saved!
        </span>
      </div>

      {/* === RESUME DRAFT BANNER === */}
      {hasDraft && !submitted && (
        <div className="bg-cca-blue/5 border-b border-cca-blue/10">
          <div className="max-w-2xl mx-auto px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-questrial text-sm text-cca-ink">
              You have a saved application. Continue where you left off?
            </p>
            <div className="flex gap-2">
              <button
                onClick={resumeDraft}
                className="bg-cca-blue text-white font-kollektif text-sm px-4 py-2 rounded-full hover:bg-cca-blue/90 transition-colors"
              >
                Resume
              </button>
              <button
                onClick={discardDraft}
                className="text-cca-ink/60 font-questrial text-sm px-4 py-2 hover:text-cca-ink transition-colors"
              >
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MAIN CONTENT === */}
      <main className="flex-1 pt-4 md:pt-6 pb-10 md:pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {noForm ? (
            <div className="text-center py-16">
              <h1 className="font-kollektif text-2xl text-cca-ink mb-3">{title}</h1>
              <p className="font-questrial text-cca-ink/60 text-base leading-relaxed mb-8">
                Our enrollment application is being set up. Please contact us to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`mailto:${EMAIL}`}
                  className="inline-flex items-center justify-center gap-2 bg-cca-blue text-white font-kollektif px-8 py-3 rounded-full hover:bg-cca-blue/90 transition-colors"
                >
                  Email Us
                </a>
                <a
                  href={PHONE_TEL}
                  className="inline-flex items-center justify-center gap-2 border border-gray-200 text-cca-ink font-kollektif px-8 py-3 rounded-full hover:bg-gray-50 transition-colors"
                >
                  Call {PHONE}
                </a>
              </div>
            </div>
          ) : submitted ? (
            <div className="relative text-center py-12 md:py-20">
              <Image
                src="/cca-assets/crandall-sunshine.png"
                alt=""
                aria-hidden
                width={280}
                height={280}
                className="mx-auto w-40 md:w-56 mb-6 drop-shadow-[0_12px_32px_rgba(242,176,32,0.25)] animate-[spin_40s_linear_infinite]"
              />
              <p className="font-[family-name:var(--font-signature)] text-xl md:text-3xl text-cca-pink mb-3">
                Hooray!
              </p>
              <h1 className="font-kollektif text-3xl md:text-5xl text-cca-ink mb-4 text-balance">
                {thankYouTitle}
              </h1>
              <p className="font-questrial text-cca-ink/70 text-base md:text-lg leading-relaxed mb-3 max-w-lg mx-auto text-pretty">
                {thankYouMessage}
              </p>
              <p className="font-questrial text-cca-ink/50 text-sm leading-relaxed mb-10 max-w-md mx-auto">
                Track your application status and book your tour when invited &mdash; right from
                your parent portal.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/portal/login"
                  className="inline-flex items-center justify-center gap-2 bg-cca-blue text-white font-kollektif px-8 py-3.5 rounded-full hover:bg-cca-blue/90 transition-all shadow-[0_10px_28px_-8px_rgba(59,112,176,0.5)] hover:-translate-y-0.5"
                >
                  Log into Your Portal
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <a
                  href={WEBSITE_URL}
                  className="inline-flex items-center justify-center gap-2 border border-cca-ink/10 bg-white text-cca-ink font-kollektif px-8 py-3.5 rounded-full hover:bg-cca-cream transition-colors"
                >
                  Return to Website
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Fee notice */}
              <WizardFeeNotice
                feeEnabled={feeEnabled}
                feeAmountCents={feeAmountCents}
                feeDescription={feeDescription}
                hideFeeNotice={hideFeeNotice}
              />

              {/* Step indicator */}
              {steps.length > 1 && (
                <div className="mb-6">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    {steps.map((s, i) => {
                      const isActive = i === step
                      const isComplete = i < step
                      // Rotate through the CCA palette so progress feels alive.
                      const palette = [
                        'bg-cca-blue',
                        'bg-cca-green',
                        'bg-cca-yellow',
                        'bg-cca-pink',
                        'bg-cca-teal',
                        'bg-cca-coral',
                      ]
                      const completedColor = palette[i % palette.length]
                      return (
                        <div key={s.id} className="flex-1">
                          <div
                            className={cn(
                              'h-2 rounded-full transition-all duration-500',
                              isComplete && completedColor,
                              isActive &&
                                'bg-gradient-to-r from-cca-blue to-cca-pink shadow-[0_2px_8px_-2px_rgba(59,112,176,0.4)]',
                              !isComplete && !isActive && 'bg-cca-ink/10',
                            )}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <p className="font-questrial text-xs md:text-sm text-cca-ink/50">
                      <span className="font-kollektif text-cca-ink">Step {step + 1}</span>
                      <span className="mx-1.5">of</span>
                      <span>{steps.length}</span>
                      {currentStep?.title && (
                        <>
                          <span className="mx-2 text-cca-ink/25">&bull;</span>
                          <span className="text-cca-ink/70">{currentStep.title}</span>
                        </>
                      )}
                    </p>
                    <p className="font-questrial text-[11px] md:text-xs text-cca-ink/35">
                      {Math.round(((step + 1) / steps.length) * 100)}% complete
                    </p>
                  </div>
                </div>
              )}

              {/* Form card */}
              <div className="relative bg-white rounded-[28px] border border-cca-ink/5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_24px_48px_-16px_rgba(59,112,176,0.12)] p-6 md:p-10 overflow-hidden">
                {/* Subtle top accent line using brand palette */}
                <div
                  aria-hidden
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    background:
                      'linear-gradient(90deg, #3b70b0 0%, #5cb961 25%, #f2b020 50%, #f878af 75%, #4abdac 100%)',
                  }}
                />
                {currentStep && (
                  <>
                    <div className="mb-7">
                      <h2 className="font-kollektif text-2xl md:text-3xl text-cca-ink text-balance">
                        {currentStep.title ?? title}
                      </h2>
                      {currentStep.description && (
                        <p className="mt-2 font-questrial text-base text-cca-ink/60 text-pretty">
                          {currentStep.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-5">
                      {currentStep.iterate_over_field_key ? (
                        <IteratedFields
                          iterateKey={currentStep.iterate_over_field_key}
                          values={values}
                          setValues={setValues}
                          fields={currentFields}
                          isFieldVisible={isFieldVisible}
                          tenantName={tenantName}
                        />
                      ) : (
                        currentFields
                          .filter((f) => isFieldVisible(f))
                          .map((field) => (
                            <FieldBlock
                              key={field.id}
                              field={field}
                              value={values[field.field_key]}
                              onChange={(v) => setValues({ ...values, [field.field_key]: v })}
                              tenantName={tenantName}
                            />
                          ))
                      )}

                      {/* Honeypot */}
                      <input
                        type="text"
                        tabIndex={-1}
                        aria-hidden
                        autoComplete="off"
                        style={{ position: 'absolute', left: '-9999px' }}
                      />

                      {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 font-questrial">
                          {error}
                        </div>
                      )}
                    </div>

                    {/* Navigation */}
                    <div className="mt-10 pt-6 border-t border-cca-ink/5 flex items-center justify-between">
                      <button
                        type="button"
                        disabled={step === 0 || pending}
                        onClick={() => setStep(step - 1)}
                        className={cn(
                          'flex items-center gap-1.5 font-kollektif text-sm text-cca-ink border border-cca-ink/10 bg-white px-5 py-2.5 rounded-full hover:bg-cca-cream hover:border-cca-ink/20 disabled:opacity-40 transition-all',
                          step === 0 && 'invisible',
                        )}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>

                      {!isLast ? (
                        <button
                          type="button"
                          disabled={!canAdvance()}
                          onClick={() => setStep(step + 1)}
                          className="flex items-center gap-1.5 font-kollektif text-sm bg-cca-blue text-white px-7 py-3 rounded-full hover:bg-cca-blue/90 disabled:opacity-50 transition-all shadow-[0_8px_24px_-8px_rgba(59,112,176,0.5)] enabled:hover:shadow-[0_12px_28px_-8px_rgba(59,112,176,0.6)] enabled:hover:-translate-y-0.5"
                        >
                          Continue
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAdvance() || pending}
                          onClick={handleSubmit}
                          className="flex items-center gap-2 font-kollektif text-sm bg-cca-green text-white px-7 py-3 rounded-full hover:bg-cca-green/90 disabled:opacity-50 transition-all shadow-[0_8px_24px_-8px_rgba(92,185,97,0.55)] enabled:hover:shadow-[0_12px_28px_-8px_rgba(92,185,97,0.65)] enabled:hover:-translate-y-0.5"
                        >
                          {pending ? 'Submitting…' : 'Submit Application'}
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* === FOOTER === */}
      <footer className="pb-10 pt-4 px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 text-cca-ink/35 font-questrial text-xs">
            <a href={`mailto:${EMAIL}`} className="hover:text-cca-blue transition-colors">
              {EMAIL}
            </a>
            <span className="text-cca-ink/20">&bull;</span>
            <a href={PHONE_TEL} className="hover:text-cca-blue transition-colors">
              {PHONE}
            </a>
          </div>
          <p className="font-questrial text-[11px] text-cca-ink/25">
            &copy; {new Date().getFullYear()} Crandall Christian Academy &mdash; Where Little Minds
            Shine
          </p>
        </div>
      </footer>
    </>
  )
}

/* ============================= */
/* Field rendering (inlined to match CCA brand) */
/* ============================= */

function IteratedFields({
  iterateKey,
  values,
  setValues,
  fields,
  isFieldVisible,
  tenantName,
}: {
  iterateKey: string
  values: Record<string, unknown>
  setValues: (v: Record<string, unknown>) => void
  fields: WizardField[]
  isFieldVisible: (field: WizardField, scope?: Record<string, unknown>) => boolean
  tenantName: string
}) {
  const items = Array.isArray(values[iterateKey])
    ? (values[iterateKey] as Array<Record<string, unknown>>)
    : []

  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
        <p className="font-questrial text-sm text-cca-ink/50">
          Add at least one item on the previous step to continue.
        </p>
      </div>
    )
  }

  const updateItem = (index: number, patch: Record<string, unknown>) => {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it))
    setValues({ ...values, [iterateKey]: next })
  }

  return (
    <div className="space-y-5">
      {items.map((item, index) => {
        const name =
          (typeof item.first_name === 'string' && item.first_name.trim()) ||
          (typeof item.preferred_name === 'string' && item.preferred_name.trim()) ||
          null
        return (
          <div key={index} className="rounded-xl border border-gray-100 bg-[#FAF9F5] p-4 md:p-5">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cca-blue/10 px-3 py-1 text-xs font-kollektif text-cca-blue">
              {name || `#${index + 1}`}
            </div>
            <div className="space-y-4">
              {fields
                .filter((f) => isFieldVisible(f, item))
                .map((field) => (
                  <FieldBlock
                    key={`${field.id}-${index}`}
                    field={field}
                    value={item[field.field_key]}
                    onChange={(v) => updateItem(index, { [field.field_key]: v })}
                    tenantName={tenantName}
                  />
                ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FieldBlock({
  field,
  value,
  onChange,
  tenantName,
}: {
  field: WizardField
  value: unknown
  onChange: (v: unknown) => void
  tenantName: string
}) {
  if (field.field_type === 'section_header') {
    return (
      <div>
        <h3 className="font-kollektif text-lg text-cca-ink">{field.label}</h3>
        {field.description && (
          <p className="mt-1 font-questrial text-sm text-cca-ink/60">{field.description}</p>
        )}
      </div>
    )
  }
  if (field.field_type === 'description_block') {
    return (
      <div className="rounded-xl bg-cca-blue/5 p-4">
        {field.label && (
          <div className="mb-1 font-kollektif text-sm text-cca-ink">{field.label}</div>
        )}
        {field.description && (
          <p className="font-questrial text-sm text-cca-ink/60 leading-relaxed">
            {field.description}
          </p>
        )}
      </div>
    )
  }
  if (field.field_type === 'divider') {
    return <div className="h-px bg-gray-100" />
  }
  if (field.field_type === 'spacer') {
    return <div className="h-4" />
  }
  if (field.field_type === 'repeater_group') {
    return <RepeaterGroup field={field} value={value} onChange={onChange} />
  }

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 font-questrial text-sm font-medium text-cca-ink">
        {field.label}
        {field.is_required && <span className="text-cca-coral">*</span>}
        {field.is_locked && <Lock className="h-3 w-3 text-cca-ink/30" />}
      </span>
      {field.description && (
        <span className="mb-1.5 block font-questrial text-xs text-cca-ink/50">
          {field.description}
        </span>
      )}
      <FieldInput field={field} value={value} onChange={onChange} tenantName={tenantName} />
    </label>
  )
}

const INPUT_CLASS =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-questrial text-sm text-cca-ink focus:outline-none focus:ring-2 focus:ring-cca-blue/30 focus:border-cca-blue transition-colors'

function FieldInput({
  field,
  value,
  onChange,
  tenantName,
}: {
  field: WizardField
  value: unknown
  onChange: (v: unknown) => void
  tenantName: string
}) {
  switch (field.field_type) {
    case 'short_text':
    case 'email':
    case 'phone':
    case 'url':
    case 'number':
    case 'currency':
    case 'date':
    case 'time':
    case 'datetime':
      return (
        <input
          type={
            field.field_type === 'email'
              ? 'email'
              : field.field_type === 'phone'
                ? 'tel'
                : field.field_type === 'url'
                  ? 'url'
                  : field.field_type === 'number' || field.field_type === 'currency'
                    ? 'number'
                    : field.field_type === 'date'
                      ? 'date'
                      : field.field_type === 'time'
                        ? 'time'
                        : field.field_type === 'datetime'
                          ? 'datetime-local'
                          : 'text'
          }
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          className={INPUT_CLASS}
        />
      )
    case 'long_text':
      return (
        <textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          rows={3}
          className={INPUT_CLASS}
        />
      )
    case 'single_select_dropdown': {
      const options = (field.config?.options as Array<{ value: string; label: string }>) ?? []
      return (
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT_CLASS}
        >
          <option value="" disabled>
            Select...
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    }
    case 'single_select_radio':
    case 'button_group': {
      const options = (field.config?.options as Array<{ value: string; label: string }>) ?? []
      return (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = value === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-questrial border transition-colors',
                  active
                    ? 'bg-cca-blue text-white border-cca-blue'
                    : 'bg-white text-cca-ink border-gray-200 hover:border-cca-blue/50',
                )}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )
    }
    case 'yes_no':
      return (
        <div className="flex gap-2">
          {[
            { label: 'Yes', val: true },
            { label: 'No', val: false },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => onChange(o.val)}
              className={cn(
                'px-6 py-2 rounded-full text-sm font-questrial border transition-colors',
                value === o.val
                  ? 'bg-cca-blue text-white border-cca-blue'
                  : 'bg-white text-cca-ink border-gray-200 hover:border-cca-blue/50',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )
    case 'multi_select_checkbox': {
      const options = (field.config?.options as Array<{ value: string; label: string }>) ?? []
      const arr = Array.isArray(value) ? (value as string[]) : []
      return (
        <div className="flex flex-col gap-2">
          {options.map((o) => (
            <label
              key={o.value}
              className="flex items-center gap-2.5 font-questrial text-sm text-cca-ink cursor-pointer"
            >
              <input
                type="checkbox"
                checked={arr.includes(o.value)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...arr, o.value] : arr.filter((x) => x !== o.value))
                }
                className="rounded accent-cca-blue w-4 h-4"
              />
              {o.label}
            </label>
          ))}
        </div>
      )
    }
    case 'legal_acceptance':
      return (
        <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 cursor-pointer hover:bg-cca-blue/5 transition-colors">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-cca-blue"
          />
          <span className="font-questrial text-sm text-cca-ink">
            {field.label?.replace('{tenantName}', tenantName)}
          </span>
        </label>
      )
    case 'typed_signature': {
      const sigVal = String(value ?? '')
      return (
        <div className="space-y-3">
          <input
            type="text"
            value={sigVal}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your full legal name"
            className={INPUT_CLASS}
          />
          {sigVal.trim().length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
              <p className="text-[10px] uppercase tracking-widest text-cca-ink/40 mb-2">
                Electronic Signature
              </p>
              <p className="text-3xl leading-tight text-cca-ink font-[family-name:var(--font-signature)]">
                {sigVal}
              </p>
              <div className="mt-3 border-t border-gray-100 pt-2 flex items-center justify-between text-[10px] text-cca-ink/40">
                <span>
                  {new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>Signed electronically</span>
              </div>
            </div>
          )}
        </div>
      )
    }
    case 'address_autocomplete':
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start typing your address..."
          className={INPUT_CLASS}
        />
      )
    case 'image_upload':
    case 'file_upload':
      return (
        <input
          type="file"
          accept={field.field_type === 'image_upload' ? 'image/*' : undefined}
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? '')}
          className={INPUT_CLASS}
        />
      )
    case 'payment_stripe':
      return (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 font-questrial text-xs text-cca-ink/50">
          Secure Stripe payment — rendered on submission when fee is enabled.
        </div>
      )
    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          className={INPUT_CLASS}
        />
      )
  }
}

function RepeaterGroup({
  field,
  value,
  onChange,
}: {
  field: WizardField
  value: unknown
  onChange: (v: unknown) => void
}) {
  const config = field.config as {
    min_items?: number
    max_items?: number
    item_label?: string
    add_button_label?: string
    remove_button_label?: string
    fields?: Array<{
      field_key: string
      field_type: string
      label?: string
      is_required?: boolean
      config?: Record<string, unknown>
    }>
  }
  const maxItems = config.max_items ?? 5
  const minItems = config.min_items ?? 1
  const itemLabel = config.item_label ?? 'Item'
  const subFields = config.fields ?? []

  const arr = (Array.isArray(value) ? value : []) as Array<Record<string, unknown>>
  const emptyItem = (): Record<string, unknown> => {
    const item: Record<string, unknown> = {}
    for (const f of subFields) item[f.field_key] = ''
    return item
  }
  const items = arr.length === 0 ? [emptyItem()] : arr

  const updateItem = (idx: number, patch: Record<string, unknown>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    onChange(next)
  }
  const addItem = () => {
    if (items.length >= maxItems) return
    onChange([...items, emptyItem()])
  }
  const removeItem = (idx: number) => {
    if (items.length <= minItems) return
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-kollektif text-sm text-cca-ink">
              {itemLabel} {idx + 1}
            </h4>
            {items.length > minItems && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="flex items-center gap-1 font-questrial text-xs text-cca-coral hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {config.remove_button_label ?? 'Remove'}
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {subFields.map((sub) => (
              <label key={sub.field_key} className="block">
                <span className="mb-1 block font-questrial text-xs font-medium text-cca-ink">
                  {sub.label}
                  {sub.is_required && <span className="text-cca-coral"> *</span>}
                </span>
                <SubFieldInput
                  fieldType={sub.field_type}
                  config={sub.config ?? {}}
                  value={item[sub.field_key]}
                  onChange={(v) => updateItem(idx, { [sub.field_key]: v })}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      {items.length < maxItems && (
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-gray-200 px-4 py-2 font-questrial text-sm text-cca-ink/60 hover:border-cca-blue/50 hover:text-cca-blue transition-colors"
        >
          <Plus className="h-4 w-4" />
          {config.add_button_label ?? `Add another ${itemLabel.toLowerCase()}`}
        </button>
      )}
    </div>
  )
}

function SubFieldInput({
  fieldType,
  config,
  value,
  onChange,
}: {
  fieldType: string
  config: Record<string, unknown>
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (fieldType === 'date') {
    return (
      <input
        type="date"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      />
    )
  }
  if (fieldType === 'single_select_radio') {
    const options = (config.options as Array<{ value: string; label: string }>) ?? []
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
      >
        <option value="" disabled>
          Select...
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }
  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      className={INPUT_CLASS}
    />
  )
}
