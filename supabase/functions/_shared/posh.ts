import { buildDedupeKey } from './dedupe.ts';
import { inferNeighborhoodFromVenue } from './geocode.ts';
import type { NormalizedIngestEvent } from './eventbrite.ts';

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parsePoshOgTitle(rawTitle: string) {
  const title = decodeHtml(rawTitle);
  const parts = title.split(' | ').map((part) => part.trim());
  return {
    eventTitle: parts[0] ?? title,
    organizer: parts[1] ?? 'Posh',
    schedule: parts[2] ?? '',
    venue: parts[3] ?? 'TBA',
  };
}

function parseSchedule(schedule: string) {
  const match = schedule.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
  if (!match) return { day_label: schedule || 'Upcoming', starts_at: null as string | null };
  const parsed = new Date(match[2]);
  if (Number.isNaN(parsed.getTime())) return { day_label: match[1], starts_at: null };
  return {
    day_label: match[1],
    starts_at: parsed.toISOString(),
  };
}

function inferVibes(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  const vibes: string[] = [];
  if (text.includes('music') || text.includes('dj') || text.includes('soul')) vibes.push('Live Music');
  if (text.includes('brunch') || text.includes('dinner') || text.includes('food')) vibes.push('Food & Drink');
  if (text.includes('network')) vibes.push('Networking');
  if (text.includes('market')) vibes.push('Markets');
  if (text.includes('free')) vibes.push('Free');
  if (text.includes('party') || text.includes('night')) vibes.push('Nightlife');
  if (!vibes.length) vibes.push('Nightlife');
  return vibes;
}

export async function fetchPoshEvent(url: string): Promise<NormalizedIngestEvent | null> {
  const slug = url.split('/e/')[1]?.split('?')[0]?.trim();
  if (!slug) return null;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'RVA-Now-Ingest/1.0' },
  });

  if (!response.ok) return null;

  const html = await response.text();
  const ogTitle = html.match(/property="og:title" content="([^"]+)"/)?.[1];
  const ogDescription = html.match(/property="og:description" content="([^"]+)"/)?.[1];

  if (!ogTitle) return null;

  const parsed = parsePoshOgTitle(ogTitle);
  const description = decodeHtml(ogDescription ?? `Found on Posh — ${parsed.eventTitle}`);
  const schedule = parseSchedule(parsed.schedule);
  const vibes = inferVibes(parsed.eventTitle, description);

  return {
    slug: `posh-${slug}`,
    title: parsed.eventTitle,
    neighborhood: inferNeighborhoodFromVenue(parsed.venue),
    vibes,
    day_label: schedule.day_label,
    time_label: 'See Posh',
    venue: parsed.venue,
    price: 'See Posh',
    description,
    lat: 37.5407,
    lng: -77.436,
    time_windows: ['week', 'weekend'],
    source: parsed.organizer,
    source_type: 'organizer',
    source_platform: 'posh',
    external_id: slug,
    source_url: url,
    ticket_url: url,
    starts_at: schedule.starts_at ?? new Date().toISOString(),
    dedupe_key: buildDedupeKey({
      title: parsed.eventTitle,
      venue: parsed.venue,
      starts_at: schedule.starts_at,
      day_label: schedule.day_label,
    }),
    hidden_gem: true,
    trending_score: 65,
  };
}

export async function fetchPoshEvents(urls: string[]) {
  const events: NormalizedIngestEvent[] = [];
  for (const url of urls) {
    const event = await fetchPoshEvent(url.trim());
    if (event) events.push(event);
  }
  return events;
}
