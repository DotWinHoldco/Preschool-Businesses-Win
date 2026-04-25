// @anchor: cca.crm.settings
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { SettingsClient } from './settings-client'
import { composeMailingAddress } from '@/lib/crm/send-email'

export const dynamic = 'force-dynamic'

export default async function CRMSettingsPage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const [{ data: settings }, { data: branding }] = await Promise.all([
    supabase.from('tenant_email_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
    supabase
      .from('tenant_branding')
      .select('school_name, address_line1, address_line2, city, state, zip')
      .eq('tenant_id', tenantId)
      .maybeSingle(),
  ])

  const fallbackAddress = composeMailingAddress(branding)

  return (
    <SettingsClient
      initial={{
        from_name: (settings?.from_name as string) ?? (branding?.school_name as string) ?? '',
        from_email: (settings?.from_email as string) ?? '',
        reply_to: (settings?.reply_to as string | null) ?? null,
        resend_domain: (settings?.resend_domain as string | null) ?? null,
        domain_verified: (settings?.domain_verified as boolean) ?? false,
        mailing_address: (settings?.mailing_address as string) ?? fallbackAddress,
        unsubscribe_text: (settings?.unsubscribe_text as string) ?? 'Unsubscribe from these emails',
      }}
    />
  )
}
