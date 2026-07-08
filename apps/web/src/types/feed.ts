import type { PlaceCategory } from '@/types/place';

export type FeedActivity = 'visited' | 'at-event' | 'recommends' | 'checked-in';

export type FeedPost = {
  id: string;
  userName: string;
  userHandle: string;
  avatarColor: string;
  caption: string;
  activity: FeedActivity;
  /** When set, this post pins a place onto the community map (Corner-style). */
  placeId?: string;
  placeName?: string;
  placeCategory?: PlaceCategory;
  placeSubcategory?: string;
  placeEmoji?: string;
  placePriceLevel?: '$' | '$$' | '$$$' | '$$$$';
  placeLat?: number;
  placeLng?: number;
  eventTitle?: string;
  neighborhood: string;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  imageColor: string;
  imageEmoji: string;
  imageUrl?: string;
};

export const activityLabels: Record<FeedActivity, string> = {
  visited: 'Visited',
  'at-event': 'At an event',
  recommends: 'Recommends',
  'checked-in': 'Checked in',
};
