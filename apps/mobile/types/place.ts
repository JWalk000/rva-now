export type PlaceCategory =
  | 'eat'
  | 'cafes'
  | 'bars'
  | 'shops'
  | 'nightlife'
  | 'markets'
  | 'fitness';

export type PlaceSource = 'community' | 'reviews' | 'saved' | 'added';

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  subcategory: string;
  neighborhood: string;
  description: string;
  emoji: string;
  priceLevel: '$' | '$$' | '$$$' | '$$$$';
  lat: number;
  lng: number;
  featured?: boolean;
  /** community = feed posts, reviews = well-reviewed pull */
  source: PlaceSource;
  postCount: number;
  lastActiveAt: string;
  recentHandles: string[];
  rating?: number;
  reviewCount?: number;
};

export const placeCategoryLabels: Record<PlaceCategory, string> = {
  eat: 'Eat',
  cafes: 'Cafes',
  bars: 'Bars',
  shops: 'Shops',
  nightlife: 'Go out',
  markets: 'Markets',
  fitness: 'Fitness',
};
