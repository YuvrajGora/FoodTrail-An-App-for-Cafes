import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors, radius } from '@/theme/colors';
import { useRouter } from 'expo-router';
export default function JournalScreen() {
  const { visits } = useFoodTrail();
  const router = useRouter();
  return <Screen>
    <View><Text style={styles.kicker}>YOUR PERSONAL FOOD DIARY</Text><Text style={styles.title}>Journal</Text><Text style={styles.sub}>Every visit, every dish, every memory.</Text></View>
    <Pressable style={styles.add} onPress={() => router.push('/add-visit')}><Text style={styles.addText}>＋  Log a visit</Text></Pressable>
    {visits.length ? visits.map((v) => <View key={v.id} style={styles.card}><Text style={styles.date}>{v.visitDate}</Text><Text style={styles.name}>{v.placeName}</Text>{v.items ? <Text style={styles.body}>Tried: {v.items}</Text> : null}{v.spend !== null ? <Text style={styles.body}>Total bill: ₹{v.spend}</Text> : null}{v.personalShare !== null ? <Text style={styles.body}>Your share: ₹{v.personalShare}</Text> : null}{v.rating !== null ? <Text style={styles.rating}>{'★'.repeat(Math.round(v.rating))} {v.rating}/10</Text> : null}{v.notes ? <Text style={styles.body}>{v.notes}</Text> : null}</View>) : <View style={styles.empty}><Text style={styles.emptyTitle}>Your first food story starts here.</Text><Text style={styles.sub}>After visiting a place, log what you ate, what you spent and your rating.</Text></View>}
  </Screen>;
}
const styles=StyleSheet.create({kicker:{color:colors.muted,fontSize:9,fontWeight:'800',letterSpacing:1.6},title:{color:colors.ink,fontSize:31,fontWeight:'900',letterSpacing:-1},sub:{color:colors.muted,fontSize:13,marginTop:4,lineHeight:19},add:{backgroundColor:colors.accent,borderRadius:99,paddingVertical:14,alignItems:'center'},addText:{color:colors.white,fontWeight:'800',fontSize:13},card:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:16,gap:7},date:{color:colors.muted,fontSize:10,fontWeight:'800',letterSpacing:1},name:{color:colors.ink,fontWeight:'900',fontSize:17},body:{color:colors.muted,fontSize:12,lineHeight:18},rating:{color:colors.orange,fontSize:13,fontWeight:'900'},empty:{padding:24,backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:radius.md,gap:7},emptyTitle:{fontSize:18,fontWeight:'900',color:colors.ink}});
