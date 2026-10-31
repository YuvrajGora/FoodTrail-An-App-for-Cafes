import React, { useMemo } from 'react';
import {
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors, radius } from '@/theme/colors';
import { getRestaurantImage } from '@/data/restaurantImages';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { places, savedIds, visits, toggleSaved } = useFoodTrail();

  const place = useMemo(() => places.find((p) => p.id === id), [places, id]);
  const isSaved = place ? savedIds.includes(place.id) : false;

  // Find all logged visits for this specific place
  const placeVisits = useMemo(() => {
    if (!place) return [];
    return visits.filter(
      (v) => v.placeId === place.id || v.placeName.toLowerCase() === place.name.toLowerCase()
    );
  }, [place, visits]);

  if (!place) {
    return (
      <SafeAreaView style={styles.notFoundSafe}>
        <View style={styles.notFoundCard}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.orange} />
          <Text style={styles.notFoundTitle}>Restaurant Not Found</Text>
          <Text style={styles.notFoundCopy}>
            The dining establishment you are looking for is not in the FoodTrail catalogue.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Return to Discover</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = getRestaurantImage(place);
  const isVerified = place.verificationStatus === 'Verified';

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${place.name} on FoodTrail`,
        message: `Check out ${place.name} in ${place.area} on FoodTrail! ${place.mapsUrl || ''}`,
      });
    } catch {
      // User cancelled or share dismissed
    }
  };

  const handleOpenMaps = () => {
    if (place.mapsUrl) {
      Linking.openURL(place.mapsUrl);
    }
  };

  const handleOpenSource = () => {
    if (place.sourceUrl) {
      Linking.openURL(place.sourceUrl);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. Hero Image with Floating Controls */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroGradient} />

          {/* Floating Top Controls */}
          <View style={styles.topBar}>
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back to previous screen"
            >
              <Ionicons name="arrow-back" size={20} color={colors.white} />
            </Pressable>

            <View style={styles.topRightControls}>
              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
                onPress={handleShare}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Share restaurant"
              >
                <Ionicons name="share-social-outline" size={18} color={colors.white} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
                onPress={() => toggleSaved(place.id)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={isSaved ? 'Remove from bucket list' : 'Save to bucket list'}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isSaved ? colors.orange : colors.white}
                />
              </Pressable>
            </View>
          </View>

          {/* Hero Bottom Information */}
          <View style={styles.heroBottom}>
            <View style={[styles.statusBadge, isVerified ? styles.verifiedBadge : styles.pendingBadge]}>
              <Text style={styles.statusDot}>{isVerified ? '✦' : '•'}</Text>
              <Text style={styles.statusText}>
                {isVerified ? 'VERIFIED RECORD' : 'TO VERIFY • CANDIDATE'}
              </Text>
            </View>

            <Text style={styles.heroTitle}>{place.name}</Text>
            <Text style={styles.heroLocality}>{place.area || 'Delhi NCR'}</Text>
          </View>
        </View>

        {/* 2. Main Body Content */}
        <View style={styles.body}>
          {/* Quick Specifications Strip */}
          <View style={styles.specsRow}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>CUISINE</Text>
              <Text style={styles.specValue} numberOfLines={1}>
                {place.category || 'Curated dining'}
              </Text>
            </View>

            <View style={styles.specDivider} />

            <View style={styles.specBox}>
              <Text style={styles.specLabel}>BUDGET</Text>
              <Text style={styles.specValue}>
                {place.budgetPerPerson ? `~₹${place.budgetPerPerson}` : 'Unconfirmed'}
              </Text>
            </View>

            <View style={styles.specDivider} />

            <View style={styles.specBox}>
              <Text style={styles.specLabel}>STATUS</Text>
              <Text style={[styles.specValue, isVerified ? styles.specVerified : styles.specPending]}>
                {isVerified ? 'Checked' : 'To confirm'}
              </Text>
            </View>
          </View>

          {/* Primary Action Buttons */}
          <View style={styles.primaryActions}>
            <Pressable
              style={({ pressed }) => [styles.logVisitBtn, pressed && { opacity: 0.9 }]}
              onPress={() => router.push({ pathname: '/add-visit', params: { placeId: place.id } })}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <Ionicons name="create-outline" size={18} color={colors.white} />
              <Text style={styles.logVisitBtnText}>
                {placeVisits.length > 0 ? 'Log Another Visit' : 'Mark as Visited & Log Review'}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.bookmarkBtn,
                isSaved ? styles.bookmarkBtnSaved : styles.bookmarkBtnUnsaved,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => toggleSaved(place.id)}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={isSaved ? colors.orange : colors.accent}
              />
              <Text style={[styles.bookmarkBtnText, isSaved && styles.bookmarkBtnTextSaved]}>
                {isSaved ? 'In your Bucket List' : 'Add to Bucket List'}
              </Text>
            </Pressable>
          </View>

          {/* 3. Curator's Notes Section */}
          {place.notes ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionCardHeader}>
                <Text style={styles.sectionCardIcon}>✦</Text>
                <Text style={styles.sectionCardTitle}>CURATOR&apos;S NOTE & CONTEXT</Text>
              </View>
              <Text style={styles.notesText}>{place.notes}</Text>
            </View>
          ) : null}

          {/* 4. Logged Visits History (if user already recorded visits) */}
          {placeVisits.length > 0 ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionCardHeader}>
                <Ionicons name="time-outline" size={16} color={colors.accent} />
                <Text style={styles.sectionCardTitle}>
                  YOUR VISIT HISTORY ({placeVisits.length})
                </Text>
              </View>

              {placeVisits.map((v) => (
                <View key={v.id} style={styles.visitEntry}>
                  <View style={styles.visitEntryTop}>
                    <Text style={styles.visitDate}>{v.visitDate}</Text>
                    {v.rating !== null ? (
                      <View style={styles.ratingPill}>
                        <Ionicons name="star" size={12} color={colors.orange} />
                        <Text style={styles.ratingText}>{v.rating}/10</Text>
                      </View>
                    ) : null}
                  </View>

                  {v.items ? (
                    <Text style={styles.visitItems}>
                      <Text style={{ fontWeight: '800' }}>Tried: </Text>
                      {v.items}
                    </Text>
                  ) : null}

                  {v.notes ? <Text style={styles.visitNotes}>&ldquo;{v.notes}&rdquo;</Text> : null}

                  <View style={styles.visitEntryBottom}>
                    {v.spend !== null ? (
                      <Text style={styles.visitSpend}>
                        Bill: ₹{v.spend}
                        {v.personalShare !== null ? ` (Share: ₹${v.personalShare})` : ''}
                      </Text>
                    ) : (
                      <View />
                    )}

                    <Pressable
                      style={styles.editVisitInlineBtn}
                      onPress={() => router.push({ pathname: '/add-visit', params: { visitId: v.id } })}
                      hitSlop={8}
                    >
                      <Ionicons name="create-outline" size={13} color={colors.accent} />
                      <Text style={styles.editVisitInlineText}>Edit Entry</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.unvisitedNotice}>
              <View style={styles.unvisitedIcon}>
                <Ionicons name="restaurant-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.unvisitedContent}>
                <Text style={styles.unvisitedTitle}>Haven&apos;t logged a visit yet</Text>
                <Text style={styles.unvisitedSub}>
                  When you dine at {place.name}, record the date, what you ordered and your rating.
                </Text>
              </View>
            </View>
          )}

          {/* 5. Location & Google Maps */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Ionicons name="location-outline" size={16} color={colors.accent} />
              <Text style={styles.sectionCardTitle}>LOCATION & DIRECTIONS</Text>
            </View>

            <Text style={styles.addressText}>{place.area || 'Locality pending confirmation'}</Text>

            {place.mapsUrl ? (
              <Pressable
                style={({ pressed }) => [styles.linkActionBtn, pressed && { opacity: 0.8 }]}
                onPress={handleOpenMaps}
              >
                <Ionicons name="navigate-outline" size={16} color={colors.accent} />
                <Text style={styles.linkActionText}>Open in Google Maps ↗</Text>
              </Pressable>
            ) : (
              <Text style={styles.pendingInfoText}>
                Coordinates and map pin will be verified in the next data pass.
              </Text>
            )}
          </View>

          {/* 6. Source & Data Quality Verification Information */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
              <Text style={styles.sectionCardTitle}>SOURCE & VERIFICATION</Text>
            </View>

            <View style={styles.sourceInfoRow}>
              <Text style={styles.sourceLabel}>Verification State:</Text>
              <Text style={[styles.sourceValue, isVerified ? styles.specVerified : styles.specPending]}>
                {isVerified ? 'Verified by Source' : 'Pending Verification'}
              </Text>
            </View>

            {place.source ? (
              <View style={styles.sourceInfoRow}>
                <Text style={styles.sourceLabel}>Primary Source:</Text>
                <Text style={styles.sourceValue}>{place.source}</Text>
              </View>
            ) : null}

            {place.sourceUrl ? (
              <Pressable
                style={({ pressed }) => [styles.linkActionBtn, pressed && { opacity: 0.8 }]}
                onPress={handleOpenSource}
              >
                <Ionicons name="open-outline" size={16} color={colors.accent} />
                <Text style={styles.linkActionText}>View Source Record ↗</Text>
              </Pressable>
            ) : null}

            {!isVerified ? (
              <View style={styles.unverifiedWarning}>
                <Ionicons name="information-circle-outline" size={16} color={colors.orange} />
                <Text style={styles.unverifiedWarningText}>
                  This is a candidate venue. Exact address, branch confirmation and opening hours should be checked prior to visiting.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  heroContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    backgroundColor: colors.ink,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(29, 41, 36, 0.52)',
  },
  topBar: {
    position: 'absolute',
    top: 18,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 41, 36, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 22,
    paddingTop: 28,
    backgroundColor: 'rgba(29, 41, 36, 0.7)',
    zIndex: 5,
    gap: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    gap: 5,
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(40, 96, 77, 0.95)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(29, 41, 36, 0.85)',
  },
  statusDot: {
    color: colors.orange,
    fontSize: 9,
    fontWeight: '900',
  },
  statusText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  heroLocality: {
    color: '#D8E2DC',
    fontSize: 13,
    fontWeight: '600',
  },
  body: {
    padding: 20,
    gap: 18,
  },
  specsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center',
  },
  specBox: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  specDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  specLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  specValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  specVerified: {
    color: colors.accent,
  },
  specPending: {
    color: colors.muted,
  },
  primaryActions: {
    gap: 10,
  },
  logVisitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 15,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  logVisitBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  bookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.pill,
    paddingVertical: 13,
    borderWidth: 1,
  },
  bookmarkBtnUnsaved: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  bookmarkBtnSaved: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  bookmarkBtnText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  bookmarkBtnTextSaved: {
    color: colors.accent,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  sectionCardIcon: {
    color: colors.orange,
    fontSize: 14,
  },
  sectionCardTitle: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  notesText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'normal',
  },
  visitEntry: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visitEntryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitDate: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  visitItems: {
    color: colors.ink,
    fontSize: 12,
  },
  visitSpend: {
    color: colors.muted,
    fontSize: 11,
  },
  visitNotes: {
    color: colors.muted,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  visitEntryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  editVisitInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  editVisitInlineText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  unvisitedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unvisitedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unvisitedContent: {
    flex: 1,
    gap: 2,
  },
  unvisitedTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  unvisitedSub: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  addressText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  linkActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  linkActionText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  pendingInfoText: {
    color: colors.muted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  sourceInfoRow: {
    gap: 2,
  },
  sourceLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sourceValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  unverifiedWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FAF5EE',
    borderRadius: radius.sm,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#EFE3D3',
  },
  unverifiedWarningText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  notFoundSafe: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundCard: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 12,
  },
  notFoundTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  notFoundCopy: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  backButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginTop: 8,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
