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

export const DEFAULT_STARTING_LOCATION: UserLocation = {
  lat: 22.5645,
  lng: 88.3524,
  accuracy: 1000,
  timestamp: Date.now(),
  addressName: 'Kolkata Central (Esplanade)',
  isRealGps: false,
  isAutoSynced: false
};

export function useGeolocation(): UseGeolocationReturn {
  // 1. Instantly restore valid cached location if available, or start with default
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
    return DEFAULT_STARTING_LOCATION;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<UseGeolocationReturn['permissionStatus']>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const isRealGpsAcquiredRef = useRef<boolean>(false);
  const lastCoordsRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);

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
          addressName: 'Live Device GPS',
          heading: typeof position.coords.heading === 'number' && !isNaN(position.coords.heading) ? position.coords.heading : null,
          isRealGps: true,
          isAutoSynced: true
        };
        saveLocation(loc);
        setError(null);
        setPermissionStatus('granted');
      },
      (err) => {
        console.warn('Live watch position update notice:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  }, [saveLocation]);

  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);
  }, []);

  // Instant Parallel Network/IP Geolocation Fallback (<300ms, 0 permissions required)
  const fetchIpLocation = useCallback(async () => {
    if (isRealGpsAcquiredRef.current) return;

    const apis = [
      { url: 'https://ipwho.is/', latKey: 'latitude', lngKey: 'longitude', cityKey: 'city' },
      { url: 'https://freeipapi.com/api/json', latKey: 'latitude', lngKey: 'longitude', cityKey: 'cityName' },
      { url: 'https://ipapi.co/json/', latKey: 'latitude', lngKey: 'longitude', cityKey: 'city' }
    ];

    for (const api of apis) {
      if (isRealGpsAcquiredRef.current) return;
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
            if (isRealGpsAcquiredRef.current) return;
            // Only accept IP coordinates if they are in the Greater Kolkata / West Bengal area
            const isNearKolkata = lat >= 21.5 && lat <= 24.5 && lng >= 87.0 && lng <= 89.5;
            const cityName = data[api.cityKey] || 'Kolkata';
            const loc: UserLocation = {
              lat: isNearKolkata ? Number(lat.toFixed(6)) : 22.5645,
              lng: isNearKolkata ? Number(lng.toFixed(6)) : 88.3524,
              accuracy: isNearKolkata ? 450 : 1000,
              timestamp: Date.now(),
              addressName: isNearKolkata ? `${cityName} (Auto-synced)` : 'Kolkata Central (Esplanade)',
              isRealGps: false,
              isAutoSynced: true
            };
            saveLocation(loc);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Continue to next endpoint
      }
    }
  }, [saveLocation]);

  // Request location with resilient multi-tier fallback: High accuracy GPS, then Wi-Fi, then IP
  const requestLocation = useCallback(async (): Promise<UserLocation | null> => {
    setIsLoading(true);
    setError(null);

    // Trigger fast IP fallback in parallel if real GPS is not yet acquired
    if (!isRealGpsAcquiredRef.current) {
      fetchIpLocation();
    }

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

        const loc: UserLocation = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp,
          addressName: 'Live Device GPS',
          heading: typeof position.coords.heading === 'number' && !isNaN(position.coords.heading) ? position.coords.heading : null,
          isRealGps: true,
          isAutoSynced: true
        };
        saveLocation(loc);
        setIsLoading(false);
        setError(null);
        setPermissionStatus('granted');
        startLiveTracking();
        resolve(loc);
      };

      const onError = (err: GeolocationPositionError) => {
        if (resolved) return;

        // Fast fallback to low accuracy / Wi-Fi positioning (instant on laptops & PCs)
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
            fetchIpLocation();
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      };

      // Try high accuracy with a 4s timeout so laptops/PCs don't hang
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 4000,
        maximumAge: 15000
      });
    });
  }, [saveLocation, startLiveTracking, fetchIpLocation]);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Instant Auto-Sync on Website Load (Zero Clicks)
  useEffect(() => {
    // 1. Immediately trigger fast parallel IP auto-sync (<300ms)
    fetchIpLocation();

    // 2. Immediately trigger live device GPS synchronization
    requestLocation().then((loc) => {
      if (loc) {
        startLiveTracking();
      }
    });

    // 3. Monitor browser permission state
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionStatus(result.state as any);
          if (result.state === 'granted') {
            startLiveTracking();
          }
          result.onchange = () => {
            setPermissionStatus(result.state as any);
            if (result.state === 'granted') {
              requestLocation();
              startLiveTracking();
            }
          };
        })
        .catch(() => {
          // ignore
        });
    }
  }, [requestLocation, startLiveTracking, fetchIpLocation]);

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
