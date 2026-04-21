// @anchor: cca.documents.cron
// Cron: Check document expirations (60/30/7 day alerts)

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runDocumentExpiryCheckForAllTenants } from '@/lib/cron/document-expiry'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    console.log('[Cron] Document expiry check started')
    const summary = await runDocumentExpiryCheckForAllTenants()

    return NextResponse.json({
      success: true,
      message: 'Document expiry check complete',
      ...summary,
    })
  } catch (error) {
    console.error('[Cron] Document expiry check error:', error)
    return NextResponse.json({ error: 'Document expiry check failed' }, { status: 500 })
  }
}
