import { Link } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { eventImageUrl } from '@/lib/eventImage';
import type { RvaEvent } from '@/types/event';

type Props = {
  event: RvaEvent;
};

export function SponsoredCard({ event }: Props) {
  return (
    <Link href={`/event/${event.id}`} asChild>
      <Pressable style={styles.card}>
        <ImageBackground source={{ uri: eventImageUrl(event, 1000) }} style={styles.image} imageStyle={styles.imageStyle}>
          <View style={styles.overlay} />
          <Text style={styles.sponsored}>Featured</Text>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {event.neighborhood} · {event.day} · {event.price}
          </Text>
          <Text style={styles.cta}>View Details →</Text>
        </ImageBackground>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: theme.colors.ink,
    ...theme.shadow.card,
  },
  image: {
    minHeight: 180,
    padding: theme.spacing.md,
    justifyContent: 'flex-end',
    gap: 6,
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 6, 14, 0.5)',
  },
  sponsored: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.colors.featured,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
  },
  cta: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.white,
  },
});
