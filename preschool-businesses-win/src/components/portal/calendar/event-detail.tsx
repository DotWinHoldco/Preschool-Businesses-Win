'use client'

// @anchor: cca.calendar.event-detail
// Event detail with RSVP and sign-up options
// See CCA_BUILD_BRIEF.md §36

import { Calendar, MapPin, Users, Clock, Tag } from 'lucide-react'

interface EventDetailProps {
  event: {
    id: string
    title: string
    description: string | null
    event_type: string
    start_at: string
    end_at: string
    all_day: boolean
    location: string | null
    scope: string
    requires_rsvp: boolean
    max_participants: number | null
    cost_per_child_cents: number | null
    rsvp_count?: number
    user_rsvp?: 'yes' | 'no' | 'maybe' | null
  }
  onRSVP?: (response: 'yes' | 'no' | 'maybe') => void
}

export function EventDetail({ event, onRSVP }: EventDetailProps) {
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <div className="p-6 space-y-4">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium uppercase tracking-wide rounded-full px-2.5 py-0.5"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            {event.event_type.replace(/_/g, ' ')}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            {event.scope.replace(/_/g, ' ')}
          </span>
        </div>

        <h2 className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>{event.title}</h2>

        {/* Meta info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-foreground)' }}>
            <Calendar size={16} style={{ color: 'var(--color-muted-foreground)' }} />
            {event.all_day
              ? formatDate(event.start_at)
              : `${formatDate(event.start_at)}`}
          </div>
          {!event.all_day && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-foreground)' }}>
              <Clock size={16} style={{ color: 'var(--color-muted-foreground)' }} />
              {formatTime(event.start_at)} - {formatTime(event.end_at)}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-foreground)' }}>
              <MapPin size={16} style={{ color: 'var(--color-muted-foreground)' }} />
              {event.location}
            </div>
          )}
          {event.max_participants && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-foreground)' }}>
              <Users size={16} style={{ color: 'var(--color-muted-foreground)' }} />
              {event.rsvp_count ?? 0} / {event.max_participants} spots filled
            </div>
          )}
          {event.cost_per_child_cents != null && event.cost_per_child_cents > 0 && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-foreground)' }}>
              <Tag size={16} style={{ color: 'var(--color-muted-foreground)' }} />
              ${(event.cost_per_child_cents / 100).toFixed(2)} per child
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-foreground)' }}>
              {event.description}
            </p>
          </div>
        )}

        {/* RSVP buttons */}
        {event.requires_rsvp && onRSVP && (
          <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-foreground)' }}>
              Will you attend?
            </p>
            <div className="flex gap-2">
              {(['yes', 'no', 'maybe'] as const).map((response) => (
                <button
                  key={response}
                  onClick={() => onRSVP(response)}
                  className="flex-1 rounded-md py-2 text-sm font-medium border transition-colors"
                  style={{
                    backgroundColor: event.user_rsvp === response ? 'var(--color-primary)' : 'transparent',
                    color: event.user_rsvp === response ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
                    borderColor: event.user_rsvp === response ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                >
                  {response === 'yes' ? 'Yes' : response === 'no' ? 'No' : 'Maybe'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
