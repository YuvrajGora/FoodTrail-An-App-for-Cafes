import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { PlaceCard } from '@/components/PlaceCard';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors, radius } from '@/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { places, savedIds, visits } = useFoodTrail();
  const featured = places.filter((p) => p.verificationStatus === 'Verified').slice(0, 3);
  return (
    <Screen>
      <View style={styles.header}>
        <View><Text style={styles.kicker}>YOUR PERSONAL FOOD MAP</Text><Text style={styles.logo}>FoodTrail<Text style={styles.logoDot}> ✦</Text></Text></View>
        <Pressable style={styles.avatar} onPress={() => router.push('/profile')}><Text style={styles.avatarText}>Y</Text></Pressable>
      </View>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>YOUR NEXT GREAT BITE</Text>
        <Text style={styles.heroTitle}>Good food.{"\n"}Better memories.</Text>
        <Text style={styles.heroCopy}>Keep every place you want to try, and every meal worth remembering.</Text>
        <Pressable style={styles.heroButton} onPress={() => router.push('/(tabs)/discover')}><Text style={styles.heroButtonText}>Explore places  →</Text></Pressable>
      </View>
      <View style={styles.stats}>
        <Stat value={String(places.length)} label="PLACES" />
        <Stat value={String(savedIds.length)} label="SAVED" />
        <Stat value={String(visits.length)} label="VISITS" />
      </View>
      <SectionTitle title="A few places to start" action="VERIFIED PICKS" />
      {featured.map((place) => <PlaceCard key={place.id} place={place} saved={savedIds.includes(place.id)} />)}
      <View style={styles.tip}><Text style={styles.tipLabel}>THE FOODTRAIL RULE</Text><Text style={styles.tipText}>A place is not a visit until you log the date, what you ate and what you thought.</Text></View>
    </Screen>
  );
}
function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, kicker: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.7 },
  logo: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -1 }, logoDot: { color: colors.orange, fontSize: 18 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  hero: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: 22, gap: 12, overflow: 'hidden' }, eyebrow: { color: '#B8C7BE', fontSize: 9, letterSpacing: 1.6, fontWeight: '800' },
  heroTitle: { color: colors.white, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.1 }, heroCopy: { color: '#D0D8D2', fontSize: 13, lineHeight: 20, maxWidth: 280 },
  heroButton: { alignSelf: 'flex-start', backgroundColor: '#D9E9DF', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 11, marginTop: 4 }, heroButtonText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  stats: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 16 }, stat: { flex: 1, alignItems: 'center', gap: 3 }, statValue: { color: colors.ink, fontSize: 22, fontWeight: '900' }, statLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  tip: { backgroundColor: colors.accentSoft, padding: 16, borderRadius: radius.md, gap: 6 }, tipLabel: { color: colors.accent, fontSize: 9, letterSpacing: 1.4, fontWeight: '900' }, tipText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
});
