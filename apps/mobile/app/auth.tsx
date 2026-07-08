import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function AuthScreen() {
  const { signIn, user, logout } = useAuth();
  const { error: callbackError } = useLocalSearchParams<{ error?: string }>();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof callbackError === 'string' && callbackError) {
      setError(callbackError);
      setSent(false);
    }
  }, [callbackError]);

  useEffect(() => {
    if (user) setSent(false);
  }, [user]);

  if (user) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Signed in</Text>
        <Text style={styles.copy}>{user.email}</Text>
        <Text style={styles.hint}>Saved events sync to your account across devices.</Text>
        <Pressable style={styles.ctaSecondary} onPress={() => void logout()}>
          <Text style={styles.ctaSecondaryText}>Sign out</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Sign in to RVA Now</Text>
      <Text style={styles.copy}>Magic link — no password. Sync saves across devices.</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={theme.colors.textMuted}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {sent ? (
        <Text style={styles.success}>
          Check your email for the sign-in link. Open it on this phone with Expo Go in the background.
        </Text>
      ) : (
        <Pressable
          style={styles.cta}
          onPress={async () => {
            try {
              setError('');
              await signIn(email.trim());
              setSent(true);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Sign in failed');
            }
          }}>
          <Text style={styles.ctaText}>Send magic link</Text>
        </Pressable>
      )}
      <Pressable onPress={() => router.back()}>
        <Text style={styles.link}>Continue without account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: theme.spacing.lg, justifyContent: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.background },
  title: { fontSize: 28, fontWeight: '800', color: theme.colors.text },
  copy: { fontSize: 15, color: theme.colors.textSecondary, lineHeight: 22 },
  hint: { fontSize: 14, color: theme.colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  cta: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.pill, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: theme.colors.white, fontWeight: '700', fontSize: 16 },
  ctaSecondary: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingVertical: 14, alignItems: 'center' },
  ctaSecondaryText: { color: theme.colors.text, fontWeight: '700' },
  link: { textAlign: 'center', color: theme.colors.accent, fontWeight: '600', marginTop: theme.spacing.sm },
  error: { color: '#b00020', fontSize: 14 },
  success: { color: theme.colors.accent, fontWeight: '600' },
});
