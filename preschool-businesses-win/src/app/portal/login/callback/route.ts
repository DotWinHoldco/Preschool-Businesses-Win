// @anchor: cca.auth.callback
// Auth callback route handler for magic link / OAuth.
// Exchanges the auth code for a session, then redirects to portal.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = 'https://oajfxyiqjqymuvevnoui.supabase.co'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/portal'

  if (!code) {
    // No code — redirect to login with error
    return NextResponse.redirect(
      new URL('/portal/login?error=missing_code', origin)
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] Code exchange failed:', error.message)
    return NextResponse.redirect(
      new URL('/portal/login?error=auth_failed', origin)
    )
  }

  // Redirect to portal entry (role-based routing handled by portal layout)
  return NextResponse.redirect(new URL(next, origin))
}
