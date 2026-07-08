'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { createCheckoutSession } from '@/lib/api';
import { neighborhoods, promotionTiers } from '@/lib/data';
import { useApp } from '@/context/AppProvider';
import type { PromotionTier } from '@/types/event';

function SubmitForm() {
  const searchParams = useSearchParams();
  const paid = searchParams.get('paid');
  const { submitEvent } = useApp();
  const [title, setTitle] = useState('');
  const [neighborhood, setNeighborhood] = useState(neighborhoods[0]);
  const [dateTime, setDateTime] = useState('');
  const [venue, setVenue] = useState('');
  const [email, setEmail] = useState('');
  const [pitch, setPitch] = useState('');
  const [tier, setTier] = useState<PromotionTier>('free');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus('');
    try {
      const submission = await submitEvent({
        title,
        neighborhood,
        dateTime,
        venue,
        email,
        pitch,
        tier,
      });

      if (tier === 'featured' || tier === 'subscription') {
        const checkoutUrl = await createCheckoutSession(
          submission.id,
          tier === 'subscription' ? 'subscription' : 'featured',
          window.location.origin,
        );
        window.location.href = checkoutUrl;
        return;
      }

      setStatus('Listing submitted. Free listings are reviewed before publishing.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="bg-[#14121A] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Organizers</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">
            List An Event
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            Submit your Richmond event for discovery, featured placement, or ticketing.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {paid === '1' ? (
          <div className="mb-4 rounded-2xl border border-[#2F6B52] bg-[#E8F5EE] px-4 py-3 text-sm font-semibold text-[#2F6B52]">
            Payment received. Your featured listing is being published.
          </div>
        ) : null}
        {paid === '0' ? (
          <div className="mb-4 rounded-2xl border border-[#D4922A] bg-[#FFF6E8] px-4 py-3 text-sm font-semibold text-[#9E3A24]">
            Payment canceled. Your submission was saved as unpaid.
          </div>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border border-[#E6E0D8] bg-white/95 p-5 shadow-sm sm:p-8">
          <label className="block">
            <span className="text-sm font-bold text-[#14121A]">Event title</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E6E0D8] px-4 py-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#14121A]">Neighborhood</span>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E6E0D8] px-4 py-3 text-sm"
            >
              {neighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#14121A]">Date & time</span>
            <input
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              placeholder="Saturday 7:00 PM"
              className="mt-2 w-full rounded-xl border border-[#E6E0D8] px-4 py-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#14121A]">Venue</span>
            <input
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E6E0D8] px-4 py-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#14121A]">Contact email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#E6E0D8] px-4 py-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#14121A]">Pitch</span>
            <textarea
              required
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-[#E6E0D8] px-4 py-3 text-sm"
            />
          </label>

          <div>
            <p className="text-sm font-bold text-[#14121A]">Placement</p>
            <div className="mt-3 space-y-2">
              {promotionTiers.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTier(option.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    tier === option.id ? 'border-[#C44B2F] bg-[#F6E4DE]' : 'border-[#E6E0D8] bg-[#F7F4EF]'
                  }`}
                >
                  <p className="font-bold text-[#14121A]">
                    {option.label} · {option.price}
                  </p>
                  <p className="text-sm text-[#5A5560]">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[#C44B2F] px-4 py-4 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : tier === 'free' ? 'Submit listing' : 'Continue to payment'}
          </button>
          {status ? <p className="text-sm font-semibold text-[#2F6B52]">{status}</p> : null}
        </form>

        <p className="mt-4 text-center text-sm text-[#5A5560]">
          <Link href="/" className="underline">
            Back to Discover
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-6">Loading…</div>}>
      <SubmitForm />
    </Suspense>
  );
}
