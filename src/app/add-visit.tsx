import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useFoodTrail } from '@/context/FoodTrailContext';
import { colors, radius } from '@/theme/colors';
import type { Visit } from '@/types';

export default function AddVisitScreen() {
  const params = useLocalSearchParams<{placeId?:string}>();
  const router = useRouter();
  const { places, addVisit } = useFoodTrail();
  const place = useMemo(() => places.find((p) => p.id === params.placeId), [places, params.placeId]);
  const [placeName, setPlaceName] = useState(place?.name ?? '');
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const [date, setDate] = useState(localToday);
  const [spend, setSpend] = useState('');
  const [personalShare, setPersonalShare] = useState('');
  const [rating, setRating] = useState('');
  const [items, setItems] = useState('');
  const [companions, setCompanions] = useState('');
  const [notes, setNotes] = useState('');
  const save = async () => {
    if (!placeName.trim()) { Alert.alert('Add a place', 'Enter the restaurant name first.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T12:00:00`).getTime())) { Alert.alert('Check date', 'Use a valid date in YYYY-MM-DD format.'); return; }
    const parsedRating = rating.trim() ? Number(rating) : null;
    if (parsedRating !== null && (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 10)) { Alert.alert('Check rating', 'Rating must be between 0 and 10.'); return; }
    const parsedSpend = spend.trim() ? Number(spend) : null;
    const parsedPersonalShare = personalShare.trim() ? Number(personalShare) : null;
    if ([parsedSpend, parsedPersonalShare].some((v) => v !== null && (!Number.isFinite(v) || v < 0))) { Alert.alert('Check amount', 'Spend amounts must be valid non-negative numbers.'); return; }
    const visit: Visit = { id: `${Date.now()}`, placeId: place?.id ?? '', placeName: placeName.trim(), visitDate: date, spend: parsedSpend, personalShare: parsedPersonalShare, rating: parsedRating, items: items.trim(), companions: companions.trim(), notes: notes.trim(), createdAt: new Date().toISOString() };
    await addVisit(visit);
    router.replace('/(tabs)/journal');
  };
  return <Screen>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← CANCEL</Text></Pressable>
    <View><Text style={styles.kicker}>SAVE THE EXPERIENCE</Text><Text style={styles.title}>Log a visit</Text><Text style={styles.sub}>You can log multiple visits to the same place.</Text></View>
    <Field label="PLACE NAME" value={placeName} onChangeText={setPlaceName} placeholder="Restaurant or café" />
    <Field label="VISIT DATE (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-11-01" />
    <Field label="TOTAL BILL (₹)" value={spend} onChangeText={setSpend} placeholder="Full bill amount" keyboardType="numeric" />
    <Field label="YOUR SHARE (₹)" value={personalShare} onChangeText={setPersonalShare} placeholder="What you personally paid" keyboardType="numeric" />
    <Field label="RATING (0–10)" value={rating} onChangeText={setRating} placeholder="Your rating" keyboardType="decimal-pad" />
    <Field label="WHAT DID YOU TRY?" value={items} onChangeText={setItems} placeholder="Dishes, drinks, desserts…" multiline />
    <Field label="WHO WERE YOU WITH?" value={companions} onChangeText={setCompanions} placeholder="Friends, family, solo…" />
    <Field label="NOTES" value={notes} onChangeText={setNotes} placeholder="Taste, service, ambience, would you return?" multiline />
    <Pressable style={styles.save} onPress={save}><Text style={styles.saveText}>Save visit</Text></Pressable>
  </Screen>;
}
function Field({label,...props}: any) { return <View style={{gap:7}}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={colors.muted} style={[styles.input, props.multiline && {minHeight:82,textAlignVertical:'top'}]} /></View>; }
const styles=StyleSheet.create({back:{color:colors.accent,fontSize:11,fontWeight:'900',letterSpacing:1},kicker:{color:colors.muted,fontSize:9,fontWeight:'800',letterSpacing:1.5},title:{color:colors.ink,fontSize:31,fontWeight:'900',letterSpacing:-1},sub:{color:colors.muted,fontSize:13,marginTop:4},label:{color:colors.muted,fontSize:9,fontWeight:'900',letterSpacing:1.2},input:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:14,paddingVertical:13,color:colors.ink,fontSize:14},save:{backgroundColor:colors.accent,borderRadius:99,alignItems:'center',padding:16,marginTop:6},saveText:{color:colors.white,fontSize:14,fontWeight:'900'}});
