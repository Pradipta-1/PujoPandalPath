import { useState, useMemo, useCallback } from 'react';
import type { Pandal, FilterOptions, UserLocation } from '../types/pandal';
import { calculateWalkingDistance, estimateWalkingMinutes } from '../utils/geo';
import { searchPandals } from '../utils/search';
import rawPandals from '../data/pandals.json';

const ALL_PANDALS = rawPandals as Pandal[];

// Pre-computed static metro stations and division counts (never recalculate)
const ALL_METRO_STATIONS: string[] = (() => {
  const set = new Set<string>();
  ALL_PANDALS.forEach((p) => {
    if (p.nearest_metro && p.nearest_metro !== 'Location to verify') {
      set.add(p.nearest_metro);
    }
  });
  return Array.from(set).sort();
})();

const DIVISION_COUNTS: Record<string, number> = (() => {
  const counts: Record<string, number> = {
    'North Kolkata': 0,
    'Central Kolkata': 0,
    'South Kolkata': 0,
    'East Kolkata & Salt Lake': 0,
    'Naktala & Haridevpur': 0,
    'Behala & Barisha': 0,
    'Kalyani, Nadia': 0
  };
  ALL_PANDALS.forEach((p) => {
    if (counts[p.area_division] !== undefined) {
      counts[p.area_division]++;
    }
  });
  return counts;
})();

export const INITIAL_FILTERS: FilterOptions = {
  searchQuery: '',
  division: 'All',
  metroStation: 'All',
  verificationStatus: 'all',
  hasCautionOnly: false,
  radiusKm: 'all',
  sortBy: 'user-distance'
};

export function usePandalSearch(userLocation?: UserLocation | null) {
  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS);

  // Compute live user pedestrian walking distance only when lat/lng changes
  const userLat = userLocation?.lat;
  const userLng = userLocation?.lng;

  const pandalsWithDistance = useMemo(() => {
    if (userLat == null || userLng == null) {
      return ALL_PANDALS;
    }
    return ALL_PANDALS.map((pandal) => {
      if (!pandal.location_verified || pandal.latitude == null || pandal.longitude == null) {
        return pandal;
      }
      const dist = calculateWalkingDistance(
        userLat,
        userLng,
        pandal.latitude,
        pandal.longitude
      );
      const mins = estimateWalkingMinutes(dist);
      return {
        ...pandal,
        distance_from_user_km: dist,
        walking_duration_mins: mins
      };
    });
  }, [userLat, userLng]);

  // Filtered and sorted pandals
  const filteredPandals = useMemo(() => {
    let result = [...pandalsWithDistance];

    // 1. Intelligent ranked text & phonetic search
    if (filters.searchQuery.trim()) {
      result = searchPandals(result, filters.searchQuery);
    }

    // 2. Division
    if (filters.division !== 'All') {
      result = result.filter((p) => p.area_division === filters.division);
    }

    // 3. Metro station
    if (filters.metroStation !== 'All') {
      result = result.filter((p) => p.nearest_metro === filters.metroStation);
    }

    // 4. Verification status
    if (filters.verificationStatus === 'verified') {
      result = result.filter((p) => p.location_verified);
    } else if (filters.verificationStatus === 'unverified') {
      result = result.filter((p) => !p.location_verified);
    }

    // 5. Caution filter
    if (filters.hasCautionOnly) {
      result = result.filter((p) => p.has_caution);
    }

    // 6. Radius filter (only applicable when userLocation is set)
    if (filters.radiusKm !== 'all' && userLocation) {
      const radius = Number(filters.radiusKm);
      result = result.filter(
        (p) => p.distance_from_user_km != null && p.distance_from_user_km <= radius
      );
    }

    // 7. Sort: ALWAYS sort nearest pandals in ascending order of distance in km
    result.sort((a, b) => {
      if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (filters.sortBy === 'pdf-distance') {
        const da = a.estimated_walking_distance_km ?? 999;
        const db = b.estimated_walking_distance_km ?? 999;
        return da - db;
      }

      // Default & 'user-distance' & 'recommended': Ascending order of distance from current location in kilometers
      const distA = a.distance_from_user_km != null ? a.distance_from_user_km : Infinity;
      const distB = b.distance_from_user_km != null ? b.distance_from_user_km : Infinity;

      if (distA !== distB) {
        return distA - distB; // Ascending order of distance in km (nearest first)
      }

      // If neither has distance or identical distance, prioritize verified pins then page order
      if (a.location_verified !== b.location_verified) {
        return a.location_verified ? -1 : 1;
      }
      return a.source_page - b.source_page;
    });

    return result;
  }, [pandalsWithDistance, filters, userLat, userLng]);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const updateFilter = useCallback(<K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    allPandals: pandalsWithDistance,
    filteredPandals,
    totalCount: ALL_PANDALS.length,
    filteredCount: filteredPandals.length,
    verifiedCount: ALL_PANDALS.filter((p) => p.location_verified).length,
    unverifiedCount: ALL_PANDALS.filter((p) => !p.location_verified).length,
    filters,
    allMetroStations: ALL_METRO_STATIONS,
    divisionCounts: DIVISION_COUNTS,
    updateFilter,
    resetFilters
  };
}
