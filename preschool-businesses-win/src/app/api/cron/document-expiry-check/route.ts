// @anchor: cca.documents.cron
// Cron: Check document expirations (60/30/7 day alerts)

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Query documents with approaching expiry_date
  // Alert admin + entity owner
  console.log('[Cron] Document expiry check')
  return NextResponse.json({ success: true })
}
