// @anchor: cca.notify.cron
// Cron: Daily email digest for parents who don't check the app

import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runEmailDigestForAllTenants } from '@/lib/cron/email-digest'

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const summary = await runEmailDigestForAllTenants()

    return NextResponse.json({ success: true, ...summary })
  } catch {
    return NextResponse.json({ error: 'Email digest failed' }, { status: 500 })
  }
}
