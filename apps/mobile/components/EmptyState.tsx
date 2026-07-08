import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentSoft,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accentBright,
  },
});
