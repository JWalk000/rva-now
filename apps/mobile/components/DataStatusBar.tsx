import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { isBackendConfigured } from '@/lib/api';

export function DataStatusBar() {
  const { dataSource, loading, refreshData } = useApp();
  const configured = isBackendConfigured();

  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        {loading ? <ActivityIndicator size="small" color={theme.colors.accent} /> : null}
        <Text style={styles.text}>
          {loading
            ? 'Loading events…'
            : dataSource === 'supabase'
              ? 'Live data from Supabase'
              : configured
                ? 'Using local sample data (check Supabase seed)'
                : 'Sample data — add .env to connect Supabase'}
        </Text>
      </View>
      <Pressable onPress={() => void refreshData()} style={styles.refresh}>
        <Text style={styles.refreshText}>Refresh</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  copy: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  text: { flex: 1, fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },
  refresh: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  refreshText: { fontSize: 12, fontWeight: '700', color: theme.colors.accent },
});
