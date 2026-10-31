import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '@/components/SearchBar';
import { PlaceCard } from '@/components/PlaceCard';
import { DELHI_LOCATIONS } from '@/components/LocationPickerModal';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors, radius } from '@/theme/colors';
import type { Place } from '@/types';

type VerificationFilter = 'all' | 'verified' | 'to_verify';
type BudgetFilter = 'all' | 'budget' | 'mid' | 'fine' | 'unconfirmed';
type SortOption = 'default' | 'name' | 'budget_asc' | 'budget_desc';

interface CuisineOption {
  id: string;
  label: string;
  icon: string;
  match: (p: Place) => boolean;
}

const CUISINES: CuisineOption[] = [
  { id: 'all', label: 'All Cuisines', icon: '🍽️', match: () => true },
  {
    id: 'mughlai',
    label: 'Mughlai & Kebabs',
    icon: '🍢',
    match: (p) => /mughlai|kebab|chicken|meat/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'north_indian',
    label: 'North Indian',
    icon: '🍛',
    match: (p) => /north indian|punjabi|chole|frontier/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'street',
    label: 'Street Food & Chaat',
    icon: '🥟',
    match: (p) => /street|chaat|paranthe|kachori/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'modern',
    label: 'Modern Indian',
    icon: '✨',
    match: (p) => /modern indian|contemporary|fusion/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'cafes',
    label: 'Cafes & Bakeries',
    icon: '☕',
    match: (p) => /cafe|coffee|bakery|patisserie|deli/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'asian',
    label: 'Asian & Himalayan',
    icon: '🥢',
    match: (p) => /asian|himalayan|tibetan|nepalese|chinese|japanese/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'sweets',
    label: 'Sweets & Kulfi',
    icon: '🍨',
    match: (p) => /sweet|dessert|kulfi|jalebi|gelato/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'south_indian',
    label: 'South Indian',
    icon: '🥞',
    match: (p) => /south indian|dosa|kerala|chettinad/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'continental',
    label: 'European & Italian',
    icon: '🍕',
    match: (p) => /continental|european|italian|pizza|mediterranean/i.test(`${p.category} ${p.name}`),
  },
];

const BUDGET_OPTIONS: { id: BudgetFilter; label: string; desc: string }[] = [
  { id: 'all', label: 'All Budgets', desc: 'Any cost' },
  { id: 'budget', label: '< ₹600', desc: 'Budget-friendly' },
  { id: 'mid', label: '₹600 – ₹1.5K', desc: 'Casual dining' },
  { id: 'fine', label: '> ₹1.5K', desc: 'Fine dining' },
  { id: 'unconfirmed', label: 'Pending', desc: 'Unverified price' },
];

export default function DiscoverScreen() {
  const { places, savedIds, toggleSaved } = useFoodTrail();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [selectedCuisineId, setSelectedCuisineId] = useState<string>('all');
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  const selectedLocation = useMemo(
    () => DELHI_LOCATIONS.find((l) => l.id === selectedLocationId) || DELHI_LOCATIONS[0],
    [selectedLocationId]
  );

  const selectedCuisine = useMemo(
    () => CUISINES.find((c) => c.id === selectedCuisineId) || CUISINES[0],
    [selectedCuisineId]
  );

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim().length > 0 ||
      verificationFilter !== 'all' ||
      selectedLocationId !== 'all' ||
      selectedCuisineId !== 'all' ||
      budgetFilter !== 'all' ||
      sortOption !== 'default'
    );
  }, [searchQuery, verificationFilter, selectedLocationId, selectedCuisineId, budgetFilter, sortOption]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setVerificationFilter('all');
    setSelectedLocationId('all');
    setSelectedCuisineId('all');
    setBudgetFilter('all');
    setSortOption('default');
  };

  // Filter and sort the restaurant collection
  const filteredPlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = places.filter((place) => {
      // 1. Search query (name, area, category, notes)
      if (query) {
        const text = `${place.name} ${place.area} ${place.category} ${place.notes}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      // 2. Verification status
      if (verificationFilter === 'verified' && place.verificationStatus !== 'Verified') {
        return false;
      }
      if (verificationFilter === 'to_verify' && place.verificationStatus === 'Verified') {
        return false;
      }

      // 3. Location / Region
      if (selectedLocation.id !== 'all' && selectedLocation.keywords.length > 0) {
        const areaLower = (place.area || '').toLowerCase();
        const matchesArea = selectedLocation.keywords.some((kw) => areaLower.includes(kw));
        if (!matchesArea) return false;
      }

      // 4. Cuisine category
      if (selectedCuisine.id !== 'all' && !selectedCuisine.match(place)) {
        return false;
      }

      // 5. Budget filter
      if (budgetFilter === 'budget') {
        if (place.budgetPerPerson === null || place.budgetPerPerson > 600) return false;
      } else if (budgetFilter === 'mid') {
        if (place.budgetPerPerson === null || place.budgetPerPerson <= 600 || place.budgetPerPerson > 1500) {
          return false;
        }
      } else if (budgetFilter === 'fine') {
        if (place.budgetPerPerson === null || place.budgetPerPerson <= 1500) return false;
      } else if (budgetFilter === 'unconfirmed') {
        if (place.budgetPerPerson !== null) return false;
      }

      return true;
    });

    // Sort results
    if (sortOption === 'name') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortOption === 'budget_asc') {
      return [...filtered].sort((a, b) => (a.budgetPerPerson ?? 99999) - (b.budgetPerPerson ?? 99999));
    }
    if (sortOption === 'budget_desc') {
      return [...filtered].sort((a, b) => (b.budgetPerPerson ?? 0) - (a.budgetPerPerson ?? 0));
    }

    return filtered;
  }, [places, searchQuery, verificationFilter, selectedLocation, selectedCuisine, budgetFilter, sortOption]);

  const verifiedCount = useMemo(() => places.filter((p) => p.verificationStatus === 'Verified').length, [places]);
  const toVerifyCount = places.length - verifiedCount;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filteredPlaces}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.kicker}>THE COMPLETE CAPITAL COLLECTION</Text>
              <Text style={styles.title}>Discover Places</Text>
              <Text style={styles.subtitle}>
                Explore {places.length} curated venues across Delhi NCR. Filter by neighborhood, cuisine and verification.
              </Text>
            </View>

            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, locality, or dish..."
            />

            {/* Verification Status Segmented Control */}
            <View style={styles.verificationSegment}>
              <Pressable
                style={[styles.segmentTab, verificationFilter === 'all' && styles.segmentTabActive]}
                onPress={() => setVerificationFilter('all')}
              >
                <Text style={[styles.segmentText, verificationFilter === 'all' && styles.segmentTextActive]}>
                  All ({places.length})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.segmentTab, verificationFilter === 'verified' && styles.segmentTabActive]}
                onPress={() => setVerificationFilter('verified')}
              >
                <Text style={[styles.segmentText, verificationFilter === 'verified' && styles.segmentTextActive]}>
                  ✦ Verified ({verifiedCount})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.segmentTab, verificationFilter === 'to_verify' && styles.segmentTabActive]}
                onPress={() => setVerificationFilter('to_verify')}
              >
                <Text style={[styles.segmentText, verificationFilter === 'to_verify' && styles.segmentTextActive]}>
                  To Verify ({toVerifyCount})
                </Text>
              </Pressable>
            </View>

            {/* Locality Filter Row */}
            <View style={styles.filterBlock}>
              <Text style={styles.filterBlockLabel}>REGION / LOCALITY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {DELHI_LOCATIONS.map((loc) => {
                  const active = loc.id === selectedLocationId;
                  return (
                    <Pressable
                      key={loc.id}
                      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                      onPress={() => setSelectedLocationId(loc.id)}
                    >
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={active ? colors.white : colors.accent}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                        {loc.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Cuisine Filter Row */}
            <View style={styles.filterBlock}>
              <Text style={styles.filterBlockLabel}>CUISINE CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {CUISINES.map((c) => {
                  const active = c.id === selectedCuisineId;
                  return (
                    <Pressable
                      key={c.id}
                      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                      onPress={() => setSelectedCuisineId(c.id)}
                    >
                      <Text style={{ marginRight: 5, fontSize: 12 }}>{c.icon}</Text>
                      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Budget Filter Row */}
            <View style={styles.filterBlock}>
              <Text style={styles.filterBlockLabel}>BUDGET RANGE (PER PERSON)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {BUDGET_OPTIONS.map((b) => {
                  const active = b.id === budgetFilter;
                  return (
                    <Pressable
                      key={b.id}
                      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                      onPress={() => setBudgetFilter(b.id)}
                    >
                      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                        {b.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Active Filters Summary Strip & Sorting */}
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.resultsCountText}>
                  SHOWING {filteredPlaces.length} OF {places.length} VENUES
                </Text>
                {selectedLocationId !== 'all' || selectedCuisineId !== 'all' || budgetFilter !== 'all' ? (
                  <Text style={styles.activeFiltersSub} numberOfLines={1}>
                    {[
                      selectedLocationId !== 'all' ? selectedLocation.name : null,
                      selectedCuisineId !== 'all' ? selectedCuisine.label : null,
                      budgetFilter !== 'all' ? BUDGET_OPTIONS.find((b) => b.id === budgetFilter)?.label : null,
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                ) : null}
              </View>

              {hasActiveFilters ? (
                <Pressable
                  style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.7 }]}
                  onPress={resetAllFilters}
                >
                  <Ionicons name="refresh-outline" size={12} color={colors.accent} />
                  <Text style={styles.resetButtonText}>Reset Filters</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <PlaceCard
            place={item}
            saved={savedIds.includes(item.id)}
            onToggleSave={toggleSaved}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search" size={28} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>No dining places matched</Text>
            <Text style={styles.emptyCopy}>
              We couldn&apos;t find any venues matching your active criteria. Try broadening your location, cuisine, or budget filters.
            </Text>
            <Pressable style={styles.emptyResetBtn} onPress={resetAllFilters}>
              <Text style={styles.emptyResetText}>Reset All Filters</Text>
            </Pressable>
          </View>
        }
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerContainer: {
    gap: 16,
    marginBottom: 16,
  },
  titleSection: {
    gap: 4,
    paddingTop: 4,
  },
  kicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  verificationSegment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  segmentTabActive: {
    backgroundColor: colors.accent,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: colors.white,
  },
  filterBlock: {
    gap: 7,
  },
  filterBlockLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  chipScroll: {
    gap: 8,
    paddingRight: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chipTextActive: {
    color: colors.white,
  },
  chipTextInactive: {
    color: colors.ink,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultsCountText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  activeFiltersSub: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    maxWidth: 220,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  resetButtonText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyResetBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginTop: 8,
  },
  emptyResetText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
