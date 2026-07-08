'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useApp } from '@/context/AppProvider';
import { eventImageUrl } from '@/lib/eventImage';

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const { getEvent, isSaved, toggleSaved } = useApp();
  const event = getEvent(params.id);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0A10] px-6 text-center text-white">
        <div>
          <p className="text-xl font-bold">Event not found.</p>
          <Link href="/" className="mt-4 inline-block text-[#C44B2F] underline">
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  const saved = isSaved(event.id);
  const ticketUrl = event.ticketUrl ?? event.sourceUrl;

  return (
    <div className="min-h-screen bg-[#0B0A10] pb-10 text-white">
      <div className="relative h-[46vh] lg:h-[56vh]">
        <Image src={eventImageUrl(event, 1200)} alt={event.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A10] via-black/35 to-black/20" />
        <Link
          href="/"
          className="absolute left-4 top-4 rounded-full bg-black/40 px-4 py-2 text-sm font-bold backdrop-blur sm:left-6"
        >
          ← Back
        </Link>
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl p-5 sm:px-6 lg:px-8">
          <div className="mb-3 flex flex-wrap gap-2">
            {event.featured || event.sponsored ? (
              <span className="rounded-full bg-[#D4922A] px-3 py-1 text-xs font-bold">Featured</span>
            ) : null}
            {event.hiddenGem ? (
              <span className="rounded-full bg-[#2F6B52] px-3 py-1 text-xs font-bold">Hidden Gem</span>
            ) : null}
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{event.vibe[0]}</span>
          </div>
          <p className="text-sm font-semibold text-white/70">
            {event.day} · {event.time}
          </p>
          <h1 className="mt-2 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            {event.title}
          </h1>
          <p className="mt-2 text-white/75">
            {event.venue} · {event.neighborhood} · {event.price}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-5 py-6 sm:px-6 lg:grid lg:grid-cols-[1.4fr_0.8fr] lg:gap-8 lg:space-y-0 lg:px-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'When', value: `${event.day} ${event.time}` },
              { label: 'Where', value: event.venue },
              { label: 'Price', value: event.price },
              { label: 'Area', value: event.neighborhood },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#C44B2F]">{card.label}</p>
                <p className="mt-1 text-sm font-semibold">{card.value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-extrabold">About</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{event.description}</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-extrabold">Vibes</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {event.vibe.map((v) => (
                <span key={v} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                  {v}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <button
            type="button"
            onClick={() => toggleSaved(event.id)}
            className="w-full rounded-full border border-white/15 px-4 py-3 text-sm font-bold"
          >
            {saved ? '★ Saved' : '☆ Save'}
          </button>
          {ticketUrl ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-full bg-[#C44B2F] px-4 py-3 text-center text-sm font-bold text-white"
            >
              Get Tickets
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
