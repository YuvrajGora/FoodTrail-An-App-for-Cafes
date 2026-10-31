import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors, radius } from '@/theme/colors';
export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{id:string}>();
  const router = useRouter();
  const { places, savedIds, toggleSaved } = useFoodTrail();
  const place = places.find((p) => p.id === id);
  if (!place) return <Screen><Text style={styles.title}>Place not found</Text></Screen>;
  const saved = savedIds.includes(place.id);
  return <Screen>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← BACK</Text></Pressable>
    <View style={styles.hero}><Text style={styles.kicker}>FOODTRAIL PLACE</Text><Text style={[styles.title, styles.heroTitle]}>{place.name}</Text><Text style={styles.area}>{place.area}</Text><View style={styles.tag}><Text style={styles.tagText}>{place.verificationStatus.toUpperCase()}</Text></View></View>
    <View style={styles.info}><Text style={styles.label}>CUISINE / CATEGORY</Text><Text style={styles.value}>{place.category || 'Not yet classified'}</Text><Text style={styles.label}>ESTIMATED BUDGET</Text><Text style={styles.value}>{place.budgetPerPerson ? `Around ₹${place.budgetPerPerson} per person` : 'Not confirmed yet'}</Text><Text style={styles.label}>NOTES</Text><Text style={styles.note}>{place.notes || 'Add your notes after a visit.'}</Text></View>
    <Pressable style={styles.primary} onPress={() => toggleSaved(place.id)}><Text style={styles.primaryText}>{saved ? '♥  Remove from bucket list' : '＋  Save to bucket list'}</Text></Pressable>
    <Pressable style={styles.secondary} onPress={() => router.push({pathname:'/add-visit',params:{placeId:place.id}})}><Text style={styles.secondaryText}>Log a visit</Text></Pressable>
    {place.mapsUrl ? <Pressable onPress={() => Linking.openURL(place.mapsUrl)}><Text style={styles.mapLink}>OPEN IN GOOGLE MAPS ↗</Text></Pressable> : null}
    {place.sourceUrl ? <Pressable onPress={() => Linking.openURL(place.sourceUrl)}><Text style={styles.sourceLink}>OPEN SOURCE ↗</Text></Pressable> : null}
  </Screen>;
}
const styles=StyleSheet.create({back:{color:colors.accent,fontWeight:'900',fontSize:11,letterSpacing:1},hero:{backgroundColor:colors.ink,borderRadius:radius.lg,padding:22,gap:11},kicker:{color:'#B8C7BE',fontWeight:'800',fontSize:9,letterSpacing:1.5},title:{color:colors.ink,fontWeight:'900',fontSize:31,letterSpacing:-.8},heroTitle:{color:colors.white},area:{color:'#D0D8D2',fontSize:13},tag:{alignSelf:'flex-start',backgroundColor:'#DCE9E0',borderRadius:99,paddingVertical:7,paddingHorizontal:11},tagText:{color:colors.accent,fontWeight:'900',fontSize:9,letterSpacing:1},info:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:18,gap:7},label:{color:colors.muted,fontSize:9,fontWeight:'900',letterSpacing:1.2,marginTop:7},value:{color:colors.ink,fontSize:14,fontWeight:'700'},note:{color:colors.muted,fontSize:12,lineHeight:18},primary:{backgroundColor:colors.accent,borderRadius:99,paddingVertical:15,alignItems:'center'},primaryText:{color:colors.white,fontWeight:'900'},secondary:{backgroundColor:colors.accentSoft,borderRadius:99,paddingVertical:15,alignItems:'center'},secondaryText:{color:colors.accent,fontWeight:'900'},mapLink:{color:colors.accent,fontSize:11,fontWeight:'900',textAlign:'center'},sourceLink:{color:colors.muted,fontSize:10,fontWeight:'800',textAlign:'center'}});
