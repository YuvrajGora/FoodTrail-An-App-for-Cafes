import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { getRestaurantImage } from '@/data/restaurantImages';
import { colors, radius } from '@/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isGuest, isConfigured, signIn, signUp, signOut } = useAuth();
  const { places, savedIds, visits } = useFoodTrail();

  // Auth UI state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ isError: boolean; text: string } | null>(null);

  // User display metadata
  const userInitials = useMemo(() => {
    if (!user) return 'FT';
    const name = user.user_metadata?.full_name || user.user_metadata?.display_name;
    if (name && typeof name === 'string' && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.trim().substring(0, 2).toUpperCase();
    }
    if (user.email) return user.email.substring(0, 2).toUpperCase();
    return 'FT';
  }, [user]);

  const userDisplayName = useMemo(() => {
    if (!user) return 'FoodTrail Explorer';
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.display_name ||
      user.email?.split('@')[0] ||
      'FoodTrail Explorer'
    );
  }, [user]);

  const handleAuthSubmit = async () => {
    setAuthFeedback(null);
    setSubmitting(true);

    if (authMode === 'signup') {
      const res = await signUp({ email, password, displayName });
      setSubmitting(false);
      if (res.success) {
        setAuthFeedback({ isError: false, text: res.message || 'Account created successfully!' });
        setPassword('');
        if (!res.requiresEmailConfirmation) {
          setEmail('');
          setDisplayName('');
        }
      } else {
        setAuthFeedback({ isError: true, text: res.message || 'Sign up failed.' });
      }
    } else {
      const res = await signIn({ email, password });
      setSubmitting(false);
      if (res.success) {
        setAuthFeedback(null);
        setEmail('');
        setPassword('');
      } else {
        setAuthFeedback({ isError: true, text: res.message || 'Login failed.' });
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your journal entries and bookmarks will remain safely saved on your account, and you will return to local guest mode.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            setAuthFeedback(null);
          },
        },
      ]
    );
  };

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
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {userDisplayName}
            </Text>
            <Text style={styles.userHandle} numberOfLines={1}>
              {user ? user.email : 'Delhi NCR Dining Journal'}
            </Text>
            {user ? (
              <View style={styles.authBadge}>
                <Ionicons name="cloud-done-outline" size={11} color={colors.accent} />
                <Text style={styles.authBadgeText}>AUTHENTICATED · CLOUD BACKED</Text>
              </View>
            ) : (
              <View style={styles.guestBadge}>
                <Text style={styles.guestText}>LOCAL GUEST MODE</Text>
              </View>
            )}
          </View>

          {user ? (
            <Pressable
              style={({ pressed }) => [styles.signOutPill, pressed && { opacity: 0.7 }]}
              onPress={handleSignOut}
              accessibilityLabel="Sign Out"
            >
              <Ionicons name="log-out-outline" size={14} color={colors.muted} />
              <Text style={styles.signOutPillText}>Sign Out</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Guest Authentication Card (Sign In / Sign Up) */}
        {isGuest && isConfigured ? (
          <View style={styles.authCard}>
            <View style={styles.authCardTop}>
              <View style={styles.authIconCircle}>
                <Ionicons name="cloud-outline" size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.authCardHeading}>Cloud Dining Account</Text>
                <Text style={styles.authCardDescription}>
                  Sign in to back up your journal and access visits across devices. Existing local records remain preserved.
                </Text>
              </View>
            </View>

            {/* Segmented Auth Mode Switch */}
            <View style={styles.authTabRow}>
              <Pressable
                style={[styles.authTab, authMode === 'login' && styles.authTabActive]}
                onPress={() => {
                  setAuthMode('login');
                  setAuthFeedback(null);
                }}
              >
                <Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                style={[styles.authTab, authMode === 'signup' && styles.authTabActive]}
                onPress={() => {
                  setAuthMode('signup');
                  setAuthFeedback(null);
                }}
              >
                <Text style={[styles.authTabText, authMode === 'signup' && styles.authTabTextActive]}>
                  Create Account
                </Text>
              </Pressable>
            </View>

            {/* Feedback Message Banner */}
            {authFeedback ? (
              <View
                style={[
                  styles.feedbackBanner,
                  authFeedback.isError ? styles.feedbackBannerError : styles.feedbackBannerSuccess,
                ]}
              >
                <Ionicons
                  name={authFeedback.isError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                  size={16}
                  color={authFeedback.isError ? colors.orange : colors.accent}
                />
                <Text
                  style={[
                    styles.feedbackBannerText,
                    authFeedback.isError ? styles.feedbackBannerTextError : styles.feedbackBannerTextSuccess,
                  ]}
                >
                  {authFeedback.text}
                </Text>
              </View>
            ) : null}

            {/* Form Fields */}
            <View style={styles.authForm}>
              {authMode === 'signup' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>YOUR NAME / HANDLE</Text>
                  <TextInput
                    style={styles.textInput}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="e.g. Yuvraj Gora"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                  />
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@domain.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  {authMode === 'signup' ? (
                    <Text style={styles.inputHint}>Min. 6 characters</Text>
                  ) : null}
                </View>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.muted}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.authSubmitButton,
                  submitting && styles.authSubmitButtonDisabled,
                  pressed && !submitting && { opacity: 0.9 },
                ]}
                onPress={handleAuthSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.authSubmitText}>
                    {authMode === 'login' ? 'Sign In to FoodTrail' : 'Create Cloud Account'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}

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

        {/* Favourite Restaurants Section */}
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

        {/* Architecture & Protocol Note */}
        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <Text style={styles.noteIcon}>✦</Text>
            <Text style={styles.noteTitle}>THE FOODTRAIL PROTOCOL</Text>
          </View>
          <Text style={styles.note}>
            All visit journals, spend tracking, and bucket list bookmarks are stored securely on this device (partitioned via AsyncStorage) with persistent Supabase session management. Account switching guarantees full local isolation.
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
    fontSize: 20,
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
  authBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  authBadgeText: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  signOutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  signOutPillText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  // Auth Card Styles
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
  },
  authCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  authIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authCardHeading: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  authCardDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  authTabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: 3,
  },
  authTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm - 2,
  },
  authTabActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  authTabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  authTabTextActive: {
    color: colors.accent,
    fontWeight: '800',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.sm,
  },
  feedbackBannerError: {
    backgroundColor: '#FDF0EC',
    borderWidth: 1,
    borderColor: '#F5C8BA',
  },
  feedbackBannerSuccess: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: '#C3DFD3',
  },
  feedbackBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  feedbackBannerTextError: {
    color: colors.orange,
    fontWeight: '600',
  },
  feedbackBannerTextSuccess: {
    color: colors.accent,
    fontWeight: '700',
  },
  authForm: {
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  inputHint: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  authSubmitButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  authSubmitButtonDisabled: {
    opacity: 0.6,
  },
  authSubmitText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // Stats Card Styles
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
