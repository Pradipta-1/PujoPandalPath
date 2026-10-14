import type { Pandal, UserLocation } from '../types/pandal';

/**
 * Calculates Haversine straight-line distance in kilometers between two coordinates
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Calculates realistic pedestrian walking distance in Kolkata factoring in street grid circuity (~1.22x)
 */
export function calculateWalkingDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const direct = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  return Number((direct * 1.22).toFixed(2));
}

/**
 * Estimate walking duration in minutes during Kolkata Durga Puja festival pedestrian conditions (~4.0 km/h)
 */
export function estimateWalkingMinutes(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / 4.0) * 60));
}

/**
 * Format distance nicely (meters for < 1km, kilometers for >= 1km)
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm == null || isNaN(distanceKm)) return 'Not available';
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${distanceKm.toFixed(2)} km (${meters} m)`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

/**
 * Returns formatted distance from nearest metro station to the pandal
 */
export function getMetroDistanceText(pandal: Pandal): string {
  if (pandal.estimated_walking_distance_raw) {
    const match = pandal.estimated_walking_distance_raw.match(/~?[\d.]+\s*km/i);
    if (match) return match[0];
    if (pandal.estimated_walking_distance_raw !== 'Check') {
      const clean = pandal.estimated_walking_distance_raw.replace(/^Check\s*\(/i, '').replace(/\)$/, '');
      if (clean) return clean;
    }
  }
  if (pandal.metro_nearest_dist) return pandal.metro_nearest_dist;
  if (pandal.estimated_walking_distance_km != null) return `~${pandal.estimated_walking_distance_km} km`;
  return '';
}

/**
 * Generate Google Maps navigation URL
 * Prefers exact coords if verified, else uses encoded search query
 */
export function getGoogleMapsNavigationUrl(
  pandal: Pandal,
  userLocation?: UserLocation | null
): string {
  const travelMode = 'walking';
  
  if (pandal.location_verified && pandal.latitude && pandal.longitude) {
    const dest = `${pandal.latitude},${pandal.longitude}`;
    if (userLocation) {
      const origin = `${userLocation.lat},${userLocation.lng}`;
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=${travelMode}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${travelMode}`;
  }

  // Fallback for unverified pandals using the original PDF search query
  if (pandal.google_maps_search_url) {
    return pandal.google_maps_search_url;
  }
  const query = encodeURIComponent(`${pandal.name}, Durga Puja, ${pandal.area_division}, Kolkata`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Build Google Maps Multi-stop Itinerary URL
 */
export function getGoogleMapsMultiStopUrl(
  pandals: Pandal[],
  userLocation?: UserLocation | null
): string {
  if (pandals.length === 0) return 'https://www.google.com/maps';

  const validPandals = pandals.filter(p => p.location_verified && p.latitude && p.longitude);
  if (validPandals.length === 0) {
    return getGoogleMapsNavigationUrl(pandals[0], userLocation);
  }

  const origin = userLocation 
    ? `${userLocation.lat},${userLocation.lng}` 
    : `${validPandals[0].latitude},${validPandals[0].longitude}`;

  const destinationPandal = validPandals[validPandals.length - 1];
  const destination = `${destinationPandal.latitude},${destinationPandal.longitude}`;

  // Intermediate waypoints (cap to 8 to respect Google Maps URL limits)
  const waypoints = validPandals
    .slice(userLocation ? 0 : 1, -1)
    .slice(0, 8)
    .map(p => `${p.latitude},${p.longitude}`)
    .join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }
  return url;
}
