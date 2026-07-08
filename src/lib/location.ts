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

/** Downtown Richmond — city-level zoom keeps Ashland off the basemap tiles. */
export const RVA_CENTER: [number, number] = [37.5407, -77.436];
export const CITY_ZOOM = 14;
/** Zoom when centered on the user — tight enough to stay in Richmond proper. */
export const USER_LOCATION_ZOOM = 14;

/** Leaflet zoom level that roughly frames a circular search radius around the user. */
export function zoomForRadiusMiles(miles: number): number {
  const clamped = Math.max(1, Math.min(25, miles));
  const zoom = 14 - Math.log2(clamped);
  return Math.round(Math.max(10, Math.min(15, zoom)));
}

export const LOCATION_STORAGE_KEY = 'citipilot-user-location';
