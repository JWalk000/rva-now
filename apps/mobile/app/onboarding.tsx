import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ONBOARDING_KEY } from '@/components/AppLoadingGate';
import { ChipRow } from '@/components/ChipRow';
import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

export default function OnboardingScreen() {
  const { neighborhoods, vibes, prefs, toggleNeighborhood, toggleVibe } = useApp();
  const { completeOnboarding } = useAuth();

  const canContinue = prefs.neighborhoods.length > 0 && prefs.vibes.length > 0;

  // Onboarding is optional — never trap users here.
  useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Welcome to RVA Now</Text>
      <Text style={styles.title}>Tell us your RVA</Text>
      <Text style={styles.subtitle}>
        Pick neighborhoods and interests so we can surface what’s actually relevant to you.
      </Text>

      <Text style={styles.section}>Where do you hang out?</Text>
      <ChipRow values={neighborhoods} selected={prefs.neighborhoods} onToggle={toggleNeighborhood} />

      <Text style={styles.section}>What are you into?</Text>
      <ChipRow values={vibes} selected={prefs.vibes} onToggle={toggleVibe} />

      <Pressable
        style={[styles.cta, !canContinue && styles.ctaDisabled]}
        disabled={!canContinue}
        onPress={async () => {
          await AsyncStorage.setItem(ONBOARDING_KEY, '1');
          await completeOnboarding(prefs);
          router.replace('/(tabs)');
        }}>
        <Text style={styles.ctaText}>Start exploring</Text>
      </Pressable>

      <Pressable
        style={styles.skip}
        onPress={async () => {
          await AsyncStorage.setItem(ONBOARDING_KEY, '1');
          router.replace('/(tabs)');
        }}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingTop: 80,
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  eyebrow: { fontSize: 13, fontWeight: '700', color: theme.colors.accent, textTransform: 'uppercase' },
  title: { fontSize: 34, fontWeight: '800', color: theme.colors.text },
  subtitle: { fontSize: 16, lineHeight: 24, color: theme.colors.textSecondary },
  section: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.sm },
  cta: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: theme.colors.white, fontSize: 17, fontWeight: '700' },
  skip: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: theme.colors.textMuted, fontSize: 15, fontWeight: '600' },
});
