export type TimeWindow = 'today' | 'weekend' | 'week';

export type EventSourceType = 'venue' | 'business' | 'market' | 'popup' | 'community' | 'organizer';

export type SourcePlatform = 'manual' | 'posh' | 'eventbrite' | 'submission';

export type PromotionTier = 'free' | 'featured' | 'subscription';

export type RvaEvent = {
  id: string;
  title: string;
  neighborhood: string;
  vibe: string[];
  day: string;
  time: string;
  venue: string;
  price: string;
  featured: boolean;
  hiddenGem: boolean;
  sponsored: boolean;
  trendingScore: number;
  when: TimeWindow[];
  source: string;
  sourceType: EventSourceType;
  sourcePlatform: SourcePlatform;
  sourceUrl?: string | null;
  ticketUrl?: string | null;
  externalId?: string | null;
  description: string;
  lat: number;
  lng: number;
  sellsTickets?: boolean;
  submissionId?: string | null;
};

export type CuratedList = {
  id: string;
  title: string;
  by: string;
  description: string;
  items: string[];
  eventSlugs: string[];
};

export type UserPrefs = {
  neighborhoods: string[];
  vibes: string[];
};

export type EventFilters = {
  neighborhood: string;
  vibe: string;
  freeOnly: boolean;
  timeWindow: TimeWindow;
  searchQuery: string;
};

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export type EventSubmission = {
  id: string;
  title: string;
  neighborhood: string;
  dateTime: string;
  venue: string;
  email: string;
  tier: PromotionTier;
  pitch: string;
  submittedAt: string;
  status?: SubmissionStatus;
  paymentStatus?: string;
  publishedSlug?: string | null;
  ticketingEnabled?: boolean;
};

export type DigestSignup = {
  contact: string;
  channel: 'email' | 'sms';
  signedUpAt: string;
};
