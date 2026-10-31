import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Place } from '@/types';
import { colors, radius } from '@/theme/colors';
import { getRestaurantImage } from '@/data/restaurantImages';

interface PlaceCardProps {
  place: Place;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
}

export function PlaceCard({ place, saved, onToggleSave }: PlaceCardProps) {
  const router = useRouter();
  const imageUrl = getRestaurantImage(place);
  const isVerified = place.verificationStatus === 'Verified';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/place/${place.id}`)}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${place.name}`}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} resizeMode="cover" />
        <View style={[styles.badge, isVerified ? styles.verifiedBadge : styles.pendingBadge]}>
          <Text style={[styles.badgeText, isVerified ? styles.verifiedText : styles.pendingText]}>
            {isVerified ? 'VERIFIED' : 'TO VERIFY'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {place.name}
          </Text>
          {onToggleSave ? (
            <Pressable
              style={({ pressed }) => [styles.bookmarkIcon, pressed && { opacity: 0.6 }]}
              onPress={(e) => {
                e.stopPropagation();
                onToggleSave(place.id);
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={saved ? `Remove ${place.name} from bucket list` : `Save ${place.name} to bucket list`}
            >
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={saved ? colors.orange : colors.muted}
              />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.area} numberOfLines={1}>
          {place.area || 'Delhi NCR'}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.category} numberOfLines={1}>
            {place.category || 'Dining place'}
          </Text>
          {place.budgetPerPerson ? (
            <Text style={styles.budget}>~₹{place.budgetPerPerson}</Text>
          ) : (
            <Text style={styles.budgetMuted}>Price pending</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  pressed: {
    opacity: 0.96,
    backgroundColor: '#FAF8F3',
  },
  imageContainer: {
    position: 'relative',
    width: 78,
    height: 78,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    borderRadius: 4,
    paddingVertical: 2,
    alignItems: 'center',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(40, 96, 77, 0.9)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(29, 41, 36, 0.75)',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  verifiedText: {
    color: colors.white,
  },
  pendingText: {
    color: '#D8DDD9',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  bookmarkIcon: {
    padding: 2,
  },
  area: {
    color: colors.muted,
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  category: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  budget: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  budgetMuted: {
    color: colors.muted,
    fontSize: 10,
  },
});
