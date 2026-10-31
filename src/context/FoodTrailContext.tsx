import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import placesData from '../data/places.json';
import type { Place, Visit } from '../types';
import { getSavedPlaceIds, getVisits, setSavedPlaceIds, setVisits } from '../lib/storage';

type FoodTrailContextValue = {
  places: Place[];
  savedIds: string[];
  visits: Visit[];
  ready: boolean;
  toggleSaved: (placeId: string) => Promise<void>;
  addVisit: (visit: Visit) => Promise<void>;
};

const FoodTrailContext = createContext<FoodTrailContextValue | null>(null);
const seedPlaces = placesData as Place[];

export function FoodTrailProvider({ children }: { children: React.ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [visits, setVisitsState] = useState<Visit[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getSavedPlaceIds(), getVisits()]).then(([saved, recentVisits]) => {
      if (!active) return;
      setSavedIds(saved);
      setVisitsState(recentVisits);
      setReady(true);
    }).catch(() => setReady(true));
    return () => { active = false; };
  }, []);

  const toggleSaved = useCallback(async (placeId: string) => {
    const next = savedIds.includes(placeId) ? savedIds.filter((id) => id !== placeId) : [...savedIds, placeId];
    setSavedIds(next);
    await setSavedPlaceIds(next);
  }, [savedIds]);

  const addVisit = useCallback(async (visit: Visit) => {
    const next = [visit, ...visits];
    setVisitsState(next);
    await setVisits(next);
    // The seed catalogue remains immutable. Visit records are tracked separately so repeat visits are supported.
  }, [visits]);

  const value = useMemo(() => ({ places: seedPlaces, savedIds, visits, ready, toggleSaved, addVisit }), [savedIds, visits, ready, toggleSaved, addVisit]);
  return <FoodTrailContext.Provider value={value}>{children}</FoodTrailContext.Provider>;
}

export function useFoodTrail() {
  const value = useContext(FoodTrailContext);
  if (!value) throw new Error('useFoodTrail must be used within FoodTrailProvider');
  return value;
}
