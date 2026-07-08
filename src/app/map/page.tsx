'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { MapMarker } from '@/components/MapView';
import { useApp } from '@/context/AppProvider';
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

export default function MapPage() {
  const { events, places } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [selected, setSelected] = useState<{ type: 'event' | 'place'; id: string } | null>(null);

  const markers = useMemo<MapMarker[]>(() => {
    const eventMarkers: MapMarker[] = events.map((e) => ({
      type: 'event',
      id: e.id,
      title: e.title,
      subtitle: `${e.venue} · ${e.neighborhood}`,
      lat: e.lat,
      lng: e.lng,
      href: `/event/${e.id}`,
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
    }));
    return [...eventMarkers, ...placeMarkers];
  }, [events, places]);

  const visible = markers.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'events') return m.type === 'event';
    return m.type === 'place' && m.category === filter;
  });

  const active = selected
    ? visible.find((m) => m.id === selected.id && m.type === selected.type)
    : null;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-[#0B0A10] text-white lg:flex-row">
      <aside className="z-10 flex w-full shrink-0 flex-col border-b border-white/10 bg-[#0B0A10] lg:w-[360px] lg:border-b-0 lg:border-r">
        <div className="px-5 pb-4 pt-6 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Richmond</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold">Map</h1>
          <p className="mt-2 text-sm text-white/65">
            Real locations across RVA — filter pins and open what&apos;s nearby.
          </p>
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
          <div className="mx-5 mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:mx-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[#C44B2F]">
              {active.type === 'event' ? 'Event' : 'Place'}
            </p>
            <h2 className="mt-1 text-xl font-extrabold">{active.title}</h2>
            <p className="mt-1 text-sm text-white/65">{active.subtitle}</p>
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

        <div className="hidden max-h-[40vh] flex-1 overflow-y-auto px-5 pb-6 sm:px-6 lg:block lg:max-h-none">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">
            {visible.length} locations
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
                  <span className="ml-3 shrink-0">{marker.type === 'event' ? '★' : '●'}</span>
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
        />
      </div>
    </div>
  );
}
