'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { useApp } from '@/context/AppProvider';
import { placeCategoryLabels, type PlaceCategory } from '@/types/place';

const FILTERS: Array<'events' | PlaceCategory | 'all'> = ['all', 'events', 'eat', 'cafes', 'bars', 'nightlife'];

export default function MapPage() {
  const { events, places } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [selected, setSelected] = useState<{ type: 'event' | 'place'; id: string } | null>(null);

  const markers = useMemo(() => {
    const eventMarkers = events.map((e) => ({
      type: 'event' as const,
      id: e.id,
      title: e.title,
      subtitle: `${e.venue} · ${e.neighborhood}`,
      lat: e.lat,
      lng: e.lng,
      href: `/event/${e.id}`,
    }));
    const placeMarkers = places.map((p) => ({
      type: 'place' as const,
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
    : visible[0];

  return (
    <div className="min-h-screen bg-[#0B0A10] pb-24 text-white">
      <div className="border-b border-white/10 px-5 pb-4 pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Richmond</p>
        <h1 className="mt-1 text-3xl font-extrabold">Map</h1>
        <p className="mt-2 text-sm text-white/65">Tap a pin to see what&apos;s happening around RVA.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                filter === item ? 'bg-[#C44B2F] text-white' : 'bg-white/10 text-white/75'
              }`}
            >
              {item === 'all' ? 'All' : item === 'events' ? 'Events' : placeCategoryLabels[item]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mx-4 mt-4 overflow-hidden rounded-3xl border border-white/10 bg-[#14121A]">
        <iframe
          title="RVA map"
          className="h-[52vh] w-full border-0 grayscale-[20%] invert-[92%] hue-rotate-180"
          loading="lazy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-77.50%2C37.50%2C-77.40%2C37.57&layer=mapnik"
        />
        <div className="absolute inset-0 pointer-events-none">
          {visible.slice(0, 24).map((marker, index) => (
            <button
              key={`${marker.type}-${marker.id}`}
              type="button"
              style={{
                left: `${12 + (index % 6) * 14}%`,
                top: `${18 + Math.floor(index / 6) * 16}%`,
              }}
              onClick={() => setSelected({ type: marker.type, id: marker.id })}
              className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-full rounded-full px-2 py-1 text-[10px] font-bold shadow-lg ${
                active?.id === marker.id && active?.type === marker.type
                  ? 'bg-[#C44B2F] text-white'
                  : marker.type === 'event'
                    ? 'bg-[#D4922A] text-white'
                    : 'bg-[#2F6B52] text-white'
              }`}
            >
              {marker.type === 'event' ? '★' : '●'}
            </button>
          ))}
        </div>
      </div>

      {active ? (
        <div className="mx-4 mt-4 rounded-2xl border border-white/10 bg-[#14121A] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#C44B2F]">
            {active.type === 'event' ? 'Event' : 'Place'}
          </p>
          <h2 className="mt-1 text-xl font-extrabold">{active.title}</h2>
          <p className="mt-1 text-sm text-white/65">{active.subtitle}</p>
          {active.href ? (
            <Link href={active.href} className="mt-4 inline-flex rounded-full bg-[#C44B2F] px-4 py-2 text-sm font-bold">
              View details →
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mx-4 mt-4 space-y-2">
        {visible.slice(0, 8).map((marker) => (
          <button
            key={`${marker.type}-${marker.id}-row`}
            type="button"
            onClick={() => setSelected({ type: marker.type, id: marker.id })}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
          >
            <div>
              <p className="font-bold">{marker.title}</p>
              <p className="text-sm text-white/60">{marker.subtitle}</p>
            </div>
            <span>{marker.type === 'event' ? '★' : '●'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
