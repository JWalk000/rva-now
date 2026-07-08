import { Link } from 'expo-router';
import { Dimensions, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { eventImageUrl } from '@/lib/eventImage';
import type { RvaEvent } from '@/types/event';

type Props = {
  event: RvaEvent;
  large?: boolean;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const LARGE_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.62, 230);

export function EventPosterCard({ event, large = false }: Props) {
  const vibe = event.vibe[0] ?? 'Event';
  const width = large ? LARGE_WIDTH : CARD_WIDTH;

  return (
    <Link href={`/event/${event.id}`} asChild>
      <Pressable style={[styles.card, { width }]}>
        <ImageBackground
          source={{ uri: eventImageUrl(event, large ? 1000 : 800) }}
          style={[styles.poster, large && styles.posterLarge]}
          imageStyle={styles.image}>
          <View style={styles.overlay} pointerEvents="none" />
          <View style={styles.topRow}>
            <View style={[styles.badge, styles.badgeFlex]}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {vibe}
              </Text>
            </View>
            {event.sponsored || event.featured ? (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.bottom}>
            <Text style={styles.day} numberOfLines={1}>
              {event.day}
            </Text>
            <Text style={[styles.posterTitle, large && styles.posterTitleLarge]} numberOfLines={3}>
              {event.title}
            </Text>
            <Text style={styles.posterMeta} numberOfLines={1}>
              {event.time} · {event.neighborhood}
            </Text>
            <View style={styles.footerRow}>
              <Text style={styles.venue} numberOfLines={1}>
                {event.venue}
              </Text>
              <Text style={styles.price} numberOfLines={1}>
                {event.price}
              </Text>
            </View>
            {event.sellsTickets || event.ticketUrl ? (
              <Text style={styles.tickets}>Tickets Available</Text>
            ) : null}
          </View>
        </ImageBackground>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#141018',
  },
  poster: {
    height: 290,
    padding: 14,
    justifyContent: 'space-between',
  },
  posterLarge: {
    height: 330,
  },
  image: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 6, 14, 0.48)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badgeFlex: {
    flexShrink: 1,
    maxWidth: '70%',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  featuredBadge: {
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
  },
  featuredText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  bottom: {
    gap: 5,
  },
  day: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#F0B27A',
  },
  posterTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 26,
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  posterTitleLarge: {
    fontSize: 26,
    lineHeight: 30,
  },
  posterMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  venue: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
  },
  price: {
    flexShrink: 0,
    maxWidth: '40%',
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'right',
  },
  tickets: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#F0B27A',
  },
});
