import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showTune?: boolean;
};

export function ScreenHeader({ eyebrow, title, subtitle, showTune = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + theme.spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.actions}>
          <Link href="/auth" asChild>
            <Pressable style={styles.tuneButton}>
              <Text style={styles.tuneText}>Account</Text>
            </Pressable>
          </Link>
          {showTune ? (
            <Link href="/modal" asChild>
              <Pressable style={styles.tuneButton}>
                <Text style={styles.tuneText}>Your RVA</Text>
              </Pressable>
            </Link>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.colors.accent,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  actions: {
    marginTop: 8,
    gap: theme.spacing.sm,
    alignItems: 'flex-end',
  },
  tuneButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tuneText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
