export type AreaDivision = 
  | 'North Kolkata'
  | 'Central Kolkata'
  | 'South Kolkata'
  | 'East Kolkata & Salt Lake'
  | 'Naktala & Haridevpur'
  | 'Behala & Barisha'
  | 'Kalyani, Nadia';

export interface Pandal {
  id: string;
  name: string;
  area_division: AreaDivision;
  nearest_metro: string;
  metro_nearest_dist?: string;
  estimated_walking_distance_raw: string; // e.g. "~0.3 km" or "Check"
  estimated_walking_distance_km: number | null; // e.g. 0.3 or null if Check
  notes: string;
  has_caution: boolean;
  caution_reasons: string[];
  location_verified: boolean;
  latitude: number | null;
  longitude: number | null;
  category: string;
  google_maps_search_url: string;
  source_page: number;
  source_pdf: string;
  // Computed client-side when user location is available:
  distance_from_user_km?: number;
  walking_duration_mins?: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
  addressName?: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface CalculatedRoute {
  coordinates: [number, number][]; // [lat, lng] array for polyline
  distanceKm: number;
  durationMinutes: number;
  steps: RouteStep[];
  provider: 'osrm' | 'haversine-direct' | 'fallback';
  summary?: string;
}

export interface QualityNote {
  id: string;
  page: number;
  division: string;
  title: string;
  content: string;
  status: string;
}

export interface FilterOptions {
  searchQuery: string;
  division: AreaDivision | 'All';
  metroStation: string | 'All';
  verificationStatus: 'all' | 'verified' | 'unverified';
  hasCautionOnly: boolean;
  radiusKm: number | 'all';
  sortBy: 'recommended' | 'name' | 'pdf-distance' | 'user-distance';
}
