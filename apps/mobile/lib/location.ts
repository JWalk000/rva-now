import * as Location from 'expo-location';

import type { RvaEvent } from '@/types/event';

export type UserLocation = { lat: number; lng: number };

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function requestUserLocation(options?: { prompt?: boolean }): Promise<UserLocation | null> {
  const existing = await Location.getForegroundPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    if (!options?.prompt) return null;
    const requested = await Location.requestForegroundPermissionsAsync();
    status = requested.status;
    if (status !== 'granted') return null;
  }

  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 300_000 });
  if (lastKnown) {
    return { lat: lastKnown.coords.latitude, lng: lastKnown.coords.longitude };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Low,
  });
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

export function sortByDistance(events: RvaEvent[], location: UserLocation) {
  return [...events].sort(
    (a, b) =>
      distanceKm(location.lat, location.lng, a.lat, a.lng) -
      distanceKm(location.lat, location.lng, b.lat, b.lng),
  );
}

export function distanceMiles(event: RvaEvent, location: UserLocation) {
  return distanceKm(location.lat, location.lng, event.lat, event.lng) * 0.621371;
}
