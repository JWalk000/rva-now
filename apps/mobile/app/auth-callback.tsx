import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { collectAuthCallbackUrls, handleAuthRedirect } from '@/lib/authRedirect';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const liveUrl = Linking.useURL();
  const routeParams = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();
  const [message, setMessage] = useState('Signing you in…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function completeSignIn() {
      try {
        // Router may land before Linking exposes the full callback URL.
        await new Promise((resolve) => setTimeout(resolve, 150));

        const urls = new Set<string>();
        if (liveUrl) urls.add(liveUrl);
        for (const url of await collectAuthCallbackUrls()) urls.add(url);

        let signedIn = false;
        let lastError: string | null = null;

        for (const callbackUrl of urls) {
          try {
            if (await handleAuthRedirect(callbackUrl, routeParams)) {
              signedIn = true;
              break;
            }
          } catch (error) {
            lastError = error instanceof Error ? error.message : 'Sign in failed.';
          }
        }

        if (!signedIn && !lastError && routeParams.code) {
          try {
            signedIn = await handleAuthRedirect('auth-callback://cb', routeParams);
          } catch (error) {
            lastError = error instanceof Error ? error.message : 'Sign in failed.';
          }
        }

        if (cancelled) return;

        if (signedIn) {
          router.replace('/auth');
          return;
        }

        const detail =
          lastError ??
          'Could not finish sign in. Request a new magic link and open it on this phone.';
        setFailed(true);
        setMessage(detail);
      } catch (error) {
        if (cancelled) return;
        setFailed(true);
        setMessage(error instanceof Error ? error.message : 'Sign in failed.');
      }
    }

    void completeSignIn();
    return () => {
      cancelled = true;
    };
  }, [liveUrl, routeParams, router]);

  return (
    <View style={styles.wrap}>
      {!failed ? <ActivityIndicator size="large" color={theme.colors.accent} /> : null}
      <Text style={styles.text}>{message}</Text>
      {failed ? (
        <Pressable style={styles.button} onPress={() => router.replace('/auth')}>
          <Text style={styles.buttonText}>Back to sign in</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  text: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
