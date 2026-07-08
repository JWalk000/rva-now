'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MapMarker } from '@/components/MapView';
import { useApp } from '@/context/AppProvider';
import {
  distanceMiles,
  formatDistanceMiles,
  LOCATION_STORAGE_KEY,
  type UserLocation,
} from '@/lib/location';
import { placeCategoryLabels, type PlaceCategory } from '@/types/place';

const FILTERS: Array<'events' | PlaceCategory | 'all'> = [
  'all',
  'events',
  'eat',
  'cafes',
  'bars',
  'nightlife',
  'shops',
  'fitness',
  'entertainment',
];

const RADIUS_MIN = 1;
const RADIUS_MAX = 25;
const RADIUS_DEFAULT = 5;
const RADIUS_STORAGE_KEY = 'citipilot-search-radius';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0B0A10] text-sm text-white/60">
      Loading map…
    </div>
  ),
});

type LocStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'unavailable' | 'error';

function readStoredLocation(): UserLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function readStoredRadius(): number {
  if (typeof window === 'undefined') return RADIUS_DEFAULT;
  try {
    const raw = sessionStorage.getItem(RADIUS_STORAGE_KEY);
    if (!raw) return RADIUS_DEFAULT;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= RADIUS_MIN && n <= RADIUS_MAX) return n;
  } catch {
    /* ignore */
  }
  return RADIUS_DEFAULT;
}

export default function MapPage() {
  const { events, places } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [selected, setSelected] = useState<{ type: 'event' | 'place'; id: string } | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locStatus, setLocStatus] = useState<LocStatus>('idle');
  const [searchRadius, setSearchRadius] = useState(RADIUS_DEFAULT);
  const [recenterToken, setRecenterToken] = useState(0);
  const [showAllRvaToken, setShowAllRvaToken] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  const persistLocation = useCallback((loc: UserLocation) => {
    setUserLocation(loc);
    try {
      sessionStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    } catch {
      /* ignore */
    }
  }, []);

  const handleGeoError = useCallback((err: GeolocationPositionError) => {
    if (err.code === err.PERMISSION_DENIED) setLocStatus('denied');
    else if (err.code === err.POSITION_UNAVAILABLE) setLocStatus('unavailable');
    else setLocStatus('error');
  }, []);

  const requestLocation = useCallback((background = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocStatus('unavailable');
      return;
    }
    if (!background) setLocStatus('loading');

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        persistLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('ready');
        if (!background) setRecenterToken((n) => n + 1);
      },
      handleGeoError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        persistLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('ready');
      },
      () => {
        /* keep last known position on watch errors */
      },
      { enableHighAccuracy: true, maximumAge: 30_000 },
    );
  }, [persistLocation, handleGeoError]);

  useEffect(() => {
    const stored = readStoredLocation();
    const radius = readStoredRadius();
    setSearchRadius(radius);
    if (stored) {
      setUserLocation(stored);
      setLocStatus('ready');
      requestLocation(true);
    } else {
      requestLocation(false);
    }
    return () => {
      if (watchIdRef.current != null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRadiusChange = useCallback((value: number) => {
    setSearchRadius(value);
    try {
      sessionStorage.setItem(RADIUS_STORAGE_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, []);

  const markers = useMemo<MapMarker[]>(() => {
    const eventMarkers: MapMarker[] = events.map((e) => ({
      type: 'event',
      id: e.id,
      title: e.title,
      subtitle: `${e.venue} · ${e.neighborhood}`,
      lat: e.lat,
      lng: e.lng,
      href: `/event/${e.id}`,
      distanceMiles: userLocation ? distanceMiles(e, userLocation) : undefined,
    }));
    const placeMarkers: MapMarker[] = places.map((p) => ({
      type: 'place',
      id: p.id,
      title: p.name,
      subtitle: `${p.subcategory} · ${p.neighborhood}`,
      lat: p.lat,
      lng: p.lng,
      category: p.category,
      href: null,
      distanceMiles: userLocation ? distanceMiles(p, userLocation) : undefined,
    }));
    return [...eventMarkers, ...placeMarkers];
  }, [events, places, userLocation]);

  const visible = useMemo(() => {
    let list = markers.filter((m) => {
      if (filter === 'all') return true;
      if (filter === 'events') return m.type === 'event';
      return m.type === 'place' && m.category === filter;
    });

    if (userLocation) {
      list = list
        .filter((m) => (m.distanceMiles ?? Infinity) <= searchRadius)
        .sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
    }

    return list;
  }, [markers, filter, userLocation, searchRadius]);

  const nearbyList = useMemo(() => {
    if (!userLocation) return [];
    return [...markers]
      .filter((m) => (m.distanceMiles ?? Infinity) <= searchRadius)
      .sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity))
      .slice(0, 8);
  }, [markers, userLocation, searchRadius]);

  const active = selected
    ? visible.find((m) => m.id === selected.id && m.type === selected.type) ??
      markers.find((m) => m.id === selected.id && m.type === selected.type)
    : null;

  const locationPending = locStatus === 'idle' || locStatus === 'loading';

  const locationMessage =
    locStatus === 'denied'
      ? 'Location permission denied. Enable it in your browser settings, then tap Use my location.'
      : locStatus === 'unavailable'
        ? 'Location isn’t available on this device or browser.'
        : locStatus === 'error'
          ? 'Couldn’t get your location. Try again in a moment.'
          : locStatus === 'loading'
            ? 'Finding your location…'
            : null;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#0B0A10] text-white lg:flex-row">
      <aside className="z-10 flex w-full shrink-0 flex-col border-b border-white/10 bg-[#0B0A10] lg:w-[380px] lg:border-b-0 lg:border-r">
        <div className="px-5 pb-4 pt-6 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Richmond</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold">Map</h1>
          <p className="mt-2 text-sm text-white/65">
            See what&apos;s around you — filter pins, check distances, and open details.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => requestLocation(false)}
              disabled={locStatus === 'loading'}
              className="rounded-full bg-[#C44B2F] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#9E3A24] disabled:opacity-60"
            >
              {locStatus === 'loading'
                ? 'Locating…'
                : locStatus === 'ready'
                  ? 'Refresh location'
                  : 'Use my location'}
            </button>
            {locStatus === 'ready' ? (
              <button
                type="button"
                onClick={() => setRecenterToken((n) => n + 1)}
                className="rounded-full border border-white/20 px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10"
              >
                Recenter
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowAllRvaToken((n) => n + 1)}
              className="rounded-full border border-white/20 px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10"
            >
              Show all RVA
            </button>
          </div>

          {locationMessage ? (
            <p
              className={`mt-3 text-xs font-semibold ${
                locStatus === 'ready' || locStatus === 'loading' ? 'text-white/55' : 'text-[#F6A08C]'
              }`}
            >
              {locationMessage}
            </p>
          ) : null}
          {locStatus === 'ready' && userLocation ? (
            <p className="mt-3 text-xs font-semibold text-[#93C5FD]">
              Centered on you · showing spots within {searchRadius} mi
            </p>
          ) : null}

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <label
              htmlFor="search-radius"
              className={`flex items-center justify-between text-xs font-bold ${
                userLocation ? 'text-white/80' : 'text-white/40'
              }`}
            >
              <span>Search radius</span>
              <span className="text-[#C44B2F]">{searchRadius} mi</span>
            </label>
            <input
              id="search-radius"
              type="range"
              min={RADIUS_MIN}
              max={RADIUS_MAX}
              step={1}
              value={searchRadius}
              disabled={!userLocation}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              className="mt-2 w-full accent-[#C44B2F] disabled:opacity-40"
            />
            <div className="mt-1 flex justify-between text-[10px] font-semibold text-white/35">
              <span>{RADIUS_MIN} mi</span>
              <span>{RADIUS_MAX} mi</span>
            </div>
            {!userLocation ? (
              <p className="mt-2 text-[10px] font-semibold text-white/40">
                Enable location to adjust search radius.
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  filter === item ? 'bg-[#C44B2F] text-white' : 'bg-white/10 text-white/75 hover:bg-white/15'
                }`}
              >
                {item === 'all' ? 'All' : item === 'events' ? 'Events' : placeCategoryLabels[item]}
              </button>
            ))}
          </div>
        </div>

        {active ? (
          <div className="mx-5 mb-4 rounded-2xl border border-[#C44B2F]/40 bg-[#C44B2F]/10 p-4 sm:mx-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[#C44B2F]">
              {active.type === 'event' ? 'Selected event' : 'Selected place'}
            </p>
            <h2 className="mt-1 text-xl font-extrabold">{active.title}</h2>
            <p className="mt-1 text-sm text-white/65">{active.subtitle}</p>
            {typeof active.distanceMiles === 'number' ? (
              <p className="mt-2 text-sm font-bold text-[#F6E4DE]">
                {formatDistanceMiles(active.distanceMiles)} away
              </p>
            ) : null}
            {active.href ? (
              <Link
                href={active.href}
                className="mt-4 inline-flex rounded-full bg-[#C44B2F] px-4 py-2 text-sm font-bold hover:bg-[#9E3A24]"
              >
                View details →
              </Link>
            ) : null}
          </div>
        ) : null}

        {nearbyList.length > 0 ? (
          <div className="mb-2 px-5 sm:px-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">
              Nearby · within {searchRadius} mi
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {nearbyList.map((marker) => (
                <button
                  key={`near-${marker.type}-${marker.id}`}
                  type="button"
                  onClick={() => setSelected({ type: marker.type, id: marker.id })}
                  className="min-w-[140px] shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left hover:bg-white/10"
                >
                  <p className="truncate text-sm font-bold">{marker.title}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#C44B2F]">
                    {formatDistanceMiles(marker.distanceMiles ?? 0)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="hidden max-h-[40vh] flex-1 overflow-y-auto px-5 pb-6 sm:px-6 lg:block lg:max-h-none">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">
            {visible.length} location{visible.length === 1 ? '' : 's'}
            {userLocation ? ` · within ${searchRadius} mi` : ''}
          </p>
          <div className="space-y-2">
            {visible.slice(0, 40).map((marker) => {
              const isActive = active?.id === marker.id && active?.type === marker.type;
              return (
                <button
                  key={`${marker.type}-${marker.id}-row`}
                  type="button"
                  onClick={() => setSelected({ type: marker.type, id: marker.id })}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-[#C44B2F]/50 bg-[#C44B2F]/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{marker.title}</p>
                    <p className="truncate text-sm text-white/60">{marker.subtitle}</p>
                  </div>
                  <span className="ml-3 shrink-0 text-right text-xs font-bold text-[#C44B2F]">
                    {typeof marker.distanceMiles === 'number'
                      ? formatDistanceMiles(marker.distanceMiles)
                      : marker.type === 'event'
                        ? '★'
                        : '●'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="relative min-h-[62vh] flex-1 lg:min-h-0">
        <MapView
          markers={visible}
          allMarkers={markers}
          selected={selected}
          onSelect={(marker) => setSelected({ type: marker.type, id: marker.id })}
          userLocation={userLocation}
          locationPending={locationPending}
          searchRadiusMiles={searchRadius}
          recenterToken={recenterToken}
          showAllRvaToken={showAllRvaToken}
        />
        {process.env.NODE_ENV === 'development' && userLocation ? (
          <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-lg bg-black/70 px-2.5 py-1.5 font-mono text-[10px] text-white/80">
            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </div>
        ) : null}
        {locStatus === 'ready' ? (
          <button
            type="button"
            onClick={() => setRecenterToken((n) => n + 1)}
            className="absolute bottom-5 right-5 z-[500] rounded-full border border-white/20 bg-[#14121A]/95 px-4 py-2.5 text-xs font-bold text-white shadow-lg backdrop-blur hover:bg-[#1C1A24]"
          >
            Recenter on me
          </button>
        ) : (
          <button
            type="button"
            onClick={() => requestLocation(false)}
            className="absolute bottom-5 right-5 z-[500] rounded-full bg-[#C44B2F] px-4 py-2.5 text-xs font-extrabold text-white shadow-lg hover:bg-[#9E3A24]"
          >
            Use my location
          </button>
        )}
      </div>
    </div>
  );
}
