import { Pressable, StyleSheet, Text, View } from 'react-native';

import { timeWindows } from '@/lib/data';
import { theme } from '@/constants/theme';
import type { TimeWindow } from '@/types/event';

type Props = {
  value: TimeWindow;
  onChange: (window: TimeWindow) => void;
};

export function TimeWindowPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {timeWindows.map((window) => {
        const active = value === window.id;
        return (
          <Pressable
            key={window.id}
            onPress={() => onChange(window.id)}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{window.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
    shadowOpacity: 0.04,
    elevation: 1,
  },
  chip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: theme.colors.ink,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  labelActive: {
    color: theme.colors.white,
  },
});
