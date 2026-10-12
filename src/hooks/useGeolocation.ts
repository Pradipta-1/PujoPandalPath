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
  accuracy: 100,
  timestamp: Date.now(),
  addressName: 'Live Location (Kolkata Central)'
};

export function useGeolocation(): UseGeolocationReturn {
  // 1. Instantly restore cached location at 0ms, or default to central Kolkata so location is never null
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() => {
    try {
      const saved = localStorage.getItem('pandalpath_user_loc');
      if (saved) return JSON.parse(saved);
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
  const hasAttemptedGps = useRef<boolean>(false);

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
        const loc: UserLocation = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp,
          addressName: 'Live Device GPS'
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
        timeout: 12000
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

  // Silent IP Geolocation Fallback (Works with 0 clicks and 0 permissions)
  const fetchIpLocation = useCallback(async () => {
    const apis = [
      { url: 'https://ipapi.co/json/', latKey: 'latitude', lngKey: 'longitude', cityKey: 'city' },
      { url: 'https://freeipapi.com/api/json', latKey: 'latitude', lngKey: 'longitude', cityKey: 'cityName' },
      { url: 'https://ipwho.is/', latKey: 'latitude', lngKey: 'longitude', cityKey: 'city' }
    ];

    for (const api of apis) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(api.url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const lat = data[api.latKey];
          const lng = data[api.lngKey];
          if (typeof lat === 'number' && typeof lng === 'number') {
            const cityName = data[api.cityKey] || 'Kolkata';
            const loc: UserLocation = {
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              accuracy: 600,
              timestamp: Date.now(),
              addressName: `${cityName} (Auto-synced)`
            };
            setUserLocation((prev) => {
              // Only apply if GPS hasn't already provided accurate device coordinates
              if (!prev || prev.addressName?.includes('Auto-synced') || prev.addressName?.includes('Default')) {
                saveLocation(loc);
                return loc;
              }
              return prev;
            });
            return;
          }
        }
      } catch {
        // Continue to next endpoint
      }
    }

    // Default to central Kolkata hub (Esplanade / Dharmatala) so user is immediately synced
    setUserLocation((prev) => {
      if (!prev) {
        const defaultLoc: UserLocation = {
          lat: 22.5645,
          lng: 88.3524,
          accuracy: 500,
          timestamp: Date.now(),
          addressName: 'Kolkata Central (Auto-synced)'
        };
        saveLocation(defaultLoc);
        return defaultLoc;
      }
      return prev;
    });
  }, [saveLocation]);

  // Request location with two-tier fallback: High accuracy GPS first, then Wi-Fi/IP fallback
  const requestLocation = useCallback(async (): Promise<UserLocation | null> => {
    if (!navigator.geolocation) {
      fetchIpLocation();
      setPermissionStatus('unavailable');
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      const onSuccess = (position: GeolocationPosition) => {
        const loc: UserLocation = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          timestamp: position.timestamp,
          addressName: 'Live Device GPS'
        };
        saveLocation(loc);
        setIsLoading(false);
        setPermissionStatus('granted');
        startLiveTracking();
        resolve(loc);
      };

      const onError = (err: GeolocationPositionError) => {
        // If high accuracy timed out on PC/Laptop without satellite GPS, retry with standard Wi-Fi
        if (err.code === err.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            () => {
              setIsLoading(false);
              setPermissionStatus('timeout');
              fetchIpLocation();
              resolve(null);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
          );
          return;
        }

        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionStatus('denied');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setPermissionStatus('unavailable');
        }
        // Seamlessly ensure user still has auto-synced location via IP fallback
        fetchIpLocation();
        resolve(null);
      };

      // Tier 1: High accuracy GPS request
      navigator.geolocation.getCurrentPosition(onSuccess, onError, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 10000
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
    if (hasAttemptedGps.current) return;
    hasAttemptedGps.current = true;

    // 1. If not cached, immediately trigger silent IP fallback so location is synced in <300ms
    if (!userLocation) {
      fetchIpLocation();
    }

    // 2. Immediately trigger live device GPS synchronization (silent if permission granted)
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
  }, [requestLocation, startLiveTracking, fetchIpLocation, userLocation]);

  const clearLocation = useCallback(() => {
    stopLiveTracking();
    saveLocation(null);
    setError(null);
  }, [saveLocation, stopLiveTracking]);

  const setManualLocation = useCallback((lat: number, lng: number, name = 'Selected Hub') => {
    stopLiveTracking();
    const loc: UserLocation = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      accuracy: 25,
      timestamp: Date.now(),
      addressName: name
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
