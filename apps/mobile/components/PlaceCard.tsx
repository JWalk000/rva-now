import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { sourceLabel } from '@/lib/communityPlaces';
import type { Place } from '@/types/place';

type Props = {
  place: Place;
  compact?: boolean;
};

export function PlaceCard({ place, compact = false }: Props) {
  const { isPlaceSaved, toggleSavedPlace } = useApp();
  const saved = isPlaceSaved(place.id);

  return (
    <View style={[styles.card, compact && styles.compact]}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{place.emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {place.subcategory} · {place.priceLevel}
        </Text>
        <Text style={styles.neighborhood}>
          {place.neighborhood}
          {place.postCount ? ` · ${place.postCount} post${place.postCount === 1 ? '' : 's'}` : ''}
        </Text>
        <Text style={styles.source}>{sourceLabel(place)}</Text>
        {place.recentHandles.length ? (
          <Text style={styles.handles} numberOfLines={1}>
            @{place.recentHandles.join(' · @')}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={() => toggleSavedPlace(place.id)} hitSlop={8} style={styles.saveBtn}>
        <Text style={[styles.save, saved && styles.saveActive]}>{saved ? '★' : '☆'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  compact: {
    width: 260,
    marginRight: theme.spacing.sm,
  },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
  },
  meta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  neighborhood: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  source: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.accent,
    marginTop: 2,
  },
  handles: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  save: {
    fontSize: 18,
    color: theme.colors.textMuted,
  },
  saveActive: {
    color: theme.colors.accent,
  },
});
