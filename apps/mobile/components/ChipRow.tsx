import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { theme } from '@/constants/theme';

type Props = {
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  colorMap?: Record<string, string>;
};

export function ChipRow({ values, selected, onToggle, colorMap = theme.vibeColors }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {values.map((value) => {
        const active = selected.includes(value);
        const color = colorMap[value] ?? theme.colors.accent;
        return (
          <Pressable
            key={value}
            onPress={() => onToggle(value)}
            style={[styles.chip, active && { backgroundColor: `${color}33`, borderColor: color }]}>
            <Text style={[styles.label, active && { color: theme.colors.text, fontWeight: '700' }]}>
              {value}
            </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
