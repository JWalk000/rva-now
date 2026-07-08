import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { Place } from '@/types/place';

type Props = {
  place: Place;
};

const CARD_WIDTH = Math.min(Dimensions.get('window').width * 0.44, 170);

export function HomePlaceCard({ place }: Props) {
  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{place.emoji}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {place.name}
      </Text>
      <Text style={styles.sub} numberOfLines={1}>
        {place.subcategory}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {place.neighborhood} · {place.priceLevel}
      </Text>
      <View style={styles.footer}>
        {place.rating ? (
          <Text style={styles.posts} numberOfLines={1}>
            ★ {place.rating.toFixed(1)}
          </Text>
        ) : (
          <Text style={styles.posts} numberOfLines={1}>
            {place.postCount} Post{place.postCount === 1 ? '' : 's'}
          </Text>
        )}
        <Text style={styles.handle} numberOfLines={1}>
          {place.rating && place.reviewCount
            ? `${place.reviewCount} reviews`
            : place.recentHandles[0]
              ? `@${place.recentHandles[0]}`
              : 'Top rated'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#141218',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 4,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 22,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  footer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  posts: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  handle: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'right',
  },
});
