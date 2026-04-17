// @anchor: platform.form-builder.standalone-page

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ConversationalForm } from '@/components/forms/ConversationalForm'
import { DocumentForm } from '@/components/forms/DocumentForm'
import type { FormFieldType } from '@/lib/schemas/form'

export default async function StandaloneFormPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; formSlug: string }>
}) {
  const { tenantSlug, formSlug } = await params
  const supabase = createAdminClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) notFound()

  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('slug', formSlug)
    .eq('status', 'published')
    .single()

  if (!form) notFound()

  const { data: fields } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', form.id)
    .order('sort_order')

  const { data: sections } = await supabase
    .from('form_sections')
    .select('*')
    .eq('form_id', form.id)
    .order('sort_order')

  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('tenant_id', tenant.id)
    .single()

  const themeStyle = branding ? {
    '--color-primary': branding.color_primary,
    '--color-primary-foreground': branding.color_primary_foreground,
    '--color-secondary': branding.color_secondary,
    '--color-accent': branding.color_accent,
    '--color-background': branding.color_background,
    '--color-foreground': branding.color_foreground,
    '--color-muted': branding.color_muted,
    '--color-muted-foreground': branding.color_muted_foreground,
    '--color-border': branding.color_border,
    '--color-card': branding.color_card,
    '--color-destructive': branding.color_destructive || '#EF4444',
    '--color-warning': branding.color_warning || '#F59E0B',
    '--radius': branding.border_radius || '0.75rem',
  } as React.CSSProperties : {}

  const typedFields = (fields || []).map(f => ({
    ...f,
    field_type: f.field_type as FormFieldType,
    config: (f.config || {}) as Record<string, unknown>,
    validation_rules: (f.validation_rules || {}) as Record<string, unknown>,
    logic_rules: (f.logic_rules || []) as Record<string, unknown>[],
  }))

  return (
    <div style={{ ...themeStyle, backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)', minHeight: '100vh' }}>
      {form.header_config && (form.header_config as Record<string, unknown>).show_header !== false && (
        <div className="text-center py-8 px-6">
          {branding?.school_name && (
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary)' }}>
              {branding.school_name}
            </p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold">{form.title}</h1>
          {form.description && (
            <p className="mt-2 text-sm max-w-lg mx-auto" style={{ color: 'var(--color-muted-foreground)' }}>
              {form.description}
            </p>
          )}
        </div>
      )}

      {form.mode === 'conversational' ? (
        <ConversationalForm
          formId={form.id}
          fields={typedFields}
          thankYouTitle={form.thank_you_title}
          thankYouMessage={form.thank_you_message}
          thankYouRedirectUrl={form.thank_you_redirect_url}
          tenantSlug={tenantSlug}
        />
      ) : (
        <DocumentForm
          formId={form.id}
          fields={typedFields}
          sections={(sections || []).map(s => ({
            ...s,
            logic_rules: (s.logic_rules || []) as Record<string, unknown>[],
          }))}
          thankYouTitle={form.thank_you_title}
          thankYouMessage={form.thank_you_message}
          thankYouRedirectUrl={form.thank_you_redirect_url}
        />
      )}

      <div className="text-center py-6">
        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          Powered by <span className="font-semibold">.win</span>
        </p>
      </div>
    </div>
  )
}
