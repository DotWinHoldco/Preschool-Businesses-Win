// @anchor: cca.documents.cron
// Cron: Check document expirations (60/30/7 day alerts)

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  // TODO: Query documents with approaching expiry_date
  // Alert admin + entity owner
  console.log('[Cron] Document expiry check')
  return NextResponse.json({ success: true })
}
