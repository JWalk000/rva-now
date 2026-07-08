import { pullWellReviewedPlaces } from '@/lib/reviewedPlaces';
import type { FeedPost } from '@/types/feed';
import type { Place, PlaceCategory } from '@/types/place';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function categoryFromSubcategory(subcategory?: string): PlaceCategory {
  const text = (subcategory ?? '').toLowerCase();
  if (text.includes('coffee') || text.includes('bakery') || text.includes('cafe') || text.includes('donut')) {
    return 'cafes';
  }
  if (
    text.includes('distillery') ||
    text.includes('meadery') ||
    text.includes('cocktail') ||
    text.includes('brew') ||
    text.includes('bar') ||
    text.includes('pub') ||
    text.includes('tasting')
  ) {
    return 'bars';
  }
  if (
    text.includes('axe') ||
    text.includes('bowling') ||
    text.includes('arcade') ||
    text.includes('escape') ||
    text.includes('mini golf') ||
    text.includes('golf') ||
    text.includes('skate') ||
    text.includes('trampoline') ||
    text.includes('entertain') ||
    text.includes('family fun')
  ) {
    return 'entertainment';
  }
  if (
    text.includes('vintage') ||
    text.includes('thrift') ||
    text.includes('record') ||
    text.includes('book') ||
    text.includes('shop') ||
    text.includes('retail') ||
    text.includes('museum')
  ) {
    return 'shops';
  }
  if (
    text.includes('music') ||
    text.includes('club') ||
    text.includes('nightlife') ||
    text.includes('venue') ||
    text.includes('theater') ||
    text.includes('theatre') ||
    text.includes('comedy') ||
    text.includes('karaoke') ||
    text.includes('dance')
  ) {
    return 'nightlife';
  }
  if (text.includes('market')) return 'markets';
  if (text.includes('fitness') || text.includes('gym') || text.includes('run') || text.includes('climb')) {
    return 'fitness';
  }
  return 'eat';
}

function namesMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Pull places for Home + Map from:
 * 1) Community feed posts (Corner-style)
 * 2) Well-reviewed spots (good ratings)
 * 3) Places the user added
 */
export function pullPlacesFromCommunity(input: {
  posts: FeedPost[];
  savedPlaceIds?: string[];
  userAddedPlaces?: Place[];
}): Place[] {
  const { posts, userAddedPlaces = [] } = input;
  const byId = new Map<string, Place>();

  // Start with highly rated places so the map always has strong local spots.
  for (const place of pullWellReviewedPlaces()) {
    byId.set(place.id, { ...place });
  }

  for (const place of userAddedPlaces) {
    byId.set(place.id, {
      ...place,
      source: place.source === 'business' ? 'business' : 'added',
      featured: place.source === 'business' ? true : place.featured,
      postCount: place.postCount ?? 0,
      recentHandles: place.recentHandles ?? [],
    });
  }

  const placePosts = posts
    .filter((post) => post.placeName)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  for (const post of placePosts) {
    const existingByName = [...byId.values()].find((place) => namesMatch(place.name, post.placeName!));
    const id = existingByName?.id ?? post.placeId ?? `plc-${slugify(post.placeName!)}`;
    const existing = byId.get(id);
    const category = post.placeCategory ?? categoryFromSubcategory(post.placeSubcategory);

    if (existing) {
      existing.postCount += 1;
      existing.lastActiveAt =
        +new Date(post.createdAt) > +new Date(existing.lastActiveAt) ? post.createdAt : existing.lastActiveAt;
      if (!existing.recentHandles.includes(post.userHandle)) {
        existing.recentHandles = [post.userHandle, ...existing.recentHandles].slice(0, 4);
      }
      // Keep review ratings, but mark as also active in the feed.
      if (existing.source === 'reviews') {
        existing.featured = true;
      } else if (existing.source === 'added') {
        existing.source = 'community';
      } else if (existing.source === 'business') {
        existing.featured = true;
      }
      continue;
    }

    byId.set(id, {
      id,
      name: post.placeName!,
      category,
      subcategory: post.placeSubcategory ?? 'Local spot',
      neighborhood: post.neighborhood,
      description: post.caption,
      emoji: post.placeEmoji ?? post.imageEmoji ?? '📍',
      priceLevel: post.placePriceLevel ?? '$$',
      lat: post.placeLat ?? 37.5407,
      lng: post.placeLng ?? -77.436,
      source: 'community',
      postCount: 1,
      lastActiveAt: post.createdAt,
      recentHandles: [post.userHandle],
      featured: true,
    });
  }

  return [...byId.values()].sort((a, b) => {
    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;
    if (b.postCount !== a.postCount) return b.postCount - a.postCount;
    if (ratingB !== ratingA) return ratingB - ratingA;
    return +new Date(b.lastActiveAt) - +new Date(a.lastActiveAt);
  });
}

export function filterPlacesByCategory(places: Place[], category?: PlaceCategory | 'all') {
  if (!category || category === 'all') return places;
  return places.filter((place) => place.category === category);
}

export function sourceLabel(place: Place) {
  if (place.source === 'business') return 'Business listing';
  if (place.source === 'added') return 'Added by you';
  if (place.source === 'saved') return 'Saved';
  if (place.source === 'reviews') {
    return place.rating ? `★ ${place.rating.toFixed(1)} reviews` : 'Top rated';
  }
  if (place.rating) return `★ ${place.rating.toFixed(1)} · From the feed`;
  return 'From the feed';
}

/** Rough neighborhood centroids for map pins when lat/lng not provided */
export const neighborhoodCoords: Record<string, { lat: number; lng: number }> = {
  Downtown: { lat: 37.5407, lng: -77.436 },
  'The Fan': { lat: 37.552, lng: -77.458 },
  "Scott's Addition": { lat: 37.569, lng: -77.466 },
  'Church Hill': { lat: 37.532, lng: -77.416 },
  Manchester: { lat: 37.523, lng: -77.445 },
  Carytown: { lat: 37.553, lng: -77.48 },
};

export function coordsForNeighborhood(neighborhood: string): { lat: number; lng: number } {
  return neighborhoodCoords[neighborhood] ?? { lat: 37.5407, lng: -77.436 };
}
