import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchProfile, signInWithEmail, signOut, updateDisplayName, upsertProfile } from '@/lib/auth';
import { registerForPushNotifications } from '@/lib/notifications';
import { getSupabase } from '@/lib/supabase';
import type { UserPrefs } from '@/types/event';

const USERNAME_KEY = 'citipilot-username';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  username: string | null;
  onboardingComplete: boolean;
  authReady: boolean;
  signIn: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (prefs: UserPrefs) => Promise<void>;
  syncPrefsToProfile: (prefs: UserPrefs) => Promise<void>;
  setUsername: (name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function cleanUsername(value: string) {
  return value.trim().replace(/^@+/, '').slice(0, 24);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(USERNAME_KEY).then((stored) => {
      if (stored) setUsernameState(stored);
    });
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let cancelled = false;

    async function loadProfile(userId: string) {
      try {
        const profile = await fetchProfile(userId);
        if (cancelled) return;
        setOnboardingComplete(profile?.onboarding_complete ?? false);
        if (profile?.display_name) {
          setUsernameState(profile.display_name);
          await AsyncStorage.setItem(USERNAME_KEY, profile.display_name);
        }
      } catch {
        if (!cancelled) setOnboardingComplete(false);
      }
    }

    async function bootAuth() {
      try {
        const sessionPromise = supabase!.auth.getSession();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        if (cancelled) return;

        if (result && 'data' in result) {
          setSession(result.data.session);
          if (result.data.session?.user) {
            void loadProfile(result.data.session.user.id);
            void registerForPushNotifications(result.data.session.user.id);
          }
        }
      } catch {
        // Continue without a session.
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    void bootAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        await loadProfile(nextSession.user.id);
        void registerForPushNotifications(nextSession.user.id);
      } else {
        setOnboardingComplete(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string) => {
    await signInWithEmail(email);
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    setOnboardingComplete(false);
  }, []);

  const completeOnboarding = useCallback(
    async (prefs: UserPrefs) => {
      if (!session?.user) return;
      await upsertProfile(session.user.id, session.user.email ?? '', prefs, true, username);
      setOnboardingComplete(true);
    },
    [session, username],
  );

  const syncPrefsToProfile = useCallback(
    async (prefs: UserPrefs) => {
      if (!session?.user) return;
      await upsertProfile(session.user.id, session.user.email ?? '', prefs, onboardingComplete, username);
    },
    [session, onboardingComplete, username],
  );

  const setUsername = useCallback(
    async (name: string) => {
      const next = cleanUsername(name);
      if (!next) return;
      setUsernameState(next);
      await AsyncStorage.setItem(USERNAME_KEY, next);
      if (session?.user) {
        try {
          await updateDisplayName(session.user.id, next);
        } catch {
          // Local username still works offline.
        }
      }
    },
    [session],
  );

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      username,
      onboardingComplete,
      authReady,
      signIn,
      logout,
      completeOnboarding,
      syncPrefsToProfile,
      setUsername,
    }),
    [
      session,
      username,
      onboardingComplete,
      authReady,
      signIn,
      logout,
      completeOnboarding,
      syncPrefsToProfile,
      setUsername,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
