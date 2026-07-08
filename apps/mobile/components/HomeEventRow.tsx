import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { eventImageUrl } from '@/lib/eventImage';
import type { RvaEvent } from '@/types/event';

type Props = {
  event: RvaEvent;
};

export function HomeEventRow({ event }: Props) {
  const { isSaved, toggleSaved } = useApp();
  const saved = isSaved(event.id);
  const vibe = event.vibe[0] ?? 'Event';
  const vibeColor = theme.vibeColors[vibe] ?? theme.colors.accent;

  return (
    <Link href={`/event/${event.id}`} asChild>
      <Pressable style={styles.card}>
        <Image source={{ uri: eventImageUrl(event, 400) }} style={styles.thumb} />
        <View style={styles.body}>
          <View style={styles.top}>
            <View style={[styles.vibePill, { backgroundColor: `${vibeColor}22` }]}>
              <Text style={[styles.vibeText, { color: vibeColor }]} numberOfLines={1}>
                {vibe}
              </Text>
            </View>
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

          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          <Text style={styles.when} numberOfLines={1}>
            {event.day} · {event.time}
          </Text>
          <Text style={styles.where} numberOfLines={1}>
            {event.neighborhood} · {event.venue}
          </Text>

          <View style={styles.bottom}>
            <Text style={styles.price} numberOfLines={1}>
              {event.price}
            </Text>
            <Text style={styles.cta} numberOfLines={1}>
              {event.sellsTickets || event.ticketUrl ? 'Tickets' : 'Details'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#141218',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  thumb: {
    width: 96,
    backgroundColor: '#1A1820',
  },
  body: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    gap: 3,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  vibePill: {
    flexShrink: 1,
    maxWidth: '80%',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  vibeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  saveBtn: {
    flexShrink: 0,
  },
  save: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.35)',
  },
  saveActive: {
    color: theme.colors.accent,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  when: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
  },
  where: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  bottom: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  cta: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
  },
});
