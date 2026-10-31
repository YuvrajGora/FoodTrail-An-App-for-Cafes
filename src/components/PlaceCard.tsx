import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Place } from '../types';
import { colors, radius } from '../theme/colors';

export function PlaceCard({ place, saved }: { place: Place; saved?: boolean }) {
  const router = useRouter();
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/place/${place.id}`)}>
      <View style={styles.topRow}>
        <View style={styles.icon}><Text style={styles.iconText}>✦</Text></View>
        <View style={styles.status}><Text style={styles.statusText}>{place.verificationStatus === 'Verified' ? 'CHECKED' : 'TO VERIFY'}</Text></View>
      </View>
      <Text style={styles.name}>{place.name}</Text>
      <Text style={styles.meta}>{place.area || 'Area to confirm'}</Text>
      <View style={styles.bottomRow}>
        <Text style={styles.category} numberOfLines={1}>{place.category || 'Cuisine to add'}</Text>
        <Text style={styles.saved}>{saved ? '♥ SAVED' : place.budgetPerPerson ? `~₹${place.budgetPerPerson}/person` : 'OPEN DETAILS'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.accent, fontSize: 18 },
  status: { backgroundColor: '#F0EEE8', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  name: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, gap: 10 },
  category: { color: colors.muted, fontSize: 11, flex: 1 },
  saved: { color: colors.accent, fontWeight: '800', fontSize: 10, letterSpacing: 0.4 },
});
