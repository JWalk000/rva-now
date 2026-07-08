import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { DateTimeField } from '@/components/DateTimeField';
import { ScreenHeader } from '@/components/ScreenHeader';
import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { createCheckoutSession } from '@/lib/api';
import { defaultEventDate, formatSubmissionDateTime } from '@/lib/datetime';
import { neighborhoods, promotionTiers } from '@/lib/data';
import { getSubmissionStatusDetail, getSubmissionStatusLabel } from '@/lib/submissionStatus';
import { createConnectLink } from '@/lib/tickets';
import type { PromotionTier } from '@/types/event';
import type { TicketTypeInput } from '@/types/ticket';

export default function SubmitScreen() {
  const { paid, connect } = useLocalSearchParams<{ paid?: string; connect?: string }>();
  const { submitEvent, submissions, refreshSubmissions, refreshData } = useApp();
  const [title, setTitle] = useState('');
  const [neighborhood, setNeighborhood] = useState(neighborhoods[0]);
  const [eventDate, setEventDate] = useState(defaultEventDate);
  const [venue, setVenue] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<PromotionTier>('free');
  const [pitch, setPitch] = useState('');
  const [sellTickets, setSellTickets] = useState(false);
  const [ticketName, setTicketName] = useState('General admission');
  const [ticketPrice, setTicketPrice] = useState('25');
  const [ticketQty, setTicketQty] = useState('100');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (connect === 'done') {
      setStatus('Stripe payout setup complete. You can sell tickets once your event is live.');
    }
  }, [connect]);

  useEffect(() => {
    if (paid === '1') {
      void (async () => {
        await refreshSubmissions();
        await refreshData();
        setStatus('Payment received — your listing should appear on Discover shortly.');
      })();
      return;
    }
    if (paid === '0') {
      setStatus('Payment canceled. Your listing is saved — tap Submit & pay when you are ready.');
    }
  }, [paid, refreshData, refreshSubmissions]);

  async function handleSubmit() {
    const dateTime = formatSubmissionDateTime(eventDate);
    if (!title || !venue || !email) {
      setStatus('Fill in title, venue, and email.');
      return;
    }
    if (sellTickets) {
      const price = Number(ticketPrice);
      const qty = Number(ticketQty);
      if (!ticketName.trim() || !price || price <= 0 || !qty || qty <= 0) {
        setStatus('Add a valid ticket name, price, and quantity.');
        return;
      }
    }

    setStatus('');
    try {
      const ticketTypes: TicketTypeInput[] | undefined = sellTickets
        ? [
            {
              name: ticketName.trim(),
              priceCents: Math.round(Number(ticketPrice) * 100),
              quantity: Math.round(Number(ticketQty)),
            },
          ]
        : undefined;

      const submission = await submitEvent({
        title,
        neighborhood,
        dateTime,
        venue,
        email,
        tier,
        pitch,
        ticketingEnabled: sellTickets,
        ticketTypes,
      });

      if (sellTickets) {
        try {
          const connectUrl = await createConnectLink(email);
          await WebBrowser.openBrowserAsync(connectUrl);
          setStatus('Listing saved. Finish Stripe setup to receive ticket payouts.');
        } catch {
          setStatus('Listing saved with tickets. Set up payouts from Stripe when prompted.');
        }
      } else if (tier === 'featured' || tier === 'subscription') {
        try {
          const checkoutUrl = await createCheckoutSession(submission.id, tier);
          await WebBrowser.openBrowserAsync(checkoutUrl);
          setStatus('Opening Stripe to enter card details…');
        } catch (checkoutError) {
          const msg = checkoutError instanceof Error ? checkoutError.message : 'Checkout failed';
          setStatus(`Listing saved, but payment could not start (${msg}). Try again from your submissions below.`);
        }
      } else {
        setStatus('Submitted! Free listings are reviewed before they go live — no card needed.');
      }
      setTitle('');
      setEventDate(defaultEventDate());
      setVenue('');
      setPitch('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Submission failed. Try again.');
    }
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        eyebrow="Supply-side growth"
        title="List your event"
        subtitle="Businesses and organizers submit directly. Priority placement available."
        showTune={false}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>Event title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Sunset market on Main" placeholderTextColor={theme.colors.textMuted} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Neighborhood</Text>
          <View style={styles.chipWrap}>
            {neighborhoods.map((n) => (
              <Pressable
                key={n}
                onPress={() => setNeighborhood(n)}
                style={[styles.chip, neighborhood === n && styles.chipActive]}>
                <Text style={[styles.chipText, neighborhood === n && styles.chipTextActive]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date / time</Text>
          <DateTimeField value={eventDate} onChange={setEventDate} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Venue</Text>
          <TextInput style={styles.input} value={venue} onChangeText={setVenue} placeholder="Venue name" placeholderTextColor={theme.colors.textMuted} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Organizer email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@business.com"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Sell tickets on RVA Now</Text>
              <Text style={styles.tierHint}>Only for your own event. Buyers pay $0.50 + 3.5% service fee per order.</Text>
            </View>
            <Switch
              value={sellTickets}
              onValueChange={setSellTickets}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
              thumbColor={sellTickets ? theme.colors.accent : theme.colors.white}
            />
          </View>
          {sellTickets ? (
            <View style={styles.ticketFields}>
              <TextInput
                style={styles.input}
                value={ticketName}
                onChangeText={setTicketName}
                placeholder="Ticket name"
                placeholderTextColor={theme.colors.textMuted}
              />
              <View style={styles.ticketRow}>
                <TextInput
                  style={[styles.input, styles.ticketHalf]}
                  value={ticketPrice}
                  onChangeText={setTicketPrice}
                  placeholder="Price USD"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.ticketHalf]}
                  value={ticketQty}
                  onChangeText={setTicketQty}
                  placeholder="Quantity"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Promotion tier</Text>
          <Text style={styles.tierHint}>
            {tier === 'free'
              ? 'Free = no card. Tap Featured or Subscription to pay and open Stripe checkout.'
              : 'You will enter card details on Stripe’s secure page after tapping submit.'}
          </Text>
          {promotionTiers.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => setTier(option.id)}
              style={[styles.tierCard, tier === option.id && styles.tierCardActive]}>
              <Text style={styles.tierTitle}>{option.label} · {option.price}</Text>
              <Text style={styles.tierBody}>{option.description}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Why should people show up?</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={pitch}
            onChangeText={setPitch}
            placeholder="Short pitch for your listing"
            placeholderTextColor={theme.colors.textMuted}
            multiline
          />
        </View>

        <Pressable style={styles.submitButton} onPress={() => void handleSubmit()}>
          <Text style={styles.submitText}>
            {tier === 'free' ? 'Submit listing' : `Submit & pay ${promotionTiers.find((t) => t.id === tier)?.price ?? ''}`}
          </Text>
        </Pressable>
        {status ? <Text style={styles.status}>{status}</Text> : null}

        {submissions.length ? (
          <View style={styles.inbox}>
            <View style={styles.inboxHeader}>
              <Text style={styles.inboxTitle}>Your submissions ({submissions.length})</Text>
              <Pressable onPress={() => void refreshSubmissions(email || undefined)}>
                <Text style={styles.inboxRefresh}>Refresh</Text>
              </Pressable>
            </View>
            {submissions.slice(0, 5).map((sub) => (
              <View key={sub.id} style={styles.inboxRow}>
                <Text style={styles.inboxEvent}>{sub.title}</Text>
                <Text style={styles.inboxStatus}>{getSubmissionStatusLabel(sub)}</Text>
                <Text style={styles.inboxMeta}>{getSubmissionStatusDetail(sub)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: 120, gap: theme.spacing.md },
  field: { gap: theme.spacing.sm },
  label: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent },
  chipText: { fontSize: 13, color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.accent, fontWeight: '700' },
  tierHint: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  tierCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 4,
  },
  tierCardActive: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentSoft },
  tierTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  tierBody: { fontSize: 13, color: theme.colors.textSecondary },
  submitButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  submitText: { color: theme.colors.white, fontSize: 16, fontWeight: '700' },
  status: { fontSize: 13, color: theme.colors.accent, fontWeight: '600' },
  inbox: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  inboxHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inboxTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  inboxRefresh: { fontSize: 13, fontWeight: '600', color: theme.colors.accent },
  inboxRow: { paddingVertical: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  inboxEvent: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  inboxStatus: { fontSize: 13, fontWeight: '600', color: theme.colors.accent, marginTop: 2 },
  inboxMeta: { fontSize: 13, color: theme.colors.textMuted },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  ticketFields: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  ticketRow: { flexDirection: 'row', gap: theme.spacing.sm },
  ticketHalf: { flex: 1 },
});
