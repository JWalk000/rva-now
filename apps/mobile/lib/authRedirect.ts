import * as Linking from 'expo-linking';

import { getSupabase } from '@/lib/supabase';

/** Dedicated callback route — avoids Expo Router treating `auth` as `/event/auth`. */
export function getAuthRedirectUrl() {
  return Linking.createURL('auth-callback');
}

export function isAuthCallbackUrl(url: string) {
  const lower = url.toLowerCase();
  return (
    lower.includes('auth-callback') ||
    lower.includes('type=magiclink') ||
    lower.includes('access_token=') ||
    lower.includes('refresh_token=') ||
    lower.includes('code=') ||
    /(?:^|[/:])auth(?:[?#]|$)/i.test(url)
  );
}

/** Supabase magic links put tokens in the URL hash; Linking.parse misses those. */
export function parseAuthParams(
  url: string,
  routeParams?: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const params: Record<string, string> = {};
  const parsed = Linking.parse(url);

  for (const [key, value] of Object.entries(parsed.queryParams ?? {})) {
    if (typeof value === 'string') params[key] = value;
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const hash = url.slice(hashIndex + 1).replace(/^\?/, '');
    for (const [key, value] of new URLSearchParams(hash)) {
      params[key] = value;
    }
  }

  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    const end = hashIndex !== -1 ? hashIndex : url.length;
    const qs = url.slice(queryIndex + 1, end);
    for (const [key, value] of new URLSearchParams(qs)) {
      params[key] = value;
    }
  }

  if (routeParams) {
    for (const [key, value] of Object.entries(routeParams)) {
      if (typeof value === 'string' && value) params[key] = value;
    }
  }

  return params;
}

/** Complete sign-in when the user opens the magic-link email on this device. */
export async function handleAuthRedirect(
  url: string,
  routeParams?: Record<string, string | string[] | undefined>,
): Promise<boolean> {
  const hasRouteCode = typeof routeParams?.code === 'string' && routeParams.code.length > 0;
  if (!isAuthCallbackUrl(url) && !hasRouteCode) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  const params = parseAuthParams(url, routeParams);

  const authError = params.error_description ?? params.error;
  if (authError) {
    throw new Error(authError);
  }

  const code = params.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return true;
  }

  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

export async function collectAuthCallbackUrls(): Promise<string[]> {
  const urls = new Set<string>();
  const candidates = [Linking.getLinkingURL(), Linking.getInitialURL()];
  for (const candidate of candidates) {
    const resolved = typeof candidate === 'string' ? candidate : await candidate;
    if (resolved) urls.add(resolved);
  }
  return [...urls];
}
