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
    const { firstName, lastName, email, message } = body;

    if (body.company) {
      return NextResponse.json({ success: true });
    }

    if (!email || !email.includes('@') || !message) {
      return NextResponse.json({ error: 'Email and message are required' }, { status: 400 });
    }

    const { error } = await supabase.from('enrollment_leads').insert({
      tenant_id: TENANT_ID,
      parent_first_name: firstName || null,
      parent_last_name: lastName || null,
      parent_email: email.toLowerCase().trim(),
      notes: message,
      source: 'marketing_contact_form',
      source_detail: '/contact',
      status: 'new',
      priority: 'medium',
    });

    if (error) {
      console.error('Contact form error:', error);
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
