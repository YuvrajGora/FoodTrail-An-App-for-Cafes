import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { PlaceCard } from '@/components/PlaceCard';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors } from '@/theme/colors';
export default function BucketScreen() {
  const { places, savedIds, toggleSaved } = useFoodTrail();
  const saved = places.filter((p) => savedIds.includes(p.id));
  return <Screen>
    <View><Text style={styles.kicker}>PLACES YOU WANT TO TRY</Text><Text style={styles.title}>Bucket list</Text><Text style={styles.sub}>{saved.length} saved places. Your next food adventure starts here.</Text></View>
    {saved.length ? saved.map((p) => <PlaceCard key={p.id} place={p} saved onToggleSave={toggleSaved} />) : <View style={styles.empty}><Text style={styles.emptyIcon}>✦</Text><Text style={styles.emptyTitle}>Your list is waiting.</Text><Text style={styles.sub}>Save a place from Discover and it will appear here.</Text></View>}
  </Screen>;
}
const styles=StyleSheet.create({kicker:{color:colors.muted,fontSize:9,fontWeight:'800',letterSpacing:1.6},title:{color:colors.ink,fontSize:31,fontWeight:'900',letterSpacing:-1},sub:{color:colors.muted,fontSize:13,marginTop:4,lineHeight:19},empty:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:22,padding:28,alignItems:'center',gap:8,marginTop:16},emptyIcon:{color:colors.orange,fontSize:30},emptyTitle:{color:colors.ink,fontSize:19,fontWeight:'800'}});
