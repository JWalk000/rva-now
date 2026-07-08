'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useApp } from '@/context/AppProvider';

export default function YouPage() {
  const { prefs, neighborhoods, vibes, toggleNeighborhood, toggleVibe, savedIds, signUpDigest, digest } = useApp();
  const [digestEmail, setDigestEmail] = useState('');
  const [digestStatus, setDigestStatus] = useState('');

  async function handleDigest(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signUpDigest(digestEmail, 'email');
      setDigestStatus('You are on the weekly RVA digest list.');
    } catch (error) {
      setDigestStatus(error instanceof Error ? error.message : 'Could not sign up.');
    }
  }

  return (
    <div className="min-h-screen">
      <div className="bg-[#14121A] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Your RVA</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">You</h1>
          <p className="mt-2 max-w-xl text-sm text-white/65">Saved events, preferences, and organizer tools.</p>
          <div className="mt-6 grid max-w-md grid-cols-3 gap-3">
            {[
              { label: 'Saved', value: savedIds.length },
              { label: 'Tickets', value: 0 },
              { label: 'Places', value: 0 },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-xs text-white/55">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:px-8">
        <Link
          href="/submit"
          className="block rounded-2xl bg-[#C44B2F] px-5 py-4 text-center text-sm font-extrabold text-white shadow-lg sm:col-span-2"
        >
          List An Event
        </Link>

        <section id="prefs" className="rounded-2xl border border-[#E6E0D8] bg-white/90 p-5 backdrop-blur">
          <h2 className="text-lg font-extrabold text-[#14121A]">Neighborhoods</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {neighborhoods.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => toggleNeighborhood(n)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  prefs.neighborhoods.includes(n) ? 'bg-[#1B1724] text-white' : 'bg-[#F7F4EF] text-[#5A5560]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E6E0D8] bg-white/90 p-5 backdrop-blur">
          <h2 className="text-lg font-extrabold text-[#14121A]">Vibes</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {vibes.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => toggleVibe(v)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  prefs.vibes.includes(v) ? 'bg-[#C44B2F] text-white' : 'bg-[#F7F4EF] text-[#5A5560]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E6E0D8] bg-white/90 p-5 backdrop-blur sm:col-span-2">
          <h2 className="text-lg font-extrabold text-[#14121A]">Weekly Digest</h2>
          <p className="mt-1 text-sm text-[#5A5560]">Get the best of RVA in your inbox every Sunday.</p>
          <form onSubmit={(e) => void handleDigest(e)} className="mt-4 flex max-w-lg gap-2">
            <input
              type="email"
              required
              value={digestEmail}
              onChange={(e) => setDigestEmail(e.target.value)}
              placeholder="you@email.com"
              className="min-w-0 flex-1 rounded-xl border border-[#E6E0D8] px-4 py-3 text-sm"
            />
            <button type="submit" className="rounded-xl bg-[#1B1724] px-4 py-3 text-sm font-bold text-white">
              Join
            </button>
          </form>
          {digest || digestStatus ? (
            <p className="mt-3 text-sm font-semibold text-[#2F6B52]">{digestStatus || 'Signed up.'}</p>
          ) : null}
        </section>

        <div className="flex gap-3 text-sm text-[#5A5560] sm:col-span-2">
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
          <Link href="/terms" className="underline">
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}
