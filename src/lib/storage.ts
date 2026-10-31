import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Visit } from '../types';

const SAVED_KEY = 'foodtrail:saved-place-ids:v1';
const VISITS_KEY = 'foodtrail:visits:v1';

export async function getSavedPlaceIds(): Promise<string[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(SAVED_KEY)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export async function setSavedPlaceIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_KEY, JSON.stringify([...new Set(ids)]));
}

export async function getVisits(): Promise<Visit[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(VISITS_KEY)) ?? '[]') as Visit[];
  } catch {
    return [];
  }
}

export async function setVisits(visits: Visit[]): Promise<void> {
  await AsyncStorage.setItem(VISITS_KEY, JSON.stringify(visits));
}
