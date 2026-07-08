import { Image } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { fetchTicketByCode, walletPassUrl } from '@/lib/tickets';
import type { Ticket } from '@/types/ticket';

export default function TicketDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [status, setStatus] = useState('Loading ticket…');

  useEffect(() => {
    if (!code) return;
    void fetchTicketByCode(code).then((row) => {
      setTicket(row);
      setStatus(row ? '' : 'Ticket not found.');
    });
  }, [code]);

  if (!ticket) {
    return (
      <View style={styles.screen}>
        <Text style={styles.status}>{status}</Text>
      </View>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(ticket.ticketCode)}`;

  return (
    <>
      <Stack.Screen options={{ title: 'Your ticket' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{ticket.ticketTypeName}</Text>
        <Text style={styles.title}>{ticket.eventTitle}</Text>
        <Text style={styles.meta}>
          {ticket.eventDay} · {ticket.eventTime} · {ticket.venue}
        </Text>
        <Text style={styles.code}>{ticket.ticketCode}</Text>

        <Image source={{ uri: qrUrl }} style={styles.qr} accessibilityLabel="Ticket QR code" />

        {Platform.OS === 'ios' ? (
          <Pressable
            style={styles.walletBtn}
            onPress={() => void Linking.openURL(walletPassUrl(ticket.ticketCode))}>
            <Text style={styles.walletBtnText}>Add to Apple Wallet</Text>
          </Pressable>
        ) : null}

        <Text style={styles.help}>Show this QR code at the door. A copy was also emailed to {ticket.buyerEmail}.</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  status: { color: theme.colors.textSecondary },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, alignItems: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '700', color: theme.colors.accent, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  meta: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center' },
  code: { fontSize: 18, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: theme.colors.text },
  qr: { width: 240, height: 240, borderRadius: theme.radius.md },
  walletBtn: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  walletBtnText: { color: theme.colors.white, fontSize: 16, fontWeight: '700' },
  help: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
