import { searchEventsLocal } from '@/lib/search';
import type { UserLocation } from '@/lib/location';
import { sortByDistance } from '@/lib/location';
import type { EventFilters, RvaEvent, TimeWindow, UserPrefs } from '@/types/event';

export function scoreEvent(event: RvaEvent, prefs: UserPrefs) {
  let score = 0;
  if (prefs.neighborhoods.includes(event.neighborhood)) score += 4;
  if (event.vibe.some((v) => prefs.vibes.includes(v))) score += 3;
  if (event.hiddenGem) score += 1.5;
  if (event.featured || event.sponsored) score += 1;
  if (event.price === 'Free') score += 0.5;
  return score;
}

export function personalize(events: RvaEvent[], prefs: UserPrefs) {
  return [...events].sort((a, b) => scoreEvent(b, prefs) - scoreEvent(a, prefs));
}

export function filterByTimeWindow(events: RvaEvent[], timeWindow: TimeWindow) {
  return events.filter((event) => event.when.includes(timeWindow));
}

export function filterEvents(events: RvaEvent[], filters: EventFilters) {
  const searched = searchEventsLocal(events, filters.searchQuery);
  return searched.filter((event) => {
    const neighborhoodOk = !filters.neighborhood || event.neighborhood === filters.neighborhood;
    const vibeOk = !filters.vibe || event.vibe.includes(filters.vibe);
    const priceOk = !filters.freeOnly || event.price === 'Free';
    const timeOk = event.when.includes(filters.timeWindow);
    return neighborhoodOk && vibeOk && priceOk && timeOk;
  });
}

export function getTrending(events: RvaEvent[], prefs: UserPrefs, limit = 5, location?: UserLocation | null) {
  const base = location ? sortByDistance(events, location) : [...events];
  return base
    .sort((a, b) => {
      const aScore = a.trendingScore + scoreEvent(a, prefs) * 0.5;
      const bScore = b.trendingScore + scoreEvent(b, prefs) * 0.5;
      return bScore - aScore;
    })
    .slice(0, limit);
}

export function getHiddenGems(events: RvaEvent[]) {
  return events.filter((e) => e.hiddenGem);
}

export function getSponsored(events: RvaEvent[]) {
  return events.filter((e) => e.sponsored || e.featured);
}

export function buildFeed(events: RvaEvent[], prefs: UserPrefs, filters: EventFilters) {
  const ranked = personalize(events, prefs);
  return filterEvents(ranked, filters);
}
