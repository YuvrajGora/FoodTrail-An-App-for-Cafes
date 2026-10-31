import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme/colors';

export interface LocationOption {
  id: string;
  name: string;
  subtitle: string;
  keywords: string[];
}

export const DELHI_LOCATIONS: LocationOption[] = [
  {
    id: 'all',
    name: 'All Delhi NCR',
    subtitle: 'Entire capital region catalogue',
    keywords: [],
  },
  {
    id: 'old-delhi',
    name: 'Old Delhi & Walled City',
    subtitle: 'Chandni Chowk, Jama Masjid, Chawri Bazar, Daryaganj',
    keywords: ['old delhi', 'chandni chowk', 'jama masjid', 'chawri bazar', 'daryaganj', 'fatehpuri', 'dariba'],
  },
  {
    id: 'central',
    name: 'Connaught Place & Central',
    subtitle: 'CP, Janpath, Khan Market, Pandara Road, Bengali Market',
    keywords: ['connaught place', 'cp', 'khan market', 'pandara', 'janpath', 'bengali market', 'central'],
  },
  {
    id: 'south',
    name: 'South Delhi & Mehrauli',
    subtitle: 'Hauz Khas, Mehrauli, GK, Safdarjung, Lodhi Colony',
    keywords: ['south delhi', 'hauz khas', 'mehrauli', 'safdarjung', 'gk', 'greater kailash', 'lodhi'],
  },
  {
    id: 'gurugram',
    name: 'Gurugram & CyberHub',
    subtitle: 'DLF CyberHub, Golf Course Road, Sector 29',
    keywords: ['gurugram', 'gurgaon', 'cyberhub', 'cyber city', 'golf course', 'sector 29'],
  },
  {
    id: 'noida',
    name: 'Noida & East Delhi',
    subtitle: 'Sector 18, Mall of India, Mayur Vihar',
    keywords: ['noida', 'east delhi', 'mayur vihar', 'sector 18'],
  },
];

interface LocationPickerModalProps {
  visible: boolean;
  selectedId: string;
  onSelect: (option: LocationOption) => void;
  onClose: () => void;
}

export function LocationPickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
}: LocationPickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>LOCATION FILTER</Text>
              <Text style={styles.title}>Select Region</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color={colors.ink} />
            </Pressable>
          </View>

          <Text style={styles.description}>
            Filter the catalogue to discover authentic dining spots in specific neighborhoods across the capital.
          </Text>

          <View style={styles.optionsList}>
            {DELHI_LOCATIONS.map((loc) => {
              const isSelected = loc.id === selectedId;
              return (
                <Pressable
                  key={loc.id}
                  style={({ pressed }) => [
                    styles.optionRow,
                    isSelected && styles.optionRowSelected,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    onSelect(loc);
                    onClose();
                  }}
                  android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
                >
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                      {loc.name}
                    </Text>
                    <Text style={styles.optionSubtitle}>{loc.subtitle}</Text>
                  </View>
                  {isSelected ? (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    </View>
                  ) : (
                    <View style={styles.emptyCircle} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 41, 36, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 24,
    paddingBottom: 36,
    gap: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  optionsList: {
    gap: 10,
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionRowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  optionContent: {
    flex: 1,
    marginRight: 12,
  },
  optionName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  optionNameSelected: {
    color: colors.accent,
  },
  optionSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
});
