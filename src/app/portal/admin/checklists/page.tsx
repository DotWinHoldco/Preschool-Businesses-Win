// @anchor: cca.checklist.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ClipboardList } from 'lucide-react'

export default async function AdminChecklistsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: templates } = await supabase
    .from('checklist_templates')
    .select('id, name, target_type, description, created_by, is_active, sort_order, created_at')
    .eq('tenant_id', tenantId)
    .order('sort_order', { ascending: true })

  const allTemplates = templates ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Checklist Templates
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Manage daily, weekly, and monthly checklists for your team.
        </p>
      </div>

      {allTemplates.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <ClipboardList
            size={48}
            className="mx-auto mb-4"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            No checklists yet.
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Create checklist templates to keep your team on track.
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: 'Total Templates', value: allTemplates.length.toString() },
              { label: 'Active', value: allTemplates.filter((t) => t.is_active).length.toString() },
              { label: 'Inactive', value: allTemplates.filter((t) => !t.is_active).length.toString() },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{stat.label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Templates table */}
          <div
            className="overflow-hidden rounded-xl"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="p-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                Templates
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Name', 'Target Type', 'Description', 'Status', 'Created'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allTemplates.map((tpl) => (
                    <tr key={tpl.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{tpl.name}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{tpl.target_type ?? '\u2014'}</td>
                      <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                        {tpl.description ?? '\u2014'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: tpl.is_active ? 'var(--color-primary)' : 'var(--color-muted)',
                            color: tpl.is_active ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
                          }}
                        >
                          {tpl.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                        {tpl.created_at ? new Date(tpl.created_at).toLocaleDateString() : '\u2014'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
