// @anchor: cca.family.tree-view
// Visual relationship tree for blended families.
// Shows which parents/guardians are connected to which students across households.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface FamilyMemberData {
  id: string
  first_name: string
  last_name: string
  relationship_type: string
  relationship_label?: string | null
  is_primary_contact: boolean
  is_billing_responsible: boolean
  can_pickup_default: boolean
  phone?: string | null
  email?: string | null
}

export interface LinkedStudentData {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  enrollment_status: string
  billing_split_pct?: number | null
  is_primary_family?: boolean
}

export interface FamilyTreeViewProps {
  familyName: string
  members: FamilyMemberData[]
  students: LinkedStudentData[]
  className?: string
}

function formatRelationship(type: string, label?: string | null): string {
  if (label) return label
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function FamilyTreeView({ familyName, members, students, className }: FamilyTreeViewProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{familyName} Family</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Parents / Guardians */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Parents &amp; Guardians
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-sm font-semibold text-[var(--color-muted-foreground)]">
                    {member.first_name[0]}
                    {member.last_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {formatRelationship(member.relationship_type, member.relationship_label)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {member.is_primary_contact && (
                        <Badge variant="default" size="sm">
                          Primary
                        </Badge>
                      )}
                      {member.is_billing_responsible && (
                        <Badge variant="outline" size="sm">
                          Billing
                        </Badge>
                      )}
                      {member.can_pickup_default && (
                        <Badge variant="success" size="sm">
                          Pickup
                        </Badge>
                      )}
                    </div>
                    {(member.phone || member.email) && (
                      <div className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                        {member.phone && <span>{member.phone}</span>}
                        {member.phone && member.email && <span> · </span>}
                        {member.email && <span>{member.email}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)] col-span-2">
                  No members linked to this family yet
                </p>
              )}
            </div>
          </div>

          {/* Connecting line visual */}
          {members.length > 0 && students.length > 0 && (
            <div className="flex justify-center">
              <div className="h-6 w-px bg-[var(--color-border)]" />
            </div>
          )}

          {/* Students */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Children
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {students.map((student) => (
                <a
                  key={student.id}
                  href={`/portal/admin/students/${student.id}`}
                  className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] p-3 transition-colors hover:bg-[var(--color-muted)]/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-semibold text-[var(--color-primary)]">
                    {student.first_name[0]}
                    {student.last_name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">
                      {student.first_name} {student.last_name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                      <Badge
                        variant={student.enrollment_status === 'active' ? 'success' : 'outline'}
                        size="sm"
                      >
                        {student.enrollment_status}
                      </Badge>
                      {student.billing_split_pct != null && student.billing_split_pct < 100 && (
                        <span>{student.billing_split_pct}% billing</span>
                      )}
                      {student.is_primary_family && (
                        <Badge variant="default" size="sm">
                          Primary
                        </Badge>
                      )}
                    </div>
                  </div>
                </a>
              ))}
              {students.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)] col-span-2">
                  No students linked to this family yet
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
