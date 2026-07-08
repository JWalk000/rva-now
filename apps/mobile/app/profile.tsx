import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  return (
    <View style={styles.screen}>
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + theme.spacing.md }]}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>
        {user?.email ? `Signed in as ${user.email}` : 'Sign in to save events across devices.'}
      </Text>

      <Link href="/auth" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>{user ? 'Account settings' : 'Sign in'}</Text>
        </Pressable>
      </Link>

      <Link href="/modal" asChild>
        <Pressable style={styles.buttonSecondary}>
          <Text style={styles.buttonSecondaryText}>Your RVA preferences</Text>
        </Pressable>
      </Link>

      <Link href="/submit" asChild>
        <Pressable style={styles.buttonSecondary}>
          <Text style={styles.buttonSecondaryText}>List your event</Text>
        </Pressable>
      </Link>

      {user ? (
        <Pressable style={styles.buttonGhost} onPress={() => void logout()}>
          <Text style={styles.buttonGhostText}>Sign out</Text>
        </Pressable>
      ) : null}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    flexGrow: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondary: {
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  buttonSecondaryText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonGhost: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonGhostText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
