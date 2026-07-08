import Link from 'next/link';

import { eventImageUrl } from '@/lib/eventImage';
import type { RvaEvent } from '@/types/event';

type Props = {
  event: RvaEvent;
};

export function HomeEventRow({ event }: Props) {
  return (
    <Link
      href={`/event/${event.id}`}
      className="flex items-center gap-3 rounded-2xl border border-[#E6E0D8] bg-white p-3 shadow-sm transition hover:border-[#C44B2F]/30"
    >
      <div
        className="h-16 w-16 shrink-0 rounded-xl bg-cover bg-center"
        style={{ backgroundImage: `url(${eventImageUrl(event, 200)})` }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#8A8490]">{event.day} · {event.neighborhood}</p>
        <h3 className="truncate font-bold text-[#14121A]">{event.title}</h3>
        <p className="truncate text-sm text-[#5A5560]">{event.venue} · {event.price}</p>
      </div>
      <span className="text-sm font-bold text-[#C44B2F]">→</span>
    </Link>
  );
}
