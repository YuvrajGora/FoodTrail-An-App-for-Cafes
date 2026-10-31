import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors, radius } from '@/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { places, savedIds, visits } = useFoodTrail();
  const verifiedCount = places.filter((p) => p.verificationStatus === 'Verified').length;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>YG</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>FoodTrail Explorer</Text>
          <Text style={styles.userHandle}>Delhi NCR Dining Journal</Text>
          <View style={styles.guestBadge}>
            <Text style={styles.guestText}>LOCAL GUEST MODE</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <Stat label="IN CATALOGUE" value={String(places.length)} />
          <View style={styles.statDivider} />
          <Stat label="BUCKET LIST" value={String(savedIds.length)} highlight />
          <View style={styles.statDivider} />
          <Stat label="VISITS LOGGED" value={String(visits.length)} />
        </View>
        <View style={styles.verifiedRow}>
          <Ionicons name="shield-checkmark" size={16} color={colors.accent} />
          <Text style={styles.verifiedSummary}>
            {verifiedCount} verified iconic Delhi NCR establishments tracked
          </Text>
        </View>
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.sectionHeader}>JOURNAL & RECORD</Text>
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
              <Text style={styles.actionSub}>Review past meal notes & memories</Text>
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
              <Text style={styles.actionSub}>Places you want to try next</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteIcon}>✦</Text>
          <Text style={styles.noteTitle}>THE FOODTRAIL PROTOCOL</Text>
        </View>
        <Text style={styles.note}>
          This app saves your bucket-list bookmarks and visit logs on this device (via AsyncStorage). Supabase Auth (magic link / email OTP), cloud synchronization, photo uploads, and Google Maps API are scheduled for the next backend milestone.
        </Text>
      </View>
    </Screen>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  statValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  statValueHighlight: {
    color: colors.orange,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    padding: 10,
    borderRadius: radius.sm,
    gap: 8,
  },
  verifiedSummary: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  actionSection: {
    gap: 10,
  },
  sectionHeader: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 2,
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
