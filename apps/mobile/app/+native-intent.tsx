import { isAuthCallbackUrl } from '@/lib/authRedirect';

function toAuthCallbackPath(path: string) {
  const queryIndex = path.indexOf('?');
  const hashIndex = path.indexOf('#');
  const suffix =
    queryIndex !== -1 ? path.slice(queryIndex) : hashIndex !== -1 ? path.slice(hashIndex) : '';
  return `/auth-callback${suffix}`;
}

function shouldRewriteAuthPath(path: string) {
  const normalized = path.replace(/^\//, '');
  return (
    isAuthCallbackUrl(path) ||
    normalized === 'auth' ||
    normalized.startsWith('auth?') ||
    normalized.startsWith('auth#') ||
    normalized === 'event/auth' ||
    normalized.startsWith('event/auth?') ||
    normalized.startsWith('event/auth#') ||
    normalized.startsWith('auth-callback')
  );
}

/**
 * Rewrites magic-link paths before Expo Router can misroute `auth` → `/event/auth`.
 * Must preserve ?code=… or #access_token=… or sign-in will fail.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (shouldRewriteAuthPath(path)) {
      if (path.startsWith('/auth-callback')) return path;
      return toAuthCallbackPath(path);
    }
  } catch {
    // Never throw — crashes the app on a bad deep link.
  }
  return path;
}
