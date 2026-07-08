import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminSecret = Deno.env.get('ADMIN_SECRET');
    if (adminSecret && request.headers.get('x-admin-secret') !== adminSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { place_id, action } = await request.json();
    if (!place_id || !['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ error: 'place_id and action (approve|reject) required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const now = new Date().toISOString();

    if (action === 'reject') {
      const { error } = await supabase
        .from('business_places')
        .update({ approved: false, status: 'canceled', updated_at: now })
        .eq('id', place_id);
      if (error) throw error;
      return new Response(JSON.stringify({ status: 'rejected' }), { headers: corsHeaders });
    }

    const { error } = await supabase
      .from('business_places')
      .update({ approved: true, status: 'active', updated_at: now })
      .eq('id', place_id);
    if (error) throw error;

    return new Response(JSON.stringify({ status: 'approved' }), { headers: corsHeaders });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: corsHeaders },
    );
  }
});
