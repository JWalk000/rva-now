import { activityLabels } from '@/types/feed';
import type { FeedPost } from '@/types/feed';

export function FeedPostCard({ post }: { post: FeedPost }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#2A2730] bg-[#14121A] text-white">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: post.avatarColor }}
          >
            {post.userName.slice(0, 1)}
          </div>
          <div>
            <p className="font-bold">{post.userName}</p>
            <p className="text-xs text-white/55">@{post.userHandle} · {activityLabels[post.activity]}</p>
          </div>
        </div>
        <button type="button" className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold">
          Follow
        </button>
      </div>

      {post.imageUrl ? (
        <div
          className="aspect-[4/3] bg-cover bg-center"
          style={{ backgroundImage: `url(${post.imageUrl})` }}
        />
      ) : (
        <div
          className="flex aspect-[4/3] items-center justify-center text-6xl"
          style={{ backgroundColor: post.imageColor }}
        >
          {post.imageEmoji}
        </div>
      )}

      <div className="space-y-2 p-4">
        <div className="flex gap-4 text-sm font-semibold">
          <span>♥ {post.likes}</span>
          <span>💬 {post.comments}</span>
          <span>↗ {post.shares}</span>
        </div>
        <p className="text-sm leading-relaxed text-white/85">
          <span className="font-bold">{post.userHandle}</span> {post.caption}
        </p>
        {post.placeName ? (
          <p className="text-sm text-[#F6E4DE]">
            📍 {post.placeName} · {post.neighborhood}
          </p>
        ) : null}
        {post.eventTitle ? (
          <p className="text-sm text-[#D4922A]">🎟 {post.eventTitle}</p>
        ) : null}
      </div>
    </article>
  );
}
