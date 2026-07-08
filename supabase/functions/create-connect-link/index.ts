import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function stripePost(path: string, params: URLSearchParams) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured');

  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? 'Stripe error');
  return json;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email, return_url } = await request.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'email required' }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const normalizedEmail = String(email).trim().toLowerCase();
    let { data: account } = await supabase
      .from('organizer_accounts')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!account?.stripe_account_id) {
      const created = await stripePost(
        'accounts',
        new URLSearchParams({
          type: 'express',
          email: normalizedEmail,
          'capabilities[card_payments][requested]': 'true',
          'capabilities[transfers][requested]': 'true',
          'business_profile[product_description]': 'Citipilot event organizer',
        }),
      );

      const { data: inserted, error } = await supabase
        .from('organizer_accounts')
        .upsert(
          { email: normalizedEmail, stripe_account_id: created.id },
          { onConflict: 'email' },
        )
        .select('*')
        .single();

      if (error) throw error;
      account = inserted;
    }

    const link = await stripePost(
      'account_links',
      new URLSearchParams({
        account: account.stripe_account_id,
        refresh_url: return_url ?? 'citipilot://submit?connect=refresh',
        return_url: return_url ?? 'citipilot://submit?connect=done',
        type: 'account_onboarding',
      }),
    );

    return new Response(JSON.stringify({ url: link.url, stripe_account_id: account.stripe_account_id }), {
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: corsHeaders },
    );
  }
});
