import React, { useMemo, useState } from 'react';
import {
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
import { DELHI_LOCATIONS } from '@/components/LocationPickerModal';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { getRestaurantImage } from '@/data/restaurantImages';
import { colors, radius } from '@/theme/colors';
import type { Place } from '@/types';

type SortOption = 'recent' | 'name' | 'budget_asc' | 'budget_desc';

const CUISINE_FILTERS = [
  { id: 'all', label: 'All Cuisines' },
  { id: 'mughlai', label: 'Mughlai & Kebabs', match: (p: Place) => /mughlai|kebab|chicken|meat/i.test(`${p.category} ${p.name}`) },
  { id: 'north_indian', label: 'North Indian', match: (p: Place) => /north indian|punjabi|chole|frontier/i.test(`${p.category} ${p.name}`) },
  { id: 'street', label: 'Street Food', match: (p: Place) => /street|chaat|paranthe|kachori/i.test(`${p.category} ${p.name}`) },
  { id: 'cafes', label: 'Cafes & Bakeries', match: (p: Place) => /cafe|coffee|bakery|patisserie|deli/i.test(`${p.category} ${p.name}`) },
  { id: 'asian', label: 'Asian', match: (p: Place) => /asian|himalayan|tibetan|chinese|japanese/i.test(`${p.category} ${p.name}`) },
  { id: 'sweets', label: 'Sweets & Kulfi', match: (p: Place) => /sweet|dessert|kulfi|jalebi/i.test(`${p.category} ${p.name}`) },
];

export default function BucketScreen() {
  const router = useRouter();
  const { places, savedIds, toggleSaved } = useFoodTrail();

  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [selectedCuisineId, setSelectedCuisineId] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  // Derive saved places list in reversed savedIds order (recently added first)
  const allSavedPlaces = useMemo(() => {
    // preserve reverse savedIds order
    const map = new Map<string, Place>(places.map((p) => [p.id, p]));
    const list: Place[] = [];
    for (let i = savedIds.length - 1; i >= 0; i--) {
      const p = map.get(savedIds[i]);
      if (p) list.push(p);
    }
    return list;
  }, [places, savedIds]);

  // Filtered & sorted saved places
  const displayedPlaces = useMemo(() => {
    let result = [...allSavedPlaces];

    // 1. Search Query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((p) => {
        const text = `${p.name} ${p.area} ${p.category} ${p.notes}`.toLowerCase();
        return text.includes(query);
      });
    }

    // 2. Locality Filter
    if (selectedLocationId !== 'all') {
      const loc = DELHI_LOCATIONS.find((l) => l.id === selectedLocationId);
      if (loc && loc.keywords.length > 0) {
        result = result.filter((p) => {
          const area = p.area.toLowerCase();
          return loc.keywords.some((k) => area.includes(k.toLowerCase()));
        });
      }
    }

    // 3. Cuisine Filter
    if (selectedCuisineId !== 'all') {
      const cuisine = CUISINE_FILTERS.find((c) => c.id === selectedCuisineId);
      if (cuisine && cuisine.match) {
        result = result.filter(cuisine.match);
      }
    }

    // 4. Sorting
    if (sortOption === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === 'budget_asc') {
      result.sort((a, b) => (a.budgetPerPerson ?? 99999) - (b.budgetPerPerson ?? 99999));
    } else if (sortOption === 'budget_desc') {
      result.sort((a, b) => (b.budgetPerPerson ?? -1) - (a.budgetPerPerson ?? -1));
    }
    // 'recent' keeps the existing reverse order

    return result;
  }, [allSavedPlaces, searchQuery, selectedLocationId, selectedCuisineId, sortOption]);

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedLocationId !== 'all' || selectedCuisineId !== 'all' || sortOption !== 'recent';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedLocationId('all');
    setSelectedCuisineId('all');
    setSortOption('recent');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleSection}>
        <Text style={styles.kicker}>PLACES YOU WANT TO TRY</Text>
        <Text style={styles.title}>Bucket List</Text>
        <Text style={styles.sub}>
          {allSavedPlaces.length === 1
            ? '1 curated place saved. Your next Delhi NCR food adventure starts here.'
            : `${allSavedPlaces.length} curated places saved. Your personal dining wishlist.`}
        </Text>
      </View>

      {allSavedPlaces.length > 0 ? (
        <View style={styles.controlsSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved spots, locality, cuisine..."
            onClear={() => setSearchQuery('')}
          />

          {/* Locality Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {DELHI_LOCATIONS.map((loc) => {
              const active = selectedLocationId === loc.id;
              return (
                <Pressable
                  key={loc.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedLocationId(loc.id)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {loc.id === 'all' ? 'All Areas' : loc.name.split('&')[0].trim()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Cuisine Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {CUISINE_FILTERS.map((cuisine) => {
              const active = selectedCuisineId === cuisine.id;
              return (
                <Pressable
                  key={cuisine.id}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setSelectedCuisineId(cuisine.id)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {cuisine.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Sort Selection & Count Row */}
          <View style={styles.sortRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.resultCount}>
                Showing {displayedPlaces.length} of {allSavedPlaces.length}
              </Text>
              {hasActiveFilters ? (
                <Pressable onPress={resetFilters} hitSlop={6}>
                  <Text style={styles.resetFilterLink}>Reset</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.sortOptions}>
              <Pressable
                style={[styles.sortChip, sortOption === 'recent' && styles.sortChipActive]}
                onPress={() => setSortOption('recent')}
              >
                <Text style={[styles.sortChipText, sortOption === 'recent' && styles.sortChipTextActive]}>
                  Recent
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sortChip, sortOption === 'name' && styles.sortChipActive]}
                onPress={() => setSortOption('name')}
              >
                <Text style={[styles.sortChipText, sortOption === 'name' && styles.sortChipTextActive]}>
                  A–Z
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sortChip, sortOption === 'budget_asc' && styles.sortChipActive]}
                onPress={() => setSortOption(sortOption === 'budget_asc' ? 'budget_desc' : 'budget_asc')}
              >
                <Text
                  style={[
                    styles.sortChipText,
                    (sortOption === 'budget_asc' || sortOption === 'budget_desc') && styles.sortChipTextActive,
                  ]}
                >
                  {sortOption === 'budget_desc' ? 'Price ↓' : 'Price ↑'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (allSavedPlaces.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bookmark-outline" size={36} color={colors.orange} />
          </View>
          <Text style={styles.emptyTitle}>Your Bucket List is empty</Text>
          <Text style={styles.emptySubtitle}>
            Save iconic Delhi NCR restaurants, hidden Old Delhi gems, and artisanal cafes while exploring the catalogue.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.exploreButton, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/(tabs)/discover')}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="compass-outline" size={18} color={colors.white} />
            <Text style={styles.exploreButtonText}>Explore Discover Catalogue</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={32} color={colors.muted} />
        <Text style={styles.emptyTitle}>No matching saved places</Text>
        <Text style={styles.emptySubtitle}>
          Try adjusting your search query, area selection, or cuisine filters.
        </Text>
        <Pressable style={styles.resetButton} onPress={resetFilters}>
          <Text style={styles.resetButtonText}>Reset All Filters</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={displayedPlaces}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const imageUrl = getRestaurantImage(item);
          const isVerified = item.verificationStatus === 'Verified';

          return (
            <Pressable
              style={({ pressed }) => [styles.placeCard, pressed && { opacity: 0.96 }]}
              onPress={() => router.push(`/place/${item.id}`)}
              android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
            >
              <View style={styles.cardMain}>
                <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.cardDetails}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Pressable
                      style={styles.removeIconBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleSaved(item.id);
                      }}
                      hitSlop={10}
                      accessibilityLabel="Remove from bucket list"
                    >
                      <Ionicons name="bookmark" size={18} color={colors.orange} />
                    </Pressable>
                  </View>

                  <Text style={styles.cardArea} numberOfLines={1}>
                    {item.area || 'Delhi NCR'}
                  </Text>

                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardCategory} numberOfLines={1}>
                      {item.category || 'Dining place'}
                    </Text>
                    {item.budgetPerPerson ? (
                      <Text style={styles.cardBudget}>~₹{item.budgetPerPerson}</Text>
                    ) : (
                      <Text style={styles.cardBudgetPending}>Price unconfirmed</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Card Footer Actions */}
              <View style={styles.cardFooter}>
                <View style={[styles.statusTag, isVerified ? styles.statusVerified : styles.statusPending]}>
                  <Text style={[styles.statusTagText, isVerified ? styles.statusVerifiedText : styles.statusPendingText]}>
                    {isVerified ? 'VERIFIED SPOT' : 'CANDIDATE'}
                  </Text>
                </View>

                <View style={styles.actionButtonGroup}>
                  <Pressable
                    style={({ pressed }) => [styles.logVisitBtn, pressed && { opacity: 0.8 }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({ pathname: '/add-visit', params: { placeId: item.id } });
                    }}
                  >
                    <Ionicons name="create-outline" size={13} color={colors.accent} />
                    <Text style={styles.logVisitBtnText}>Log Visit</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleSaved(item.id);
                    }}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
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
  titleSection: {
    gap: 4,
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
  resetFilterLink: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
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
  placeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 12,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardMain: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  cardDetails: {
    flex: 1,
    gap: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  removeIconBtn: {
    padding: 2,
  },
  cardArea: {
    color: colors.muted,
    fontSize: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  cardCategory: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  cardBudget: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  cardBudgetPending: {
    color: colors.muted,
    fontSize: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusVerified: {
    backgroundColor: colors.accentSoft,
  },
  statusPending: {
    backgroundColor: colors.surfaceMuted,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusVerifiedText: {
    color: colors.accent,
  },
  statusPendingText: {
    color: colors.muted,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logVisitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  logVisitBtnText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  removeBtnText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
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
    backgroundColor: colors.surfaceMuted,
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
    maxWidth: 280,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
    marginTop: 8,
  },
  exploreButtonText: {
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
