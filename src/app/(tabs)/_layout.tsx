import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

type TabIconName = keyof typeof Ionicons.glyphMap;

const activeIcons: Record<string, TabIconName> = {
  index: 'home',
  discover: 'compass',
  bucket: 'bookmark',
  map: 'map',
  profile: 'person',
  journal: 'book',
};

const inactiveIcons: Record<string, TabIconName> = {
  index: 'home-outline',
  discover: 'compass-outline',
  bucket: 'bookmark-outline',
  map: 'map-outline',
  profile: 'person-outline',
  journal: 'book-outline',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          elevation: 8,
          shadowColor: colors.ink,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const iconName = focused
            ? activeIcons[route.name] ?? 'ellipse'
            : inactiveIcons[route.name] ?? 'ellipse-outline';
          return (
            <Ionicons
              name={iconName}
              color={typeof color === 'string' ? color : undefined}
              size={size || 22}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="bucket" options={{ title: 'Bucket List' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="journal" options={{ href: null, title: 'Journal' }} />
    </Tabs>
  );
}
