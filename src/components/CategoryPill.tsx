import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '@/theme/colors';

interface CategoryPillProps {
  id: string;
  name: string;
  icon: string;
  count?: number;
  active: boolean;
  onPress: (id: string) => void;
}

export function CategoryPill({ id, name, icon, count, active, onPress }: CategoryPillProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pill,
        active ? styles.pillActive : styles.pillInactive,
        pressed && styles.pressed,
      ]}
      onPress={() => onPress(id)}
      android_ripple={{ color: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)' }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter by ${name}`}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.name, active ? styles.nameActive : styles.nameInactive]}>
        {name}
      </Text>
      {count !== undefined && count > 0 ? (
        <Text style={[styles.count, active ? styles.countActive : styles.countInactive]}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    gap: 7,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    fontSize: 14,
  },
  name: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  nameActive: {
    color: colors.white,
  },
  nameInactive: {
    color: colors.ink,
  },
  count: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  countActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: colors.white,
  },
  countInactive: {
    backgroundColor: colors.surfaceMuted,
    color: colors.muted,
  },
});
