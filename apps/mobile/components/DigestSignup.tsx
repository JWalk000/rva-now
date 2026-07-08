import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

type Props = {
  dark?: boolean;
};

export function DigestSignup({ dark = false }: Props) {
  const { digest, signUpDigest } = useApp();
  const [contact, setContact] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const s = dark ? darkStyles : lightStyles;

  if (digest) {
    return (
      <View style={s.wrap}>
        <Text style={s.title}>You’re On The List</Text>
        <Text style={s.body}>
          {digest.channel === 'email' ? 'Weekly email' : 'Weekly text'} digest going to {digest.contact}.
        </Text>
      </View>
    );
  }

  async function handleSubmit() {
    if (!contact.trim()) {
      setStatus('Add an email or phone number.');
      return;
    }
    setSubmitting(true);
    setStatus('');
    try {
      await signUpDigest(contact.trim(), channel);
      setStatus('You’re signed up for the RVA weekend digest.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not sign up. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Weekly RVA Digest</Text>
      <Text style={s.body}>Get this weekend’s best events by email or text.</Text>

      <View style={s.channelRow}>
        {(['email', 'sms'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setChannel(option)}
            style={[s.channelChip, channel === option && s.channelChipActive]}>
            <Text style={[s.channelText, channel === option && s.channelTextActive]}>
              {option === 'email' ? 'Email' : 'Text'}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={s.input}
        placeholder={channel === 'email' ? 'you@email.com' : '(804) 555-0100'}
        placeholderTextColor={dark ? 'rgba(255,255,255,0.35)' : theme.colors.textMuted}
        value={contact}
        onChangeText={setContact}
        keyboardType={channel === 'email' ? 'email-address' : 'phone-pad'}
        autoCapitalize="none"
      />

      <Pressable style={[s.button, submitting && s.buttonDisabled]} onPress={() => void handleSubmit()} disabled={submitting}>
        <Text style={s.buttonText}>{submitting ? 'Saving…' : 'Join Digest'}</Text>
      </Pressable>
      {status ? <Text style={s.status}>{status}</Text> : null}
    </View>
  );
}

const lightStyles = StyleSheet.create({
  wrap: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  body: { fontSize: 14, lineHeight: 20, color: theme.colors.textSecondary },
  channelRow: { flexDirection: 'row', gap: theme.spacing.sm },
  channelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  channelChipActive: { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent },
  channelText: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  channelTextActive: { color: theme.colors.accent },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: theme.colors.white, fontSize: 15, fontWeight: '700' },
  status: { fontSize: 13, color: theme.colors.accent, fontWeight: '600' },
});

const darkStyles = StyleSheet.create({
  wrap: {
    padding: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: '#141218',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: theme.spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  body: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.55)' },
  channelRow: { flexDirection: 'row', gap: theme.spacing.sm },
  channelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  channelChipActive: {
    backgroundColor: 'rgba(196, 75, 47, 0.18)',
    borderColor: theme.colors.accent,
  },
  channelText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  channelTextActive: { color: theme.colors.accent },
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
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: theme.colors.white, fontSize: 15, fontWeight: '800' },
  status: { fontSize: 13, color: theme.colors.accent, fontWeight: '600' },
});
