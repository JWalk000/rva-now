import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { theme } from '@/constants/theme';

type Props = {
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
};

export function FilterChips({ values, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {values.map((value) => {
        const active = selected === value;
        return (
          <Pressable
            key={value}
            onPress={() => onSelect(active ? '' : value)}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{value}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  labelActive: {
    color: theme.colors.accentBright,
    fontWeight: '700',
  },
});
