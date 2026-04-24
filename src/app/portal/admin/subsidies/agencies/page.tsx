// @anchor: cca.subsidy.agencies-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { Building, Phone, Mail } from 'lucide-react'
import { AddAgencyButton } from '@/components/portal/subsidies/add-agency-button'
import { AgencyRowActions } from '@/components/portal/subsidies/agency-row-actions'

export default async function AgenciesPage() {
  const supabase = await createTenantServerClient()

  const { data: agencies } = await supabase.from('subsidy_agencies').select('*').order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Subsidy Agencies</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Manage state and county subsidy agencies
          </p>
        </div>
        <AddAgencyButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(agencies ?? []).length === 0 ? (
          <div className="col-span-full rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-12 text-center">
            <Building className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)] mb-3" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">
              No agencies configured
            </h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Add your first subsidy agency to start tracking
            </p>
          </div>
        ) : (
          (agencies ?? []).map((agency: Record<string, unknown>) => {
            const id = agency.id as string
            const name = (agency.name as string) ?? ''
            const agencyType = (agency.agency_type as string) ?? 'state'
            const state = (agency.state as string) ?? ''
            const county = (agency.county as string) ?? ''
            const contactEmail = (agency.contact_email as string) ?? ''
            const contactPhone = (agency.contact_phone as string) ?? ''
            const billingFormat = (agency.billing_format as string) ?? 'manual'
            const paymentTermsDays = (agency.payment_terms_days as number) ?? 30

            return (
              <div
                key={id}
                className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{name}</h3>
                  <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    {agencyType}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-[var(--color-muted-foreground)]">
                  <p>
                    {state}
                    {county ? `, ${county}` : ''}
                  </p>
                  {contactEmail && (
                    <p className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {contactEmail}
                    </p>
                  )}
                  {contactPhone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {contactPhone}
                    </p>
                  )}
                  <p>Format: {billingFormat.replace('_', ' ')}</p>
                  <p>Payment terms: {paymentTermsDays} days</p>
                </div>
                <AgencyRowActions
                  agency={{
                    id,
                    name,
                    agency_type: agencyType,
                    state,
                    county,
                    contact_email: contactEmail,
                    contact_phone: contactPhone,
                    billing_format: billingFormat,
                    payment_terms_days: paymentTermsDays,
                  }}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
