import type { RvaEvent } from '@/types/event';

export type UserLocation = { lat: number; lng: number };

export function distanceMiles(
  event: Pick<RvaEvent, 'lat' | 'lng'>,
  location: UserLocation,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(event.lat - location.lat);
  const dLng = toRad(event.lng - location.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(location.lat)) * Math.cos(toRad(event.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortByDistance(events: RvaEvent[], location: UserLocation) {
  return [...events].sort(
    (a, b) => distanceMiles(a, location) - distanceMiles(b, location),
  );
}
