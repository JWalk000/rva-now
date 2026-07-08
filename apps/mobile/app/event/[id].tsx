import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TicketPurchase } from '@/components/TicketPurchase';
import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { addEventToCalendar } from '@/lib/calendar';
import { eventImageUrl } from '@/lib/eventImage';
import { distanceMiles } from '@/lib/location';
import { getTicketLabel } from '@/lib/platforms';
import { shareEvent } from '@/lib/share';

const RESERVED_EVENT_IDS = new Set(['auth', 'auth-callback', 'callback']);

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getEvent, isSaved, toggleSaved, userLocation } = useApp();
  const event = id && !RESERVED_EVENT_IDS.has(id) ? getEvent(id) : undefined;

  useEffect(() => {
    if (id && RESERVED_EVENT_IDS.has(id)) {
      router.replace('/auth-callback');
    }
  }, [id, router]);

  if (id && RESERVED_EVENT_IDS.has(id)) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <Text style={styles.missing}>Signing you in…</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <Pressable style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.missing}>Event not found.</Text>
      </View>
    );
  }

  const saved = isSaved(event.id);
  const ticketUrl = event.ticketUrl ?? event.sourceUrl;
  const hasRvaTickets = event.sellsTickets && event.sourcePlatform === 'submission';
  const distance = userLocation ? `${distanceMiles(event, userLocation).toFixed(1)} mi away` : 'In RVA';
  const primaryVibe = event.vibe[0] ?? 'Event';
  const externalTickets = Boolean(ticketUrl) && !hasRvaTickets;

  async function handleCalendar() {
    try {
      await addEventToCalendar(event);
      Alert.alert('Added', 'Event added to your calendar.');
    } catch (error) {
      Alert.alert('Calendar', error instanceof Error ? error.message : 'Could not add event.');
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom + (externalTickets ? 110 : 40) }}
        showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: eventImageUrl(event, 1200) }} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <Pressable style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.heroContent}>
            <View style={styles.heroBadges}>
              {event.sponsored || event.featured ? (
                <View style={styles.badgeFeatured}>
                  <Text style={styles.badgeFeaturedText}>Featured</Text>
                </View>
              ) : null}
              {event.hiddenGem ? (
                <View style={styles.badgeGem}>
                  <Text style={styles.badgeGemText}>Hidden Gem</Text>
                </View>
              ) : null}
              <View style={styles.badgeVibe}>
                <Text style={styles.badgeVibeText}>{primaryVibe}</Text>
              </View>
            </View>

            <Text style={styles.heroDay}>{event.day}</Text>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <Text style={styles.heroMeta}>
              {event.time} · {event.neighborhood}
            </Text>
            <Text style={styles.heroVenue}>{event.venue}</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.quickActions}>
            <Pressable
              style={[styles.quickBtn, saved && styles.quickBtnActive]}
              onPress={() => toggleSaved(event.id)}>
              <Text style={[styles.quickBtnText, saved && styles.quickBtnTextActive]}>
                {saved ? '★ Saved' : '☆ Save'}
              </Text>
            </Pressable>
            <Pressable style={styles.quickBtn} onPress={() => void shareEvent(event)}>
              <Text style={styles.quickBtnText}>Share</Text>
            </Pressable>
            <Pressable style={styles.quickBtn} onPress={() => void handleCalendar()}>
              <Text style={styles.quickBtnText}>Calendar</Text>
            </Pressable>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>When</Text>
              <Text style={styles.detailValue}>{event.day}</Text>
              <Text style={styles.detailSub}>{event.time}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Where</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {event.venue}
              </Text>
              <Text style={styles.detailSub}>{event.neighborhood}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>{event.price}</Text>
              <Text style={styles.detailSub}>
                {hasRvaTickets || externalTickets ? 'Tickets available' : 'See details'}
              </Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailValue}>{distance}</Text>
              <Text style={styles.detailSub}>Richmond, VA</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Vibes</Text>
            <View style={styles.vibes}>
              {event.vibe.map((vibe) => (
                <View key={vibe} style={styles.vibeChip}>
                  <Text style={styles.vibeText}>{vibe}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Event Info</Text>
            <View style={styles.infoList}>
              <InfoRow label="Venue" value={event.venue} />
              <InfoRow label="Neighborhood" value={event.neighborhood} />
              <InfoRow label="Day" value={event.day} />
              <InfoRow label="Time" value={event.time} />
              <InfoRow label="Price" value={event.price} />
              <InfoRow label="Source" value={event.source} last />
            </View>
          </View>

          {hasRvaTickets ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Tickets</Text>
              <TicketPurchase event={event} />
            </View>
          ) : null}
        </View>
      </ScrollView>

      {externalTickets && ticketUrl ? (
        <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.stickyCopy}>
            <Text style={styles.stickyLabel}>From</Text>
            <Text style={styles.stickyPrice}>{event.price}</Text>
          </View>
          <Pressable style={styles.stickyCta} onPress={() => void Linking.openURL(ticketUrl)}>
            <Text style={styles.stickyCtaText}>{getTicketLabel(event.sourcePlatform)}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07060A',
  },
  missing: {
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 120,
    fontSize: 16,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    minHeight: 380,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 80,
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 6, 10, 0.55)',
  },
  heroContent: {
    gap: 8,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  badgeFeatured: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
  },
  badgeFeaturedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  badgeGem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.hiddenGem,
  },
  badgeGemText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  badgeVibe: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  badgeVibeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  heroDay: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#F0B27A',
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.7,
  },
  heroMeta: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.86)',
  },
  heroVenue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
  },
  body: {
    padding: 16,
    gap: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#141218',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickBtnActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(196, 75, 47, 0.18)',
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  quickBtnTextActive: {
    color: theme.colors.accent,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: '#141218',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.accent,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 21,
  },
  detailSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  sectionCard: {
    backgroundColor: '#141218',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.78)',
  },
  vibes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vibeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  vibeText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  infoList: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#0C0B10',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  stickyCopy: {
    flex: 1,
  },
  stickyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
  stickyPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  stickyCta: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  stickyCtaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
