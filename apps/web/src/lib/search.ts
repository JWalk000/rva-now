import type { RvaEvent } from '@/types/event';

export function searchEventsLocal(events: RvaEvent[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return events;
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.neighborhood.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.vibe.some((v) => v.toLowerCase().includes(q)),
  );
}
