import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { formatSubmissionDateTime } from '@/lib/datetime';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
};

export function DateTimeField({ value, onChange }: Props) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);

  function applyChange(event: DateTimePickerEvent, next: Date | undefined) {
    if (event.type === 'dismissed' || !next) {
      setMode(null);
      return;
    }
    onChange(next);
    if (Platform.OS === 'android') setMode(null);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={() => setMode('date')}>
          <Text style={styles.buttonLabel}>Date</Text>
          <Text style={styles.buttonValue}>
            {value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => setMode('time')}>
          <Text style={styles.buttonLabel}>Time</Text>
          <Text style={styles.buttonValue}>
            {value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.preview}>{formatSubmissionDateTime(value)}</Text>
      {mode ? (
        <DateTimePicker
          value={value}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, next) => applyChange(event, next)}
          minimumDate={new Date()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.sm },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    gap: 2,
  },
  buttonLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase' },
  buttonValue: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  preview: { fontSize: 13, color: theme.colors.textSecondary },
});
