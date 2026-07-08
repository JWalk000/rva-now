export type ExistingEvent = {
  id: string;
  slug: string;
  title: string;
  venue: string;
  day_label: string;
  source_platform: string;
  external_id: string | null;
  dedupe_key: string | null;
  starts_at: string | null;
};

export type IncomingEvent = {
  title: string;
  venue: string;
  day_label: string;
  source_platform: string;
  external_id?: string | null;
  starts_at?: string | null;
  source_url?: string | null;
};

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildDedupeKey(event: {
  title: string;
  venue: string;
  starts_at?: string | null;
  day_label?: string;
}) {
  const title = normalizeText(event.title);
  const venue = normalizeText(event.venue);
  const date = event.starts_at?.slice(0, 10) ?? normalizeText(event.day_label ?? '');
  return `${title}|${venue}|${date}`;
}

export function findDuplicate(
  existing: ExistingEvent[],
  incoming: IncomingEvent,
): { match: ExistingEvent; reason: string } | null {
  if (incoming.external_id) {
    const byExternal = existing.find(
      (row) =>
        row.external_id === incoming.external_id && row.source_platform === incoming.source_platform,
    );
    if (byExternal) return { match: byExternal, reason: 'external_id' };
  }

  const incomingKey = buildDedupeKey(incoming);
  const byKey = existing.find((row) => row.dedupe_key === incomingKey);
  if (byKey) return { match: byKey, reason: 'dedupe_key' };

  const title = normalizeText(incoming.title);
  const venue = normalizeText(incoming.venue);
  const incomingDate = incoming.starts_at?.slice(0, 10) ?? incoming.day_label;

  const fuzzy = existing.find((row) => {
    const sameTitle = normalizeText(row.title) === title;
    const sameVenue = normalizeText(row.venue) === venue;
    const rowDate = row.starts_at?.slice(0, 10) ?? row.day_label;
    return sameTitle && sameVenue && rowDate === incomingDate;
  });

  if (fuzzy) return { match: fuzzy, reason: 'fuzzy_title_venue_date' };

  return null;
}
