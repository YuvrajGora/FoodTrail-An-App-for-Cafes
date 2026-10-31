import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline', discover: 'compass-outline', bucket: 'bookmark-outline', map: 'map-outline', journal: 'book-outline',
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { height: 66, paddingTop: 8, paddingBottom: 8, borderTopColor: colors.border, backgroundColor: colors.surface },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name] ?? 'ellipse-outline'} color={typeof color === 'string' ? color : undefined} size={size} />,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="bucket" options={{ title: 'Bucket List' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
    </Tabs>
  );
}
