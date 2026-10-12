import { useState, useCallback } from 'react';
import type { CalculatedRoute, RouteStep, UserLocation, Pandal } from '../types/pandal';
import { calculateHaversineDistance, estimateWalkingMinutes } from '../utils/geo';

export interface UseRoutingReturn {
  activeRoute: CalculatedRoute | null;
  isLoadingRoute: boolean;
  routingError: string | null;
  calculateWalkingRoute: (origin: UserLocation, destination: Pandal) => Promise<CalculatedRoute | null>;
  clearRoute: () => void;
}

export function useRouting(): UseRoutingReturn {
  const [activeRoute, setActiveRoute] = useState<CalculatedRoute | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  const calculateWalkingRoute = useCallback(
    async (origin: UserLocation, destination: Pandal): Promise<CalculatedRoute | null> => {
      if (!destination.location_verified || !destination.latitude || !destination.longitude) {
        setRoutingError(`Cannot calculate live walking route: ${destination.name} coordinates are unverified in the official survey.`);
        return null;
      }

      setIsLoadingRoute(true);
      setRoutingError(null);

      const startLng = origin.lng;
      const startLat = origin.lat;
      const destLng = destination.longitude;
      const destLat = destination.latitude;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500);

        const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;
        
        const response = await fetch(osrmUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const primaryRoute = data.routes[0];
            const coordinates: [number, number][] = primaryRoute.geometry.coordinates.map(
              (coord: [number, number]) => [coord[1], coord[0]]
            );

            const distanceKm = Number((primaryRoute.distance / 1000).toFixed(2));
            const durationMinutes = Math.max(1, Math.round(primaryRoute.duration / 60));

            const steps: RouteStep[] = (primaryRoute.legs?.[0]?.steps || []).map((step: any) => {
              const modifier = step.maneuver?.modifier ? ` (${step.maneuver.modifier})` : '';
              const maneuverType = step.maneuver?.type || 'proceed';
              const name = step.name ? ` onto ${step.name}` : '';
              return {
                instruction: `${maneuverType}${modifier}${name}`.trim(),
                distanceMeters: Math.round(step.distance),
                durationSeconds: Math.round(step.duration)
              };
            });

            const routeResult: CalculatedRoute = {
              coordinates,
              distanceKm,
              durationMinutes,
              steps: steps.slice(0, 15),
              provider: 'osrm',
              summary: primaryRoute.legs?.[0]?.summary || `Route to ${destination.name}`
            };

            setActiveRoute(routeResult);
            setIsLoadingRoute(false);
            return routeResult;
          }
        }
        throw new Error('OSRM service response not Ok');
      } catch (err: any) {
        console.warn('OSRM walking routing failed or timed out, falling back to direct line estimate:', err);
        
        const directDistKm = calculateHaversineDistance(startLat, startLng, destLat, destLng);
        const estMinutes = estimateWalkingMinutes(directDistKm);

        const fallbackRoute: CalculatedRoute = {
          coordinates: [
            [startLat, startLng],
            [destLat, destLng]
          ],
          distanceKm: directDistKm,
          durationMinutes: estMinutes,
          steps: [
            {
              instruction: `Head towards ${destination.name}`,
              distanceMeters: Math.round(directDistKm * 1000),
              durationSeconds: estMinutes * 60
            }
          ],
          provider: 'haversine-direct',
          summary: `Direct line to ${destination.name} (Open Google Maps for turn-by-turn)`
        };

        setActiveRoute(fallbackRoute);
        setIsLoadingRoute(false);
        setRoutingError('Public routing server is slow/offline. Showing direct path. Use "Google Maps" button for live turn-by-turn voice directions.');
        return fallbackRoute;
      }
    },
    []
  );

  const clearRoute = useCallback(() => {
    setActiveRoute(null);
    setRoutingError(null);
  }, []);

  return {
    activeRoute,
    isLoadingRoute,
    routingError,
    calculateWalkingRoute,
    clearRoute
  };
}
