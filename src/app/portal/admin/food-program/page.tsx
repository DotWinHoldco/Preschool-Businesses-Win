// @anchor: cca.food-program.admin-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { UtensilsCrossed, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function FoodProgramPage() {
  const supabase = await createTenantServerClient()

  // Fetch recent claims summary
  const { data: claims } = await supabase
    .from('cacfp_claims')
    .select('id, claim_month, claim_year, status, total_meals_claimed, total_reimbursement_cents')
    .order('claim_year', { ascending: false })
    .order('claim_month', { ascending: false })
    .limit(6)

  // Fetch today's menus
  const today = new Date().toISOString().split('T')[0]
  const { data: todayMenus } = await supabase
    .from('meal_menus')
    .select('*')
    .eq('date', today)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UtensilsCrossed className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">CACFP Food Program</h1>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Manage menus, track meals, and generate CACFP reimbursement claims
        </p>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/portal/admin/food-program/menus"
          className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-primary)] transition-colors"
        >
          <Calendar className="h-8 w-8 text-[var(--color-primary)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-foreground)]">Menu Planner</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Plan weekly menus with USDA compliance</p>
          </div>
        </Link>
        <Link
          href="/portal/staff/food-program"
          className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-primary)] transition-colors"
        >
          <UtensilsCrossed className="h-8 w-8 text-[var(--color-secondary)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-foreground)]">Meal Recording</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Record daily meal service</p>
          </div>
        </Link>
        <Link
          href="/portal/admin/food-program/claims"
          className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-primary)] transition-colors"
        >
          <FileText className="h-8 w-8 text-[var(--color-accent)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-foreground)]">CACFP Claims</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Generate and submit claims</p>
          </div>
        </Link>
      </div>

      {/* Today's menu */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Today&apos;s Menu - {today}</h3>
        </div>
        {(todayMenus ?? []).length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
            No menu planned for today
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {(todayMenus ?? []).map((menu: Record<string, unknown>) => (
              <div key={menu.id as string} className="p-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    {(menu.meal_type as string).replace('_', ' ')}
                  </span>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {(menu.items as string[])?.join(', ')}
                  </p>
                </div>
                {menu.meets_cacfp_pattern ? (
                  <span className="text-xs text-[var(--color-primary)]">CACFP compliant</span>
                ) : (
                  <span className="text-xs text-[var(--color-warning)]">Incomplete</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent claims */}
      {(claims ?? []).length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Recent Claims</h3>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {(claims ?? []).map((claim: Record<string, unknown>) => (
              <div key={claim.id as string} className="flex items-center justify-between p-3">
                <div>
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    {claim.claim_month as number}/{claim.claim_year as number}
                  </span>
                  <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
                    {claim.total_meals_claimed as number} meals
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">
                    ${((claim.total_reimbursement_cents as number) / 100).toFixed(2)}
                  </span>
                  <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[10px] text-[var(--color-muted-foreground)]">
                    {claim.status as string}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
