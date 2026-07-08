import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RVA_COVER_IMAGE } from '@/constants/rvaHero';
import { theme } from '@/constants/theme';

type Props = {
  loading?: boolean;
};

export function AppCover({ loading = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground source={RVA_COVER_IMAGE} style={styles.image} imageStyle={styles.imageStyle}>
        <View style={styles.nightWash} pointerEvents="none" />
        <View style={styles.glow} pointerEvents="none" />
        <View style={styles.bottomGlow} pointerEvents="none" />

        <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 }]}>
          <Text style={styles.brand}>RVA NOW</Text>

          <View style={styles.center}>
            <Text style={styles.eyebrow}>Richmond, VA</Text>
            <Text style={styles.title}>The RVA{'\n'}Movement</Text>
            <Text style={styles.subtitle}>Create your day. Find your night.</Text>
          </View>

          <View style={styles.footer}>
            {loading ? <ActivityIndicator color="#fff" /> : null}
            <Text style={styles.footerText}>{loading ? 'Lighting up the city…' : 'Welcome in'}</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05040A',
  },
  image: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
  nightWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 4, 14, 0.55)',
  },
  glow: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: '18%',
    height: 180,
    backgroundColor: 'rgba(196, 75, 47, 0.22)',
  },
  bottomGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    backgroundColor: 'rgba(8, 6, 18, 0.72)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.82)',
  },
  center: {
    gap: 12,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  title: {
    fontSize: 48,
    lineHeight: 50,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.4,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.82)',
    maxWidth: 280,
  },
  footer: {
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
  },
});
