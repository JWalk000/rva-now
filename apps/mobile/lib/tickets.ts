import { buyerTotalCents, platformFeeCents } from '@/lib/ticketFees';
import type { Ticket, TicketType } from '@/types/ticket';

const baseUrl = () => process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = () => process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export { buyerTotalCents, platformFeeCents };

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function walletPassUrl(ticketCode: string): string {
  return `${baseUrl()}/functions/v1/wallet-pass?code=${encodeURIComponent(ticketCode)}`;
}

export async function fetchTicketTypes(eventSlug: string): Promise<TicketType[]> {
  const { getSupabase } = await import('@/lib/supabase');
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('ticket_types')
    .select('id, name, price_cents, quantity, sold_count, event_slug')
    .eq('event_slug', eventSlug)
    .eq('active', true);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    quantity: row.quantity,
    soldCount: row.sold_count,
    available: Math.max(0, row.quantity - row.sold_count),
    eventSlug: row.event_slug,
  }));
}

export async function fetchTicketsByEmail(email: string): Promise<Ticket[]> {
  const { getSupabase } = await import('@/lib/supabase');
  const supabase = getSupabase();
  if (!supabase || !email.trim()) return [];

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('buyer_email', email.trim())
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(mapTicket);
}

export async function fetchTicketByCode(code: string): Promise<Ticket | null> {
  const { getSupabase } = await import('@/lib/supabase');
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('tickets').select('*').eq('ticket_code', code).maybeSingle();
  if (error || !data) return null;
  return mapTicket(data);
}

function mapTicket(row: {
  id: string;
  ticket_code: string;
  event_slug: string;
  event_title: string;
  ticket_type_name: string;
  venue: string;
  event_day: string;
  event_time: string;
  buyer_email: string;
  status: string;
}): Ticket {
  return {
    id: row.id,
    ticketCode: row.ticket_code,
    eventSlug: row.event_slug,
    eventTitle: row.event_title,
    ticketTypeName: row.ticket_type_name,
    venue: row.venue,
    eventDay: row.event_day,
    eventTime: row.event_time,
    buyerEmail: row.buyer_email,
    status: row.status,
  };
}

export async function createTicketCheckout(
  ticketTypeId: string,
  quantity: number,
  buyerEmail: string,
  eventSlug: string,
): Promise<{ url: string; total: string }> {
  const res = await fetch(`${baseUrl()}/functions/v1/create-ticket-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey()}`,
    },
    body: JSON.stringify({
      ticket_type_id: ticketTypeId,
      quantity,
      buyer_email: buyerEmail,
      success_url: `rvanow://ticket-order?paid=1&event=${eventSlug}`,
      cancel_url: `rvanow://event/${eventSlug}?paid=0`,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Ticket checkout failed');
  return { url: json.url as string, total: json.total as string };
}

export async function createConnectLink(email: string): Promise<string> {
  const res = await fetch(`${baseUrl()}/functions/v1/create-connect-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey()}`,
    },
    body: JSON.stringify({
      email,
      return_url: 'rvanow://submit?connect=done',
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Connect setup failed');
  return json.url as string;
}
