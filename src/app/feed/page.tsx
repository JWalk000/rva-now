'use client';

import { useMemo, useState } from 'react';

import { CreatePostModal } from '@/components/CreatePostModal';
import { FeedPostCard } from '@/components/FeedPostCard';
import { useApp } from '@/context/AppProvider';

const FILTERS = ['For You', 'Nearby', 'Events', 'Places'] as const;

export default function FeedPage() {
  const { socialPosts, places, createSocialPost } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('For You');
  const [composeOpen, setComposeOpen] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const posts = useMemo(() => {
    if (filter === 'Events') return socialPosts.filter((post) => post.eventTitle);
    if (filter === 'Places') return socialPosts.filter((post) => post.placeName);
    if (filter === 'Nearby') {
      return [...socialPosts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return socialPosts;
  }, [socialPosts, filter]);

  const totalLikes = socialPosts.reduce((sum, post) => sum + post.likes, 0);
  const placePosts = socialPosts.filter((post) => post.placeName).length;

  return (
    <div className="min-h-screen bg-[#0B0A10] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Richmond</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold sm:text-4xl">Feed</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            What people are doing around RVA — posts pin places onto the map.
          </p>

          {submitMessage ? (
            <p className="mt-4 rounded-xl border border-[#2F6B52]/40 bg-[#2F6B52]/20 px-4 py-3 text-sm font-semibold text-[#A8E6C3]">
              {submitMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="mt-6 flex w-full max-w-xl items-center gap-4 rounded-2xl border border-white/15 bg-gradient-to-r from-[#C44B2F]/25 via-white/5 to-transparent px-4 py-4 text-left transition hover:border-[#C44B2F]/50 hover:from-[#C44B2F]/35 sm:px-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C44B2F] text-sm font-extrabold text-white">
              +
            </span>
            <span className="min-w-0">
              <span className="block font-[family-name:var(--font-display)] text-lg font-extrabold">
                Create a post
              </span>
              <span className="mt-0.5 block text-sm text-white/60">
                Share what&apos;s happening around Richmond
              </span>
            </span>
            <span className="ml-auto hidden rounded-full bg-[#C44B2F] px-4 py-2 text-sm font-bold text-white sm:inline">
              Compose
            </span>
          </button>

          <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
            {[
              { label: 'Posts', value: socialPosts.length },
              { label: 'Places', value: placePosts },
              { label: 'Likes', value: totalLikes },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-xs text-white/55">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  filter === item ? 'bg-white text-[#14121A]' : 'bg-white/10 text-white/75'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:px-8 xl:grid-cols-3">
        {posts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>

      <CreatePostModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        places={places}
        onSubmit={async (input) => {
          setSubmitting(true);
          setSubmitMessage('');
          try {
            await createSocialPost(input);
            setComposeOpen(false);
            setSubmitMessage('Post submitted for review. It will appear in the feed once approved.');
          } catch (err) {
            setSubmitMessage(err instanceof Error ? err.message : 'Could not submit post.');
          } finally {
            setSubmitting(false);
          }
        }}
        submitting={submitting}
      />
    </div>
  );
}
