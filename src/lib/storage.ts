import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Visit } from '../types';

const SAVED_KEY = 'foodtrail:saved-place-ids:v1';
const VISITS_KEY = 'foodtrail:visits:v1';

export async function getSavedPlaceIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function setSavedPlaceIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify([...new Set(ids)]));
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

export async function getVisits(): Promise<Visit[]> {
  try {
    const raw = await AsyncStorage.getItem(VISITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidVisit) : [];
  } catch {
    return [];
  }
}

export async function setVisits(visits: Visit[]): Promise<void> {
  await AsyncStorage.setItem(VISITS_KEY, JSON.stringify(visits));
}
