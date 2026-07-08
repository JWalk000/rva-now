import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';
import { buyerTotalCents, createTicketCheckout, fetchTicketTypes, formatUsd } from '@/lib/tickets';
import type { TicketType } from '@/types/ticket';
import type { RvaEvent } from '@/types/event';

type Props = {
  event: RvaEvent;
};

export function TicketPurchase({ event }: Props) {
  const [types, setTypes] = useState<TicketType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const selected = types.find((t) => t.id === selectedId) ?? types[0];

  useEffect(() => {
    void fetchTicketTypes(event.id).then((rows) => {
      setTypes(rows.filter((t) => t.available > 0));
      setSelectedId(rows[0]?.id ?? null);
      setLoading(false);
    });
  }, [event.id]);

  if (loading) return null;
  if (!types.length) return null;

  const totalCents = selected ? buyerTotalCents(selected.priceCents, quantity) : 0;

  async function handleBuy() {
    if (!selected || !email.trim()) {
      setStatus('Enter your email to receive tickets.');
      return;
    }
    setStatus('');
    try {
      const { url, total } = await createTicketCheckout(selected.id, quantity, email.trim(), event.id);
      setStatus(`Opening checkout (${total})…`);
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not start checkout');
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Get Tickets On RVA Now</Text>
      <Text style={styles.hint}>Service fee: $0.50 + 3.5% per order — about half of Posh.</Text>

      {types.map((type) => (
        <Pressable
          key={type.id}
          onPress={() => setSelectedId(type.id)}
          style={[styles.typeCard, selected?.id === type.id && styles.typeCardActive]}>
          <Text style={styles.typeName}>{type.name}</Text>
          <Text style={styles.typeMeta}>
            {formatUsd(type.priceCents)} · {type.available} left
          </Text>
        </Pressable>
      ))}

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email for your tickets"
        placeholderTextColor="rgba(255,255,255,0.35)"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.qtyRow}>
        <Pressable style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
          <Text style={styles.qtyBtnText}>−</Text>
        </Pressable>
        <Text style={styles.qtyLabel}>
          {quantity} ticket{quantity > 1 ? 's' : ''}
        </Text>
        <Pressable style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.min(10, q + 1))}>
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
      </View>

      <Pressable style={styles.buyBtn} onPress={() => void handleBuy()}>
        <Text style={styles.buyBtnText}>Buy for {formatUsd(totalCents)}</Text>
      </Pressable>
      {status ? <Text style={styles.status}>{status}</Text> : null}
      {Platform.OS === 'ios' ? (
        <Text style={styles.walletNote}>After payment, tickets are emailed with Apple Wallet links.</Text>
      ) : (
        <Text style={styles.walletNote}>After payment, tickets are emailed with QR codes.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.xl,
    backgroundColor: '#141218',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  hint: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  typeCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  typeCardActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(196, 75, 47, 0.16)',
  },
  typeName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  typeMeta: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(196, 75, 47, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 20, fontWeight: '700', color: theme.colors.accent },
  qtyLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
  buyBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buyBtnText: { color: theme.colors.white, fontSize: 16, fontWeight: '800' },
  status: { fontSize: 13, color: theme.colors.accent, fontWeight: '600' },
  walletNote: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18 },
});
