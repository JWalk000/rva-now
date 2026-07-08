import { events as localEvents, lists as localLists } from '@/lib/data';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Place, PlaceCategory } from '@/types/place';
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
import type { FeedActivity, FeedPost } from '@/types/feed';

type DbEvent = {
  slug: string;
  title: string;
  neighborhood: string;
  vibes: string[];
  day_label: string;
  time_label: string;
  venue: string;
  price: string;
  featured: boolean;
  hidden_gem: boolean;
  sponsored: boolean;
  trending_score: number;
  time_windows: TimeWindow[];
  source: string;
  source_type: EventSourceType;
  source_platform: SourcePlatform | null;
  source_url: string | null;
  ticket_url: string | null;
  external_id: string | null;
  description: string;
  lat: number;
  lng: number;
  sells_tickets: boolean | null;
  submission_id: string | null;
};

type DbList = {
  id: string;
  title: string;
  by_line: string;
  description: string;
  items: string[];
  event_slugs?: string[];
};

type DbSubmission = {
  id: string;
  title: string;
  neighborhood: string;
  date_time: string;
  venue: string;
  email: string;
  tier: PromotionTier;
  pitch: string;
  created_at: string;
  status: SubmissionStatus;
  payment_status: string | null;
  published_slug: string | null;
  ticketing_enabled: boolean | null;
};

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
    when: row.time_windows,
    source: row.source,
    sourceType: row.source_type,
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

function mapList(row: DbList): CuratedList {
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
    tier: row.tier,
    pitch: row.pitch,
    submittedAt: row.created_at,
    status: row.status,
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
    return { lists: localLists, source: 'local' };
  }

  return { lists: data.map(mapList), source: 'supabase' };
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
  input: Omit<EventSubmission, 'id' | 'submittedAt'> & { ticketTypes?: TicketTypeInput[] },
): Promise<EventSubmission> {
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
    submittedAt: new Date().toISOString(),
    status: 'pending',
    paymentStatus: 'unpaid',
  };
}

export type CheckoutTier = 'featured' | 'subscription' | 'place_monthly' | 'business_place';

export type PlaceCheckoutMeta = {
  name: string;
  category: PlaceCategory;
  subcategory: string;
  neighborhood: string;
  description: string;
  email: string;
  website?: string;
  address?: string;
  emoji?: string;
  lat?: number;
  lng?: number;
};

type DbBusinessPlace = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  neighborhood: string;
  description: string;
  email: string;
  website: string | null;
  address: string | null;
  emoji: string;
  lat: number;
  lng: number;
  status: string;
  approved: boolean;
  created_at: string;
};

function mapBusinessPlace(row: DbBusinessPlace): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category as PlaceCategory,
    subcategory: row.subcategory,
    neighborhood: row.neighborhood,
    description: row.description,
    emoji: row.emoji || '📍',
    priceLevel: '$$',
    lat: row.lat,
    lng: row.lng,
    source: 'business',
    featured: true,
    postCount: 0,
    lastActiveAt: row.created_at,
    recentHandles: [],
    address: row.address ?? undefined,
    website: row.website ?? undefined,
    contactEmail: row.email,
    subscriptionActive: row.status === 'active' && row.approved,
  };
}

export async function fetchBusinessPlaces(): Promise<Place[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('business_places')
    .select('*')
    .eq('status', 'active')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];
  return data.map((row) => mapBusinessPlace(row as DbBusinessPlace));
}

export async function fetchBusinessPlaceById(id: string): Promise<Place | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('business_places')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .eq('approved', true)
    .maybeSingle();

  if (error || !data) return null;
  return mapBusinessPlace(data as DbBusinessPlace);
}

export async function createCheckoutSession(
  submissionId: string,
  tier: CheckoutTier,
  origin: string,
  options?: { successPath?: string; cancelPath?: string; place?: PlaceCheckoutMeta },
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL not configured');
  const successPath = options?.successPath ?? '/submit?paid=1';
  const cancelPath = options?.cancelPath ?? '/submit?paid=0';
  const res = await fetch(`${url}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      submission_id: submissionId,
      tier,
      success_url: `${origin}${successPath}`,
      cancel_url: `${origin}${cancelPath}`,
      place: options?.place,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Checkout failed');
  return json.url as string;
}

export type AdminDashboard = {
  stats: {
    totalPlaces: number;
    activePlaces: number;
    pendingPlaces: number;
    eventCount: number;
    pendingFeedPosts: number;
    approvedFeedPosts: number;
  };
  pending: Array<{
    id: string;
    name: string;
    email: string;
    neighborhood: string;
    category: string;
    subcategory: string;
    status: string;
    approved: boolean;
    created_at: string;
  }>;
  active: Array<{
    id: string;
    name: string;
    email: string;
    neighborhood: string;
    category: string;
    subcategory: string;
    status: string;
    approved: boolean;
    created_at: string;
    stripe_subscription_id: string | null;
  }>;
  pendingFeed: Array<{
    id: string;
    user_name: string;
    user_handle: string;
    caption: string;
    neighborhood: string;
    activity: string;
    place_name: string | null;
    status: string;
    created_at: string;
  }>;
  approvedFeed: Array<{
    id: string;
    user_name: string;
    user_handle: string;
    caption: string;
    neighborhood: string;
    activity: string;
    place_name: string | null;
    status: string;
    created_at: string;
  }>;
};

export async function verifyAdminSecret(secret: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;
  const res = await fetch(`${url}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret,
    },
    body: JSON.stringify({ action: 'verify' }),
  });
  return res.ok;
}

export async function fetchAdminDashboard(secret: string): Promise<AdminDashboard> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL not configured');
  const res = await fetch(`${url}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret,
    },
    body: JSON.stringify({ action: 'dashboard' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Admin request failed');
  return json as AdminDashboard;
}

export async function moderateBusinessPlace(
  secret: string,
  placeId: string,
  action: 'approve' | 'reject',
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL not configured');
  const res = await fetch(`${url}/functions/v1/approve-business-place`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret,
    },
    body: JSON.stringify({ place_id: placeId, action }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Moderation failed');
}

export async function moderateFeedPost(
  secret: string,
  postId: string,
  action: 'approve' | 'reject',
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL not configured');
  const res = await fetch(`${url}/functions/v1/approve-feed-post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret,
    },
    body: JSON.stringify({ post_id: postId, action }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Moderation failed');
}

export function isBackendConfigured() {
  return isSupabaseConfigured();
}

type DbFeedPost = {
  id: string;
  user_name: string;
  user_handle: string;
  avatar_color: string;
  caption: string;
  activity: FeedActivity;
  place_id: string | null;
  place_name: string | null;
  place_category: string | null;
  place_lat: number | null;
  place_lng: number | null;
  event_title: string | null;
  neighborhood: string;
  image_url: string | null;
  image_color: string;
  image_emoji: string;
  likes: number;
  comments: number;
  shares: number;
  status: string;
  created_at: string;
};

function mapFeedPost(row: DbFeedPost): FeedPost {
  return {
    id: row.id,
    userName: row.user_name,
    userHandle: row.user_handle,
    avatarColor: row.avatar_color,
    caption: row.caption,
    activity: row.activity,
    placeId: row.place_id ?? undefined,
    placeName: row.place_name ?? undefined,
    placeCategory: (row.place_category as PlaceCategory) ?? undefined,
    placeLat: row.place_lat ?? undefined,
    placeLng: row.place_lng ?? undefined,
    eventTitle: row.event_title ?? undefined,
    neighborhood: row.neighborhood,
    imageUrl: row.image_url ?? undefined,
    imageColor: row.image_color,
    imageEmoji: row.image_emoji,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    createdAt: row.created_at,
  };
}

export async function fetchFeedPosts(): Promise<FeedPost[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('feed_posts')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data?.length) return [];
  return data.map((row) => mapFeedPost(row as DbFeedPost));
}

export type CreateFeedPostInput = Omit<
  FeedPost,
  'id' | 'createdAt' | 'likes' | 'comments' | 'shares' | 'userName' | 'userHandle' | 'avatarColor'
> & {
  userName?: string;
  userHandle?: string;
  avatarColor?: string;
};

export async function createFeedPost(input: CreateFeedPostInput): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Backend not configured');

  const { error } = await supabase.from('feed_posts').insert({
    user_name: input.userName?.trim() || 'You',
    user_handle: input.userHandle?.trim() || 'you',
    avatar_color: input.avatarColor || '#C44B2F',
    caption: input.caption,
    activity: input.activity,
    place_id: input.placeId ?? null,
    place_name: input.placeName ?? null,
    place_category: input.placeCategory ?? null,
    place_lat: input.placeLat ?? null,
    place_lng: input.placeLng ?? null,
    event_title: input.eventTitle ?? null,
    neighborhood: input.neighborhood,
    image_url: input.imageUrl ?? null,
    image_color: input.imageColor,
    image_emoji: input.imageEmoji,
    status: 'pending',
  });

  if (error) throw new Error(error.message);
}
