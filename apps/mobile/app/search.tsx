import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { EventCard } from '@/components/EventCard';
import { SearchBar } from '@/components/SearchBar';
import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { feed, filters, setFilter } = useApp();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + theme.spacing.md }]}>
      <Text style={styles.title}>Search</Text>
      <SearchBar value={filters.searchQuery} onChange={(q) => setFilter('searchQuery', q)} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {feed.length ? (
          feed.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <EmptyState title="No results" body="Try a venue, neighborhood, or vibe." />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
  },
  content: {
    gap: theme.spacing.md,
    paddingBottom: 120,
  },
});
