'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useApp } from '@/context/AppProvider';

function Chip({
  label,
  active,
  activeClass,
  onClick,
}: {
  label: string;
  active: boolean;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide transition ${
        active ? activeClass : 'border border-[#DED8D0] bg-transparent text-[#5A5560] hover:border-[#C4BDB3] hover:text-[#14121A]'
      }`}
    >
      {label}
    </button>
  );
}

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
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {[
              { label: 'Saved', value: savedIds.length },
              { label: 'Tickets', value: 0 },
              { label: 'Places', value: 0 },
            ].map((stat) => (
              <p key={stat.label} className="text-white/55">
                <span className="font-[family-name:var(--font-display)] text-xl font-extrabold text-white">{stat.value}</span>
                <span className="ml-2">{stat.label}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <Link
            href="/submit"
            className="inline-flex rounded-full bg-[#C44B2F] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#9E3A24]"
          >
            List An Event
          </Link>
        </div>

        <section id="prefs" className="space-y-8 border-t border-[#DED8D0] pt-8">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#14121A]">Preferences</h2>
            <p className="mt-1 text-sm text-[#5A5560]">Tune what shows up across Discover and your feed.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A8490]">Neighborhoods</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {neighborhoods.map((n) => (
                  <Chip
                    key={n}
                    label={n}
                    active={prefs.neighborhoods.includes(n)}
                    activeClass="bg-[#1B1724] text-white"
                    onClick={() => toggleNeighborhood(n)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A8490]">Vibes</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {vibes.map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    active={prefs.vibes.includes(v)}
                    activeClass="bg-[#C44B2F] text-white"
                    onClick={() => toggleVibe(v)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#DED8D0] pt-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="max-w-md shrink-0">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#14121A]">Weekly Digest</h2>
              <p className="mt-1 text-sm text-[#5A5560]">The best of RVA in your inbox every Sunday.</p>
            </div>
            <form onSubmit={(e) => void handleDigest(e)} className="flex w-full max-w-md items-stretch gap-2 lg:ml-auto">
              <input
                type="email"
                required
                value={digestEmail}
                onChange={(e) => setDigestEmail(e.target.value)}
                placeholder="you@email.com"
                className="h-11 min-w-0 flex-1 rounded-lg border border-[#DED8D0] bg-white/70 px-3.5 text-sm outline-none transition focus:border-[#C44B2F]"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-lg bg-[#1B1724] px-5 text-sm font-bold text-white transition hover:bg-[#2A2433]"
              >
                Join
              </button>
            </form>
          </div>
          {digest || digestStatus ? (
            <p className="mt-3 text-sm font-semibold text-[#2F6B52]">{digestStatus || 'Signed up.'}</p>
          ) : null}
        </section>

        <footer className="flex gap-5 border-t border-[#DED8D0] pt-6 text-sm text-[#8A8490]">
          <Link href="/privacy" className="transition hover:text-[#14121A]">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-[#14121A]">
            Terms
          </Link>
        </footer>
      </div>
    </div>
  );
}
