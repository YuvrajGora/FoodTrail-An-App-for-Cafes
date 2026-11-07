import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Visit } from '../types';

// Legacy keys preserved from Milestones 1-3
const LEGACY_SAVED_KEY = 'foodtrail:saved-place-ids:v1';
const LEGACY_VISITS_KEY = 'foodtrail:visits:v1';

// Partitioned keys for guest mode and authenticated users
const GUEST_SAVED_KEY = 'foodtrail:guest:saved-place-ids:v1';
const GUEST_VISITS_KEY = 'foodtrail:guest:visits:v1';

export function getSavedPlacesKey(userId?: string | null): string {
  if (userId && typeof userId === 'string' && userId.trim()) {
    return `foodtrail:user:${userId.trim()}:saved-place-ids:v1`;
  }
  return GUEST_SAVED_KEY;
}

export function getVisitsKey(userId?: string | null): string {
  if (userId && typeof userId === 'string' && userId.trim()) {
    return `foodtrail:user:${userId.trim()}:visits:v1`;
  }
  return GUEST_VISITS_KEY;
}

export async function getSavedPlaceIds(userId?: string | null): Promise<string[]> {
  try {
    const key = getSavedPlacesKey(userId);
    let raw = await AsyncStorage.getItem(key);

    // If guest key has not been written yet, safely migrate from legacy key
    if (!raw && !userId) {
      raw = await AsyncStorage.getItem(LEGACY_SAVED_KEY);
      if (raw) {
        await AsyncStorage.setItem(GUEST_SAVED_KEY, raw);
      }
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function setSavedPlaceIds(ids: string[], userId?: string | null): Promise<void> {
  const key = getSavedPlacesKey(userId);
  const json = JSON.stringify([...new Set(ids)]);
  await AsyncStorage.setItem(key, json);

  // Maintain legacy key in sync for guest mode backward compatibility
  if (!userId) {
    await AsyncStorage.setItem(LEGACY_SAVED_KEY, json);
  }
}

function isValidVisit(item: unknown): item is Visit {
  if (!item || typeof item !== 'object') return false;
  const v = item as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.placeName === 'string' &&
    typeof v.visitDate === 'string'
  );
}

export async function getVisits(userId?: string | null): Promise<Visit[]> {
  try {
    const key = getVisitsKey(userId);
    let raw = await AsyncStorage.getItem(key);

    // If guest key has not been written yet, safely migrate from legacy key
    if (!raw && !userId) {
      raw = await AsyncStorage.getItem(LEGACY_VISITS_KEY);
      if (raw) {
        await AsyncStorage.setItem(GUEST_VISITS_KEY, raw);
      }
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidVisit) : [];
  } catch {
    return [];
  }
}

export async function setVisits(visits: Visit[], userId?: string | null): Promise<void> {
  const key = getVisitsKey(userId);
  const json = JSON.stringify(visits);
  await AsyncStorage.setItem(key, json);

  // Maintain legacy key in sync for guest mode backward compatibility
  if (!userId) {
    await AsyncStorage.setItem(LEGACY_VISITS_KEY, json);
  }
}

/**
 * Initializes a new user partition upon first login on this device.
 * Copies existing guest bookmarks and visits into the new user partition
 * so local records are preserved, while keeping the guest archive intact.
 */
export async function initializeUserPartition(userId: string): Promise<void> {
  if (!userId || typeof userId !== 'string') return;
  const targetSavedKey = getSavedPlacesKey(userId);
  const targetVisitsKey = getVisitsKey(userId);

  try {
    const existingSaved = await AsyncStorage.getItem(targetSavedKey);
    if (existingSaved === null) {
      const guestSaved = await getSavedPlaceIds(null);
      if (guestSaved.length > 0) {
        await AsyncStorage.setItem(targetSavedKey, JSON.stringify(guestSaved));
      }
    }

    const existingVisits = await AsyncStorage.getItem(targetVisitsKey);
    if (existingVisits === null) {
      const guestVisits = await getVisits(null);
      if (guestVisits.length > 0) {
        await AsyncStorage.setItem(targetVisitsKey, JSON.stringify(guestVisits));
      }
    }
  } catch (error) {
    console.warn('Failed to initialize user partition:', error);
  }
}
