import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { getRestaurantImage } from '@/data/restaurantImages';
import { colors, radius } from '@/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { places, savedIds, visits } = useFoodTrail();

  // 1. Total unique establishments visited
  const uniquePlacesVisitedCount = useMemo(() => {
    const visitedSet = new Set<string>();
    visits.forEach((v) => {
      if (v.placeId) visitedSet.add(v.placeId);
      else if (v.placeName) visitedSet.add(v.placeName.trim().toLowerCase());
    });
    return visitedSet.size;
  }, [visits]);

  // 2. Total dining visits
  const totalVisitsCount = visits.length;

  // 3. Average personal rating
  const averageRating = useMemo(() => {
    const ratedVisits = visits.filter((v) => v.rating !== null && Number.isFinite(v.rating));
    if (ratedVisits.length === 0) return null;
    const sum = ratedVisits.reduce((acc, v) => acc + (v.rating as number), 0);
    return (sum / ratedVisits.length).toFixed(1);
  }, [visits]);

  // 4. Total actual personal spending
  const totalActualSpend = useMemo(() => {
    return visits.reduce((acc, v) => {
      const amt = v.personalShare !== null ? v.personalShare : v.spend !== null ? v.spend : 0;
      return acc + (amt || 0);
    }, 0);
  }, [visits]);

  // 5. Most visited cuisine
  const mostVisitedCuisine = useMemo<{ cuisine: string; count: number } | null>(() => {
    if (visits.length === 0) return null;
    const counts: Record<string, number> = {};
    visits.forEach((v) => {
      const p = places.find((item) => item.id === v.placeId);
      const cat = p?.category || 'Curated dining';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    let topCat: string | null = null;
    let topCount = 0;
    Object.entries(counts).forEach(([cat, count]) => {
      if (count > topCount) {
        topCount = count;
        topCat = cat;
      }
    });

    return topCat ? { cuisine: topCat, count: topCount } : null;
  }, [visits, places]);

  // 6. Favourite restaurants (rated 8+ or multiple visits)
  const favouritePlaces = useMemo(() => {
    // Map places by ID and compute high scores / visit frequencies
    const scoreMap: Record<string, { place: (typeof places)[0]; maxRating: number; count: number }> = {};

    visits.forEach((v) => {
      if (!v.placeId) return;
      const place = places.find((p) => p.id === v.placeId);
      if (!place) return;

      if (!scoreMap[place.id]) {
        scoreMap[place.id] = { place, maxRating: v.rating ?? 0, count: 1 };
      } else {
        scoreMap[place.id].count += 1;
        if (v.rating && v.rating > scoreMap[place.id].maxRating) {
          scoreMap[place.id].maxRating = v.rating;
        }
      }
    });

    return Object.values(scoreMap)
      .filter((item) => item.maxRating >= 8 || item.count > 1)
      .sort((a, b) => b.maxRating - a.maxRating || b.count - a.count)
      .slice(0, 4);
  }, [visits, places]);

  const verifiedCount = places.filter((p) => p.verificationStatus === 'Verified').length;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Identity Header */}
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>FT</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>FoodTrail Explorer</Text>
            <Text style={styles.userHandle}>Delhi NCR Dining Journal</Text>
            <View style={styles.guestBadge}>
              <Text style={styles.guestText}>LOCAL JOURNAL MODE</Text>
            </View>
          </View>
        </View>

        {/* Real Statistics Calculated from Local Records */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>PERSONAL DINING METRICS</Text>
          <View style={styles.statsGrid}>
            <StatBox label="PLACES VISITED" value={String(uniquePlacesVisitedCount)} />
            <View style={styles.statDivider} />
            <StatBox label="TOTAL MEALS" value={String(totalVisitsCount)} highlight />
            <View style={styles.statDivider} />
            <StatBox label="AVG RATING" value={averageRating ? `★ ${averageRating}` : '—'} />
          </View>

          <View style={styles.statsSubStrip}>
            <View style={styles.subStat}>
              <Ionicons name="wallet-outline" size={15} color={colors.accent} />
              <Text style={styles.subStatLabel}>Recorded Spend:</Text>
              <Text style={styles.subStatValue}>₹{totalActualSpend.toLocaleString('en-IN')}</Text>
            </View>

            {mostVisitedCuisine ? (
              <View style={styles.subStat}>
                <Ionicons name="flame-outline" size={15} color={colors.orange} />
                <Text style={styles.subStatLabel}>Top Cuisine:</Text>
                <Text style={styles.subStatValue}>
                  {mostVisitedCuisine.cuisine.split('&')[0].trim()} ({mostVisitedCuisine.count})
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Favourite Restaurants Section (if user has high rated visits) */}
        {favouritePlaces.length > 0 ? (
          <View style={styles.favouritesSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="star" size={16} color={colors.orange} />
              <Text style={styles.sectionTitle}>FAVOURITE SPOTS ({favouritePlaces.length})</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favouritesScroll}>
              {favouritePlaces.map(({ place, maxRating, count }) => {
                const img = getRestaurantImage(place);
                return (
                  <Pressable
                    key={place.id}
                    style={({ pressed }) => [styles.favCard, pressed && { opacity: 0.9 }]}
                    onPress={() => router.push(`/place/${place.id}`)}
                  >
                    <Image source={{ uri: img }} style={styles.favImage} resizeMode="cover" />
                    <View style={styles.favDetails}>
                      <Text style={styles.favName} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={styles.favArea} numberOfLines={1}>
                        {place.area}
                      </Text>
                      <View style={styles.favMeta}>
                        {maxRating > 0 ? (
                          <View style={styles.favRatingPill}>
                            <Ionicons name="star" size={10} color={colors.white} />
                            <Text style={styles.favRatingText}>{maxRating}/10</Text>
                          </View>
                        ) : null}
                        <Text style={styles.favVisitsText}>
                          {count === 1 ? '1 visit' : `${count} visits`}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Primary Navigation Shortcuts */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>JOURNAL & RECORD</Text>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/add-visit')}
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrapper}>
                <Ionicons name="create-outline" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.actionTitle}>Log a Dining Visit</Text>
                <Text style={styles.actionSub}>Record date, dishes, bill & rating</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/journal')}
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrapper}>
                <Ionicons name="book-outline" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.actionTitle}>Dining Journal ({visits.length})</Text>
                <Text style={styles.actionSub}>Chronological history of meals & ratings</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/bucket')}
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrapper}>
                <Ionicons name="bookmark-outline" size={20} color={colors.orange} />
              </View>
              <View>
                <Text style={styles.actionTitle}>Saved Bucket List ({savedIds.length})</Text>
                <Text style={styles.actionSub}>Curated spots you want to try next</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/discover')}
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          >
            <View style={styles.actionLeft}>
              <View style={styles.actionIconWrapper}>
                <Ionicons name="compass-outline" size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.actionTitle}>Discover Catalogue ({places.length})</Text>
                <Text style={styles.actionSub}>{verifiedCount} verified iconic Delhi NCR establishments</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {/* Architecture & Offline Persistence Protocol Note */}
        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Text style={styles.noteIcon}>✦</Text>
            <Text style={styles.noteTitle}>THE FOODTRAIL PROTOCOL</Text>
          </View>
          <Text style={styles.note}>
            All visit journals, spend tracking, and bucket list bookmarks are stored securely on this device (via AsyncStorage). Supabase Auth (magic link / OTP), cloud multi-device sync, and photo upload pipeline are prepared for the upcoming backend milestone.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 48,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  userHandle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  guestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  guestText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 14,
  },
  statsTitle: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  statValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  statValueHighlight: {
    color: colors.accent,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statsSubStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subStatLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  subStatValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  favouritesSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  favouritesScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  favCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  favImage: {
    width: '100%',
    height: 90,
    backgroundColor: colors.surfaceMuted,
  },
  favDetails: {
    padding: 10,
    gap: 3,
  },
  favName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  favArea: {
    color: colors.muted,
    fontSize: 11,
  },
  favMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  favRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.orange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  favRatingText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  favVisitsText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  actionSection: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  actionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  actionSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  noteCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteIcon: {
    color: colors.orange,
    fontSize: 14,
  },
  noteTitle: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
