import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const syncSecret = Deno.env.get('SYNC_SECRET');
    if (syncSecret && request.headers.get('x-sync-secret') !== syncSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('DIGEST_FROM_EMAIL') ?? 'digest@citipilot.local';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: signups } = await supabase
      .from('digest_signups')
      .select('contact, channel')
      .eq('channel', 'email');

    const { data: events } = await supabase
      .from('events')
      .select('title, day_label, time_label, venue, neighborhood, slug')
      .eq('status', 'published')
      .contains('time_windows', ['weekend'])
      .order('trending_score', { ascending: false })
      .limit(8);

    const eventLines = (events ?? [])
      .map((e) => `• ${e.title} — ${e.day_label} ${e.time_label} @ ${e.venue} (${e.neighborhood})`)
      .join('\n');

    const body = `Your RVA weekend picks:\n\n${eventLines || 'Check Citipilot for fresh listings.'}\n\n— Citipilot`;

    let sent = 0;
    const errors: string[] = [];

    if (!resendKey) {
      return new Response(JSON.stringify({ sent: 0, errors: ['RESEND_API_KEY not configured'], preview: body }), {
        headers: corsHeaders,
      });
    }

    for (const signup of signups ?? []) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: signup.contact,
          subject: 'Your RVA weekend — Citipilot',
          text: body,
        }),
      });
      if (res.ok) sent += 1;
      else errors.push(`${signup.contact}: ${await res.text()}`);
    }

    return new Response(JSON.stringify({ sent, errors, recipients: signups?.length ?? 0 }), {
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: corsHeaders },
    );
  }
});
