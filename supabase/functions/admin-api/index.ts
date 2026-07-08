import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminSecret = Deno.env.get('ADMIN_SECRET');
    if (adminSecret && request.headers.get('x-admin-secret') !== adminSecret) {
      return unauthorized();
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const action = body.action ?? 'dashboard';

    if (action === 'verify') {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const [
      { count: totalPlaces },
      { count: activePlaces },
      { count: pendingPlaces },
      { count: eventCount },
      { data: pending },
      { data: active },
    ] = await Promise.all([
      supabase.from('business_places').select('*', { count: 'exact', head: true }),
      supabase
        .from('business_places')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('approved', true),
      supabase
        .from('business_places')
        .select('*', { count: 'exact', head: true })
        .eq('approved', false)
        .neq('status', 'canceled'),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase
        .from('business_places')
        .select('id, name, email, neighborhood, category, subcategory, status, approved, created_at')
        .eq('approved', false)
        .neq('status', 'canceled')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('business_places')
        .select('id, name, email, neighborhood, category, subcategory, status, approved, created_at, stripe_subscription_id')
        .eq('status', 'active')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    return new Response(
      JSON.stringify({
        stats: {
          totalPlaces: totalPlaces ?? 0,
          activePlaces: activePlaces ?? 0,
          pendingPlaces: pendingPlaces ?? 0,
          eventCount: eventCount ?? 0,
        },
        pending: pending ?? [],
        active: active ?? [],
      }),
      { headers: corsHeaders },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: corsHeaders },
    );
  }
});
