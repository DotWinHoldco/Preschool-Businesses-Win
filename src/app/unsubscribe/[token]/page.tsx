// @anchor: cca.crm.unsubscribe-page
// Public unsubscribe page. One-click adds the contact to the tenant
// suppression list and updates contacts.email_subscribed.

import { createAdminClient } from '@/lib/supabase/admin'
import { UnsubForm } from './unsub-form'

export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()
  const { data: send } = await supabase
    .from('email_sends')
    .select('id, tenant_id, to_email, contact_id, unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle()

  let tenantName = 'this school'
  if (send?.tenant_id) {
    const { data: branding } = await supabase
      .from('tenant_branding')
      .select('school_name')
      .eq('tenant_id', send.tenant_id)
      .maybeSingle()
    if (branding?.school_name) tenantName = branding.school_name as string
  }

  if (!send) {
    return (
      <Shell title="Link not recognized">
        <p>
          This unsubscribe link doesn&rsquo;t look right. If you got here by mistake, you can safely
          close this tab.
        </p>
      </Shell>
    )
  }

  if (send.unsubscribed_at) {
    return (
      <Shell title="Already unsubscribed">
        <p>
          You&rsquo;re no longer receiving marketing emails from {tenantName} at{' '}
          <b>{send.to_email}</b>.
        </p>
      </Shell>
    )
  }

  return <UnsubForm token={token} email={send.to_email as string} tenantName={tenantName} />
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 space-y-3 text-[#141413]">
        <h1 className="font-bold text-xl">{title}</h1>
        <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
      </div>
    </main>
  )
}
