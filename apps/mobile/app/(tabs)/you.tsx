import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DigestSignup } from '@/components/DigestSignup';
import { HomeEventRow } from '@/components/HomeEventRow';
import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { fetchTicketsByEmail } from '@/lib/tickets';
import type { Ticket } from '@/types/ticket';

const TICKETS_EMAIL_KEY = 'rva-now-tickets-email';

export default function YouScreen() {
  const insets = useSafeAreaInsets();
  const { user, username, setUsername, logout } = useAuth();
  const { savedIds, getEvent, savedPlaceIds } = useApp();
  const savedEvents = savedIds.map((id) => getEvent(id)).filter(Boolean);
  const [ticketEmail, setTicketEmail] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(username ?? '');

  useEffect(() => {
    setNameDraft(username ?? '');
  }, [username]);

  useEffect(() => {
    void AsyncStorage.getItem(TICKETS_EMAIL_KEY).then((stored) => {
      if (stored) {
        setTicketEmail(stored);
        void fetchTicketsByEmail(stored).then(setTickets);
      }
    });
  }, []);

  async function loadTickets() {
    const email = ticketEmail.trim();
    if (!email) return;
    await AsyncStorage.setItem(TICKETS_EMAIL_KEY, email);
    setTickets(await fetchTicketsByEmail(email));
  }

  async function saveUsername() {
    const next = nameDraft.trim().replace(/^@+/, '');
    if (!next) return;
    await setUsername(next);
    setEditingName(false);
  }

  const displayName = username || 'Set your username';
  const initial = (username || 'R').slice(0, 1).toUpperCase();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <Text style={styles.eyebrow}>Your RVA</Text>

          {editingName ? (
            <View style={styles.usernameEdit}>
              <TextInput
                style={styles.usernameInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="username"
                placeholderTextColor="rgba(255,255,255,0.35)"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={24}
              />
              <Pressable style={styles.saveNameBtn} onPress={() => void saveUsername()}>
                <Text style={styles.saveNameText}>Save</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setEditingName(true)} style={styles.usernameTap}>
              <Text style={styles.name} numberOfLines={1}>
                @{displayName}
              </Text>
              <Text style={styles.editHint}>Tap to edit username</Text>
            </Pressable>
          )}

          <Text style={styles.email} numberOfLines={1}>
            {user?.email ?? 'Sign in to sync saves across devices'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{savedEvents.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{tickets.length}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{savedPlaceIds.length}</Text>
            <Text style={styles.statLabel}>Places</Text>
          </View>
        </View>

        <View style={styles.actionsStack}>
          <ActionCard
            title={user ? 'Account' : 'Sign In'}
            subtitle={user ? 'Manage your profile' : 'Magic link, no password'}
            onPress={() => router.push('/auth')}
          />
          <ActionCard
            title="Preferences"
            subtitle="Neighborhoods and vibes"
            onPress={() => router.push('/modal')}
          />
          <ActionCard
            title="List An Event"
            subtitle="For businesses and organizers"
            onPress={() => router.push('/submit')}
          />
        </View>

        <DigestSignup dark />

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>My Tickets</Text>
          <Text style={styles.sectionSub}>Load tickets with the email used at checkout.</Text>
          <TextInput
            style={styles.input}
            value={ticketEmail}
            onChangeText={setTicketEmail}
            placeholder="Email used at checkout"
            placeholderTextColor="rgba(255,255,255,0.35)"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Pressable style={styles.loadBtn} onPress={() => void loadTickets()}>
            <Text style={styles.loadBtnText}>Load Tickets</Text>
          </Pressable>
          {tickets.length ? (
            tickets.map((ticket) => (
              <Pressable
                key={ticket.id}
                style={styles.ticketRow}
                onPress={() => router.push(`/ticket/${ticket.ticketCode}`)}>
                <Text style={styles.ticketTitle} numberOfLines={1}>
                  {ticket.eventTitle}
                </Text>
                <Text style={styles.ticketMeta} numberOfLines={1}>
                  {ticket.ticketTypeName} · {ticket.eventDay} · {ticket.ticketCode}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>No tickets loaded yet.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Events</Text>
          <Text style={styles.sectionSub}>Events you starred across the app.</Text>
          {savedEvents.length ? (
            savedEvents.map((event) => (event ? <HomeEventRow key={event.id} event={event} /> : null))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nothing Saved Yet</Text>
              <Text style={styles.emptyText}>Tap the star on any event to save it here.</Text>
            </View>
          )}
        </View>

        {user ? (
          <Pressable style={styles.signOutBtn} onPress={() => void logout()}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ActionCard({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>
      <Text style={styles.actionArrow}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07060A',
  },
  content: {
    paddingHorizontal: 16,
    gap: 14,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#141218',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.colors.accent,
  },
  usernameTap: {
    alignItems: 'center',
    width: '100%',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  editHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    textAlign: 'center',
  },
  usernameEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  usernameInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.04)',
    textAlign: 'center',
  },
  saveNameBtn: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
  },
  saveNameText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  email: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#141218',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  actionsStack: {
    gap: 10,
  },
  actionCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141218',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  actionSub: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 3,
  },
  actionArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    flexShrink: 0,
  },
  sectionCard: {
    backgroundColor: '#141218',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    gap: 10,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  sectionSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 2,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  loadBtn: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loadBtnText: {
    color: theme.colors.white,
    fontWeight: '800',
  },
  ticketRow: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  ticketMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  emptyCard: {
    backgroundColor: '#141218',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginTop: 4,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
  },
});
