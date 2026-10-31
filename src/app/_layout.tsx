import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FoodTrailProvider } from '@/context/FoodTrailContext';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <FoodTrailProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="place/[id]" />
        <Stack.Screen name="add-visit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile" />
      </Stack>
    </FoodTrailProvider>
  );
}
