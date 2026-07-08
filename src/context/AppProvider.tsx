'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createDigestSignup, createEventSubmission, fetchBusinessPlaces, fetchCuratedLists, fetchPublishedEvents } from '@/lib/api';
import { coordsForNeighborhood, filterPlacesByCategory, pullPlacesFromCommunity } from '@/lib/communityPlaces';
import { events as localEvents, lists as localLists, neighborhoods, timeWindows, vibes } from '@/lib/data';
import { feedPosts as localFeedPosts } from '@/lib/feedData';
import {
  buildFeed,
  getHiddenGems,
  getSponsored,
  getTrending,
} from '@/lib/helpers';
import type {
  CuratedList,
  DigestSignup,
  EventFilters,
  EventSubmission,
  RvaEvent,
  TimeWindow,
  UserPrefs,
} from '@/types/event';
import type { FeedPost } from '@/types/feed';
import type { Place, PlaceCategory } from '@/types/place';
import type { TicketTypeInput } from '@/types/ticket';

const PREFS_KEY = 'citipilot-prefs';
const SAVED_KEY = 'citipilot-saved';
const SAVED_PLACES_KEY = 'citipilot-saved-places';
const USER_POSTS_KEY = 'citipilot-user-posts';
const MY_PLACE_IDS_KEY = 'citipilot-my-place-ids';
const PENDING_PLACE_KEY = 'citipilot-pending-place';

export type BusinessPlaceInput = {
  name: string;
  category: PlaceCategory;
  subcategory: string;
  neighborhood: string;
  description: string;
  emoji?: string;
  address?: string;
  lat?: number;
  lng?: number;
  website?: string;
  contactEmail: string;
};

export type CreateSocialPostInput = Omit<
  FeedPost,
  'id' | 'createdAt' | 'likes' | 'comments' | 'shares' | 'userName' | 'userHandle' | 'avatarColor'
> & {
  userName?: string;
  userHandle?: string;
  avatarColor?: string;
};

const defaultPrefs: UserPrefs = {
  neighborhoods: ["The Fan", "Scott's Addition", 'Carytown'],
  vibes: ['Food & Drink', 'Live Music', 'Free'],
};

const defaultFilters: EventFilters = {
  neighborhood: '',
  vibe: '',
  freeOnly: false,
  timeWindow: 'weekend',
  searchQuery: '',
};

type AppContextValue = {
  events: RvaEvent[];
  lists: CuratedList[];
  places: Place[];
  socialPosts: FeedPost[];
  neighborhoods: string[];
  vibes: string[];
  timeWindows: typeof timeWindows;
  prefs: UserPrefs;
  filters: EventFilters;
  savedIds: string[];
  feed: RvaEvent[];
  trending: RvaEvent[];
  sponsored: RvaEvent[];
  hiddenGems: RvaEvent[];
  digest: DigestSignup | null;
  ready: boolean;
  loading: boolean;
  savedPlaceIds: string[];
  businessPlaces: Place[];
  myPlaceIds: string[];
  getPlacesByCategory: (category?: PlaceCategory | 'all') => Place[];
  toggleSavedPlace: (id: string) => void;
  isPlaceSaved: (id: string) => boolean;
  createSocialPost: (input: CreateSocialPostInput) => FeedPost;
  savePendingBusinessPlace: (input: BusinessPlaceInput) => Place;
  refreshBusinessPlaces: () => Promise<Place[]>;
  refreshData: () => Promise<void>;
  toggleNeighborhood: (value: string) => void;
  toggleVibe: (value: string) => void;
  setFilter: <K extends keyof EventFilters>(key: K, value: EventFilters[K]) => void;
  setTimeWindow: (window: TimeWindow) => void;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  getEvent: (id: string) => RvaEvent | undefined;
  signUpDigest: (contact: string, channel: 'email' | 'sms') => Promise<void>;
  submitEvent: (
    input: Omit<EventSubmission, 'id' | 'submittedAt'> & { ticketTypes?: TicketTypeInput[] },
  ) => Promise<EventSubmission>;
};

const AppContext = createContext<AppContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<UserPrefs>(defaultPrefs);
  const [filters, setFilters] = useState<EventFilters>(defaultFilters);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [digest, setDigest] = useState<DigestSignup | null>(null);
  const [events, setEvents] = useState<RvaEvent[]>(localEvents);
  const [lists, setLists] = useState<CuratedList[]>(localLists);
  const [userPosts, setUserPosts] = useState<FeedPost[]>([]);
  const [businessPlaces, setBusinessPlaces] = useState<Place[]>([]);
  const [myPlaceIds, setMyPlaceIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const socialPosts = useMemo(
    () =>
      [...userPosts, ...localFeedPosts].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    [userPosts],
  );

  const places = useMemo(
    () =>
      pullPlacesFromCommunity({
        posts: socialPosts,
        savedPlaceIds,
        userAddedPlaces: businessPlaces,
      }),
    [socialPosts, savedPlaceIds, businessPlaces],
  );

  const refreshBusinessPlaces = useCallback(async () => {
    const places = await fetchBusinessPlaces();
    setBusinessPlaces(places);
    return places;
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventResult, listResult, dbPlaces] = await Promise.all([
        fetchPublishedEvents(),
        fetchCuratedLists(),
        fetchBusinessPlaces(),
      ]);
      setEvents(eventResult.events);
      setLists(listResult.lists);
      setBusinessPlaces(dbPlaces);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPrefs(readJson(PREFS_KEY, defaultPrefs));
    setSavedIds(readJson(SAVED_KEY, []));
    setSavedPlaceIds(readJson(SAVED_PLACES_KEY, []));
    setUserPosts(readJson(USER_POSTS_KEY, []));
    setMyPlaceIds(readJson(MY_PLACE_IDS_KEY, []));
    void refreshData().finally(() => setReady(true));
  }, [refreshData]);

  const feed = useMemo(() => buildFeed(events, prefs, filters), [events, prefs, filters]);
  const trending = useMemo(() => getTrending(events, prefs), [events, prefs]);
  const sponsored = useMemo(() => getSponsored(events), [events]);
  const hiddenGems = useMemo(() => getHiddenGems(events), [events]);

  const toggleNeighborhood = useCallback((value: string) => {
    setPrefs((current) => {
      const next = {
        ...current,
        neighborhoods: current.neighborhoods.includes(value)
          ? current.neighborhoods.filter((n) => n !== value)
          : [...current.neighborhoods, value],
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleVibe = useCallback((value: string) => {
    setPrefs((current) => {
      const next = {
        ...current,
        vibes: current.vibes.includes(value)
          ? current.vibes.filter((v) => v !== value)
          : [...current.vibes, value],
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setFilter = useCallback(<K extends keyof EventFilters>(key: K, value: EventFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const setTimeWindow = useCallback((window: TimeWindow) => {
    setFilters((current) => ({ ...current, timeWindow: window }));
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleSavedPlace = useCallback((id: string) => {
    setSavedPlaceIds((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getEvent = useCallback((id: string) => events.find((e) => e.id === id), [events]);
  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);
  const isPlaceSaved = useCallback((id: string) => savedPlaceIds.includes(id), [savedPlaceIds]);
  const getPlacesByCategory = useCallback(
    (category: PlaceCategory | 'all' = 'all') => filterPlacesByCategory(places, category),
    [places],
  );

  const createSocialPost = useCallback((input: CreateSocialPostInput) => {
    const post: FeedPost = {
      ...input,
      id: `user-post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userName: input.userName?.trim() || 'You',
      userHandle: input.userHandle?.trim() || 'you',
      avatarColor: input.avatarColor || '#C44B2F',
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
    };
    setUserPosts((current) => {
      const next = [post, ...current];
      localStorage.setItem(USER_POSTS_KEY, JSON.stringify(next));
      return next;
    });
    return post;
  }, []);

  const savePendingBusinessPlace = useCallback((input: BusinessPlaceInput) => {
    const fallback = coordsForNeighborhood(input.neighborhood);
    const place: Place = {
      id: `biz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name.trim(),
      category: input.category,
      subcategory: input.subcategory.trim(),
      neighborhood: input.neighborhood,
      description: input.description.trim(),
      emoji: input.emoji || '📍',
      priceLevel: '$$',
      lat: input.lat ?? fallback.lat,
      lng: input.lng ?? fallback.lng,
      source: 'business',
      featured: true,
      postCount: 0,
      lastActiveAt: new Date().toISOString(),
      recentHandles: [],
      address: input.address?.trim() || undefined,
      website: input.website?.trim() || undefined,
      contactEmail: input.contactEmail.trim(),
      subscriptionActive: false,
    };
    localStorage.setItem(PENDING_PLACE_KEY, JSON.stringify(place));
    setMyPlaceIds((current) => {
      const next = current.includes(place.id) ? current : [place.id, ...current];
      localStorage.setItem(MY_PLACE_IDS_KEY, JSON.stringify(next));
      return next;
    });
    return place;
  }, []);

  const signUpDigest = useCallback(async (contact: string, channel: 'email' | 'sms') => {
    const signup = await createDigestSignup(contact, channel);
    setDigest(signup);
  }, []);

  const submitEvent = useCallback(
    async (input: Omit<EventSubmission, 'id' | 'submittedAt'> & { ticketTypes?: TicketTypeInput[] }) => {
      return createEventSubmission(input);
    },
    [],
  );

  const value: AppContextValue = {
    events,
    lists,
    places,
    socialPosts,
    neighborhoods,
    vibes,
    timeWindows,
    prefs,
    filters,
    savedIds,
    feed,
    trending,
    sponsored,
    hiddenGems,
    digest,
    ready,
    loading,
    savedPlaceIds,
    businessPlaces,
    myPlaceIds,
    getPlacesByCategory,
    toggleSavedPlace,
    isPlaceSaved,
    createSocialPost,
    savePendingBusinessPlace,
    refreshBusinessPlaces,
    refreshData,
    toggleNeighborhood,
    toggleVibe,
    setFilter,
    setTimeWindow,
    toggleSaved,
    isSaved,
    getEvent,
    signUpDigest,
    submitEvent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
