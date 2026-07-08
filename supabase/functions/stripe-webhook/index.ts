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
