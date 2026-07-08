import { events as localEvents, lists as localLists } from '@/lib/data';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type {
  CuratedList,
  DigestSignup,
  EventSubmission,
  EventSourceType,
  PromotionTier,
  RvaEvent,
  SourcePlatform,
  SubmissionStatus,
  TimeWindow,
} from '@/types/event';
import type { TicketTypeInput } from '@/types/ticket';

type DbEvent = Database['public']['Tables']['events']['Row'];
type DbList = Database['public']['Tables']['curated_lists']['Row'];
type DbSubmission = Database['public']['Tables']['event_submissions']['Row'];

function mapEvent(row: DbEvent): RvaEvent {
  return {
    id: row.slug,
    title: row.title,
    neighborhood: row.neighborhood,
    vibe: row.vibes,
    day: row.day_label,
    time: row.time_label,
    venue: row.venue,
    price: row.price,
    featured: row.featured,
    hiddenGem: row.hidden_gem,
    sponsored: row.sponsored,
    trendingScore: row.trending_score,
    when: row.time_windows as TimeWindow[],
    source: row.source,
    sourceType: row.source_type as EventSourceType,
    sourcePlatform: (row.source_platform ?? 'manual') as SourcePlatform,
    sourceUrl: row.source_url,
    ticketUrl: row.ticket_url,
    externalId: row.external_id,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    sellsTickets: row.sells_tickets ?? false,
    submissionId: row.submission_id ?? null,
  };
}

function mapList(row: DbList & { event_slugs?: string[] }): CuratedList {
  return {
    id: row.id,
    title: row.title,
    by: row.by_line,
    description: row.description,
    items: row.items,
    eventSlugs: row.event_slugs ?? [],
  };
}

function mapSubmission(row: DbSubmission): EventSubmission {
  return {
    id: row.id,
    title: row.title,
    neighborhood: row.neighborhood,
    dateTime: row.date_time,
    venue: row.venue,
    email: row.email,
    tier: row.tier as PromotionTier,
    pitch: row.pitch,
    submittedAt: row.created_at,
    status: row.status as SubmissionStatus,
    paymentStatus: row.payment_status ?? 'unpaid',
    publishedSlug: row.published_slug,
    ticketingEnabled: row.ticketing_enabled ?? false,
  };
}

type FetchSource = 'supabase' | 'local';

export async function fetchPublishedEvents(): Promise<{ events: RvaEvent[]; source: FetchSource }> {
  const supabase = getSupabase();
  if (!supabase) return { events: localEvents, source: 'local' };

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('trending_score', { ascending: false });

  if (error || !data?.length) {
    console.warn('[RVA Now] Using local events fallback:', error?.message);
    return { events: localEvents, source: 'local' };
  }

  return { events: data.map(mapEvent), source: 'supabase' };
}

export async function fetchCuratedLists(): Promise<{ lists: CuratedList[]; source: FetchSource }> {
  const supabase = getSupabase();
  if (!supabase) return { lists: localLists, source: 'local' };

  const { data, error } = await supabase
    .from('curated_lists')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    console.warn('[RVA Now] Using local lists fallback:', error?.message);
    return { lists: localLists, source: 'local' };
  }

  return { lists: data.map(mapList), source: 'supabase' };
}

export async function fetchSubmissionsByEmail(email: string): Promise<EventSubmission[]> {
  const supabase = getSupabase();
  if (!supabase || !email.trim()) return [];

  const { data, error } = await supabase
    .from('event_submissions')
    .select(
      'id, title, neighborhood, date_time, venue, email, tier, pitch, status, payment_status, published_slug, ticketing_enabled, created_at',
    )
    .eq('email', email.trim())
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) {
    console.warn('[RVA Now] Could not load submissions:', error?.message);
    return [];
  }

  return data.map(mapSubmission);
}

export async function createDigestSignup(contact: string, channel: 'email' | 'sms'): Promise<DigestSignup> {
  const signedUpAt = new Date().toISOString();
  const supabase = getSupabase();

  if (supabase) {
    const { error } = await supabase.from('digest_signups').insert({ contact, channel });
    if (error && !error.message.includes('duplicate')) {
      throw new Error(error.message);
    }
  }

  return { contact, channel, signedUpAt };
}

export async function createEventSubmission(
  input: Omit<EventSubmission, 'id' | 'submittedAt'> & {
    ticketTypes?: TicketTypeInput[];
  },
): Promise<EventSubmission> {
  const submittedAt = new Date().toISOString();
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from('event_submissions')
      .insert({
        title: input.title,
        neighborhood: input.neighborhood,
        date_time: input.dateTime,
        venue: input.venue,
        email: input.email,
        tier: input.tier,
        pitch: input.pitch,
        ticketing_enabled: input.ticketingEnabled ?? false,
      })
      .select(
        'id, title, neighborhood, date_time, venue, email, tier, pitch, status, payment_status, published_slug, ticketing_enabled, created_at',
      )
      .single();

    if (error) throw new Error(error.message);

    if (input.ticketingEnabled && input.ticketTypes?.length) {
      const rows = input.ticketTypes.map((t) => ({
        submission_id: data.id,
        name: t.name,
        price_cents: t.priceCents,
        quantity: t.quantity,
      }));
      const { error: ticketError } = await supabase.from('ticket_types').insert(rows);
      if (ticketError) throw new Error(ticketError.message);
    }

    return mapSubmission(data);
  }

  return {
    ...input,
    id: `sub-${Date.now()}`,
    submittedAt,
    status: 'pending',
    paymentStatus: 'unpaid',
  };
}

export async function searchEventsRemote(query: string): Promise<RvaEvent[]> {
  const supabase = getSupabase();
  if (!supabase || !query.trim()) return [];
  const { data, error } = await supabase.rpc('search_events', { query, max_results: 40 });
  if (error || !data) return [];
  return (data as DbEvent[]).map(mapEvent);
}

export async function fetchSavedEventIds(userId: string): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from('saved_events').select('event_slug').eq('user_id', userId);
  return (data ?? []).map((r) => r.event_slug);
}

export async function persistSavedEvent(userId: string, eventSlug: string, saved: boolean) {
  const supabase = getSupabase();
  if (!supabase) return;
  if (saved) {
    await supabase.from('saved_events').upsert({ user_id: userId, event_slug: eventSlug });
  } else {
    await supabase.from('saved_events').delete().eq('user_id', userId).eq('event_slug', eventSlug);
  }
}

export async function createCheckoutSession(submissionId: string, tier: 'featured' | 'subscription') {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL not configured');
  const res = await fetch(`${url}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      submission_id: submissionId,
      tier,
      success_url: 'rvanow://submit?paid=1',
      cancel_url: 'rvanow://submit?paid=0',
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Checkout failed');
  return json.url as string;
}

export function isBackendConfigured() {
  return isSupabaseConfigured();
}
