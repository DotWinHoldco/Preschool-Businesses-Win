// @anchor: cca.leads.detail
import { Phone, Mail, Calendar, MessageSquare, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface LeadActivity {
  id: string
  activity_type: string
  description: string
  performed_at: string
  performed_by_name?: string
}

interface LeadDetailProps {
  lead: {
    id: string
    parent_first_name: string
    parent_last_name: string
    parent_email: string | null
    parent_phone: string | null
    child_name: string | null
    child_age_months: number | null
    program_interest: string | null
    status: string
    priority: string
    source: string
    source_detail: string | null
    notes: string | null
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    created_at: string
  }
  activities: LeadActivity[]
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  email_sent: Mail,
  call_made: Phone,
  call_received: Phone,
  tour_scheduled: Calendar,
  tour_completed: CheckCircle,
  application_sent: MessageSquare,
  note_added: MessageSquare,
  status_changed: Clock,
}

export function LeadDetail({ lead, activities }: LeadDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-foreground)]">
              {lead.parent_first_name} {lead.parent_last_name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {lead.parent_email && (
                <a
                  href={`mailto:${lead.parent_email}`}
                  className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" /> {lead.parent_email}
                </a>
              )}
              {lead.parent_phone && (
                <a
                  href={`tel:${lead.parent_phone}`}
                  className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" /> {lead.parent_phone}
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium',
                lead.priority === 'hot' &&
                  'bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]',
                lead.priority === 'warm' &&
                  'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
                lead.priority === 'cold' &&
                  'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]',
              )}
            >
              {lead.priority}
            </span>
            <span className="rounded-full bg-[var(--color-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
              {lead.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Lead info */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">Details</h3>
            <dl className="space-y-2.5 text-sm">
              {lead.child_name && (
                <div>
                  <dt className="text-xs text-[var(--color-muted-foreground)]">Child</dt>
                  <dd className="font-medium text-[var(--color-foreground)]">{lead.child_name}</dd>
                </div>
              )}
              {lead.child_age_months !== null && (
                <div>
                  <dt className="text-xs text-[var(--color-muted-foreground)]">Age</dt>
                  <dd className="font-medium text-[var(--color-foreground)]">
                    {lead.child_age_months} months
                  </dd>
                </div>
              )}
              {lead.program_interest && (
                <div>
                  <dt className="text-xs text-[var(--color-muted-foreground)]">Program interest</dt>
                  <dd className="font-medium text-[var(--color-foreground)]">
                    {lead.program_interest}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[var(--color-muted-foreground)]">Source</dt>
                <dd className="font-medium text-[var(--color-foreground)]">
                  {lead.source}
                  {lead.source_detail ? ` - ${lead.source_detail}` : ''}
                </dd>
              </div>
              {lead.utm_source && (
                <div>
                  <dt className="text-xs text-[var(--color-muted-foreground)]">Campaign</dt>
                  <dd className="text-xs text-[var(--color-foreground)]">
                    {lead.utm_source} / {lead.utm_medium} / {lead.utm_campaign}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[var(--color-muted-foreground)]">Created</dt>
                <dd className="font-medium text-[var(--color-foreground)]">
                  {new Date(lead.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {lead.notes && (
            <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">Notes</h3>
              <p className="text-sm text-[var(--color-muted-foreground)] whitespace-pre-line">
                {lead.notes}
              </p>
            </div>
          )}
        </div>

        {/* Activity timeline */}
        <div className="md:col-span-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">
            Activity Timeline
          </h3>

          {activities.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)] text-center py-8">
              No activity yet
            </p>
          ) : (
            <div className="relative space-y-4">
              <div className="absolute left-[15px] top-0 bottom-0 w-px bg-[var(--color-border)]" />
              {activities.map((activity) => {
                const Icon = activityIcons[activity.activity_type] ?? MessageSquare
                return (
                  <div key={activity.id} className="relative flex gap-3 pl-0">
                    <div className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)]">
                      <Icon className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm text-[var(--color-foreground)]">
                        {activity.description}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {new Date(activity.performed_at).toLocaleString()}
                        </span>
                        {activity.performed_by_name && (
                          <span className="text-xs text-[var(--color-muted-foreground)]">
                            by {activity.performed_by_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
