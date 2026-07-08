import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { AppCover } from '@/components/AppCover';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

export const ONBOARDING_KEY = 'citipilot-onboarding-complete';

/** Never leave users on the cover forever if auth/storage hangs. */
const FORCE_READY_MS = 2500;
/** Always show the city cover long enough to feel intentional. */
const MIN_COVER_MS = 1800;

export function AppLoadingGate({ children }: { children: React.ReactNode }) {
  const { ready } = useApp();
  const { authReady } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const appReady = ((ready && authReady) || timedOut) && minTimePassed;

  useEffect(() => {
    const forceTimer = setTimeout(() => setTimedOut(true), FORCE_READY_MS);
    const coverTimer = setTimeout(() => setMinTimePassed(true), MIN_COVER_MS);
    return () => {
      clearTimeout(forceTimer);
      clearTimeout(coverTimer);
    };
  }, []);

  useEffect(() => {
    // Hide native splash as soon as our city cover is up.
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!appReady) return;
    void AsyncStorage.setItem(ONBOARDING_KEY, '1');
  }, [appReady]);

  if (!appReady) {
    return <AppCover loading />;
  }

  return children;
}
