'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import { neighborhoods } from '@/lib/data';
import type { CreateSocialPostInput } from '@/context/AppProvider';
import { activityLabels, type FeedActivity } from '@/types/feed';
import type { Place } from '@/types/place';

const ACTIVITIES: FeedActivity[] = ['visited', 'at-event', 'recommends', 'checked-in'];

const EMOJI_OPTIONS = ['✨', '☕', '🍽️', '🎸', '🍸', '🌅', '🪩', '📚', '🥯', '🥖'];

const AVATAR_COLORS = ['#C44B2F', '#2F6B52', '#D4922A', '#6B4F7A', '#3D6F8C', '#457B9D'];

export type CreatePostInput = CreateSocialPostInput;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (post: CreatePostInput) => void | Promise<void>;
  places: Place[];
  submitting?: boolean;
};

export function CreatePostModal({ open, onClose, onSubmit, places, submitting = false }: Props) {
  const titleId = useId();
  const [caption, setCaption] = useState('');
  const [activity, setActivity] = useState<FeedActivity>('recommends');
  const [neighborhood, setNeighborhood] = useState(neighborhoods[0]);
  const [placeMode, setPlaceMode] = useState<'none' | 'pick' | 'custom'>('none');
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [customPlaceName, setCustomPlaceName] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageEmoji, setImageEmoji] = useState('✨');
  const [error, setError] = useState('');

  const sortedPlaces = useMemo(
    () => [...places].sort((a, b) => a.name.localeCompare(b.name)),
    [places],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  if (!open) return null;

  function reset() {
    setCaption('');
    setActivity('recommends');
    setNeighborhood(neighborhoods[0]);
    setPlaceMode('none');
    setSelectedPlaceId('');
    setCustomPlaceName('');
    setEventTitle('');
    setImageUrl('');
    setImageEmoji('✨');
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const trimmed = caption.trim();
    if (!trimmed) {
      setError('Add a caption to share what’s happening.');
      return;
    }

    const selectedPlace =
      placeMode === 'pick' ? sortedPlaces.find((p) => p.id === selectedPlaceId) : undefined;
    const customName = customPlaceName.trim();

    if (placeMode === 'pick' && !selectedPlace) {
      setError('Pick a place from the list, or choose a different option.');
      return;
    }
    if (placeMode === 'custom' && !customName) {
      setError('Enter a place or spot name.');
      return;
    }

    const post: CreatePostInput = {
      caption: trimmed,
      activity,
      neighborhood: selectedPlace?.neighborhood ?? neighborhood,
      imageColor: '#1A1528',
      imageEmoji,
      imageUrl: imageUrl.trim() || undefined,
      eventTitle: eventTitle.trim() || undefined,
      userName: 'You',
      userHandle: 'you',
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    };

    if (selectedPlace) {
      post.placeId = selectedPlace.id;
      post.placeName = selectedPlace.name;
      post.placeCategory = selectedPlace.category;
      post.placeSubcategory = selectedPlace.subcategory;
      post.placeEmoji = selectedPlace.emoji;
      post.placePriceLevel = selectedPlace.priceLevel;
      post.placeLat = selectedPlace.lat;
      post.placeLng = selectedPlace.lng;
      post.imageEmoji = selectedPlace.emoji || imageEmoji;
    } else if (placeMode === 'custom' && customName) {
      post.placeName = customName;
      post.placeEmoji = imageEmoji;
    }

    void (async () => {
      try {
        await onSubmit(post);
      } catch {
        // Parent handles error display
      }
    })();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-[#14121A] text-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#14121A]/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Citipilot</p>
            <h2 id={titleId} className="font-[family-name:var(--font-display)] text-xl font-extrabold">
              Create a post
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/5"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <label className="block">
            <span className="text-sm font-bold">What’s happening?</span>
            <textarea
              required
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share a recommendation, check-in, or what’s going on around RVA…"
              className="mt-2 w-full resize-none rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#C44B2F] focus:outline-none"
            />
          </label>

          <fieldset>
            <legend className="text-sm font-bold">Activity</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACTIVITIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActivity(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    activity === item ? 'bg-[#C44B2F] text-white' : 'bg-white/10 text-white/75 hover:bg-white/15'
                  }`}
                >
                  {activityLabels[item]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold">Place</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['none', 'None'],
                  ['pick', 'Pick a place'],
                  ['custom', 'Custom name'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPlaceMode(mode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    placeMode === mode ? 'bg-white text-[#14121A]' : 'bg-white/10 text-white/75 hover:bg-white/15'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {placeMode === 'pick' ? (
              <select
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/15 bg-[#0B0A10] px-4 py-3 text-sm"
              >
                <option value="">Select a place…</option>
                {sortedPlaces.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name} · {place.neighborhood}
                  </option>
                ))}
              </select>
            ) : null}
            {placeMode === 'custom' ? (
              <input
                value={customPlaceName}
                onChange={(e) => setCustomPlaceName(e.target.value)}
                placeholder="Spot or venue name"
                className="mt-3 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm placeholder:text-white/35 focus:border-[#C44B2F] focus:outline-none"
              />
            ) : null}
          </fieldset>

          <label className="block">
            <span className="text-sm font-bold">Event name (optional)</span>
            <input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g. Sunset on Brown’s Island"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm placeholder:text-white/35 focus:border-[#C44B2F] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">Neighborhood</span>
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              disabled={placeMode === 'pick' && Boolean(selectedPlaceId)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-[#0B0A10] px-4 py-3 text-sm disabled:opacity-50"
            >
              {neighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm font-bold">Mood emoji</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setImageEmoji(emoji)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
                    imageEmoji === emoji ? 'bg-[#C44B2F] ring-2 ring-white/40' : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-bold">Image URL (optional)</span>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm placeholder:text-white/35 focus:border-[#C44B2F] focus:outline-none"
            />
          </label>

          {error ? <p className="text-sm font-semibold text-[#F6A08C]">{error}</p> : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white/75 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#C44B2F] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#9E3A24] disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Share post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
