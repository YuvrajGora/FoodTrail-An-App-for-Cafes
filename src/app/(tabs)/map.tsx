import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors, radius } from '@/theme/colors';
export default function MapScreen() {
  const { places } = useFoodTrail();
  const verified = places.filter((p) => p.verificationStatus === 'Verified');
  return <Screen>
    <View><Text style={styles.kicker}>EXPLORE BY LOCATION</Text><Text style={styles.title}>Food map</Text><Text style={styles.sub}>Map pins will be connected to Google Maps/Places in the next integration milestone.</Text></View>
    <View style={styles.mapPlaceholder}><Text style={styles.mapIcon}>⌖</Text><Text style={styles.mapTitle}>Delhi NCR, one bite at a time.</Text><Text style={styles.mapText}>{verified.length} checked places are ready for map integration.</Text></View>
    <Text style={styles.section}>QUICK DIRECTIONS</Text>
    {verified.slice(0, 8).map((p) => <Pressable key={p.id} style={styles.row} onPress={() => p.mapsUrl ? Linking.openURL(p.mapsUrl) : undefined}><View style={{flex:1}}><Text style={styles.name}>{p.name}</Text><Text style={styles.area}>{p.area}</Text></View><Text style={styles.link}>OPEN MAP ↗</Text></Pressable>)}
  </Screen>;
}
const styles=StyleSheet.create({kicker:{color:colors.muted,fontSize:9,fontWeight:'800',letterSpacing:1.6},title:{color:colors.ink,fontSize:31,fontWeight:'900',letterSpacing:-1},sub:{color:colors.muted,fontSize:13,marginTop:4,lineHeight:19},mapPlaceholder:{backgroundColor:'#E3EAE3',borderRadius:radius.lg,minHeight:230,alignItems:'center',justifyContent:'center',padding:24,gap:10},mapIcon:{fontSize:42,color:colors.accent},mapTitle:{fontSize:20,fontWeight:'900',color:colors.ink,textAlign:'center'},mapText:{fontSize:12,color:colors.muted,textAlign:'center',lineHeight:18},section:{fontSize:9,color:colors.muted,fontWeight:'900',letterSpacing:1.4},row:{backgroundColor:colors.surface,borderRadius:14,padding:14,borderWidth:1,borderColor:colors.border,flexDirection:'row',alignItems:'center',gap:12},name:{color:colors.ink,fontWeight:'800',fontSize:14},area:{color:colors.muted,fontSize:11,marginTop:3},link:{color:colors.accent,fontSize:9,fontWeight:'900',letterSpacing:.5}});
