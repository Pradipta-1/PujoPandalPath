import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserLocation } from '../types/pandal';

export interface UseGeolocationReturn {
  userLocation: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable' | 'timeout' | null;
  isLiveTracking: boolean;
  requestLocation: () => Promise<UserLocation | null>;
  startLiveTracking: () => void;
  stopLiveTracking: () => void;
  clearLocation: () => void;
  setManualLocation: (lat: number, lng: number, name?: string) => void;
}

export const POPULAR_STARTING_POINTS = [
  { name: 'Shyambazar Five-Point', lat: 22.6025, lng: 88.3712 },
  { name: 'Esplanade / Dharmatala', lat: 22.5645, lng: 88.3524 },
  { name: 'Howrah Railway Station', lat: 22.5837, lng: 88.3429 },
  { name: 'Sealdah Railway Station', lat: 22.5678, lng: 88.3713 },
  { name: 'Kalighat Temple / Metro', lat: 22.5181, lng: 88.3464 },
  { name: 'Gariahat More', lat: 22.5185, lng: 88.3660 },
  { name: 'Salt Lake Karunamoyee', lat: 22.5870, lng: 88.4200 },
  { name: 'Behala Chowrasta', lat: 22.4940, lng: 88.3125 },
  { name: 'Dum Dum Junction', lat: 22.6225, lng: 88.3789 },
  { name: 'Jadavpur 8B Bus Stand', lat: 22.4988, lng: 88.3714 },
  { name: 'Kalyani Railway Station', lat: 22.9750, lng: 88.4344 }
];

const ROAD_LOOKUP_MIN_INTERVAL_MS = 15_000;
const ROAD_LOOKUP_MIN_MOVEMENT_DEGREES = 0.0003; // roughly 30 m in Kolkata

async function resolveRoadName(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      format: 'jsonv2', lat: String(lat), lon: String(lng), zoom: '18', addressdetails: '1'
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
    if (!response.ok) return null;
    const result = await response.json();
    const address = result?.address;
    const road = address?.road || address?.pedestrian || address?.footway || address?.residential;
    const locality = address?.neighbourhood || address?.suburb || address?.city_district;
    if (road && locality) return `${road}, ${locality}`;
    return road || locality || result?.display_name?.split(',').slice(0, 2).join(',') || null;
  } catch {
    return null;
  }
}

export function useGeolocation(): UseGeolocationReturn {
  // A cached value is only temporary; a fresh device position supersedes it.
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => {
    try {
      const saved = localStorage.getItem('pandalpath_user_loc');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number' && parsed.lat !== 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<UseGeolocationReturn['permissionStatus']>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const isRealGpsAcquiredRef = useRef<boolean>(false);
  const lastCoordsRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);
  const lastRoadLookupRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  // Sync to localStorage
  const saveLocation = useCallback((loc: UserLocation | null) => {
    setUserLocation(loc);
    try {
      if (loc) {
        localStorage.setItem('pandalpath_user_loc', JSON.stringify(loc));
      } else {
        localStorage.removeItem('pandalpath_user_loc');
      }
    } catch {
      // ignore
    }
  }, []);

  const labelRoadForLocation = useCallback(async (loc: UserLocation) => {
    if (!loc.isRealGps || (loc.accuracy ?? Infinity) > 120) return;
    const previous = lastRoadLookupRef.current;
    const movedEnough = !previous ||
      Math.abs(previous.lat - loc.lat) > ROAD_LOOKUP_MIN_MOVEMENT_DEGREES ||
      Math.abs(previous.lng - loc.lng) > ROAD_LOOKUP_MIN_MOVEMENT_DEGREES;
    if (!movedEnough && previous && Date.now() - previous.timestamp < ROAD_LOOKUP_MIN_INTERVAL_MS) return;

    lastRoadLookupRef.current = { lat: loc.lat, lng: loc.lng, timestamp: Date.now() };
    const roadName = await resolveRoadName(loc.lat, loc.lng);
    const latest = lastCoordsRef.current;
    if (!roadName || !latest || Math.abs(latest.lat - loc.lat) > 0.0001 || Math.abs(latest.lng - loc.lng) > 0.0001) return;
    saveLocation({ ...loc, addressName: roadName });
  }, [saveLocation]);

  // Continuous watchPosition live tracking
  const startLiveTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    if (watchIdRef.current != null) return;

    setIsLiveTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = Number(position.coords.latitude.toFixed(6));
        const newLng = Number(position.coords.longitude.toFixed(6));
        const newAcc = Math.round(position.coords.accuracy);

        // Filter out micro-jitter under ~3m to prevent unnecessary whole-app recalculations
        if (lastCoordsRef.current) {
          const dLat = Math.abs(newLat - lastCoordsRef.current.lat);
          const dLng = Math.abs(newLng - lastCoordsRef.current.lng);
          if (dLat < 0.00003 && dLng < 0.00003 && Math.abs(newAcc - lastCoordsRef.current.accuracy) < 15) {
            return;
          }
        }
        lastCoordsRef.current = { lat: newLat, lng: newLng, accuracy: newAcc };
        isRealGpsAcquiredRef.current = true;

        const loc: UserLocation = {
          lat: newLat,
          lng: newLng,
          accuracy: newAcc,
          timestamp: position.timestamp,
          addressName: 'Locating nearby road…',
          heading: typeof position.coords.heading === 'number' && !isNaN(position.coords.heading) ? position.coords.heading : null,
          isRealGps: true,
          isAutoSynced: true
        };
        saveLocation(loc);
        setIsLoading(false);
        setError(null);
        setPermissionStatus('granted');
        void labelRoadForLocation(loc);
      },
      (err) => {
        console.warn('Live watch position update notice:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000
      }
    );
  }, [labelRoadForLocation, saveLocation]);

  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);
  }, []);

  // Instant Parallel Network/IP Geolocation Fallback (<300ms, 0 permissions required)
  const fetchIpLocation = useCallback(async (): Promise<UserLocation | null> => {
    if (isRealGpsAcquiredRef.current) return null;

    const apis = [
      { url: 'https://ipwho.is/', latKey: 'latitude', lngKey: 'longitude', cityKey: 'city' },
      { url: 'https://freeipapi.com/api/json', latKey: 'latitude', lngKey: 'longitude', cityKey: 'cityName' },
      { url: 'https://ipapi.co/json/', latKey: 'latitude', lngKey: 'longitude', cityKey: 'city' }
    ];

    for (const api of apis) {
      if (isRealGpsAcquiredRef.current) return null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(api.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const lat = data[api.latKey];
          const lng = data[api.lngKey];
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat !== 0) {
            if (isRealGpsAcquiredRef.current) return null;
            // IP location is city-level only; never replace it with a made-up
            // Esplanade location when the network is outside Kolkata.
            const isNearKolkata = lat >= 21.5 && lat <= 24.5 && lng >= 87.0 && lng <= 89.5;
            if (!isNearKolkata) return null;
            const cityName = data[api.cityKey] || 'Kolkata';
            const loc: UserLocation = {
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              accuracy: 450,
              timestamp: Date.now(),
              addressName: `${cityName} area (approximate network location)`,
              isRealGps: false,
              isAutoSynced: true
            };
            saveLocation(loc);
            setIsLoading(false);
            return loc;
          }
        }
      } catch {
        // Continue to next endpoint
      }
    }
    return null;
  }, [saveLocation]);

  // Request location with resilient multi-tier fallback: High accuracy GPS, then Wi-Fi, then IP
  const requestLocation = useCallback(async (): Promise<UserLocation | null> => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setIsLoading(false);
      setPermissionStatus('unavailable');
      return null;
    }

    return new Promise((resolve) => {
      let resolved = false;

      const onSuccess = (position: GeolocationPosition) => {
        if (resolved) return;
        resolved = true;
        isRealGpsAcquiredRef.current = true;

        const newLat = Number(position.coords.latitude.toFixed(6));
        const newLng = Number(position.coords.longitude.toFixed(6));
        const newAcc = Math.round(position.coords.accuracy);
        lastCoordsRef.current = { lat: newLat, lng: newLng, accuracy: newAcc };

        const loc: UserLocation = {
          lat: newLat,
          lng: newLng,
          accuracy: newAcc,
          timestamp: position.timestamp,
          addressName: 'Locating nearby road…',
          heading: typeof position.coords.heading === 'number' && !isNaN(position.coords.heading) ? position.coords.heading : null,
          isRealGps: true,
          isAutoSynced: true
        };
        saveLocation(loc);
        setIsLoading(false);
        setError(null);
        setPermissionStatus('granted');
        startLiveTracking();
        void labelRoadForLocation(loc);
        resolve(loc);
      };

      const onError = (err: GeolocationPositionError) => {
        if (resolved) return;

        // Fallback to low accuracy / Wi-Fi positioning (instant on laptops & PCs)
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (err2) => {
            if (resolved) return;
            resolved = true;
            setIsLoading(false);
            if (err.code === err.PERMISSION_DENIED || err2.code === err2.PERMISSION_DENIED) {
              setPermissionStatus('denied');
            } else {
              setPermissionStatus('unavailable');
            }
            void fetchIpLocation().then(resolve);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      };

      // 20 second timeout to allow user to respond to permission dialog and GPS chip lock
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      });
    });
  }, [saveLocation, startLiveTracking, fetchIpLocation, labelRoadForLocation]);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Get a browser GPS fix on load. A network/IP result is used only after GPS
  // fails, so it can never masquerade as the road where the user is standing.
  useEffect(() => {
    requestLocation();

    // Monitor a later permission change, e.g. when it is enabled in browser settings.
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionStatus(result.state as any);
          result.onchange = () => {
            setPermissionStatus(result.state as any);
            if (result.state === 'granted') {
              startLiveTracking();
              requestLocation();
            }
          };
        })
        .catch(() => {
          // ignore
        });
    }
  }, [requestLocation, startLiveTracking]);

  const clearLocation = useCallback(() => {
    stopLiveTracking();
    isRealGpsAcquiredRef.current = false;
    saveLocation(null);
    setError(null);
  }, [saveLocation, stopLiveTracking]);

  const setManualLocation = useCallback((lat: number, lng: number, name = 'Selected Hub') => {
    stopLiveTracking();
    isRealGpsAcquiredRef.current = false;
    const loc: UserLocation = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      accuracy: 25,
      timestamp: Date.now(),
      addressName: name,
      isRealGps: false,
      isAutoSynced: false
    };
    saveLocation(loc);
    setError(null);
  }, [saveLocation, stopLiveTracking]);

  return {
    userLocation,
    isLoading,
    error,
    permissionStatus,
    isLiveTracking,
    requestLocation,
    startLiveTracking,
    stopLiveTracking,
    clearLocation,
    setManualLocation
  };
}
