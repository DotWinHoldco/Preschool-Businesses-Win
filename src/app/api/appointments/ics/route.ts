// @anchor: cca.appointments.ics-download
// Public .ics file generator — used by "Add to Calendar (Apple)" button.

import { NextRequest, NextResponse } from 'next/server'
import { generateICS } from '@/lib/calendar/ics-generator'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const start = params.get('start')
  const end = params.get('end')
  const title = params.get('title') ?? 'Appointment'
  const location = params.get('location') ?? ''
  const description = params.get('description') ?? ''

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end required' }, { status: 400 })
  }

  const ics = generateICS({
    uid: `appt-${Date.now()}@preschool.businesses.win`,
    summary: title,
    description,
    location,
    start: new Date(start),
    end: new Date(end),
  })

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="appointment.ics"',
    },
  })
}
