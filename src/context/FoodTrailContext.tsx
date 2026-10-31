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
  removeSaved: (placeId: string) => Promise<void>;
  isSaved: (placeId: string) => boolean;
  addVisit: (visit: Visit) => Promise<void>;
  updateVisit: (visit: Visit) => Promise<void>;
  deleteVisit: (visitId: string) => Promise<void>;
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
    let next: string[] = [];
    setSavedIds((prev) => {
      next = prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId];
      return next;
    });
    await setSavedPlaceIds(next);
  }, []);

  const removeSaved = useCallback(async (placeId: string) => {
    let next: string[] = [];
    setSavedIds((prev) => {
      next = prev.filter((id) => id !== placeId);
      return next;
    });
    await setSavedPlaceIds(next);
  }, []);

  const isSaved = useCallback((placeId: string) => {
    return savedIds.includes(placeId);
  }, [savedIds]);

  const addVisit = useCallback(async (visit: Visit) => {
    let next: Visit[] = [];
    setVisitsState((prev) => {
      next = [visit, ...prev];
      return next;
    });
    await setVisits(next);
    // The seed catalogue remains immutable. Visit records are tracked separately so repeat visits are supported.
  }, []);

  const updateVisit = useCallback(async (updatedVisit: Visit) => {
    let next: Visit[] = [];
    setVisitsState((prev) => {
      next = prev.map((v) => (v.id === updatedVisit.id ? { ...updatedVisit, updatedAt: new Date().toISOString() } : v));
      return next;
    });
    await setVisits(next);
  }, []);

  const deleteVisit = useCallback(async (visitId: string) => {
    let next: Visit[] = [];
    setVisitsState((prev) => {
      next = prev.filter((v) => v.id !== visitId);
      return next;
    });
    await setVisits(next);
  }, []);

  const value = useMemo(
    () => ({
      places: seedPlaces,
      savedIds,
      visits,
      ready,
      toggleSaved,
      removeSaved,
      isSaved,
      addVisit,
      updateVisit,
      deleteVisit,
    }),
    [savedIds, visits, ready, toggleSaved, removeSaved, isSaved, addVisit, updateVisit, deleteVisit]
  );
  return <FoodTrailContext.Provider value={value}>{children}</FoodTrailContext.Provider>;
}

export function useFoodTrail() {
  const value = useContext(FoodTrailContext);
  if (!value) throw new Error('useFoodTrail must be used within FoodTrailProvider');
  return value;
}
