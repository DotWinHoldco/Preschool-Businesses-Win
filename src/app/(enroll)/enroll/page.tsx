import { createAdminClient } from '@/lib/supabase/admin';
import { EnrollmentPageClient } from './enrollment-page-client';

export default async function EnrollPage() {
  let form: {
    id: string;
    tenant_id: string;
    title: string;
    mode: string;
    fee_enabled: boolean | null;
    fee_amount_cents: number | null;
    fee_description: string | null;
    hide_fee_notice: boolean | null;
    thank_you_title: string | null;
    thank_you_message: string | null;
  } | null = null;

  let tenantName = 'Crandall Christian Academy';
  let sections: Array<{
    id: string;
    title: string | null;
    description: string | null;
    sort_order: number;
    page_number: number;
    iterate_over_field_key?: string | null;
  }> = [];
  let fields: Array<{
    id: string;
    field_key: string;
    field_type: string;
    label: string | null;
    description: string | null;
    placeholder: string | null;
    config: Record<string, unknown>;
    validation_rules: Record<string, unknown>;
    logic_rules: Record<string, unknown>[];
    is_required: boolean;
    is_locked: boolean;
    is_system_field: boolean;
    sort_order: number;
    page_number: number;
    section_id: string | null;
  }> = [];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('forms')
      .select(
        'id, tenant_id, title, mode, fee_enabled, fee_amount_cents, fee_description, hide_fee_notice, thank_you_title, thank_you_message',
      )
      .eq('system_form_key', 'enrollment_application')
      .is('parent_form_id', null)
      .limit(1)
      .maybeSingle();

    form = data;

    if (form?.tenant_id) {
      const { data: branding } = await supabase
        .from('tenant_branding')
        .select('school_name')
        .eq('tenant_id', form.tenant_id)
        .maybeSingle();
      tenantName = branding?.school_name ?? tenantName;

      const [{ data: s }, { data: f }] = await Promise.all([
        supabase.from('form_sections').select('*').eq('form_id', form.id).order('sort_order'),
        supabase.from('form_fields').select('*').eq('form_id', form.id).order('sort_order'),
      ]);
      sections = (s ?? []) as typeof sections;
      fields = (f ?? []) as typeof fields;
    }
  } catch {
    // Service role key not configured — render with no form data.
    // The client component handles this gracefully.
  }

  if (!form) {
    return (
      <EnrollmentPageClient
        formId=""
        title="Enrollment Application"
        feeEnabled={false}
        feeAmountCents={null}
        feeDescription="Application Fee"
        hideFeeNotice={true}
        thankYouTitle="Application received!"
        thankYouMessage="We'll review your application within 1-2 business days. Watch for an email with next steps."
        sections={[]}
        fields={[]}
        tenantName={tenantName}
      />
    );
  }

  return (
    <EnrollmentPageClient
      formId={form.id}
      title={form.title}
      feeEnabled={form.fee_enabled ?? false}
      feeAmountCents={form.fee_amount_cents}
      feeDescription={form.fee_description ?? 'Application Fee'}
      hideFeeNotice={form.hide_fee_notice ?? false}
      thankYouTitle={form.thank_you_title ?? 'Application received!'}
      thankYouMessage={
        form.thank_you_message ??
        "We'll review your application within 1-2 business days. Watch for an email with next steps."
      }
      sections={sections}
      fields={fields}
      tenantName={tenantName}
    />
  );
}
