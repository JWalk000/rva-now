import Image from 'next/image';
import Link from 'next/link';

import { eventImageUrl } from '@/lib/eventImage';
import type { RvaEvent } from '@/types/event';

type Props = {
  event: RvaEvent;
  large?: boolean;
};

export function EventPosterCard({ event, large }: Props) {
  const vibe = event.vibe[0] ?? 'Event';

  return (
    <Link
      href={`/event/${event.id}`}
      className={`group relative block overflow-hidden rounded-2xl bg-[#1B1724] shadow-lg ${
        large ? 'min-w-[280px] max-w-[320px]' : 'min-w-[220px] max-w-[260px]'
      }`}
    >
      <div className={`relative ${large ? 'h-56' : 'h-44'} w-full`}>
        <Image
          src={eventImageUrl(event, 800)}
          alt={event.title}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          {event.featured || event.sponsored ? (
            <span className="rounded-full bg-[#D4922A] px-2 py-1 text-[10px] font-bold uppercase text-white">
              Featured
            </span>
          ) : null}
          <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
            {vibe}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs font-semibold text-white/70">{event.day} · {event.time}</p>
          <h3 className="mt-1 line-clamp-2 text-lg font-extrabold leading-tight text-white">{event.title}</h3>
          <p className="mt-1 text-sm text-white/75">{event.venue} · {event.neighborhood}</p>
          <p className="mt-2 text-sm font-bold text-[#F6E4DE]">{event.price}</p>
        </div>
      </div>
    </Link>
  );
}
