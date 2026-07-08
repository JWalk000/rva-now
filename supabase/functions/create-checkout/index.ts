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

type PlaceMeta = {
  name?: string;
  category?: string;
  subcategory?: string;
  neighborhood?: string;
  description?: string;
  email?: string;
  website?: string;
  address?: string;
  emoji?: string;
  lat?: number;
  lng?: number;
};

function appendPlaceMetadata(params: URLSearchParams, placeId: string, place?: PlaceMeta) {
  params.set('metadata[place_id]', placeId);
  if (!place) return;
  const fields: Array<[string, string | undefined]> = [
    ['place_name', place.name],
    ['place_category', place.category],
    ['place_subcategory', place.subcategory],
    ['place_neighborhood', place.neighborhood],
    ['place_description', place.description],
    ['place_email', place.email],
    ['place_website', place.website],
    ['place_address', place.address],
    ['place_emoji', place.emoji],
    ['place_lat', place.lat != null ? String(place.lat) : undefined],
    ['place_lng', place.lng != null ? String(place.lng) : undefined],
  ];
  for (const [key, value] of fields) {
    if (value != null && value !== '') {
      params.set(`metadata[${key}]`, value.slice(0, 500));
    }
  }
}

function buildCheckoutParams(
  tier: string,
  price: { amount: number; name: string; mode: 'payment' | 'subscription'; checkoutType: string },
  submission_id: string,
  success_url?: string,
  cancel_url?: string,
  place?: PlaceMeta,
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
  if (price.checkoutType === 'place') {
    appendPlaceMetadata(params, submission_id, place);
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

    const { submission_id, tier, success_url, cancel_url, place } = await request.json();
    const price = PRICES[tier as string];
    if (!submission_id || !price) {
      return new Response(JSON.stringify({ error: 'submission_id and valid tier required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (price.checkoutType === 'place' && (!place?.name || !place?.email)) {
      return new Response(JSON.stringify({ error: 'place name and email required for place checkout' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const params = buildCheckoutParams(tier, price, submission_id, success_url, cancel_url, place);

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

    if (price.checkoutType === 'place' && place) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      const now = new Date().toISOString();
      await supabase.from('business_places').upsert({
        id: submission_id,
        name: place.name,
        category: place.category ?? 'eat',
        subcategory: place.subcategory ?? '',
        neighborhood: place.neighborhood ?? 'Downtown',
        description: place.description ?? '',
        email: place.email,
        website: place.website ?? null,
        address: place.address ?? null,
        emoji: place.emoji ?? '📍',
        lat: place.lat ?? 37.5407,
        lng: place.lng ?? -77.436,
        stripe_session_id: session.id,
        status: 'pending',
        approved: false,
        updated_at: now,
      });
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
