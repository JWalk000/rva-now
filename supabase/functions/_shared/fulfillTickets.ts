import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { buildTicketEmailHtml, sendTicketEmail, ticketEmailSubject } from './ticketEmail.ts';

function randomTicketCode(): string {
  const part = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `RVA-${part}`;
}

export async function fulfillTicketOrder(orderId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: order, error: orderError } = await supabase
    .from('ticket_orders')
    .select('id, ticket_type_id, event_slug, buyer_email, quantity, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) throw new Error('Order not found');
  if (order.status === 'paid') {
    const { data: existing } = await supabase.from('tickets').select('ticket_code').eq('order_id', orderId);
    return { tickets: existing ?? [], alreadyFulfilled: true };
  }

  const { data: ticketType } = await supabase
    .from('ticket_types')
    .select('name, sold_count, quantity')
    .eq('id', order.ticket_type_id)
    .single();

  const { data: event } = await supabase
    .from('events')
    .select('title, venue, day_label, time_label')
    .eq('slug', order.event_slug)
    .single();

  if (!ticketType || !event) throw new Error('Ticket type or event missing');
  if (ticketType.sold_count + order.quantity > ticketType.quantity) {
    throw new Error('Not enough tickets remaining');
  }

  const rows = Array.from({ length: order.quantity }, () => ({
    order_id: order.id,
    ticket_code: randomTicketCode(),
    event_slug: order.event_slug,
    event_title: event.title,
    ticket_type_name: ticketType.name,
    venue: event.venue,
    event_day: event.day_label,
    event_time: event.time_label,
    buyer_email: order.buyer_email,
    status: 'valid',
  }));

  const { data: tickets, error: ticketError } = await supabase.from('tickets').insert(rows).select('*');
  if (ticketError) throw ticketError;

  await supabase.from('ticket_orders').update({ status: 'paid' }).eq('id', orderId);
  await supabase
    .from('ticket_types')
    .update({ sold_count: ticketType.sold_count + order.quantity })
    .eq('id', order.ticket_type_id);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const walletBaseUrl = `${supabaseUrl}/functions/v1/wallet-pass`;
  const appBaseUrl = 'citipilot:/';

  const html = buildTicketEmailHtml(tickets ?? [], walletBaseUrl, appBaseUrl);
  const emailResult = await sendTicketEmail(
    order.buyer_email,
    ticketEmailSubject(event.title, order.quantity),
    html,
  );

  return { tickets: tickets ?? [], emailSent: emailResult.ok, emailError: emailResult.error };
}
