'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import type { MapMarker } from '@/components/MapView';
import { useApp } from '@/context/AppProvider';
import { distanceMiles, formatDistanceMiles, type UserLocation } from '@/lib/location';
import { placeCategoryLabels, type PlaceCategory } from '@/types/place';

const FILTERS: Array<'events' | PlaceCategory | 'all'> = ['all', 'events', 'eat', 'cafes', 'bars', 'nightlife'];

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0B0A10] text-sm text-white/60">
      Loading map…
    </div>
  ),
});

type LocStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'unavailable' | 'error';

export default function MapPage() {
  const { events, places } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [selected, setSelected] = useState<{ type: 'event' | 'place'; id: string } | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locStatus, setLocStatus] = useState<LocStatus>('idle');
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [recenterToken, setRecenterToken] = useState(0);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocStatus('unavailable');
      return;
    }
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('ready');
        setNearbyOnly(true);
        setRecenterToken((n) => n + 1);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setLocStatus('denied');
        else if (err.code === err.POSITION_UNAVAILABLE) setLocStatus('unavailable');
        else setLocStatus('error');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 },
    );
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
      list = [...list].sort(
        (a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity),
      );
    }

    if (nearbyOnly && userLocation) {
      const near = list.filter((m) => (m.distanceMiles ?? Infinity) <= 5);
      if (near.length) list = near;
    }

    return list;
  }, [markers, filter, userLocation, nearbyOnly]);

  const nearbyList = useMemo(() => {
    if (!userLocation) return [];
    return [...markers]
      .sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity))
      .slice(0, 8);
  }, [markers, userLocation]);

  const active = selected
    ? visible.find((m) => m.id === selected.id && m.type === selected.type) ??
      markers.find((m) => m.id === selected.id && m.type === selected.type)
    : null;

  const locationMessage =
    locStatus === 'denied'
      ? 'Location permission denied. Enable it in your browser settings, then try again.'
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
              onClick={requestLocation}
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
              <>
                <button
                  type="button"
                  onClick={() => {
                    setNearbyOnly((v) => !v);
                    if (!nearbyOnly) setRecenterToken((n) => n + 1);
                  }}
                  className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                    nearbyOnly ? 'bg-white text-[#14121A]' : 'bg-white/10 text-white/75 hover:bg-white/15'
                  }`}
                >
                  Show nearby
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNearbyOnly(true);
                    setRecenterToken((n) => n + 1);
                  }}
                  className="rounded-full border border-white/20 px-3 py-2 text-xs font-bold text-white/80 hover:bg-white/10"
                >
                  Recenter
                </button>
              </>
            ) : null}
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
            <p className="mt-3 text-xs text-white/50">
              Showing distances from your location
              {nearbyOnly ? ' · nearby within ~5 mi' : ''}.
            </p>
          ) : null}

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
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">Closest to you</p>
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
            {userLocation ? ' · sorted by distance' : ''}
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
          selected={selected}
          onSelect={(marker) => setSelected({ type: marker.type, id: marker.id })}
          userLocation={userLocation}
          focusNearby={Boolean(userLocation && nearbyOnly)}
          recenterToken={recenterToken}
        />
        {locStatus === 'ready' ? (
          <button
            type="button"
            onClick={() => {
              setNearbyOnly(true);
              setRecenterToken((n) => n + 1);
            }}
            className="absolute bottom-5 right-5 z-[500] rounded-full border border-white/20 bg-[#14121A]/95 px-4 py-2.5 text-xs font-bold text-white shadow-lg backdrop-blur hover:bg-[#1C1A24]"
          >
            Recenter on me
          </button>
        ) : (
          <button
            type="button"
            onClick={requestLocation}
            className="absolute bottom-5 right-5 z-[500] rounded-full bg-[#C44B2F] px-4 py-2.5 text-xs font-extrabold text-white shadow-lg hover:bg-[#9E3A24]"
          >
            Show nearby
          </button>
        )}
      </div>
    </div>
  );
}
