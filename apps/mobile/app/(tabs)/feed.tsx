import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedPostCard } from '@/components/FeedPostCard';
import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

const FILTERS = ['For You', 'Nearby', 'Events', 'Places'] as const;

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const { socialPosts } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('For You');

  const posts = useMemo(() => {
    if (filter === 'Events') return socialPosts.filter((post) => post.eventTitle);
    if (filter === 'Places') return socialPosts.filter((post) => post.placeName);
    if (filter === 'Nearby') {
      return [...socialPosts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return socialPosts;
  }, [socialPosts, filter]);

  const totalLikes = socialPosts.reduce((sum, post) => sum + post.likes, 0);
  const placePosts = socialPosts.filter((post) => post.placeName).length;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <Text style={styles.eyebrow}>Richmond</Text>
        <Text style={styles.title}>Feed</Text>
        <Text style={styles.subtitle}>
          What people are doing around RVA — posts pin places onto the map.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{socialPosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{placePosts}</Text>
            <Text style={styles.statLabel}>Places</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalLikes}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {FILTERS.map((item) => {
            const active = filter === item;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {posts.length ? (
          posts.map((post) => <FeedPostCard key={post.id} post={post} />)
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No Posts Yet</Text>
            <Text style={styles.emptyBody}>Try another filter to see what’s happening.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07060A',
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: 8,
    backgroundColor: '#0C0B10',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.accent,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.55)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#141218',
    borderRadius: theme.radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  filters: {
    gap: theme.spacing.sm,
    paddingTop: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: '#141218',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: theme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
  filterTextActive: {
    color: '#07060A',
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  empty: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius.xl,
    backgroundColor: '#141218',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  emptyBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
  },
});
