export function scoreEvent(event, prefs) {
  let score = 0;
  if (prefs.neighborhoods.includes(event.neighborhood)) score += 4;
  if (event.vibe.some((v) => prefs.vibes.includes(v))) score += 3;
  if (event.hiddenGem) score += 1.5;
  if (event.featured) score += 1;
  if (event.price === 'Free') score += 0.5;
  return score;
}

export function personalize(events, prefs) {
  return [...events].sort((a, b) => scoreEvent(b, prefs) - scoreEvent(a, prefs));
}

export function filterEvents(events, filters) {
  return events.filter((event) => {
    const neighborhoodOk = !filters.neighborhood || event.neighborhood === filters.neighborhood;
    const vibeOk = !filters.vibe || event.vibe.includes(filters.vibe);
    const priceOk = !filters.freeOnly || event.price === 'Free';
    return neighborhoodOk && vibeOk && priceOk;
  });
}
