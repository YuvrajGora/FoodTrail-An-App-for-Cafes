export type VerificationStatus = 'Verified' | 'Pending verification' | 'Closed / unavailable' | 'Duplicate / merge';

export type Place = {
  id: string;
  name: string;
  area: string;
  category: string;
  source: string;
  sourceUrl: string;
  budgetPerPerson: number | null;
  mapsUrl: string;
  verificationStatus: VerificationStatus;
  visited: boolean;
  visitDate: string | null;
  rating: number | null;
  actualSpend: number | null;
  notes: string;
};

export type Visit = {
  id: string;
  placeId: string;
  placeName: string;
  visitDate: string;
  spend: number | null;
  personalShare: number | null;
  partySize?: number | null;
  rating: number | null;
  items: string;
  companions: string;
  notes: string;
  photos?: string[];
  createdAt: string;
  updatedAt?: string;
};
