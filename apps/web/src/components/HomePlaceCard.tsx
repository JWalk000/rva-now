import type { Place } from '@/types/place';
import { placeCategoryLabels } from '@/types/place';

type Props = {
  place: Place;
  saved?: boolean;
  onToggleSave?: () => void;
};

function sourceLabel(place: Place) {
  if (place.source === 'reviews') return `★ ${place.rating?.toFixed(1)} · ${place.reviewCount} reviews`;
  if (place.source === 'community') return `${place.postCount} community posts`;
  return placeCategoryLabels[place.category];
}

export function HomePlaceCard({ place, saved, onToggleSave }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E6E0D8] bg-white p-3 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F7F4EF] text-2xl">
        {place.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-[#14121A]">{place.name}</h3>
        <p className="truncate text-sm text-[#5A5560]">
          {place.subcategory} · {place.neighborhood} · {place.priceLevel}
        </p>
        <p className="truncate text-xs text-[#8A8490]">{sourceLabel(place)}</p>
      </div>
      {onToggleSave ? (
        <button
          type="button"
          onClick={onToggleSave}
          className={`text-xl ${saved ? 'text-[#D4922A]' : 'text-[#8A8490]'}`}
          aria-label={saved ? 'Unsave place' : 'Save place'}
        >
          {saved ? '★' : '☆'}
        </button>
      ) : null}
    </div>
  );
}
