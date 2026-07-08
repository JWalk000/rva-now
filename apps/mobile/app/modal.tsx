import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChipRow } from '@/components/ChipRow';
import { theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function PreferencesModal() {
  const { neighborhoods, vibes, prefs, toggleNeighborhood, toggleVibe } = useApp();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Hyperlocal personalization: tell us what you like and where you hang out, and we show you your RVA.
      </Text>

      <Section title="Your neighborhoods">
        <ChipRow values={neighborhoods} selected={prefs.neighborhoods} onToggle={toggleNeighborhood} />
      </Section>

      <Section title="Your interests">
        <ChipRow values={vibes} selected={prefs.vibes} onToggle={toggleVibe} />
      </Section>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>Data supply is job #1</Text>
        <Text style={styles.noteBody}>
          The app only works if listings stay fresh. Business submissions, venue partnerships, and community
          sourcing keep the feed full — not just weekends.
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
  },
  section: { gap: theme.spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  note: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentSoft,
    gap: theme.spacing.xs,
  },
  noteTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.accent },
  noteBody: { fontSize: 14, lineHeight: 20, color: theme.colors.textSecondary },
});
