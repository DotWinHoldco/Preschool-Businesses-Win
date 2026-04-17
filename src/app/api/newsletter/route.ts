import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (body.website) {
      return NextResponse.json({ success: true });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          tenant_id: TENANT_ID,
          email: email.toLowerCase().trim(),
          consent_at: new Date().toISOString(),
          source_page: 'home',
          ip_address: ip,
        },
        { onConflict: 'tenant_id,email' }
      );

    if (error) {
      console.error('Newsletter subscribe error:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Newsletter route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
