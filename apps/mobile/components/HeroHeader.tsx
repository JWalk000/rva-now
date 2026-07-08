import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RVA_HERO_IMAGE } from '@/constants/rvaHero';
import { theme } from '@/constants/theme';

type Props = {
  title?: string;
  subtitle?: string;
  eventCount?: number;
  placeCount?: number;
};

export function HeroHeader({
  title = 'Create Your Day',
  subtitle = 'Events, places, and what RVA is doing right now.',
  eventCount,
  placeCount,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" />
      <ImageBackground source={RVA_HERO_IMAGE} style={styles.banner} imageStyle={styles.bannerImage}>
        <View style={styles.overlay} pointerEvents="none" />
        <View style={[styles.content, { paddingTop: insets.top + 10 }]}>
          <View style={styles.topBar}>
            <Text style={styles.brand}>CITIPILOT</Text>
            <View style={styles.actions}>
              <Link href="/auth" asChild>
                <Pressable style={styles.iconBtn}>
                  <Text style={styles.iconBtnText}>Account</Text>
                </Pressable>
              </Link>
              <Link href="/modal" asChild>
                <Pressable style={styles.iconBtnFilled}>
                  <Text style={styles.iconBtnFilledText}>Tune</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          <View style={styles.copy}>
            <Text style={styles.location}>Richmond, VA</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {(eventCount != null || placeCount != null) && (
            <View style={styles.stats}>
              {eventCount != null ? (
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{eventCount}</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
              ) : null}
              {placeCount != null ? (
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{placeCount}</Text>
                  <Text style={styles.statLabel}>Places Live</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: '#07060A',
    zIndex: 10,
  },
  bannerImage: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 6, 10, 0.62)',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.4,
    color: 'rgba(255,255,255,0.78)',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtnFilled: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
  },
  iconBtnFilledText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  copy: {
    gap: 8,
  },
  location: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.78)',
    paddingRight: 8,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 88,
    flexGrow: 0,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
});
