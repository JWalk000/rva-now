import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { fulfillTicketOrder } from '../_shared/fulfillTickets.ts';

async function verifyStripeSignature(body: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const parts = Object.fromEntries(signature.split(',').map((p) => p.split('=') as [string, string]));
  const timestamp = parts.t;
  const sig = parts.v1;
  if (!timestamp || !sig) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === sig;
}

function meta(session: { metadata?: Record<string, string> }, key: string) {
  return session.metadata?.[key] ?? '';
}

async function upsertBusinessPlaceFromSession(
  supabase: ReturnType<typeof createClient>,
  session: {
    id: string;
    customer?: string;
    subscription?: string;
    metadata?: Record<string, string>;
  },
) {
  const placeId = meta(session, 'place_id') || meta(session, 'submission_id');
  if (!placeId) return null;

  const now = new Date().toISOString();
  const row = {
    id: placeId,
    name: meta(session, 'place_name'),
    category: meta(session, 'place_category') || 'eat',
    subcategory: meta(session, 'place_subcategory') || '',
    neighborhood: meta(session, 'place_neighborhood') || 'Downtown',
    description: meta(session, 'place_description') || '',
    email: meta(session, 'place_email'),
    website: meta(session, 'place_website') || null,
    address: meta(session, 'place_address') || null,
    emoji: meta(session, 'place_emoji') || '📍',
    lat: Number(meta(session, 'place_lat')) || 37.5407,
    lng: Number(meta(session, 'place_lng')) || -77.436,
    stripe_subscription_id: session.subscription ?? null,
    stripe_customer_id: session.customer ?? null,
    stripe_session_id: session.id,
    status: 'active',
    approved: true,
    updated_at: now,
  };

  const { error } = await supabase.from('business_places').upsert(row);
  if (error) throw error;
  return placeId;
}

async function cancelBusinessPlaceBySubscription(
  supabase: ReturnType<typeof createClient>,
  subscriptionId: string,
) {
  const now = new Date().toISOString();
  await supabase
    .from('business_places')
    .update({ status: 'canceled', approved: false, updated_at: now })
    .eq('stripe_subscription_id', subscriptionId);
}

Deno.serve(async (request) => {
  try {
    const body = await request.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (webhookSecret) {
      const valid = await verifyStripeSignature(body, request.headers.get('stripe-signature'), webhookSecret);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (event.type === 'account.updated') {
      const account = event.data.object;
      await supabase
        .from('organizer_accounts')
        .update({
          charges_enabled: account.charges_enabled ?? false,
          payouts_enabled: account.payouts_enabled ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_account_id', account.id);

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await cancelBusinessPlaceBySubscription(supabase, subscription.id);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const active = ['active', 'trialing'].includes(subscription.status);
      if (!active) {
        await cancelBusinessPlaceBySubscription(supabase, subscription.id);
      } else {
        const now = new Date().toISOString();
        await supabase
          .from('business_places')
          .update({ status: 'active', approved: true, updated_at: now })
          .eq('stripe_subscription_id', subscription.id);
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const checkoutType = session.metadata?.checkout_type;

      if (checkoutType === 'ticket') {
        const orderId = session.metadata?.ticket_order_id;
        if (!orderId) {
          return new Response(JSON.stringify({ error: 'No ticket_order_id' }), { status: 400 });
        }

        const result = await fulfillTicketOrder(orderId);
        return new Response(JSON.stringify({ ok: true, ...result }), { status: 200 });
      }

      if (checkoutType === 'place' || checkoutType === 'place_monthly') {
        const placeId = await upsertBusinessPlaceFromSession(supabase, session);
        return new Response(JSON.stringify({ ok: true, place_id: placeId }), { status: 200 });
      }

      const submissionId = session.metadata?.submission_id;
      if (!submissionId) {
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      await supabase
        .from('event_submissions')
        .update({ payment_status: 'paid' })
        .eq('id', submissionId);

      const { data: slug, error } = await supabase.rpc('publish_submission', { submission_id: submissionId });
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, published_slug: slug }), { status: 200 });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Webhook failed' }),
      { status: 500 },
    );
  }
});
