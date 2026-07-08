import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  createDigestSignup,
  createEventSubmission,
  fetchCuratedLists,
  fetchPublishedEvents,
  fetchSavedEventIds,
  fetchSubmissionsByEmail,
  persistSavedEvent,
} from '@/lib/api';
import { requestUserLocation, type UserLocation } from '@/lib/location';
import {
  buildFeed,
  getHiddenGems,
  getSponsored,
  getTrending,
  neighborhoods,
  vibes,
} from '@/lib/shared';
import { useAuth } from '@/context/AuthContext';
import { events as localEvents, lists as localLists } from '@/lib/data';
import { filterPlacesByCategory, pullPlacesFromCommunity } from '@/lib/communityPlaces';
import { feedPosts as localFeedPosts } from '@/lib/feedData';
import type { CuratedList, DigestSignup, EventFilters, EventSubmission, RvaEvent, TimeWindow, UserPrefs } from '@/types/event';
import type { FeedPost } from '@/types/feed';
import type { Place, PlaceCategory } from '@/types/place';
import type { TicketTypeInput } from '@/types/ticket';

const PREFS_KEY = 'citipilot-prefs';
const SAVED_KEY = 'citipilot-saved';
const DIGEST_KEY = 'citipilot-digest';
const SUBMISSIONS_KEY = 'citipilot-submissions';
const SUBMISSIONS_EMAIL_KEY = 'citipilot-submissions-email';
const SAVED_PLACES_KEY = 'citipilot-saved-places';
const ADDED_PLACES_KEY = 'citipilot-added-places';

type DataSource = 'supabase' | 'local';

type AppContextValue = {
  events: RvaEvent[];
  lists: CuratedList[];
  places: Place[];
  socialPosts: FeedPost[];
  neighborhoods: string[];
  vibes: string[];
  prefs: UserPrefs;
  filters: EventFilters;
  savedIds: string[];
  feed: RvaEvent[];
  trending: RvaEvent[];
  sponsored: RvaEvent[];
  hiddenGems: RvaEvent[];
  digest: DigestSignup | null;
  submissions: EventSubmission[];
  ready: boolean;
  loading: boolean;
  dataSource: DataSource;
  userLocation: UserLocation | null;
  savedPlaceIds: string[];
  getPlacesByCategory: (category?: PlaceCategory | 'all') => Place[];
  toggleSavedPlace: (id: string) => void;
  isPlaceSaved: (id: string) => boolean;
  refreshData: (options?: { silent?: boolean }) => Promise<void>;
  setPrefs: (prefs: UserPrefs) => void;
  toggleNeighborhood: (value: string) => void;
  toggleVibe: (value: string) => void;
  setFilter: <K extends keyof EventFilters>(key: K, value: EventFilters[K]) => void;
  setTimeWindow: (window: TimeWindow) => void;
  resetFilters: () => void;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  getEvent: (id: string) => RvaEvent | undefined;
  signUpDigest: (contact: string, channel: 'email' | 'sms') => Promise<void>;
  submitEvent: (
    input: Omit<EventSubmission, 'id' | 'submittedAt'> & { ticketTypes?: TicketTypeInput[] },
  ) => Promise<EventSubmission>;
  refreshSubmissions: (email?: string) => Promise<void>;
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

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, syncPrefsToProfile } = useAuth();
  const [prefs, setPrefsState] = useState<UserPrefs>(defaultPrefs);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [filters, setFilters] = useState<EventFilters>(defaultFilters);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [userAddedPlaces, setUserAddedPlaces] = useState<Place[]>([]);
  const [digest, setDigest] = useState<DigestSignup | null>(null);
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [events, setEvents] = useState<RvaEvent[]>(localEvents);
  const [lists, setLists] = useState<CuratedList[]>(localLists);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('local');
  const socialPosts = localFeedPosts;

  const refreshData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    try {
      const [eventResult, listResult] = await Promise.all([fetchPublishedEvents(), fetchCuratedLists()]);
      setEvents(eventResult.events);
      setLists(listResult.lists);
      setDataSource(eventResult.source === 'supabase' || listResult.source === 'supabase' ? 'supabase' : 'local');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  const refreshSubmissions = useCallback(async (email?: string) => {
    const lookupEmail = email ?? (await AsyncStorage.getItem(SUBMISSIONS_EMAIL_KEY)) ?? '';
    if (!lookupEmail.trim()) return;

    const remote = await fetchSubmissionsByEmail(lookupEmail);
    if (!remote.length) return;

    setSubmissions(remote);
    await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(remote));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let storedEmail = '';
      try {
        const [storedPrefs, storedSaved, storedDigest, storedSubmissions, email, storedPlaces, storedAdded] =
          await Promise.all([
            AsyncStorage.getItem(PREFS_KEY),
            AsyncStorage.getItem(SAVED_KEY),
            AsyncStorage.getItem(DIGEST_KEY),
            AsyncStorage.getItem(SUBMISSIONS_KEY),
            AsyncStorage.getItem(SUBMISSIONS_EMAIL_KEY),
            AsyncStorage.getItem(SAVED_PLACES_KEY),
            AsyncStorage.getItem(ADDED_PLACES_KEY),
          ]);
        if (cancelled) return;
        if (storedPrefs) setPrefsState(JSON.parse(storedPrefs));
        if (storedSaved) setSavedIds(JSON.parse(storedSaved));
        if (storedDigest) setDigest(JSON.parse(storedDigest));
        if (storedSubmissions) setSubmissions(JSON.parse(storedSubmissions));
        if (storedPlaces) setSavedPlaceIds(JSON.parse(storedPlaces));
        if (storedAdded) setUserAddedPlaces(JSON.parse(storedAdded));
        storedEmail = email ?? '';
      } finally {
        if (!cancelled) setReady(true);
      }

      // Network + GPS in background — never block the loading gate.
      void refreshData({ silent: true });
      if (storedEmail) void refreshSubmissions(storedEmail);
      void requestUserLocation().then((loc) => {
        if (!cancelled && loc) setUserLocation(loc);
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshData, refreshSubmissions]);

  useEffect(() => {
    if (!user) return;
    void fetchSavedEventIds(user.id).then(setSavedIds);
  }, [user]);

  const setPrefs = useCallback((next: UserPrefs) => {
    setPrefsState(next);
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
    void syncPrefsToProfile(next);
  }, [syncPrefsToProfile]);

  const toggleNeighborhood = useCallback((value: string) => {
    setPrefsState((current) => {
      const nextNeighborhoods = current.neighborhoods.includes(value)
        ? current.neighborhoods.filter((n) => n !== value)
        : [...current.neighborhoods, value];
      const next = { ...current, neighborhoods: nextNeighborhoods };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
      void syncPrefsToProfile(next);
      return next;
    });
  }, [syncPrefsToProfile]);

  const toggleVibe = useCallback((value: string) => {
    setPrefsState((current) => {
      const nextVibes = current.vibes.includes(value)
        ? current.vibes.filter((v) => v !== value)
        : [...current.vibes, value];
      const next = { ...current, vibes: nextVibes };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
      void syncPrefsToProfile(next);
      return next;
    });
  }, [syncPrefsToProfile]);

  const setFilter = useCallback(<K extends keyof EventFilters>(key: K, value: EventFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const setTimeWindow = useCallback((timeWindow: TimeWindow) => {
    setFilters((current) => ({ ...current, timeWindow }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters((current) => ({ ...defaultFilters, timeWindow: current.timeWindow, searchQuery: '' }));
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
      if (user) void persistSavedEvent(user.id, id, !current.includes(id));
      return next;
    });
  }, [user]);

  const signUpDigest = useCallback(async (contact: string, channel: 'email' | 'sms') => {
    const signup = await createDigestSignup(contact, channel);
    setDigest(signup);
    await AsyncStorage.setItem(DIGEST_KEY, JSON.stringify(signup));
  }, []);

  const submitEvent = useCallback(async (
    input: Omit<EventSubmission, 'id' | 'submittedAt'> & { ticketTypes?: TicketTypeInput[] },
  ) => {
    await AsyncStorage.setItem(SUBMISSIONS_EMAIL_KEY, input.email.trim());
    const submission = await createEventSubmission(input);
    setSubmissions((current) => {
      const next = [submission, ...current.filter((row) => row.id !== submission.id)];
      AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(next));
      return next;
    });
    return submission;
  }, []);

  const feed = useMemo(() => buildFeed(events, prefs, filters), [events, prefs, filters]);
  const trending = useMemo(() => getTrending(events, prefs, 5, userLocation), [events, prefs, userLocation]);
  const sponsored = useMemo(() => getSponsored(events), [events]);
  const hiddenGems = useMemo(() => getHiddenGems(events), [events]);

  /** Corner-style: places are pulled from community posts (+ anything you add). */
  const places = useMemo(
    () =>
      pullPlacesFromCommunity({
        posts: socialPosts,
        savedPlaceIds,
        userAddedPlaces,
      }),
    [socialPosts, savedPlaceIds, userAddedPlaces],
  );

  const getPlacesByCategory = useCallback(
    (category: PlaceCategory | 'all' = 'all') => filterPlacesByCategory(places, category),
    [places],
  );

  const toggleSavedPlace = useCallback((id: string) => {
    setSavedPlaceIds((current) => {
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
      AsyncStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      events,
      lists,
      places,
      socialPosts,
      neighborhoods,
      vibes,
      prefs,
      filters,
      savedIds,
      feed,
      trending,
      sponsored,
      hiddenGems,
      digest,
      submissions,
      ready,
      loading,
      dataSource,
      userLocation,
      savedPlaceIds,
      getPlacesByCategory,
      toggleSavedPlace,
      isPlaceSaved: (id) => savedPlaceIds.includes(id),
      refreshData,
      setPrefs,
      toggleNeighborhood,
      toggleVibe,
      setFilter,
      setTimeWindow,
      resetFilters,
      toggleSaved,
      isSaved: (id) => savedIds.includes(id),
      getEvent: (id) => events.find((e) => e.id === id),
      signUpDigest,
      submitEvent,
      refreshSubmissions,
    }),
    [
      events,
      lists,
      places,
      socialPosts,
      prefs,
      filters,
      savedIds,
      feed,
      trending,
      sponsored,
      hiddenGems,
      digest,
      submissions,
      ready,
      loading,
      dataSource,
      userLocation,
      savedPlaceIds,
      getPlacesByCategory,
      toggleSavedPlace,
      refreshData,
      setPrefs,
      toggleNeighborhood,
      toggleVibe,
      setFilter,
      setTimeWindow,
      resetFilters,
      toggleSaved,
      signUpDigest,
      submitEvent,
      refreshSubmissions,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
