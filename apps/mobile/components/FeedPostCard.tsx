import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { activityLabels, type FeedPost } from '@/types/feed';

type Props = {
  post: FeedPost;
};

function timeAgo(iso: string) {
  const hours = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function FeedPostCard({ post }: Props) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const likeCount = post.likes + (liked ? 1 : 0);
  const placeLabel = post.placeName ?? post.eventTitle;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: post.avatarColor }]}>
          <Text style={styles.avatarText}>{post.userName.slice(0, 1)}</Text>
        </View>
        <View style={styles.headerCopy}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{post.userName}</Text>
            <Text style={styles.activity}>{activityLabels[post.activity]}</Text>
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            @{post.userHandle} · {timeAgo(post.createdAt)} · {post.neighborhood}
          </Text>
        </View>
        <Pressable style={styles.followBtn}>
          <Text style={styles.followText}>Follow</Text>
        </Pressable>
      </View>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback, { backgroundColor: post.imageColor }]}>
          <Text style={styles.imageEmoji}>{post.imageEmoji}</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.actionRow}>
          <Pressable onPress={() => setLiked((value) => !value)} style={styles.actionBtn}>
            <Text style={[styles.actionIcon, liked && styles.actionIconActive]}>{liked ? '♥' : '♡'}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionIcon}>💬</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionIcon}>↗</Text>
          </Pressable>
          <View style={styles.actionSpacer} />
          <Pressable onPress={() => setSaved((value) => !value)} style={styles.actionBtn}>
            <Text style={[styles.actionIcon, saved && styles.actionIconActive]}>{saved ? '★' : '☆'}</Text>
          </Pressable>
        </View>

        <Text style={styles.likes}>{likeCount.toLocaleString()} likes</Text>

        <Text style={styles.caption}>
          <Text style={styles.captionName}>{post.userName} </Text>
          {post.caption}
        </Text>

        {placeLabel ? (
          <View style={styles.placeRow}>
            <View style={styles.placeEmojiWrap}>
              <Text style={styles.placeEmoji}>{post.placeEmoji ?? (post.eventTitle ? '🎟️' : '📍')}</Text>
            </View>
            <View style={styles.placeCopy}>
              <Text style={styles.placeKind}>{post.eventTitle ? 'Event' : 'Place'}</Text>
              <Text style={styles.placeTitle} numberOfLines={1}>
                {placeLabel}
              </Text>
              <Text style={styles.placeMeta} numberOfLines={1}>
                {post.placeSubcategory ?? post.placeCategory ?? 'Shared in RVA'}
                {post.placePriceLevel ? ` · ${post.placePriceLevel}` : ''}
                {post.placeName ? ' · On the map' : ''}
              </Text>
            </View>
          </View>
        ) : null}

        {post.comments > 0 ? (
          <Text style={styles.comments}>View all {post.comments} comments</Text>
        ) : null}

        <View style={styles.footerStats}>
          <Text style={styles.stat}>{post.shares} shares</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.stat}>{post.neighborhood}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141218',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  activity: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  meta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: '#fff',
  },
  followText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#07060A',
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: '#1A1820',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: {
    fontSize: 64,
  },
  body: {
    padding: theme.spacing.md,
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionBtn: {
    paddingVertical: 2,
  },
  actionIcon: {
    fontSize: 22,
    color: '#fff',
  },
  actionIconActive: {
    color: theme.colors.accent,
  },
  actionSpacer: {
    flex: 1,
  },
  likes: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.9)',
  },
  captionName: {
    fontWeight: '800',
    color: '#fff',
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  placeEmojiWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeEmoji: {
    fontSize: 20,
  },
  placeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  placeKind: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.accent,
  },
  placeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  placeMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  comments: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  footerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stat: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  dot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});
