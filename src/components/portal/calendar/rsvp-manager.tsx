// @anchor: cca.calendar.rsvp-manager
// Admin view for tracking RSVPs on calendar events

import { Check, X, HelpCircle } from 'lucide-react'

interface RSVPEntry {
  id: string
  family_name: string
  student_name: string | null
  response: 'yes' | 'no' | 'maybe'
  responded_at: string
}

interface RSVPManagerProps {
  eventTitle: string
  rsvps: RSVPEntry[]
  maxParticipants?: number | null
}

export function RSVPManager({ eventTitle, rsvps, maxParticipants }: RSVPManagerProps) {
  const yesCount = rsvps.filter((r) => r.response === 'yes').length
  const noCount = rsvps.filter((r) => r.response === 'no').length
  const maybeCount = rsvps.filter((r) => r.response === 'maybe').length

  const RESPONSE_CONFIG = {
    yes: { icon: Check, color: 'var(--color-success, #10B981)', label: 'Attending' },
    no: { icon: X, color: 'var(--color-destructive)', label: 'Not Attending' },
    maybe: { icon: HelpCircle, color: 'var(--color-warning)', label: 'Maybe' },
  }

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
          RSVP Responses - {eventTitle}
        </h3>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-sm" style={{ color: 'var(--color-success, #10B981)' }}>
            {yesCount} Yes
          </span>
          <span className="text-sm" style={{ color: 'var(--color-destructive)' }}>
            {noCount} No
          </span>
          <span className="text-sm" style={{ color: 'var(--color-warning)' }}>
            {maybeCount} Maybe
          </span>
          {maxParticipants && (
            <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              ({yesCount}/{maxParticipants} spots)
            </span>
          )}
        </div>
      </div>
      {rsvps.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No responses yet.
          </p>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {rsvps.map((rsvp) => {
            const config = RESPONSE_CONFIG[rsvp.response]
            const Icon = config.icon
            return (
              <li key={rsvp.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: config.color, color: 'white' }}
                >
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {rsvp.family_name}
                  </p>
                  {rsvp.student_name && (
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {rsvp.student_name}
                    </p>
                  )}
                </div>
                <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  {new Date(rsvp.responded_at).toLocaleDateString()}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
