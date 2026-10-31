import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PlaceCard } from '@/components/PlaceCard';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors, radius } from '@/theme/colors';

export default function DiscoverScreen() {
  const { places, savedIds } = useFoodTrail();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All' | 'Verified' | 'Pending verification'>('All');
  const results = useMemo(() => places.filter((p) => {
    const match = `${p.name} ${p.area} ${p.category}`.toLowerCase().includes(query.toLowerCase());
    return match && (filter === 'All' || p.verificationStatus === filter);
  }), [places, query, filter]);
  return <Screen>
    <View><Text style={styles.kicker}>FIND YOUR NEXT STOP</Text><Text style={styles.title}>Discover</Text><Text style={styles.sub}>Search the FoodTrail collection.</Text></View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search name, area or cuisine…" placeholderTextColor={colors.muted} style={styles.search} />
    <View style={styles.filters}>{(['All','Verified','Pending verification'] as const).map((f) => <Text key={f} onPress={() => setFilter(f)} style={[styles.filter, filter===f && styles.active]}>{f === 'Pending verification' ? 'To verify' : f}</Text>)}</View>
    <Text style={styles.count}>{results.length} PLACES IN YOUR COLLECTION</Text>
    {results.slice(0, 100).map((p) => <PlaceCard key={p.id} place={p} saved={savedIds.includes(p.id)} />)}
    {results.length === 0 ? <Text style={styles.empty}>No matches yet. Try another search.</Text> : null}
  </Screen>;
}
const styles = StyleSheet.create({ kicker: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 }, title: { color: colors.ink, fontSize: 31, fontWeight: '900', letterSpacing: -1 }, sub: { color: colors.muted, fontSize: 13, marginTop: 4 }, search: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 15, paddingVertical: 15, color: colors.ink, fontSize: 14 }, filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, filter: { color: colors.muted, backgroundColor: colors.surfaceMuted, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 9, overflow: 'hidden', fontSize: 11, fontWeight: '700' }, active: { backgroundColor: colors.accent, color: colors.white }, count: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, empty: { color: colors.muted, textAlign: 'center', paddingVertical: 28 } });
