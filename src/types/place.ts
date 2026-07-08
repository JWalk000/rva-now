export type PlaceCategory =
  | 'eat'
  | 'cafes'
  | 'bars'
  | 'shops'
  | 'nightlife'
  | 'markets'
  | 'fitness'
  | 'entertainment';

export type PlaceSource = 'community' | 'reviews' | 'saved' | 'added' | 'business';

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
  /** community = feed posts, reviews = well-reviewed pull, business = paid listing */
  source: PlaceSource;
  postCount: number;
  lastActiveAt: string;
  recentHandles: string[];
  rating?: number;
  reviewCount?: number;
  address?: string;
  website?: string;
  contactEmail?: string;
  subscriptionActive?: boolean;
};

export const placeCategoryLabels: Record<PlaceCategory, string> = {
  eat: 'Eat',
  cafes: 'Cafes',
  bars: 'Bars',
  shops: 'Shops',
  nightlife: 'Go out',
  markets: 'Markets',
  fitness: 'Fitness',
  entertainment: 'Fun',
};

/** Subcategories suggested for business place listings */
export const businessPlaceSubcategories: Array<{ category: PlaceCategory; label: string; emoji: string }> = [
  { category: 'entertainment', label: 'Axe throwing', emoji: '🪓' },
  { category: 'entertainment', label: 'Bowling', emoji: '🎳' },
  { category: 'entertainment', label: 'Arcade', emoji: '🕹️' },
  { category: 'entertainment', label: 'Escape room', emoji: '🔐' },
  { category: 'entertainment', label: 'Mini golf', emoji: '⛳' },
  { category: 'shops', label: 'Thrift', emoji: '👗' },
  { category: 'shops', label: 'Vintage', emoji: '🕶️' },
  { category: 'shops', label: 'Retail', emoji: '🛍️' },
  { category: 'eat', label: 'Restaurant', emoji: '🍽️' },
  { category: 'cafes', label: 'Cafe', emoji: '☕' },
  { category: 'bars', label: 'Bar', emoji: '🍸' },
  { category: 'nightlife', label: 'Live music', emoji: '🎶' },
  { category: 'fitness', label: 'Fitness', emoji: '💪' },
  { category: 'markets', label: 'Market', emoji: '🧺' },
  { category: 'entertainment', label: 'Other fun', emoji: '✨' },
];
