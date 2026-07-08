import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { RvaEvent } from '@/types/event';

type Props = {
  event: RvaEvent;
  compact?: boolean;
};

export function EventCard({ event, compact = false }: Props) {
  const { isSaved, toggleSaved } = useApp();
  const saved = isSaved(event.id);
  const vibe = event.vibe[0];
  const vibeColor = theme.vibeColors[vibe] ?? theme.colors.accent;

  return (
    <Link href={`/event/${event.id}`} asChild>
      <Pressable style={[styles.card, compact && styles.compact]}>
        <View style={styles.body}>
          <View style={styles.topRow}>
            {vibe ? (
              <View style={[styles.vibePill, { backgroundColor: `${vibeColor}22` }]}>
                <View style={[styles.vibeDot, { backgroundColor: vibeColor }]} />
                <Text style={[styles.vibeText, { color: vibeColor }]}>{vibe}</Text>
              </View>
            ) : (
              <View />
            )}
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                toggleSaved(event.id);
              }}
              hitSlop={10}
              style={styles.saveBtn}>
              <Text style={[styles.save, saved && styles.saveActive]}>{saved ? '★' : '☆'}</Text>
            </Pressable>
          </View>

          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
            {event.title}
          </Text>

          <Text style={styles.meta}>
            {event.day} · {event.time}
          </Text>
          <Text style={styles.venue} numberOfLines={1}>
            {event.neighborhood} · {event.venue}
          </Text>

          <View style={styles.footer}>
            <Text style={styles.price}>{event.price}</Text>
            <Text style={styles.cta}>Details →</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  compact: {
    marginBottom: theme.spacing.xs,
  },
  body: {
    padding: theme.spacing.md,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  vibePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
  },
  vibeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  vibeText: {
    fontSize: 12,
    fontWeight: '700',
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
    lineHeight: 20,
  },
  saveActive: {
    color: theme.colors.accent,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  titleCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  venue: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  footer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.accentBright,
  },
  cta: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
});
