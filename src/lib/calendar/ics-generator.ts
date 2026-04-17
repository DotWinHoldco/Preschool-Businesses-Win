// @anchor: cca.appointments.ics
// Minimal iCalendar (.ics) generator for appointment confirmations and
// add-to-calendar buttons. Conforms to RFC 5545.

export interface ICSEvent {
  uid: string
  summary: string
  description?: string
  location?: string
  start: Date
  end: Date
  organizerName?: string
  organizerEmail?: string
  attendeeName?: string
  attendeeEmail?: string
  url?: string
}

function formatICSDate(date: Date): string {
  const iso = date.toISOString()
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  // RFC 5545 says lines > 75 octets should be folded.
  if (line.length <= 75) return line
  const parts: string[] = []
  let remaining = line
  parts.push(remaining.slice(0, 75))
  remaining = remaining.slice(75)
  while (remaining.length > 0) {
    parts.push(' ' + remaining.slice(0, 74))
    remaining = remaining.slice(74)
  }
  return parts.join('\r\n')
}

export function generateICS(event: ICSEvent): string {
  const now = formatICSDate(new Date())

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Preschool Businesses Win//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(event.start)}`,
    `DTEND:${formatICSDate(event.end)}`,
    `SUMMARY:${escapeICS(event.summary)}`,
  ]

  if (event.description) lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
  if (event.location) lines.push(`LOCATION:${escapeICS(event.location)}`)
  if (event.url) lines.push(`URL:${escapeICS(event.url)}`)

  if (event.organizerName && event.organizerEmail) {
    lines.push(`ORGANIZER;CN=${escapeICS(event.organizerName)}:mailto:${event.organizerEmail}`)
  }

  if (event.attendeeName && event.attendeeEmail) {
    lines.push(
      `ATTENDEE;CN=${escapeICS(event.attendeeName)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${event.attendeeEmail}`,
    )
  }

  lines.push('STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR')

  return lines.map(foldLine).join('\r\n')
}

export function googleCalendarUrl(event: ICSEvent): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.summary,
    dates: `${fmt(event.start)}/${fmt(event.end)}`,
  })
  if (event.description) params.set('details', event.description)
  if (event.location) params.set('location', event.location)
  return `https://www.google.com/calendar/render?${params.toString()}`
}

export function outlookCalendarUrl(event: ICSEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.summary,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
  })
  if (event.description) params.set('body', event.description)
  if (event.location) params.set('location', event.location)
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}
