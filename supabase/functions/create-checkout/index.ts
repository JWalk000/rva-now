import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICES: Record<string, { amount: number; name: string; mode: 'payment' | 'subscription'; checkoutType: string }> = {
  featured: {
    amount: 2500,
    name: 'Citipilot Featured Listing',
    mode: 'payment',
    checkoutType: 'listing',
  },
  subscription: {
    amount: 5000,
    name: 'Citipilot Business Subscription (monthly)',
    mode: 'subscription',
    checkoutType: 'listing',
  },
  // Business place listing on the map / Around Town — $5/mo
  place_monthly: {
    amount: 500,
    name: 'Citipilot Place Listing (monthly)',
    mode: 'subscription',
    checkoutType: 'place',
  },
  business_place: {
    amount: 500,
    name: 'Citipilot Place Listing (monthly)',
    mode: 'subscription',
    checkoutType: 'place',
  },
};

function buildCheckoutParams(
  tier: string,
  price: { amount: number; name: string; mode: 'payment' | 'subscription'; checkoutType: string },
  submission_id: string,
  success_url?: string,
  cancel_url?: string,
) {
  const params = new URLSearchParams({
    mode: price.mode,
    success_url: success_url ?? 'https://citipilot.local/success',
    cancel_url: cancel_url ?? 'https://citipilot.local/cancel',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': price.name,
    'line_items[0][price_data][unit_amount]': String(price.amount),
    'line_items[0][quantity]': '1',
    'metadata[checkout_type]': price.checkoutType,
    'metadata[submission_id]': submission_id,
    'metadata[tier]': tier,
  });
  if (price.mode === 'subscription') {
    params.set('line_items[0][price_data][recurring][interval]', 'month');
  }
  return params;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }), {
        status: 503,
        headers: corsHeaders,
      });
    }

    const { submission_id, tier, success_url, cancel_url } = await request.json();
    const price = PRICES[tier as string];
    if (!submission_id || !price) {
      return new Response(JSON.stringify({ error: 'submission_id and valid tier required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Dynamic price_data works with both sk_test_ and sk_live_ (no pre-made Price IDs needed)
    const params = buildCheckoutParams(tier, price, submission_id, success_url, cancel_url);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) throw new Error(session.error?.message ?? 'Stripe error');

    // Event listing tiers mark submissions pending; place subscriptions are client-tracked.
    if (price.checkoutType === 'listing') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      await supabase
        .from('event_submissions')
        .update({ payment_status: 'pending', stripe_session_id: session.id })
        .eq('id', submission_id);
    }

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: corsHeaders },
    );
  }
});
