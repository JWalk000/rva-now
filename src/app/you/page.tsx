'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { useApp } from '@/context/AppProvider';
import { createCheckoutSession, fetchBusinessPlaceById } from '@/lib/api';
import { businessPlaceSubcategories } from '@/types/place';

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

type YouTab = 'preferences' | 'business';

function fieldClass() {
  return 'mt-2 w-full rounded-lg border border-[#DED8D0] bg-white/70 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#C44B2F]';
}

function YouPageInner() {
  const searchParams = useSearchParams();
  const {
    prefs,
    neighborhoods,
    vibes,
    toggleNeighborhood,
    toggleVibe,
    savedIds,
    signUpDigest,
    digest,
    businessPlaces,
    myPlaceIds,
    savePendingBusinessPlace,
    refreshBusinessPlaces,
  } = useApp();

  const initialTab: YouTab =
    searchParams.get('business') === '1' || searchParams.get('tab') === 'business' ? 'business' : 'preferences';
  const [tab, setTab] = useState<YouTab>(initialTab);
  const [digestEmail, setDigestEmail] = useState('');
  const [digestStatus, setDigestStatus] = useState('');
  const [activatedPlace, setActivatedPlace] = useState<{ name: string } | null>(null);
  const [paidBanner, setPaidBanner] = useState<'success' | 'cancel' | null>(null);

  const myListings = useMemo(
    () => businessPlaces.filter((place) => myPlaceIds.includes(place.id)),
    [businessPlaces, myPlaceIds],
  );
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [subcategoryLabel, setSubcategoryLabel] = useState(businessPlaceSubcategories[0].label);
  const [neighborhood, setNeighborhood] = useState(neighborhoods[0]);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const selectedSub = useMemo(
    () =>
      businessPlaceSubcategories.find((s) => s.label === subcategoryLabel) ?? businessPlaceSubcategories[0],
    [subcategoryLabel],
  );

  const [status, setStatus] = useState('');

  useEffect(() => {
    const paid = searchParams.get('paid');
    const business = searchParams.get('business') === '1' || searchParams.get('tab') === 'business';
    if (business) setTab('business');
    if (paid === '1') {
      setPaidBanner('success');
      const placeId = searchParams.get('place_id');
      void (async () => {
        for (let attempt = 0; attempt < 8; attempt += 1) {
          await refreshBusinessPlaces();
          if (placeId) {
            const found = await fetchBusinessPlaceById(placeId);
            if (found) {
              setActivatedPlace({ name: found.name });
              setStatus(`${found.name} is live on the map and Around Town.`);
              localStorage.removeItem('citipilot-pending-place');
              return;
            }
          } else if (attempt > 2) {
            setStatus('Payment received. Your place listing is active.');
            localStorage.removeItem('citipilot-pending-place');
            return;
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
        setStatus('Payment received. Your listing may take a moment to appear.');
      })();
    } else if (paid === '0') {
      setPaidBanner('cancel');
      setStatus('Checkout canceled. Your draft was kept — submit again when ready.');
    }
  }, [searchParams, refreshBusinessPlaces]);

  async function handleDigest(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signUpDigest(digestEmail, 'email');
      setDigestStatus('You are on the weekly RVA digest list.');
    } catch (error) {
      setDigestStatus(error instanceof Error ? error.message : 'Could not sign up.');
    }
  }

  async function handleBusinessSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus('');
    setPaidBanner(null);
    try {
      const place = savePendingBusinessPlace({
        name,
        category: selectedSub.category,
        subcategory: selectedSub.label,
        neighborhood,
        description,
        emoji: selectedSub.emoji,
        address: address || undefined,
        lat: lat.trim() ? Number(lat) : undefined,
        lng: lng.trim() ? Number(lng) : undefined,
        website: website || undefined,
        contactEmail: email,
      });

      const checkoutUrl = await createCheckoutSession(place.id, 'place_monthly', window.location.origin, {
        successPath: `/you?business=1&paid=1&place_id=${encodeURIComponent(place.id)}`,
        cancelPath: '/you?business=1&paid=0',
        place: {
          name: place.name,
          category: place.category,
          subcategory: place.subcategory,
          neighborhood: place.neighborhood,
          description: place.description,
          email: place.contactEmail ?? email,
          website: place.website,
          address: place.address,
          emoji: place.emoji,
          lat: place.lat,
          lng: place.lng,
        },
      });
      window.location.href = checkoutUrl;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not start checkout.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="bg-[#14121A] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Your RVA</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">You</h1>
          <p className="mt-2 max-w-xl text-sm text-white/65">
            Saved events, preferences, and tools to list your place.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {[
              { label: 'Saved', value: savedIds.length },
              { label: 'Tickets', value: 0 },
              { label: 'Places', value: myListings.length },
            ].map((stat) => (
              <p key={stat.label} className="text-white/55">
                <span className="font-[family-name:var(--font-display)] text-xl font-extrabold text-white">
                  {stat.value}
                </span>
                <span className="ml-2">{stat.label}</span>
              </p>
            ))}
          </div>

          <div className="mt-8 flex gap-6 border-b border-white/10 text-sm">
            {(
              [
                { id: 'preferences' as const, label: 'Preferences' },
                { id: 'business' as const, label: 'Business' },
              ] as const
            ).map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`-mb-px border-b-2 pb-3 font-semibold transition ${
                    active
                      ? 'border-[#C44B2F] text-white'
                      : 'border-transparent text-white/50 hover:text-white/80'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {tab === 'preferences' ? (
          <>
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
                <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#14121A]">
                  Preferences
                </h2>
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
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#14121A]">
                    Weekly Digest
                  </h2>
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

            <section className="border-t border-[#DED8D0] pt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-[#14121A]">
                    Own a place?
                  </h2>
                  <p className="mt-1 max-w-lg text-sm text-[#5A5560]">
                    List your shop, venue, or hangout on the map for{' '}
                    <span className="font-semibold text-[#14121A]">$5/mo</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('business')}
                  className="inline-flex shrink-0 rounded-full border border-[#1B1724] px-5 py-2.5 text-sm font-bold text-[#1B1724] transition hover:bg-[#1B1724] hover:text-white"
                >
                  List your place
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-8">
            <div className="flex flex-col gap-4 border-b border-[#DED8D0] pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C44B2F]">Business</p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold text-[#14121A]">
                  List your place
                </h2>
                <p className="mt-1 max-w-xl text-sm text-[#5A5560]">
                  Add your sight or site to Citipilot. Keep it live on the map and Around Town with a monthly
                  subscription.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-[#14121A]">
                  $5<span className="text-lg font-bold text-[#5A5560]">/mo</span>
                </p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8490]">
                  Subscription
                </p>
              </div>
            </div>

            {paidBanner === 'success' ? (
              <p className="text-sm font-semibold text-[#2F6B52]">
                Payment received. {status || (activatedPlace ? `${activatedPlace.name} is live.` : 'Your place is live.')}
              </p>
            ) : null}
            {paidBanner === 'cancel' ? (
              <p className="text-sm font-semibold text-[#9E3A24]">{status}</p>
            ) : null}

            {myListings.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A8490]">Your listings</h3>
                <ul className="divide-y divide-[#DED8D0] border-y border-[#DED8D0]">
                  {myListings.map((place) => (
                    <li key={place.id} className="flex items-baseline justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#14121A]">
                          {place.emoji} {place.name}
                        </p>
                        <p className="truncate text-sm text-[#5A5560]">
                          {place.subcategory} · {place.neighborhood}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-[#2F6B52]">
                        Live · $5/mo
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-[#5A5560]">
                  See them on the{' '}
                  <Link href="/map" className="font-semibold text-[#C44B2F] hover:underline">
                    map
                  </Link>{' '}
                  and Around Town.
                </p>
              </div>
            ) : null}

            <form onSubmit={(e) => void handleBusinessSubmit(e)} className="max-w-2xl space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-[#14121A]">Place name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Blade & Timber"
                  className={fieldClass()}
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#14121A]">Category</span>
                <select
                  value={subcategoryLabel}
                  onChange={(e) => setSubcategoryLabel(e.target.value)}
                  className={fieldClass()}
                >
                  {businessPlaceSubcategories.map((s) => (
                    <option key={s.label} value={s.label}>
                      {s.emoji} {s.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#14121A]">Neighborhood</span>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className={fieldClass()}
                >
                  {neighborhoods.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#14121A]">Short description</span>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What makes this place worth dropping by?"
                  className={fieldClass()}
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#14121A]">
                  Address <span className="font-normal text-[#8A8490]">(optional)</span>
                </span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Broad St, Richmond, VA"
                  className={fieldClass()}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-[#14121A]">
                    Latitude <span className="font-normal text-[#8A8490]">(optional)</span>
                  </span>
                  <input
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="37.54"
                    inputMode="decimal"
                    className={fieldClass()}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[#14121A]">
                    Longitude <span className="font-normal text-[#8A8490]">(optional)</span>
                  </span>
                  <input
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="-77.44"
                    inputMode="decimal"
                    className={fieldClass()}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-[#14121A]">Contact email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@yourplace.com"
                  className={fieldClass()}
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-[#14121A]">
                  Website <span className="font-normal text-[#8A8490]">(optional)</span>
                </span>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                  className={fieldClass()}
                />
              </label>

              <div className="flex flex-col gap-3 border-t border-[#DED8D0] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#5A5560]">
                  Continues to Stripe Checkout for <span className="font-semibold text-[#14121A]">$5/mo</span>.
                  Cancel anytime from Stripe.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex shrink-0 rounded-full bg-[#C44B2F] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#9E3A24] disabled:opacity-60"
                >
                  {submitting ? 'Redirecting…' : 'Subscribe · $5/mo'}
                </button>
              </div>

              {status && !paidBanner ? <p className="text-sm font-semibold text-[#9E3A24]">{status}</p> : null}
            </form>
          </section>
        )}

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

export default function YouPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[#5A5560]">Loading…</div>
      }
    >
      <YouPageInner />
    </Suspense>
  );
}
