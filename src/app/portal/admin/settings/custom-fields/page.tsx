// @anchor: platform.custom-fields.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { CustomFieldsManager } from './custom-fields-manager'

export default async function CustomFieldsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: entityTypes } = await supabase
    .from('custom_field_entity_types')
    .select('*')
    .eq('enabled', true)
    .order('entity_type')

  const { data: fields } = await supabase
    .from('custom_fields')
    .select('*, custom_field_options(*)')
    .is('deleted_at', null)
    .order('sort_order')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>Custom Fields</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
            Extend entities with custom data fields. Changes take effect immediately.
          </p>
        </div>
        <Badge variant="outline">{fields?.length || 0} fields</Badge>
      </div>

      <CustomFieldsManager
        entityTypes={entityTypes || []}
        initialFields={fields || []}
      />
    </div>
  )
}
