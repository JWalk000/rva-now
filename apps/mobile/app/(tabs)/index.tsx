import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { EventPosterCard } from '@/components/EventPosterCard';
import { HeroHeader } from '@/components/HeroHeader';
import { HomeEventRow } from '@/components/HomeEventRow';
import { HomePlaceCard } from '@/components/HomePlaceCard';
import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { timeWindows } from '@/lib/data';
import { placeCategoryLabels, type PlaceCategory } from '@/types/place';

const PLACE_FILTERS: Array<PlaceCategory | 'all'> = [
  'all',
  'eat',
  'cafes',
  'bars',
  'shops',
  'nightlife',
];

export default function HomeScreen() {
  const {
    feed,
    trending,
    sponsored,
    filters,
    loading,
    refreshData,
    setFilter,
    setTimeWindow,
    getPlacesByCategory,
  } = useApp();
  const router = useRouter();
  const [placeCategory, setPlaceCategory] = useState<PlaceCategory | 'all'>('all');
  const visiblePlaces = getPlacesByCategory(placeCategory);
  const heroEvents = sponsored.length ? sponsored : trending;
  const extraTrending = trending.filter((event) => !heroEvents.some((hero) => hero.id === event.id));

  return (
    <View style={styles.screen}>
      <HeroHeader title="Create Your Day" subtitle="Events, places, and what RVA is doing right now." />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void refreshData()} tintColor={theme.colors.accent} />
        }>
        <View style={styles.body}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeRow}>
            {timeWindows.map((window) => {
              const active = filters.timeWindow === window.id;
              return (
                <Pressable
                  key={window.id}
                  onPress={() => setTimeWindow(window.id)}
                  style={[styles.timeChip, active && styles.timeChipActive]}>
                  <Text style={[styles.timeText, active && styles.timeTextActive]}>{window.label}</Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setFilter('freeOnly', !filters.freeOnly)}
              style={[styles.timeChip, filters.freeOnly && styles.timeChipActive]}>
              <Text style={[styles.timeText, filters.freeOnly && styles.timeTextActive]}>
                {filters.freeOnly ? '✓ Free' : 'Free'}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push('/modal')} style={styles.timeChip}>
              <Text style={styles.timeText}>Vibes</Text>
            </Pressable>
          </ScrollView>

          {heroEvents.length ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Tonight’s Picks</Text>
                <Text style={styles.sectionTitle}>Trending</Text>
                <Text style={styles.sectionSub}>What people are locking in</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToAlignment="start"
                contentContainerStyle={styles.hRow}>
                {heroEvents.map((event, index) => (
                  <EventPosterCard key={event.id} event={event} large={index === 0} />
                ))}
                {extraTrending.map((event) => (
                  <EventPosterCard key={event.id} event={event} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Community Map</Text>
              <Text style={styles.sectionTitle}>Around Town</Text>
                <Text style={styles.sectionSub}>
                {visiblePlaces.length} spots from posts and top reviews
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRow}>
              {PLACE_FILTERS.map((category) => {
                const active = placeCategory === category;
                const label = category === 'all' ? 'All' : placeCategoryLabels[category];
                return (
                  <Pressable
                    key={category}
                    onPress={() => setPlaceCategory(category)}
                    style={[styles.catChip, active && styles.catChipActive]}>
                    <Text style={[styles.catText, active && styles.catTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hRow}>
              {visiblePlaces.map((place) => (
                <HomePlaceCard key={place.id} place={place} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Personalized</Text>
              <Text style={styles.sectionTitle}>For You</Text>
              <Text style={styles.sectionSub}>
                {feed.length} events matching your neighborhoods and vibes
              </Text>
            </View>

            {feed.length ? (
              feed.map((event) => <HomeEventRow key={event.id} event={event} />)
            ) : (
              <EmptyState
                title="No Matches Yet"
                body="Tune your vibes or try a different time window."
                actionLabel="Open Your RVA"
                onAction={() => router.push('/modal')}
              />
            )}
          </View>

          {sponsored.length ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Promoted</Text>
                <Text style={styles.sectionTitle}>Featured</Text>
                <Text style={styles.sectionSub}>Highlighted by organizers</Text>
              </View>
              {sponsored.map((event) => (
                <HomeEventRow key={event.id} event={event} />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07060A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  body: {
    paddingTop: 18,
    gap: 28,
  },
  timeRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#141218',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  timeChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
  timeTextActive: {
    color: '#07060A',
  },
  section: {
    gap: 14,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.colors.accent,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.6,
  },
  sectionSub: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  hRow: {
    gap: 12,
    paddingRight: 16,
  },
  catRow: {
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#141218',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  catChipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  catText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
  catTextActive: {
    color: '#fff',
  },
});
