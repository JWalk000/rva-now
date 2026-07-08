import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { buyerTotalCents, formatUsd, platformFeeCents } from '../_shared/ticketFees.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { ticket_type_id, quantity = 1, buyer_email, success_url, cancel_url } = await request.json();
    const qty = Math.max(1, Math.min(10, Number(quantity) || 1));

    if (!ticket_type_id || !buyer_email) {
      return new Response(JSON.stringify({ error: 'ticket_type_id and buyer_email required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: ticketType, error: typeError } = await supabase
      .from('ticket_types')
      .select('id, name, price_cents, quantity, sold_count, event_slug, submission_id, active')
      .eq('id', ticket_type_id)
      .single();

    if (typeError || !ticketType || !ticketType.active || !ticketType.event_slug) {
      return new Response(JSON.stringify({ error: 'Ticket type not available' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (ticketType.sold_count + qty > ticketType.quantity) {
      return new Response(JSON.stringify({ error: 'Not enough tickets left' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { data: submission } = await supabase
      .from('event_submissions')
      .select('email')
      .eq('id', ticketType.submission_id)
      .single();

    if (!submission?.email) {
      return new Response(JSON.stringify({ error: 'Organizer not found' }), { status: 400, headers: corsHeaders });
    }

    const { data: organizer } = await supabase
      .from('organizer_accounts')
      .select('stripe_account_id, charges_enabled')
      .eq('email', submission.email.trim().toLowerCase())
      .maybeSingle();

    if (!organizer?.stripe_account_id || !organizer.charges_enabled) {
      return new Response(
        JSON.stringify({ error: 'Organizer has not finished Stripe payout setup yet', needs_connect: true }),
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: event } = await supabase
      .from('events')
      .select('title, sells_tickets, source_platform')
      .eq('slug', ticketType.event_slug)
      .single();

    if (!event?.sells_tickets || event.source_platform !== 'submission') {
      return new Response(JSON.stringify({ error: 'This event does not sell tickets on RVA Now' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const subtotalCents = ticketType.price_cents * qty;
    const feeCents = platformFeeCents(subtotalCents);
    const totalCents = buyerTotalCents(ticketType.price_cents, qty);

    const { data: order, error: orderError } = await supabase
      .from('ticket_orders')
      .insert({
        ticket_type_id: ticketType.id,
        event_slug: ticketType.event_slug,
        buyer_email: String(buyer_email).trim(),
        quantity: qty,
        subtotal_cents: subtotalCents,
        platform_fee_cents: feeCents,
        total_cents: totalCents,
        status: 'pending',
      })
      .select('id')
      .single();

    if (orderError || !order) throw orderError ?? new Error('Could not create order');

    const params = new URLSearchParams({
      mode: 'payment',
      customer_email: String(buyer_email).trim(),
      success_url: success_url ?? `rvanow://ticket-order?paid=1&order=${order.id}`,
      cancel_url: cancel_url ?? `rvanow://event/${ticketType.event_slug}?paid=0`,
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': `${event.title} — ${ticketType.name}`,
      'line_items[0][price_data][unit_amount]': String(ticketType.price_cents),
      'line_items[0][quantity]': String(qty),
      'line_items[1][price_data][currency]': 'usd',
      'line_items[1][price_data][product_data][name]': 'RVA Now service fee',
      'line_items[1][price_data][unit_amount]': String(feeCents),
      'line_items[1][quantity]': '1',
      'payment_intent_data[application_fee_amount]': String(feeCents),
      'payment_intent_data[transfer_data][destination]': organizer.stripe_account_id,
      'metadata[checkout_type]': 'ticket',
      'metadata[ticket_order_id]': order.id,
      'metadata[event_slug]': ticketType.event_slug,
    });

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

    await supabase.from('ticket_orders').update({ stripe_session_id: session.id }).eq('id', order.id);

    return new Response(
      JSON.stringify({
        url: session.url,
        session_id: session.id,
        order_id: order.id,
        subtotal: formatUsd(subtotalCents),
        fee: formatUsd(feeCents),
        total: formatUsd(totalCents),
      }),
      { headers: corsHeaders },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Checkout failed' }),
      { status: 500, headers: corsHeaders },
    );
  }
});
