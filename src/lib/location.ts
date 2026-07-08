export type UserLocation = { lat: number; lng: number };
export type LatLng = { lat: number; lng: number };

export function distanceMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(a.lat - b.lat);
  const dLng = toRad(a.lng - b.lng);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(b.lat)) * Math.cos(toRad(a.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function formatDistanceMiles(miles: number): string {
  if (!Number.isFinite(miles)) return '';
  if (miles < 0.1) return '<0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function sortByDistance<T extends LatLng>(items: T[], location: UserLocation): T[] {
  return [...items].sort((a, b) => distanceMiles(a, location) - distanceMiles(b, location));
}
