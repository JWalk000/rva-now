import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { buildFeed } from '@/lib/helpers';
import { placeCategoryLabels, type PlaceCategory } from '@/types/place';

const RVA_REGION = {
  latitude: 37.5407,
  longitude: -77.436,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const MAP_FILTERS: Array<'all' | 'events' | PlaceCategory> = [
  'all',
  'events',
  'eat',
  'cafes',
  'bars',
  'shops',
  'nightlife',
];

type MapPin = {
  id: string;
  kind: 'event' | 'place';
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  meta: string;
  emoji: string;
  color: string;
  hint?: string;
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { events, prefs, filters, userLocation, getPlacesByCategory, places } = useApp();
  const [layer, setLayer] = useState<'all' | 'events' | PlaceCategory>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapRegion = userLocation
    ? { latitude: userLocation.lat, longitude: userLocation.lng, latitudeDelta: 0.06, longitudeDelta: 0.06 }
    : RVA_REGION;

  const visibleEvents = useMemo(() => buildFeed(events, prefs, filters), [events, prefs, filters]);

  const pins = useMemo(() => {
    const eventPins: MapPin[] = visibleEvents.map((event) => ({
      id: `event:${event.id}`,
      kind: 'event',
      lat: event.lat,
      lng: event.lng,
      title: event.title,
      subtitle: event.venue,
      meta: `${event.day} · ${event.time} · ${event.price}`,
      emoji: '🎟️',
      color: theme.vibeColors[event.vibe[0]] ?? theme.colors.accent,
    }));

    const placeList = layer === 'events' ? [] : layer === 'all' ? places : getPlacesByCategory(layer);
    const placePins: MapPin[] = placeList.map((place) => {
      const ratingLabel = place.rating ? `★ ${place.rating.toFixed(1)}` : null;
      const socialLabel =
        place.postCount > 0 ? `${place.postCount} post${place.postCount === 1 ? '' : 's'}` : null;
      const metaParts = [place.neighborhood, ratingLabel, socialLabel].filter(Boolean);
      return {
        id: `place:${place.id}`,
        kind: 'place' as const,
        lat: place.lat,
        lng: place.lng,
        title: place.name,
        subtitle: place.subcategory,
        meta: metaParts.join(' · '),
        emoji: place.emoji,
        color: place.rating && place.rating >= 4.7 ? theme.colors.featured : theme.colors.accent,
        hint: place.rating
          ? `${place.reviewCount ?? 0} reviews · Top rated`
          : 'From the community feed',
      };
    });

    if (layer === 'events') return eventPins;
    if (layer === 'all') return [...eventPins, ...placePins];
    return placePins;
  }, [visibleEvents, places, layer, getPlacesByCategory]);

  const selected = pins.find((pin) => pin.id === selectedId) ?? null;
  const eventId = selected?.kind === 'event' ? selected.id.replace(/^event:/, '') : null;

  return (
    <View style={styles.screen}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={mapRegion}
        showsUserLocation
        showsCompass={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        loadingEnabled
        loadingIndicatorColor={theme.colors.accent}
        loadingBackgroundColor={theme.colors.surfaceMuted}
        moveOnMarkerPress={false}
        userInterfaceStyle="light"
        onMapReady={() => setMapReady(true)}
        onPress={() => setSelectedId(null)}>
        {mapReady
          ? pins.map((pin) => (
              <Marker
                key={pin.id}
                coordinate={{ latitude: pin.lat, longitude: pin.lng }}
                pinColor={pin.color}
                title={pin.title}
                description={pin.subtitle}
                tracksViewChanges={false}
                onPress={(e) => {
                  e.stopPropagation?.();
                  setSelectedId(pin.id);
                }}
              />
            ))
          : null}
      </MapView>

      <View style={[styles.chipsWrap, { top: insets.top + theme.spacing.sm }]} pointerEvents="box-none">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {MAP_FILTERS.map((item) => {
            const active = layer === item;
            const label =
              item === 'all' ? 'All' : item === 'events' ? 'Events' : placeCategoryLabels[item];
            return (
              <Pressable
                key={item}
                onPress={() => {
                  setLayer(item);
                  setSelectedId(null);
                }}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {selected ? (
        <View style={[styles.popup, { bottom: theme.spacing.md }]}>
          <View style={styles.popupEmoji}>
            <Text style={styles.popupEmojiText}>{selected.emoji}</Text>
          </View>
          <View style={styles.popupBody}>
            <Text style={styles.popupKind}>{selected.kind === 'event' ? 'Event' : 'Place'}</Text>
            <Text style={styles.popupTitle} numberOfLines={2}>
              {selected.title}
            </Text>
            <Text style={styles.popupSubtitle} numberOfLines={1}>
              {selected.subtitle}
            </Text>
            <Text style={styles.popupMeta} numberOfLines={1}>
              {selected.meta}
            </Text>
            {eventId ? (
              <Link href={`/event/${eventId}`} asChild>
                <Pressable style={styles.popupCta}>
                  <Text style={styles.popupCtaText}>View event →</Text>
                </Pressable>
              </Link>
            ) : (
              <Text style={styles.popupHint}>{selected.hint ?? 'From the community feed'}</Text>
            )}
          </View>
          <Pressable onPress={() => setSelectedId(null)} hitSlop={10} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.hint, { bottom: theme.spacing.md }]} pointerEvents="none">
          <Text style={styles.hintText}>Tap a pin to see what’s there</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.surfaceMuted },
  chipsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  chips: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    ...theme.shadow.card,
    shadowOpacity: 0.08,
  },
  chipActive: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  popup: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  popupEmoji: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupEmojiText: {
    fontSize: 24,
  },
  popupBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  popupKind: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.accent,
  },
  popupTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  popupSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  popupMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  popupCta: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  popupCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  popupHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  closeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(27, 23, 36, 0.82)',
  },
  hintText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
