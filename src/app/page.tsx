'use client';

import { useState } from 'react';

import { EventPosterCard } from '@/components/EventPosterCard';
import { HeroHeader } from '@/components/HeroHeader';
import { HomeEventRow } from '@/components/HomeEventRow';
import { HomePlaceCard } from '@/components/HomePlaceCard';
import { useApp } from '@/context/AppProvider';
import { placeCategoryLabels, type PlaceCategory } from '@/types/place';

const PLACE_FILTERS: Array<PlaceCategory | 'all'> = [
  'all',
  'eat',
  'cafes',
  'bars',
  'shops',
  'nightlife',
  'fitness',
  'entertainment',
];

export default function HomePage() {
  const {
    feed,
    trending,
    sponsored,
    filters,
    loading,
    refreshData,
    setFilter,
    setTimeWindow,
    getPlacesByCategory,
    isPlaceSaved,
    toggleSavedPlace,
    timeWindows,
  } = useApp();
  const [placeCategory, setPlaceCategory] = useState<PlaceCategory | 'all'>('all');
  const visiblePlaces = getPlacesByCategory(placeCategory);
  const heroEvents = sponsored.length ? sponsored : trending;
  const extraTrending = trending.filter((event) => !heroEvents.some((hero) => hero.id === event.id));

  return (
    <div className="min-h-screen">
      <HeroHeader />
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {timeWindows.map((window) => {
            const active = filters.timeWindow === window.id;
            return (
              <button
                key={window.id}
                type="button"
                onClick={() => setTimeWindow(window.id)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  active ? 'bg-[#1B1724] text-white' : 'border border-[#E6E0D8] bg-white/80 text-[#5A5560] backdrop-blur'
                }`}
              >
                {window.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setFilter('freeOnly', !filters.freeOnly)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filters.freeOnly ? 'bg-[#1B1724] text-white' : 'border border-[#E6E0D8] bg-white/80 text-[#5A5560] backdrop-blur'
            }`}
          >
            {filters.freeOnly ? '✓ Free' : 'Free'}
          </button>
          <button
            type="button"
            onClick={() => void refreshData()}
            className="rounded-full border border-[#E6E0D8] bg-white/80 px-4 py-2 text-sm font-bold text-[#5A5560] backdrop-blur"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {heroEvents.length ? (
          <section>
            <div className="mb-4">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-[#14121A] sm:text-3xl">
                Trending In RVA
              </h2>
              <p className="mt-1 text-sm text-[#5A5560]">Featured picks and what&apos;s heating up.</p>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
              {heroEvents.map((event) => (
                <div key={event.id} className="min-w-[280px] sm:min-w-0">
                  <EventPosterCard event={event} large />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-[#14121A] sm:text-3xl">
              Around Town
            </h2>
            <p className="mt-1 text-sm text-[#5A5560]">Community spots and well-reviewed places.</p>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {PLACE_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setPlaceCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  placeCategory === cat ? 'bg-[#C44B2F] text-white' : 'border border-[#E6E0D8] bg-white/80 text-[#5A5560]'
                }`}
              >
                {cat === 'all' ? 'All' : placeCategoryLabels[cat]}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {visiblePlaces.slice(0, 8).map((place) => (
              <HomePlaceCard
                key={place.id}
                place={place}
                saved={isPlaceSaved(place.id)}
                onToggleSave={() => toggleSavedPlace(place.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-[#14121A] sm:text-3xl">
              For You
            </h2>
            <p className="mt-1 text-sm text-[#5A5560]">Personalized by your neighborhoods and vibes.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {feed.slice(0, 8).map((event) => (
              <HomeEventRow key={event.id} event={event} />
            ))}
          </div>
        </section>

        {extraTrending.length ? (
          <section>
            <div className="mb-4">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-[#14121A] sm:text-3xl">
                More This Weekend
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {extraTrending.map((event) => (
                <HomeEventRow key={event.id} event={event} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
