import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '@/components/SearchBar';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { getRestaurantImage } from '@/data/restaurantImages';
import { colors, radius } from '@/theme/colors';
import type { Visit } from '@/types';

type SortOption = 'recent' | 'rating' | 'spend';
type FilterTag = 'all' | 'high_rated' | 'with_notes' | 'solo';

function formatDateDisplay(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export default function JournalScreen() {
  const router = useRouter();
  const { visits, places, deleteVisit } = useFoodTrail();

  // Search, filter & sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTag>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  // Filtered & sorted visits
  const displayedVisits = useMemo(() => {
    let result = [...visits];

    // 1. Search Query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((v) => {
        const text = `${v.placeName} ${v.items} ${v.notes} ${v.companions}`.toLowerCase();
        return text.includes(query);
      });
    }

    // 2. Tag Filter
    if (activeFilter === 'high_rated') {
      result = result.filter((v) => v.rating !== null && v.rating >= 8);
    } else if (activeFilter === 'with_notes') {
      result = result.filter((v) => Boolean(v.notes?.trim()));
    } else if (activeFilter === 'solo') {
      result = result.filter((v) => v.partySize === 1 || /solo/i.test(v.companions));
    }

    // 3. Sorting
    if (sortOption === 'recent') {
      result.sort((a, b) => b.visitDate.localeCompare(a.visitDate));
    } else if (sortOption === 'rating') {
      result.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    } else if (sortOption === 'spend') {
      result.sort((a, b) => (b.spend ?? b.personalShare ?? -1) - (a.spend ?? a.personalShare ?? -1));
    }

    return result;
  }, [visits, searchQuery, activeFilter, sortOption]);

  const handleDelete = (visit: Visit) => {
    Alert.alert(
      'Delete Journal Entry?',
      `Are you sure you want to delete your visit record for ${visit.placeName} on ${visit.visitDate}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteVisit(visit.id);
          },
        },
      ]
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    setSortOption('recent');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>YOUR PERSONAL DINING LOG</Text>
          <Text style={styles.title}>Dining Journal</Text>
          <Text style={styles.sub}>
            {visits.length === 1
              ? '1 recorded food story. Every dish, bill & memory preserved.'
              : `${visits.length} recorded visits across Delhi NCR establishments.`}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.addFab, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/add-visit')}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addFabText}>Log Visit</Text>
        </Pressable>
      </View>

      {visits.length > 0 ? (
        <View style={styles.controlsSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search visited places, dishes, notes..."
            onClear={() => setSearchQuery('')}
          />

          {/* Quick Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            <Pressable
              style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
                All Visits ({visits.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, activeFilter === 'high_rated' && styles.filterChipActive]}
              onPress={() => setActiveFilter('high_rated')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'high_rated' && styles.filterChipTextActive]}>
                ★ 8+ Rated
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, activeFilter === 'with_notes' && styles.filterChipActive]}
              onPress={() => setActiveFilter('with_notes')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'with_notes' && styles.filterChipTextActive]}>
                Detailed Reviews
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterChip, activeFilter === 'solo' && styles.filterChipActive]}
              onPress={() => setActiveFilter('solo')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'solo' && styles.filterChipTextActive]}>
                Solo Meals
              </Text>
            </Pressable>
          </ScrollView>

          {/* Sort & Count Bar */}
          <View style={styles.sortRow}>
            <Text style={styles.resultCount}>
              Showing {displayedVisits.length} of {visits.length}
            </Text>

            <View style={styles.sortOptions}>
              <Pressable
                style={[styles.sortChip, sortOption === 'recent' && styles.sortChipActive]}
                onPress={() => setSortOption('recent')}
              >
                <Text style={[styles.sortChipText, sortOption === 'recent' && styles.sortChipTextActive]}>
                  Newest
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sortChip, sortOption === 'rating' && styles.sortChipActive]}
                onPress={() => setSortOption('rating')}
              >
                <Text style={[styles.sortChipText, sortOption === 'rating' && styles.sortChipTextActive]}>
                  Rating
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sortChip, sortOption === 'spend' && styles.sortChipActive]}
                onPress={() => setSortOption('spend')}
              >
                <Text style={[styles.sortChipText, sortOption === 'spend' && styles.sortChipTextActive]}>
                  Spend
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (visits.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="book-outline" size={36} color={colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>Your first food story starts here.</Text>
          <Text style={styles.emptySubtitle}>
            Whenever you dine out in Delhi NCR, log what you ordered, what you spent, and how you&apos;d rate the experience.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyActionBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/add-visit')}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="create-outline" size={18} color={colors.white} />
            <Text style={styles.emptyActionBtnText}>Log Your First Dining Visit</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={32} color={colors.muted} />
        <Text style={styles.emptyTitle}>No matching journal entries</Text>
        <Text style={styles.emptySubtitle}>
          Try searching for different dish names, companions, or clear active filters.
        </Text>
        <Pressable style={styles.resetButton} onPress={resetFilters}>
          <Text style={styles.resetButtonText}>Reset Filters</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={displayedVisits}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const place = places.find((p) => p.id === item.placeId);
          const hasCatalogueMatch = Boolean(place);
          const thumbUrl = place ? getRestaurantImage(place) : (item.photos && item.photos[0]) || null;

          return (
            <View style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                {thumbUrl ? (
                  <Image source={{ uri: thumbUrl }} style={styles.cardHeaderThumb} resizeMode="cover" />
                ) : null}
                <View style={styles.dateAndPlace}>
                  <View style={styles.dateBadge}>
                    <Ionicons name="calendar-outline" size={12} color={colors.muted} />
                    <Text style={styles.dateText}>{formatDateDisplay(item.visitDate)}</Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      if (place) router.push(`/place/${place.id}`);
                    }}
                    disabled={!place}
                  >
                    <Text style={[styles.placeName, hasCatalogueMatch && styles.placeNameLink]}>
                      {item.placeName}
                      {hasCatalogueMatch ? ' ↗' : ''}
                    </Text>
                  </Pressable>
                </View>

                {item.rating !== null ? (
                  <View
                    style={[
                      styles.ratingBadge,
                      item.rating >= 8.5 ? styles.ratingHigh : item.rating >= 7 ? styles.ratingMid : styles.ratingLow,
                    ]}
                  >
                    <Ionicons name="star" size={13} color={colors.white} />
                    <Text style={styles.ratingBadgeText}>{item.rating} / 10</Text>
                  </View>
                ) : null}
              </View>

              {/* Items & Dishes Tried */}
              {item.items ? (
                <View style={styles.detailRow}>
                  <Ionicons name="restaurant-outline" size={15} color={colors.accent} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>DISHES & DRINKS TRIED</Text>
                    <Text style={styles.detailValue}>{item.items}</Text>
                  </View>
                </View>
              ) : null}

              {/* Bill & Party Size Breakdown */}
              {(item.spend !== null || item.personalShare !== null || item.partySize) ? (
                <View style={styles.spendStrip}>
                  {item.partySize ? (
                    <View style={styles.spendItem}>
                      <Text style={styles.spendLabel}>PARTY</Text>
                      <Text style={styles.spendValue}>
                        {item.partySize === 1 ? 'Solo' : `${item.partySize} guests`}
                      </Text>
                    </View>
                  ) : null}

                  {item.spend !== null ? (
                    <View style={styles.spendItem}>
                      <Text style={styles.spendLabel}>TOTAL BILL</Text>
                      <Text style={styles.spendValue}>₹{item.spend}</Text>
                    </View>
                  ) : null}

                  {item.personalShare !== null ? (
                    <View style={styles.spendItem}>
                      <Text style={styles.spendLabel}>YOUR SHARE</Text>
                      <Text style={[styles.spendValue, styles.spendPersonal]}>₹{item.personalShare}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Companions */}
              {item.companions ? (
                <View style={styles.companionRow}>
                  <Ionicons name="people-outline" size={14} color={colors.muted} />
                  <Text style={styles.companionText}>With: {item.companions}</Text>
                </View>
              ) : null}

              {/* Personal Notes / Review */}
              {item.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>&ldquo;{item.notes}&rdquo;</Text>
                </View>
              ) : null}

              {/* Attached Photos */}
              {item.photos && item.photos.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
                  {item.photos.map((uri, idx) => (
                    <Image key={idx} source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                  ))}
                </ScrollView>
              ) : null}

              {/* Card Footer: Action Buttons */}
              <View style={styles.cardFooter}>
                {place ? (
                  <Pressable
                    style={styles.viewPlaceLink}
                    onPress={() => router.push(`/place/${place.id}`)}
                  >
                    <Ionicons name="location-outline" size={13} color={colors.accent} />
                    <Text style={styles.viewPlaceLinkText}>View Catalogue Spot</Text>
                  </Pressable>
                ) : (
                  <View />
                )}

                <View style={styles.actionBtnGroup}>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => router.push({ pathname: '/add-visit', params: { visitId: item.id } })}
                    hitSlop={8}
                  >
                    <Ionicons name="create-outline" size={15} color={colors.accent} />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => handleDelete(item)}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={15} color="#C0392B" />
                    <Text style={[styles.actionBtnText, { color: '#C0392B' }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 14,
  },
  headerContainer: {
    gap: 16,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  sub: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  addFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  addFabText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  controlsSection: {
    gap: 12,
  },
  horizontalScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  resultCount: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  sortChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  sortChipTextActive: {
    color: colors.accent,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  dateAndPlace: {
    flex: 1,
    gap: 4,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  placeName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  placeNameLink: {
    color: colors.ink,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  ratingHigh: {
    backgroundColor: colors.accent,
  },
  ratingMid: {
    backgroundColor: colors.orange,
  },
  ratingLow: {
    backgroundColor: colors.muted,
  },
  ratingBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  detailValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 18,
  },
  spendStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spendItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  spendLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  spendValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  spendPersonal: {
    color: colors.accent,
  },
  companionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  notesBox: {
    backgroundColor: '#FAF7F0',
    borderRadius: radius.sm,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
  },
  notesText: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  photosScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 2,
  },
  viewPlaceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewPlaceLinkText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radius.pill,
    marginTop: 8,
  },
  emptyActionBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  resetButton: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  resetButtonText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
});
