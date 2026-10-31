import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { getRestaurantImage } from '@/data/restaurantImages';
import { colors, radius } from '@/theme/colors';
import type { Place, Visit } from '@/types';

function getTodayString(daysAgo = 0): string {
  const d = new Date();
  if (daysAgo > 0) d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRatingDescriptor(score: number): string {
  if (score >= 9.5) return 'Legendary / Must-Visit (10/10)';
  if (score >= 8.5) return 'Exceptional / Top Pick (9/10)';
  if (score >= 7.5) return 'Very Good / High Quality (8/10)';
  if (score >= 6.5) return 'Good / Worth Visiting (7/10)';
  if (score >= 5.0) return 'Average / Fair (5–6/10)';
  return 'Underwhelming (<5/10)';
}

export default function AddVisitScreen() {
  const params = useLocalSearchParams<{ placeId?: string; visitId?: string }>();
  const { places, visits, addVisit, updateVisit } = useFoodTrail();

  // Find existing visit or matched place
  const existingVisit = useMemo(() => {
    if (!params.visitId) return null;
    return visits.find((v) => v.id === params.visitId) || null;
  }, [visits, params.visitId]);

  const matchedPlace = useMemo(() => {
    if (existingVisit?.placeId) {
      return places.find((p) => p.id === existingVisit.placeId);
    }
    if (params.placeId) {
      return places.find((p) => p.id === params.placeId);
    }
    return null;
  }, [places, existingVisit, params.placeId]);

  const formKey = existingVisit?.id ?? params.placeId ?? 'new-visit';

  return (
    <VisitForm
      key={formKey}
      existingVisit={existingVisit}
      matchedPlace={matchedPlace}
      places={places}
      addVisit={addVisit}
      updateVisit={updateVisit}
    />
  );
}

interface VisitFormProps {
  existingVisit: Visit | null;
  matchedPlace: Place | null | undefined;
  places: Place[];
  addVisit: (v: Visit) => Promise<void>;
  updateVisit: (v: Visit) => Promise<void>;
}

function VisitForm({ existingVisit, matchedPlace, places, addVisit, updateVisit }: VisitFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(existingVisit);

  // Form states initialized directly from props (idiomatic React 19)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(
    existingVisit?.placeId ?? matchedPlace?.id ?? ''
  );
  const [placeName, setPlaceName] = useState<string>(
    existingVisit?.placeName ?? matchedPlace?.name ?? ''
  );
  const [date, setDate] = useState<string>(
    existingVisit?.visitDate ?? getTodayString()
  );
  const [spend, setSpend] = useState<string>(
    existingVisit?.spend !== null && existingVisit?.spend !== undefined
      ? String(existingVisit.spend)
      : ''
  );
  const [partySize, setPartySize] = useState<string>(
    existingVisit?.partySize !== null && existingVisit?.partySize !== undefined
      ? String(existingVisit.partySize)
      : '1'
  );
  const [personalShare, setPersonalShare] = useState<string>(
    existingVisit?.personalShare !== null && existingVisit?.personalShare !== undefined
      ? String(existingVisit.personalShare)
      : ''
  );
  const [rating, setRating] = useState<string>(
    existingVisit?.rating !== null && existingVisit?.rating !== undefined
      ? String(existingVisit.rating)
      : ''
  );
  const [items, setItems] = useState<string>(existingVisit?.items ?? '');
  const [companions, setCompanions] = useState<string>(existingVisit?.companions ?? '');
  const [notes, setNotes] = useState<string>(existingVisit?.notes ?? '');
  const [photoUrlInput, setPhotoUrlInput] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>(existingVisit?.photos ?? []);

  // Suggestions dropdown if typing name freeform
  const placeSuggestions = useMemo(() => {
    if (!placeName.trim() || selectedPlaceId) return [];
    const query = placeName.trim().toLowerCase();
    return places
      .filter((p) => p.name.toLowerCase().includes(query))
      .slice(0, 3);
  }, [places, placeName, selectedPlaceId]);

  const handleSelectSuggestion = (place: Place) => {
    setSelectedPlaceId(place.id);
    setPlaceName(place.name);
  };

  // Helper: auto calculate split
  const handleSplitEvenly = () => {
    const totalBill = Number(spend);
    const people = Number(partySize);
    if (!Number.isFinite(totalBill) || totalBill <= 0) {
      Alert.alert('Total Bill Needed', 'Please enter a valid total bill amount first.');
      return;
    }
    if (!Number.isFinite(people) || people <= 0) {
      Alert.alert('Party Size Needed', 'Please enter a valid party size (number of people).');
      return;
    }
    const share = Math.round(totalBill / people);
    setPersonalShare(String(share));
  };

  // Helper: attach photo URL
  const handleAddPhoto = () => {
    const trimmed = photoUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Please enter a valid web image URL starting with https://');
      return;
    }
    setPhotos([...photos, trimmed]);
    setPhotoUrlInput('');
  };

  const handleAttachCataloguePhoto = () => {
    if (matchedPlace) {
      const url = getRestaurantImage(matchedPlace);
      if (!photos.includes(url)) {
        setPhotos([...photos, url]);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const trimmedName = placeName.trim();
    if (!trimmedName) {
      Alert.alert('Place Name Required', 'Please enter the restaurant or café name.');
      return;
    }

    // Validate Date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert('Invalid Date', 'Please provide a valid date in YYYY-MM-DD format.');
      return;
    }
    const parsedDate = new Date(`${date}T12:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert('Invalid Date', 'The entered date is not valid.');
      return;
    }

    // Validate Rating
    let parsedRating: number | null = null;
    if (rating.trim()) {
      parsedRating = Number(rating);
      if (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 10) {
        Alert.alert('Invalid Rating', 'Rating must be a number between 0 and 10.');
        return;
      }
    }

    // Validate Spend
    let parsedSpend: number | null = null;
    if (spend.trim()) {
      parsedSpend = Number(spend);
      if (!Number.isFinite(parsedSpend) || parsedSpend < 0) {
        Alert.alert('Invalid Bill Amount', 'Total bill must be a non-negative number.');
        return;
      }
    }

    // Validate Party Size
    let parsedPartySize: number | null = null;
    if (partySize.trim()) {
      parsedPartySize = Number(partySize);
      if (!Number.isFinite(parsedPartySize) || parsedPartySize < 1) {
        Alert.alert('Invalid Party Size', 'Party size must be at least 1 person.');
        return;
      }
    }

    // Validate Personal Share
    let parsedPersonalShare: number | null = null;
    if (personalShare.trim()) {
      parsedPersonalShare = Number(personalShare);
      if (!Number.isFinite(parsedPersonalShare) || parsedPersonalShare < 0) {
        Alert.alert('Invalid Share Amount', 'Personal share must be a non-negative number.');
        return;
      }
    }

    if (isEditMode && existingVisit) {
      const updated: Visit = {
        ...existingVisit,
        placeId: selectedPlaceId,
        placeName: trimmedName,
        visitDate: date,
        spend: parsedSpend,
        partySize: parsedPartySize,
        personalShare: parsedPersonalShare,
        rating: parsedRating,
        items: items.trim(),
        companions: companions.trim(),
        notes: notes.trim(),
        photos,
        updatedAt: new Date().toISOString(),
      };
      await updateVisit(updated);
      Alert.alert('Visit Updated', 'Your journal entry has been updated successfully.', [
        { text: 'Done', onPress: () => router.replace('/(tabs)/journal') },
      ]);
    } else {
      const newVisit: Visit = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        placeId: selectedPlaceId,
        placeName: trimmedName,
        visitDate: date,
        spend: parsedSpend,
        partySize: parsedPartySize,
        personalShare: parsedPersonalShare,
        rating: parsedRating,
        items: items.trim(),
        companions: companions.trim(),
        notes: notes.trim(),
        photos,
        createdAt: new Date().toISOString(),
      };
      await addVisit(newVisit);
      router.replace('/(tabs)/journal');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Navigation */}
          <View style={styles.topNav}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={18} color={colors.accent} />
              <Text style={styles.backText}>BACK</Text>
            </Pressable>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.kicker}>
              {isEditMode ? 'UPDATE DINING ENTRY' : 'RECORD A DINING EXPERIENCE'}
            </Text>
            <Text style={styles.title}>{isEditMode ? 'Edit Visit' : 'Log a Visit'}</Text>
            <Text style={styles.sub}>
              {isEditMode
                ? 'Update your personal notes, spend, and ratings for this visit.'
                : 'Log dishes, spending, and impressions. Multiple visits to the same venue are supported.'}
            </Text>
          </View>

          {/* Form Card 1: Restaurant & Date */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ESTABLISHMENT & DATE</Text>

            <View style={styles.field}>
              <Text style={styles.label}>PLACE NAME *</Text>
              <TextInput
                style={styles.input}
                value={placeName}
                onChangeText={(text) => {
                  setPlaceName(text);
                  setSelectedPlaceId('');
                }}
                placeholder="e.g. Karim's, Indian Accent, Blue Tokai"
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Suggestions if matched from catalogue */}
            {placeSuggestions.length > 0 ? (
              <View style={styles.suggestionsCard}>
                <Text style={styles.suggestionTitle}>Catalogue Matches:</Text>
                {placeSuggestions.map((s) => (
                  <Pressable
                    key={s.id}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(s)}
                  >
                    <Ionicons name="restaurant-outline" size={14} color={colors.accent} />
                    <Text style={styles.suggestionText}>
                      {s.name} <Text style={styles.suggestionSub}>({s.area})</Text>
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {matchedPlace ? (
              <View style={styles.catalogueInfoBox}>
                <Ionicons name="information-circle" size={16} color={colors.accent} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.catalogueInfoTitle}>Linked to Catalogue</Text>
                  <Text style={styles.catalogueInfoSub}>
                    {matchedPlace.area} • {matchedPlace.category}
                    {matchedPlace.budgetPerPerson
                      ? ` • Estimated catalogue budget: ~₹${matchedPlace.budgetPerPerson}/person`
                      : ''}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>VISIT DATE (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="2026-11-01"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />
              <View style={styles.quickChipsRow}>
                <Pressable
                  style={[styles.quickChip, date === getTodayString(0) && styles.quickChipActive]}
                  onPress={() => setDate(getTodayString(0))}
                >
                  <Text style={[styles.quickChipText, date === getTodayString(0) && styles.quickChipTextActive]}>
                    Today
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.quickChip, date === getTodayString(1) && styles.quickChipActive]}
                  onPress={() => setDate(getTodayString(1))}
                >
                  <Text style={[styles.quickChipText, date === getTodayString(1) && styles.quickChipTextActive]}>
                    Yesterday
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.quickChip, date === getTodayString(2) && styles.quickChipActive]}
                  onPress={() => setDate(getTodayString(2))}
                >
                  <Text style={[styles.quickChipText, date === getTodayString(2) && styles.quickChipTextActive]}>
                    2 Days Ago
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Form Card 2: Rating */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>YOUR RATING</Text>
              {rating.trim() && Number.isFinite(Number(rating)) ? (
                <Text style={styles.ratingBadgeText}>
                  ★ {Number(rating).toFixed(1)} / 10
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PERSONAL RATING (0 TO 10)</Text>
              <TextInput
                style={styles.input}
                value={rating}
                onChangeText={setRating}
                placeholder="e.g. 8.5 or select below"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Quick rating chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratingChipScroll}>
              {[5, 6, 7, 8, 8.5, 9, 9.5, 10].map((num) => {
                const active = rating === String(num);
                return (
                  <Pressable
                    key={num}
                    style={[styles.ratingPill, active && styles.ratingPillActive]}
                    onPress={() => setRating(String(num))}
                  >
                    <Ionicons
                      name="star"
                      size={12}
                      color={active ? colors.white : colors.orange}
                    />
                    <Text style={[styles.ratingPillText, active && styles.ratingPillTextActive]}>
                      {num}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {rating.trim() && Number.isFinite(Number(rating)) ? (
              <Text style={styles.ratingDescriptor}>
                {getRatingDescriptor(Number(rating))}
              </Text>
            ) : null}
          </View>

          {/* Form Card 3: Spend & Party Size */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ACTUAL BILL & PARTY SIZE</Text>

            <View style={styles.field}>
              <Text style={styles.label}>PARTY SIZE (NUMBER OF PEOPLE)</Text>
              <TextInput
                style={styles.input}
                value={partySize}
                onChangeText={setPartySize}
                placeholder="1"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />
              <View style={styles.quickChipsRow}>
                {['1', '2', '3', '4', '6'].map((num) => (
                  <Pressable
                    key={num}
                    style={[styles.quickChip, partySize === num && styles.quickChipActive]}
                    onPress={() => setPartySize(num)}
                  >
                    <Text style={[styles.quickChipText, partySize === num && styles.quickChipTextActive]}>
                      {num === '1' ? 'Solo (1)' : num === '2' ? 'Couple (2)' : `${num} People`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>ACTUAL TOTAL BILL (₹)</Text>
              <TextInput
                style={styles.input}
                value={spend}
                onChangeText={setSpend}
                placeholder="Total bill paid at the restaurant"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>YOUR PERSONAL SHARE (₹)</Text>
                {Number(partySize) > 1 && Number(spend) > 0 ? (
                  <Pressable style={styles.splitBtn} onPress={handleSplitEvenly}>
                    <Ionicons name="calculator-outline" size={13} color={colors.accent} />
                    <Text style={styles.splitBtnText}>
                      Split Evenly (~₹{Math.round(Number(spend) / Number(partySize))})
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <TextInput
                style={styles.input}
                value={personalShare}
                onChangeText={setPersonalShare}
                placeholder="What you personally contributed"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>
                Distinguished from catalogue estimates. Kept private in your local journal.
              </Text>
            </View>
          </View>

          {/* Form Card 4: Culinary Details & Notes */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>DISHES, COMPANIONS & NOTES</Text>

            <View style={styles.field}>
              <Text style={styles.label}>WHAT DID YOU TRY?</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={items}
                onChangeText={setItems}
                placeholder="e.g. Mutton Burra, Roomali Roti, Shahi Tukda, Cold Brew..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>WHO WERE YOU WITH?</Text>
              <TextInput
                style={styles.input}
                value={companions}
                onChangeText={setCompanions}
                placeholder="e.g. Sneha & Kabir, Family dinner, Solo foodie trail"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PERSONAL REVIEW & OBSERVATIONS</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { minHeight: 96 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ambience, seating recommendation, spice level, service quality, standout memories..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Form Card 5: Optional Photos */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>PHOTOS ({photos.length})</Text>
              {matchedPlace && photos.length === 0 ? (
                <Pressable onPress={handleAttachCataloguePhoto}>
                  <Text style={styles.cataloguePhotoBtn}>+ Use Catalogue Photo</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.photoInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={photoUrlInput}
                onChangeText={setPhotoUrlInput}
                placeholder="Paste image URL (https://...)"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
              <Pressable
                style={({ pressed }) => [styles.addPhotoBtn, pressed && { opacity: 0.8 }]}
                onPress={handleAddPhoto}
              >
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.addPhotoBtnText}>Add</Text>
              </Pressable>
            </View>

            {photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
                {photos.map((uri, idx) => (
                  <View key={idx} style={styles.photoWrapper}>
                    <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                    <Pressable
                      style={styles.photoDeleteBtn}
                      onPress={() => handleRemovePhoto(idx)}
                      hitSlop={6}
                    >
                      <Ionicons name="close" size={12} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </View>

          {/* Submit Action Button */}
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.88 }]}
            onPress={handleSave}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
            <Text style={styles.submitBtnText}>
              {isEditMode ? 'Save Journal Changes' : 'Record Visit in Journal'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 48,
    gap: 16,
  },
  topNav: {
    paddingVertical: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  header: {
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
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  sub: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  ratingBadgeText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: '900',
  },
  field: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  multilineInput: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  helperText: {
    color: colors.muted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  suggestionsCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionTitle: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  suggestionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  suggestionSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '400',
  },
  catalogueInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.accentSoft,
    padding: 10,
    borderRadius: radius.sm,
  },
  catalogueInfoTitle: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  catalogueInfoSub: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '500',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  quickChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  quickChipTextActive: {
    color: colors.accent,
    fontWeight: '800',
  },
  ratingChipScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingPillActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  ratingPillText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  ratingPillTextActive: {
    color: colors.white,
  },
  ratingDescriptor: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  splitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  splitBtnText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
  },
  cataloguePhotoBtn: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  photoInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.sm,
  },
  addPhotoBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  photoList: {
    gap: 10,
    paddingTop: 6,
  },
  photoWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 6,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
