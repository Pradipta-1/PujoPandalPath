import type { Pandal } from '../types/pandal';
import { calculateWalkingDistance, estimateWalkingMinutes } from './geo';

export interface StartingLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface RouteLeg {
  legIndex: number;
  fromName: string;
  toName: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  distanceKm: number;
  walkingMinutes: number;
  googleMapsLegUrl: string;
}

export interface OptimizedRouteResult {
  orderedPandals: Pandal[];
  legs: RouteLeg[];
  totalDistanceKm: number;
  totalMinutes: number;
  originalDistanceKm: number;
  distanceSavedKm: number;
  googleMapsUrl: string;
}

/**
 * Calculates the total path distance visiting stops in the given order from start
 */
function calculatePathDistance(
  start: StartingLocation,
  pandals: Pandal[]
): number {
  if (pandals.length === 0) return 0;
  let total = 0;
  let currLat = start.lat;
  let currLng = start.lng;

  for (const p of pandals) {
    if (p.latitude != null && p.longitude != null) {
      total += calculateWalkingDistance(currLat, currLng, p.latitude, p.longitude);
      currLat = p.latitude;
      currLng = p.longitude;
    }
  }
  return Number(total.toFixed(2));
}

/**
 * Optimizes the visiting sequence of pandals to find the minimum walking distance tour
 * using exact Branch & Bound (for N <= 8) or Nearest-Neighbor + 2-Opt (for N > 8).
 */
export function optimizePandalRoute(
  startPoint: StartingLocation,
  pandals: Pandal[]
): OptimizedRouteResult {
  const verifiedPandals = pandals.filter(
    (p) => p.location_verified && p.latitude != null && p.longitude != null
  );
  const unverifiedPandals = pandals.filter(
    (p) => !p.location_verified || p.latitude == null || p.longitude == null
  );

  const originalDistance = calculatePathDistance(startPoint, verifiedPandals);

  if (verifiedPandals.length <= 1) {
    const legs = buildRouteLegs(startPoint, verifiedPandals);
    const totalDist = calculatePathDistance(startPoint, verifiedPandals);
    return {
      orderedPandals: [...verifiedPandals, ...unverifiedPandals],
      legs,
      totalDistanceKm: totalDist,
      totalMinutes: estimateWalkingMinutes(totalDist),
      originalDistanceKm: originalDistance,
      distanceSavedKm: 0,
      googleMapsUrl: buildGoogleMapsMultiStopUrl(startPoint, verifiedPandals)
    };
  }

  const n = verifiedPandals.length;

  // Precompute distance matrix
  // Index 0: startPoint, Index 1..n: verifiedPandals[0..n-1]
  const distMatrix: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i < n; i++) {
    const dStart = calculateWalkingDistance(
      startPoint.lat,
      startPoint.lng,
      verifiedPandals[i].latitude!,
      verifiedPandals[i].longitude!
    );
    distMatrix[0][i + 1] = dStart;
    distMatrix[i + 1][0] = dStart;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = calculateWalkingDistance(
        verifiedPandals[i].latitude!,
        verifiedPandals[i].longitude!,
        verifiedPandals[j].latitude!,
        verifiedPandals[j].longitude!
      );
      distMatrix[i + 1][j + 1] = d;
      distMatrix[j + 1][i + 1] = d;
    }
  }

  let bestPermutation: number[] = [];
  let bestDist = Infinity;

  // Exact Branch & Bound for N <= 8 (e.g. 6-7 pandals as requested)
  if (n <= 8) {
    const visited = new Array(n + 1).fill(false);
    visited[0] = true;

    const dfs = (currNode: number, count: number, currentDist: number, path: number[]) => {
      if (currentDist >= bestDist) return; // Prune branch

      if (count === n) {
        if (currentDist < bestDist) {
          bestDist = currentDist;
          bestPermutation = [...path];
        }
        return;
      }

      for (let next = 1; next <= n; next++) {
        if (!visited[next]) {
          visited[next] = true;
          path.push(next);
          dfs(next, count + 1, currentDist + distMatrix[currNode][next], path);
          path.pop();
          visited[next] = false;
        }
      }
    };

    dfs(0, 0, 0, []);
  } else {
    // Nearest-Neighbor initialization + 2-Opt for N > 8
    const visited = new Array(n + 1).fill(false);
    let curr = 0;
    const tour: number[] = [];

    for (let step = 0; step < n; step++) {
      let nearest = -1;
      let minD = Infinity;
      for (let next = 1; next <= n; next++) {
        if (!visited[next] && distMatrix[curr][next] < minD) {
          minD = distMatrix[curr][next];
          nearest = next;
        }
      }
      if (nearest !== -1) {
        visited[nearest] = true;
        tour.push(nearest);
        curr = nearest;
      }
    }

    // 2-Opt local search refinement
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < tour.length - 1; i++) {
        for (let j = i + 1; j < tour.length; j++) {
          const prevNode = i === 0 ? 0 : tour[i - 1];
          const currNode = tour[i];
          const nextNode = tour[j];
          const afterNode = j === tour.length - 1 ? null : tour[j + 1];

          // Current distance of edges
          const currentCost =
            distMatrix[prevNode][currNode] + (afterNode !== null ? distMatrix[nextNode][afterNode] : 0);
          // New distance if reversed
          const newCost =
            distMatrix[prevNode][nextNode] + (afterNode !== null ? distMatrix[currNode][afterNode] : 0);

          if (newCost < currentCost - 0.001) {
            // Reverse segment tour[i..j]
            const reversed = tour.slice(i, j + 1).reverse();
            tour.splice(i, reversed.length, ...reversed);
            improved = true;
          }
        }
      }
    }
    bestPermutation = tour;
  }

  // Map permutation back to pandals (1-based index)
  const orderedVerified = bestPermutation.map((idx) => verifiedPandals[idx - 1]);
  const orderedPandals = [...orderedVerified, ...unverifiedPandals];

  const legs = buildRouteLegs(startPoint, orderedVerified);
  const totalDistanceKm = Number(
    legs.reduce((acc, leg) => acc + leg.distanceKm, 0).toFixed(2)
  );
  const totalMinutes = estimateWalkingMinutes(totalDistanceKm);
  const distanceSavedKm = Number(Math.max(0, originalDistance - totalDistanceKm).toFixed(2));

  return {
    orderedPandals,
    legs,
    totalDistanceKm,
    totalMinutes,
    originalDistanceKm: originalDistance,
    distanceSavedKm,
    googleMapsUrl: buildGoogleMapsMultiStopUrl(startPoint, orderedVerified)
  };
}

/**
 * Builds individual legs with step-by-step distances, walking times, and direct leg Google Maps URLs
 */
function buildRouteLegs(
  startPoint: StartingLocation,
  pandals: Pandal[]
): RouteLeg[] {
  const legs: RouteLeg[] = [];
  if (pandals.length === 0) return legs;

  let prevName = startPoint.name;
  let prevLat = startPoint.lat;
  let prevLng = startPoint.lng;

  pandals.forEach((pandal, idx) => {
    if (pandal.latitude != null && pandal.longitude != null) {
      const dist = calculateWalkingDistance(prevLat, prevLng, pandal.latitude, pandal.longitude);
      const mins = estimateWalkingMinutes(dist);
      const legUrl = `https://www.google.com/maps/dir/?api=1&origin=${prevLat},${prevLng}&destination=${pandal.latitude},${pandal.longitude}&travelmode=walking`;

      legs.push({
        legIndex: idx + 1,
        fromName: prevName,
        toName: pandal.name,
        fromCoords: [prevLat, prevLng],
        toCoords: [pandal.latitude, pandal.longitude],
        distanceKm: dist,
        walkingMinutes: mins,
        googleMapsLegUrl: legUrl
      });

      prevName = pandal.name;
      prevLat = pandal.latitude;
      prevLng = pandal.longitude;
    }
  });

  return legs;
}

/**
 * Builds a full multi-stop walking route URL directly executable in Google Maps
 */
export function buildGoogleMapsMultiStopUrl(
  startPoint: StartingLocation,
  pandals: Pandal[]
): string {
  if (pandals.length === 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(startPoint.name)}`;
  }

  const validStops = pandals.filter((p) => p.latitude != null && p.longitude != null);
  if (validStops.length === 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pandals[0].name)}`;
  }

  // Google Maps URL scheme supports a maximum of 8 intermediate waypoints + origin + destination
  const stopsToInclude = validStops.length > 9 ? validStops.slice(0, 9) : validStops;
  const destinationPandal = stopsToInclude[stopsToInclude.length - 1];
  const destination = `${destinationPandal.latitude},${destinationPandal.longitude}`;

  const waypoints = stopsToInclude
    .slice(0, -1)
    .slice(0, 8)
    .map((p) => `${p.latitude},${p.longitude}`)
    .join('|');

  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  return url;
}
