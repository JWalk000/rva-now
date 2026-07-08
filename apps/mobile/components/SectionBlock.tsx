import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionBlock({ title, subtitle, count, action, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {count !== undefined ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{count}</Text>
              </View>
            ) : null}
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingHorizontal: 2,
  },
  titles: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  badge: {
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.accentBright,
  },
  body: {
    gap: theme.spacing.sm,
  },
});
