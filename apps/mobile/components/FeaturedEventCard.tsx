import { Link } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { eventImageUrl } from '@/lib/eventImage';
import type { RvaEvent } from '@/types/event';

type Props = {
  event: RvaEvent;
};

export function FeaturedEventCard({ event }: Props) {
  return (
    <Link href={`/event/${event.id}`} asChild>
      <Pressable style={styles.card}>
        <ImageBackground
          source={{ uri: eventImageUrl(event, 900) }}
          style={styles.image}
          imageStyle={styles.imageRadius}>
          <View style={styles.overlay}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Featured Event</Text>
            </View>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.meta}>
              {event.neighborhood} · {event.time}
            </Text>
          </View>
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
    borderColor: theme.colors.border,
  },
  image: {
    height: 220,
    justifyContent: 'flex-end',
  },
  imageRadius: {
    borderRadius: theme.radius.xl,
  },
  overlay: {
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(15, 17, 23, 0.55)',
    gap: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.background,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.accentBright,
  },
});
