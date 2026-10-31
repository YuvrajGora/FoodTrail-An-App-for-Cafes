import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Place } from '@/types';
import { colors, radius } from '@/theme/colors';
import { getRestaurantImage } from '@/data/restaurantImages';

interface FeaturedPlaceCardProps {
  place: Place;
  saved: boolean;
  onToggleSave: (id: string) => void;
}

export function FeaturedPlaceCard({ place, saved, onToggleSave }: FeaturedPlaceCardProps) {
  const router = useRouter();
  const imageUrl = getRestaurantImage(place);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => router.push(`/place/${place.id}`)}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${place.name}`}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.gradientOverlay} />

        {/* Top bar over image */}
        <View style={styles.topBar}>
          <View style={styles.badge}>
            <Text style={styles.badgeDot}>✦</Text>
            <Text style={styles.badgeText}>
              {place.verificationStatus === 'Verified' ? 'VERIFIED ICON' : 'HERITAGE CANDIDATE'}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.bookmarkButton, pressed && { opacity: 0.7 }]}
            onPress={(e) => {
              e.stopPropagation();
              onToggleSave(place.id);
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={saved ? `Remove ${place.name} from bucket list` : `Save ${place.name} to bucket list`}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={saved ? colors.orange : colors.white}
            />
          </Pressable>
        </View>

        {/* Bottom content overlay */}
        <View style={styles.contentOverlay}>
          <Text style={styles.areaText} numberOfLines={1}>
            {place.area || 'Delhi NCR'}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {place.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {place.category || 'Curated dining'}
            </Text>
            {place.budgetPerPerson ? (
              <Text style={styles.budgetText}>~₹{place.budgetPerPerson} / person</Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 290,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  imageWrapper: {
    width: '100%',
    height: 205,
    position: 'relative',
    backgroundColor: colors.ink,
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(29, 41, 36, 0.45)',
  },
  topBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 41, 36, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeDot: {
    color: colors.orange,
    fontSize: 10,
    fontWeight: '900',
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(29, 41, 36, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 24,
    backgroundColor: 'rgba(29, 41, 36, 0.65)',
    zIndex: 2,
  },
  areaText: {
    color: '#D2DCD5',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  categoryText: {
    color: '#E5EDE8',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  budgetText: {
    color: '#E5EDE8',
    fontSize: 11,
    fontWeight: '700',
  },
});
