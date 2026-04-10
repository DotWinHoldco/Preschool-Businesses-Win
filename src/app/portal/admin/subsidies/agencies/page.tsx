// @anchor: cca.subsidy.agencies-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { Building, Plus, Phone, Mail } from 'lucide-react'

export default async function AgenciesPage() {
  const supabase = await createTenantServerClient()

  const { data: agencies } = await supabase
    .from('subsidy_agencies')
    .select('*')
    .order('name')

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
        <button className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Agency
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(agencies ?? []).length === 0 ? (
          <div className="col-span-full rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-12 text-center">
            <Building className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)] mb-3" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">No agencies configured</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Add your first subsidy agency to start tracking
            </p>
          </div>
        ) : (
          (agencies ?? []).map((agency: Record<string, unknown>) => (
            <div key={agency.id as string} className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
                {agency.name as string}
              </h3>
              <div className="space-y-1 text-xs text-[var(--color-muted-foreground)]">
                <p>{String(agency.state ?? '')}{agency.county ? `, ${String(agency.county)}` : ''}</p>
                {typeof agency.contact_email === 'string' && agency.contact_email && (
                  <p className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {agency.contact_email}
                  </p>
                )}
                {typeof agency.contact_phone === 'string' && agency.contact_phone && (
                  <p className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {agency.contact_phone}
                  </p>
                )}
                <p>Format: {(agency.billing_format as string)?.replace('_', ' ')}</p>
                <p>Payment terms: {agency.payment_terms_days as number} days</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
