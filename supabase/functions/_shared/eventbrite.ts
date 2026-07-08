import { buildDedupeKey } from './dedupe.ts';
import { inferNeighborhoodFromCoords, inferNeighborhoodFromVenue } from './geocode.ts';

type EventbriteVenue = {
  name?: string;
  address?: { latitude?: string; longitude?: string; city?: string };
};

type EventbriteEvent = {
  id: string;
  name: { text: string };
  description?: { text?: string };
  start: { local: string };
  url: string;
  is_free?: boolean;
  venue?: EventbriteVenue;
  venue_id?: string;
};

export type NormalizedIngestEvent = {
  slug: string;
  title: string;
  neighborhood: string;
  vibes: string[];
  day_label: string;
  time_label: string;
  venue: string;
  price: string;
  description: string;
  lat: number;
  lng: number;
  time_windows: string[];
  source: string;
  source_type: string;
  source_platform: string;
  external_id: string;
  source_url: string;
  ticket_url: string;
  starts_at: string;
  dedupe_key: string;
  hidden_gem: boolean;
  trending_score: number;
};

function inferVibes(title: string, description: string, isFree: boolean) {
  const text = `${title} ${description}`.toLowerCase();
  const vibes: string[] = [];
  if (text.includes('music') || text.includes('concert') || text.includes('dj')) vibes.push('Live Music');
  if (text.includes('food') || text.includes('brunch') || text.includes('dinner')) vibes.push('Food & Drink');
  if (text.includes('network') || text.includes('founder')) vibes.push('Networking');
  if (text.includes('market') || text.includes('vendor')) vibes.push('Markets');
  if (text.includes('family') || text.includes('kids')) vibes.push('Family');
  if (text.includes('night') || text.includes('club') || text.includes('party')) vibes.push('Nightlife');
  if (text.includes('run') || text.includes('yoga') || text.includes('fitness')) vibes.push('Fitness');
  if (isFree) vibes.push('Free');
  if (!vibes.length) vibes.push('Live Music');
  return vibes;
}

function inferTimeWindows(startsAt: string) {
  const date = new Date(startsAt);
  const now = new Date();
  const day = date.getDay();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / 86400000);
  const windows = ['week'];
  if (diffDays >= 0 && diffDays <= 0) windows.push('today');
  if (day === 0 || day === 6 || (diffDays >= 0 && diffDays <= 6)) windows.push('weekend');
  return [...new Set(windows)];
}

function formatDayLabel(startsAt: string) {
  return new Date(startsAt).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' });
}

function formatTimeLabel(startsAt: string) {
  return new Date(startsAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

export async function fetchEventbriteEvents(orgIds: string[], token: string): Promise<NormalizedIngestEvent[]> {
  const results: NormalizedIngestEvent[] = [];

  for (const orgId of orgIds) {
    const url = new URL(`https://www.eventbriteapi.com/v3/organizations/${orgId}/events/`);
    url.searchParams.set('status', 'live');
    url.searchParams.set('order_by', 'start_asc');
    url.searchParams.set('expand', 'venue');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Eventbrite org ${orgId} failed: ${response.status}`);
    }

    const payload = await response.json();
    const events = (payload.events ?? []) as EventbriteEvent[];

    for (const event of events) {
      const title = event.name.text;
      const venue = event.venue?.name ?? 'TBA';
      const description = (event.description?.text ?? '').replace(/<[^>]+>/g, ' ').slice(0, 500);
      const startsAt = new Date(event.start.local).toISOString();
      const lat = Number(event.venue?.address?.latitude ?? 37.5407);
      const lng = Number(event.venue?.address?.longitude ?? -77.436);
      const neighborhood =
        lat && lng
          ? inferNeighborhoodFromCoords(lat, lng)
          : inferNeighborhoodFromVenue(venue, event.venue?.address?.city);
      const vibes = inferVibes(title, description, Boolean(event.is_free));

      const normalized: NormalizedIngestEvent = {
        slug: `eventbrite-${event.id}`,
        title,
        neighborhood,
        vibes,
        day_label: formatDayLabel(startsAt),
        time_label: formatTimeLabel(startsAt),
        venue,
        price: event.is_free ? 'Free' : 'See Eventbrite',
        description: description || `Live on Eventbrite — ${title}`,
        lat,
        lng,
        time_windows: inferTimeWindows(startsAt),
        source: 'Eventbrite',
        source_type: 'organizer',
        source_platform: 'eventbrite',
        external_id: event.id,
        source_url: event.url,
        ticket_url: event.url,
        starts_at: startsAt,
        dedupe_key: buildDedupeKey({ title, venue, starts_at: startsAt, day_label: formatDayLabel(startsAt) }),
        hidden_gem: false,
        trending_score: 70,
      };

      results.push(normalized);
    }
  }

  return results;
}
