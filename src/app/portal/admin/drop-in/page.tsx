// @anchor: cca.dropin.admin-page

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CalendarClock, Users, DollarSign, Calendar } from 'lucide-react'
import { DropInTabs } from '@/components/portal/drop-in/drop-in-tabs'

export default async function AdminDropInPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'rates' || tab === 'slots' ? tab : 'bookings'

  const stats = [
    { label: 'Open Slots Today', value: '6', icon: CalendarClock },
    { label: 'Bookings This Week', value: '14', icon: Calendar },
    { label: 'Revenue This Month', value: '$840', icon: DollarSign },
    { label: 'Active Drop-in Families', value: '9', icon: Users },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Drop-in Scheduling
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Manage drop-in day availability, view bookings, and configure rates per classroom.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{stat.value}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <DropInTabs activeTab={activeTab} />
    </div>
  )
}
