import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
export function SectionTitle({ title, action }: { title: string; action?: string }) {
  return <View style={styles.row}><Text style={styles.title}>{title}</Text>{action ? <Text style={styles.action}>{action}</Text> : null}</View>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 }, action: { color: colors.accent, fontWeight: '700', fontSize: 12 } });
