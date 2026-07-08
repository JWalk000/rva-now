import { StyleSheet, View, type ViewProps } from 'react-native';

import { theme } from '@/constants/theme';

type Props = ViewProps & {
  children: React.ReactNode;
};

export function TexturedScreen({ children, style, ...rest }: Props) {
  return (
    <View style={[styles.root, style]} {...rest}>
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(196, 75, 47, 0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(47, 107, 82, 0.07)',
  },
});
