'use client';

import { useMemo, useState } from 'react';

import { FeedPostCard } from '@/components/FeedPostCard';
import { useApp } from '@/context/AppProvider';

const FILTERS = ['For You', 'Nearby', 'Events', 'Places'] as const;

export default function FeedPage() {
  const { socialPosts } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('For You');

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
    <div className="min-h-screen bg-[#0B0A10] pb-24 text-white">
      <div className="border-b border-white/10 px-5 pb-4 pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C44B2F]">Richmond</p>
        <h1 className="mt-1 text-3xl font-extrabold">Feed</h1>
        <p className="mt-2 text-sm text-white/65">
          What people are doing around RVA — posts pin places onto the map.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
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
        <div className="mt-4 flex flex-wrap gap-2">
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
      <div className="space-y-4 px-4 py-5">
        {posts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
