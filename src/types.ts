export interface LandmarkInfo {
  name: string;
  date: string;
  category: string;
  history: string;
  coordinates?: { lat: number; lng: number };
}

export interface CollectedLandmark extends LandmarkInfo {
  id: string;
  uid: string;
  lat: number;
  lng: number;
  collectedAt: any;
  imageUrl?: string;
}

export interface NearbyLandmark {
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  bearing?: number;
}

export type LocationStatus = 'idle' | 'requesting' | 'success' | 'error';
