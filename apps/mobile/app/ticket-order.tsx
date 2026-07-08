import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

export default function TicketOrderRedirect() {
  const { paid, event } = useLocalSearchParams<{ paid?: string; event?: string }>();
  const router = useRouter();

  useEffect(() => {
    if (paid === '1') {
      router.replace('/(tabs)/saved');
      return;
    }
    if (event) {
      router.replace(`/event/${event}`);
      return;
    }
    router.replace('/(tabs)');
  }, [paid, event, router]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.colors.accent} />
      <Text style={styles.copy}>Tickets are on the way to your email…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md, backgroundColor: theme.colors.background },
  copy: { fontSize: 15, color: theme.colors.textSecondary },
});
