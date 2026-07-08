import type { RvaEvent } from '@/types/event';

/**
 * Curated Unsplash photos by vibe — gives featured cards culture
 * until organizers upload real flyers.
 */
const vibePhotos: Record<string, string[]> = {
  'Live Music': [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
  ],
  'Food & Drink': [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
  ],
  Nightlife: [
    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1571266028247-d983b5c4c0f4?auto=format&fit=crop&w=900&q=80',
  ],
  Markets: [
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
  ],
  Family: [
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80',
  ],
  Fitness: [
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80',
  ],
  Networking: [
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80',
  ],
  Free: [
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
  ],
};

const fallbackPhotos = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=900&q=80',
];

function hashSeed(value: string) {
  return Math.abs(value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0));
}

export function eventImageUrl(event: Pick<RvaEvent, 'id' | 'vibe'>, width = 900): string {
  const vibe = event.vibe[0] ?? '';
  const pool = vibePhotos[vibe] ?? fallbackPhotos;
  const url = pool[hashSeed(event.id) % pool.length];
  return url.replace(/w=\d+/, `w=${width}`);
}

/** @deprecated use eventImageUrl(event) */
export function eventImageUrlById(eventId: string, width = 400, height = 300): string {
  return `https://picsum.photos/seed/${encodeURIComponent(eventId)}/${width}/${height}`;
}
