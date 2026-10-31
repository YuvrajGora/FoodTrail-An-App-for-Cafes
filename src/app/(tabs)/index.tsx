import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { PlaceCard } from '@/components/PlaceCard';
import { FeaturedPlaceCard } from '@/components/FeaturedPlaceCard';
import { CategoryPill } from '@/components/CategoryPill';
import { SearchBar } from '@/components/SearchBar';
import {
  DELHI_LOCATIONS,
  LocationOption,
  LocationPickerModal,
} from '@/components/LocationPickerModal';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors, radius } from '@/theme/colors';
import type { Place } from '@/types';

// Curated top iconic venues for the Featured showcase
const FEATURED_IDS = [
  'karim-s',
  'lakhori-at-haveli-dharampura',
  'farzi-cafe-cp',
  'the-grammar-room',
  'yeti-himalayan-kitchen',
  'kuremal-mohan-lal-kulfi-wale',
  'old-famous-jalebi-wala',
  'kake-di-hatti',
  'changezi-chicken',
  'sita-ram-diwan-chand',
  'united-coffee-house',
  'piano-man-jazz-club',
];

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  match: (p: Place) => boolean;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'All Cuisines', icon: '🍽️', match: () => true },
  {
    id: 'mughlai',
    name: 'Mughlai & Kebabs',
    icon: '🍢',
    match: (p) => /mughlai|kebab|chicken|meat/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'north-indian',
    name: 'North Indian',
    icon: '🍛',
    match: (p) => /north indian|punjabi|chole/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'street',
    name: 'Street Food & Chaat',
    icon: '🥟',
    match: (p) => /street|chaat|paranthe|kachori/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'modern',
    name: 'Modern Indian',
    icon: '✨',
    match: (p) => /modern indian|contemporary|fusion/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'cafes',
    name: 'Cafes & Bakeries',
    icon: '☕',
    match: (p) => /cafe|coffee|bakery|patisserie|deli/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'asian',
    name: 'Asian & Himalayan',
    icon: '🥢',
    match: (p) => /asian|himalayan|tibetan|nepalese|chinese|japanese/i.test(`${p.category} ${p.name}`),
  },
  {
    id: 'sweets',
    name: 'Sweets & Kulfi',
    icon: '🍨',
    match: (p) => /sweet|dessert|kulfi|jalebi|gelato/i.test(`${p.category} ${p.name}`),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { places, savedIds, visits, toggleSaved } = useFoodTrail();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState<LocationOption>(DELHI_LOCATIONS[0]);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Filter places based on search query, category, and location
  const filteredPlaces = useMemo(() => {
    const activeCategory = CATEGORIES.find((c) => c.id === selectedCategory);
    const query = searchQuery.trim().toLowerCase();

    return places.filter((place) => {
      // 1. Location filter
      if (selectedLocation.id !== 'all' && selectedLocation.keywords.length > 0) {
        const areaLower = (place.area || '').toLowerCase();
        const matchesLocation = selectedLocation.keywords.some((kw) => areaLower.includes(kw));
        if (!matchesLocation) return false;
      }

      // 2. Category filter
      if (activeCategory && !activeCategory.match(place)) {
        return false;
      }

      // 3. Search query
      if (query) {
        const textToSearch = `${place.name} ${place.area} ${place.category} ${place.notes}`.toLowerCase();
        if (!textToSearch.includes(query)) return false;
      }

      return true;
    });
  }, [places, searchQuery, selectedCategory, selectedLocation]);

  // Featured places list
  const featuredPlaces = useMemo(() => {
    const verified = places.filter((p) => p.verificationStatus === 'Verified');
    const priorityList = FEATURED_IDS.map((id) => verified.find((p) => p.id === id)).filter(
      (p): p is Place => p !== undefined
    );

    // Apply location filter to featured spots if a specific region is active
    if (selectedLocation.id !== 'all') {
      const locationFiltered = priorityList.filter((p) =>
        selectedLocation.keywords.some((kw) => (p.area || '').toLowerCase().includes(kw))
      );
      if (locationFiltered.length > 0) return locationFiltered;
    }

    return priorityList.length > 0 ? priorityList : verified.slice(0, 6);
  }, [places, selectedLocation]);

  // Saved bucket list preview items
  const savedPreviewPlaces = useMemo(() => {
    return places.filter((p) => savedIds.includes(p.id)).slice(0, 4);
  }, [places, savedIds]);

  return (
    <Screen>
      {/* 1. Header Bar: Branding & Location & Avatar */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.kicker}>NEW DELHI • NCR DINING JOURNAL</Text>
          <Text style={styles.logo}>
            FoodTrail<Text style={styles.logoDot}> ✦</Text>
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open user profile"
        >
          <Text style={styles.avatarText}>YG</Text>
        </Pressable>
      </View>

      {/* Location Selector Pill */}
      <View style={styles.locationSelectorRow}>
        <Pressable
          style={({ pressed }) => [styles.locationPill, pressed && { opacity: 0.8 }]}
          onPress={() => setLocationModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Change location from ${selectedLocation.name}`}
        >
          <Ionicons name="location-sharp" size={14} color={colors.accent} />
          <Text style={styles.locationText} numberOfLines={1}>
            {selectedLocation.name}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.accent} />
        </Pressable>

        <Text style={styles.catalogueBadge}>
          {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'}
        </Text>
      </View>

      {/* 2. Editorial Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search kebabs, chaat, heritage cafes..."
      />

      {/* 3. Cuisine / Category Filter Carousel */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.id}
              id={cat.id}
              name={cat.name}
              icon={cat.icon}
              active={selectedCategory === cat.id}
              onPress={setSelectedCategory}
            />
          ))}
        </ScrollView>
      </View>

      {/* 4. Editorial Hero Welcome / Stat Strip */}
      <View style={styles.heroBox}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroEyebrow}>HERITAGE DINING JOURNAL</Text>
          <Text style={styles.heroTitle}>Good food.{"\n"}Better memories.</Text>
          <Text style={styles.heroCopy}>
            Keep every iconic spot you want to try, and every unforgettable meal worth remembering.
          </Text>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>{places.length}</Text>
            <Text style={styles.heroStatLabel}>CATALOGUE</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>{savedIds.length}</Text>
            <Text style={styles.heroStatLabel}>BUCKET LIST</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>{visits.length}</Text>
            <Text style={styles.heroStatLabel}>VISITS LOGGED</Text>
          </View>
        </View>
      </View>

      {/* 5. Featured Restaurant Section */}
      <View style={styles.sectionHeaderRow}>
        <SectionTitle title="The Heritage Edit" action="VERIFIED ICONS" />
      </View>
      <FlatList
        data={featuredPlaces}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuredList}
        renderItem={({ item }) => (
          <FeaturedPlaceCard
            place={item}
            saved={savedIds.includes(item.id)}
            onToggleSave={toggleSaved}
          />
        )}
      />

      {/* 6. Bucket List Preview Section */}
      <View style={styles.bucketPreviewSection}>
        <View style={styles.sectionHeaderRow}>
          <SectionTitle
            title="Your Bucket List"
            action={savedIds.length > 0 ? `VIEW ALL (${savedIds.length})` : undefined}
          />
          {savedIds.length > 0 ? (
            <Pressable
              onPress={() => router.push('/(tabs)/bucket')}
              style={({ pressed }) => [{ paddingVertical: 4 }, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.sectionActionText}>Open List →</Text>
            </Pressable>
          ) : null}
        </View>

        {savedPreviewPlaces.length > 0 ? (
          <View style={styles.savedGrid}>
            {savedPreviewPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                saved
                onToggleSave={toggleSaved}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBucketCard}>
            <View style={styles.emptyBucketIcon}>
              <Ionicons name="bookmark-outline" size={24} color={colors.accent} />
            </View>
            <Text style={styles.emptyBucketTitle}>Your dining trail is waiting.</Text>
            <Text style={styles.emptyBucketCopy}>
              Tap the bookmark icon on any restaurant card to save your next food destination.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.exploreBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/(tabs)/discover')}
            >
              <Text style={styles.exploreBtnText}>Explore Delhi NCR Catalogue →</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 7. Recently Added Places / Neighborhood Gems */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <SectionTitle
            title={
              selectedCategory === 'all'
                ? selectedLocation.id === 'all'
                  ? 'Neighborhood Gems'
                  : `Dining in ${selectedLocation.name}`
                : `${CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Filtered'} Spots`
            }
          />
          <Text style={styles.resultsCount}>
            Showing {filteredPlaces.length} candidate venues
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [{ paddingVertical: 4 }, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/(tabs)/discover')}
        >
          <Text style={styles.sectionActionText}>Discover All →</Text>
        </Pressable>
      </View>

      <View style={styles.placeList}>
        {filteredPlaces.slice(0, 8).map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            saved={savedIds.includes(place.id)}
            onToggleSave={toggleSaved}
          />
        ))}

        {filteredPlaces.length === 0 ? (
          <View style={styles.noResultsBox}>
            <Ionicons name="search-outline" size={32} color={colors.muted} />
            <Text style={styles.noResultsTitle}>No places found</Text>
            <Text style={styles.noResultsCopy}>
              No venues matched &ldquo;{searchQuery}&rdquo; in {selectedLocation.name}. Try resetting your search or category filter.
            </Text>
            <Pressable
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLocation(DELHI_LOCATIONS[0]);
              }}
            >
              <Text style={styles.resetFilterText}>Reset All Filters</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* 8. Editorial Footnote / Data Transparency Notice */}
      <View style={styles.disclaimerBanner}>
        <View style={styles.disclaimerTop}>
          <Text style={styles.disclaimerStar}>✦</Text>
          <Text style={styles.disclaimerHeading}>DELHI NCR CATALOGUE NOTICE</Text>
        </View>
        <Text style={styles.disclaimerText}>
          FoodTrail features 132 genuine Delhi NCR dining spots across Old Delhi, Connaught Place, South Delhi, and Gurugram (58 verified). Local offline bookmarking and journal logging are fully active. Live Supabase synchronization and Google Maps will be connected in Milestone 3.
        </Text>
      </View>

      {/* Location Picker Bottom Sheet Modal */}
      <LocationPickerModal
        visible={locationModalVisible}
        selectedId={selectedLocation.id}
        onSelect={setSelectedLocation}
        onClose={() => setLocationModalVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  brandContainer: {
    gap: 2,
  },
  kicker: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  logo: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -1,
  },
  logoDot: {
    color: colors.orange,
    fontSize: 18,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  locationSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  locationText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 220,
  },
  catalogueBadge: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  categoriesSection: {
    marginHorizontal: -20,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  heroBox: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: 22,
    gap: 16,
    overflow: 'hidden',
  },
  heroHeader: {
    gap: 8,
  },
  heroEyebrow: {
    color: '#B8C7BE',
    fontSize: 9,
    letterSpacing: 1.6,
    fontWeight: '800',
  },
  heroTitle: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroCopy: {
    color: '#D0D8D2',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 280,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: '#B8C7BE',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  sectionActionText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  featuredList: {
    gap: 16,
    paddingRight: 20,
  },
  bucketPreviewSection: {
    gap: 12,
  },
  savedGrid: {
    gap: 10,
  },
  emptyBucketCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyBucketIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyBucketTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBucketCopy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 260,
  },
  exploreBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  exploreBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  resultsCount: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  placeList: {
    gap: 12,
  },
  noResultsBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  noResultsTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  noResultsCopy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  resetFilterBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  resetFilterText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  disclaimerBanner: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
    marginTop: 8,
  },
  disclaimerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disclaimerStar: {
    color: colors.orange,
    fontSize: 12,
  },
  disclaimerHeading: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  disclaimerText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
  },
});
