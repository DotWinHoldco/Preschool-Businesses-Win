// @anchor: cca.crm.templates-list
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Edit3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const { data: templates } = await supabase
    .from('email_templates')
    .select('id, name, subject, preheader, is_system, updated_at')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email templates</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Reusable email designs. Used by campaigns, drips, and automations.
          </p>
        </div>
        <Link href="/portal/admin/crm/templates/new">
          <Button>
            <Plus size={16} />
            New template
          </Button>
        </Link>
      </div>
      {(templates ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-full bg-[var(--color-muted)] flex items-center justify-center">
              <Mail size={20} className="text-[var(--color-muted-foreground)]" />
            </div>
            <p className="font-semibold">No templates yet</p>
            <p className="text-sm text-[var(--color-muted-foreground)] max-w-md mx-auto">
              Templates power broadcasts, drip sequences, and automated emails. Build a beautiful
              one with the rich editor and merge tags.
            </p>
            <Link href="/portal/admin/crm/templates/new">
              <Button>
                <Plus size={16} />
                Create your first template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(templates ?? []).map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/portal/admin/crm/templates/${t.id}`} className="flex-1 min-w-0">
                    <h2 className="font-semibold text-[var(--color-foreground)] truncate hover:text-[var(--color-primary)] transition-colors">
                      {t.name as string}
                    </h2>
                    <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">
                      Subject: {t.subject as string}
                    </p>
                    {t.preheader && (
                      <p className="text-[11px] text-[var(--color-muted-foreground)] truncate mt-0.5">
                        {t.preheader as string}
                      </p>
                    )}
                  </Link>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--color-muted-foreground)] pt-2 border-t border-[var(--color-border)]">
                  <span>Updated {new Date(t.updated_at as string).toLocaleDateString()}</span>
                  <Link
                    href={`/portal/admin/crm/templates/${t.id}`}
                    className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                  >
                    <Edit3 size={11} />
                    Edit
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
