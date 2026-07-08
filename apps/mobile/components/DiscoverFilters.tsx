import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChipRow } from '@/components/ChipRow';
import { TimeWindowPicker } from '@/components/TimeWindowPicker';
import { theme } from '@/constants/theme';
import type { TimeWindow } from '@/types/event';

type Props = {
  timeWindow: TimeWindow;
  freeOnly: boolean;
  neighborhoods: string[];
  vibes: string[];
  selectedNeighborhoods: string[];
  selectedVibes: string[];
  onTimeWindowChange: (window: TimeWindow) => void;
  onFreeOnlyChange: (value: boolean) => void;
  onNeighborhoodToggle: (value: string) => void;
  onVibeToggle: (value: string) => void;
};

export function DiscoverFilters({
  timeWindow,
  freeOnly,
  neighborhoods,
  vibes,
  selectedNeighborhoods,
  selectedVibes,
  onTimeWindowChange,
  onFreeOnlyChange,
  onNeighborhoodToggle,
  onVibeToggle,
}: Props) {
  const [open, setOpen] = useState(false);
  const activeFilterCount =
    selectedNeighborhoods.length + selectedVibes.length + (freeOnly ? 1 : 0);

  return (
    <View style={styles.wrap}>
      <TimeWindowPicker value={timeWindow} onChange={onTimeWindowChange} />

      <View style={styles.quickRow}>
        <Pressable
          onPress={() => onFreeOnlyChange(!freeOnly)}
          style={[styles.chip, freeOnly && styles.chipActive]}>
          <Text style={[styles.chipText, freeOnly && styles.chipTextActive]}>
            {freeOnly ? '✓ Free' : 'Free'}
          </Text>
        </Pressable>

        <Pressable onPress={() => setOpen((value) => !value)} style={styles.chip}>
          <Text style={styles.chipText}>
            Filters{activeFilterCount ? ` · ${activeFilterCount}` : ''} {open ? '▴' : '▾'}
          </Text>
        </Pressable>
      </View>

      {open ? (
        <View style={styles.panel}>
          <View style={styles.group}>
            <Text style={styles.label}>Neighborhood</Text>
            <ChipRow values={neighborhoods} selected={selectedNeighborhoods} onToggle={onNeighborhoodToggle} />
          </View>
          <View style={styles.group}>
            <Text style={styles.label}>Vibe</Text>
            <ChipRow values={vibes} selected={selectedVibes} onToggle={onVibeToggle} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
    shadowOpacity: 0.04,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  group: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
});
