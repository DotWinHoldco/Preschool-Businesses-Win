// @anchor: cca.family.parent-children-page
// Parent view of their children — overview cards with quick actions.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, Heart, BookOpen, FileText, ChevronRight } from 'lucide-react'

export default function ParentChildrenPage() {
  // TODO: Fetch children from Supabase for the current parent's family
  const children = [
    {
      id: 's1',
      name: 'Sophia Martinez',
      age: '4 years',
      classroom: 'Butterfly Room',
      teacher: 'Mrs. Johnson',
      status: 'checked-in',
      checkedInAt: '7:42 AM',
      allergies: ['Peanuts (severe)'],
    },
    {
      id: 's2',
      name: 'Lucas Martinez',
      age: '2 years',
      classroom: 'Sunshine Room',
      teacher: 'Ms. Davis',
      status: 'checked-in',
      checkedInAt: '7:45 AM',
      allergies: [],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          My Children
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          View your children&apos;s profiles, daily reports, and medical information.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {children.map((child) => (
          <a key={child.id} href={`/portal/parent/children/${child.id}`} className="block">
            <Card className="h-full transition-transform hover:scale-[1.01]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                  >
                    {child.name.charAt(0)}
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                </div>
                <CardTitle className="mt-2">{child.name}</CardTitle>
                <CardDescription>
                  {child.age} &middot; {child.classroom} &middot; {child.teacher}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: child.status === 'checked-in'
                          ? 'var(--color-success, #10B981)'
                          : 'var(--color-muted-foreground)',
                      }}
                    />
                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {child.status === 'checked-in'
                        ? `Checked in at ${child.checkedInAt}`
                        : 'Not checked in'}
                    </span>
                  </div>
                  {child.allergies.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Heart size={12} style={{ color: 'var(--color-destructive, #EF4444)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--color-destructive, #EF4444)' }}>
                        {child.allergies.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
                  >
                    <FileText size={10} /> Daily Reports
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}
                  >
                    <BookOpen size={10} /> Portfolio
                  </span>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
