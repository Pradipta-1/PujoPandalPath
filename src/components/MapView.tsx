import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { Pandal, UserLocation, CalculatedRoute } from '../types/pandal';
import { Compass, Crosshair, ZoomIn, ZoomOut, Layers } from 'lucide-react';

interface MapViewProps {
  pandals: Pandal[];
  selectedPandal: Pandal | null;
  onSelectPandal: (pandal: Pandal) => void;
  userLocation: UserLocation | null;
  activeRoute: CalculatedRoute | null;
  onRequestLocation?: () => void;
  className?: string;
}

// Cached DivIcons to eliminate constant DOM allocation & memory churn
function createPandalIcon(isSelected: boolean, hasCaution: boolean): L.DivIcon {
  const pinColor = isSelected ? '#d90429' : '#0b132b';
  const strokeColor = isSelected ? '#ffd166' : '#e9c46a';

  const html = `
    <div class="festive-pin ${isSelected ? 'festive-pin-active' : ''}" style="cursor: pointer; will-change: transform;">
      <div style="
        position: relative;
        width: 38px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg viewBox="0 0 38 48" width="38" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 0C8.5 0 0 8.5 0 19C0 31.5 19 48 19 48C19 48 38 31.5 38 19C38 8.5 29.5 0 19 0Z" 
            fill="${pinColor}" 
            stroke="${strokeColor}" 
            stroke-width="2.5" 
            filter="drop-shadow(0 4px 8px rgba(0,0,0,0.7))"
          />
          <circle cx="19" cy="18" r="13" fill="${isSelected ? '#8b0517' : '#141f3d'}" />
          <!-- Durga Trishul Motif in Radiant Gold -->
          <path d="M19 8V26M13 13Q19 19 19 19Q19 19 25 13" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="19" cy="10" r="1.8" fill="#ffd166"/>
        </svg>
        ${
          hasCaution
            ? `<span style="position:absolute; top:-2px; right:-2px; background:#f59e0b; color:#000; font-size:10px; font-weight:900; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border:1.5px solid #fff; box-shadow:0 0 8px rgba(245,158,11,0.8);">!</span>`
            : ''
        }
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-pandal-icon',
    iconSize: [38, 48],
    iconAnchor: [19, 48],
    popupAnchor: [0, -48]
  });
}

const iconCache = new Map<string, L.DivIcon>();
function getPandalIcon(isSelected: boolean, hasCaution: boolean): L.DivIcon {
  const key = `${isSelected ? '1' : '0'}_${hasCaution ? '1' : '0'}`;
  let icon = iconCache.get(key);
  if (!icon) {
    icon = createPandalIcon(isSelected, hasCaution);
    iconCache.set(key, icon);
  }
  return icon;
}

function generatePopupContent(pandal: Pandal, userLocation: UserLocation | null): string {
  const gmapsWalkUrl = (userLocation && pandal.latitude && pandal.longitude)
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${pandal.latitude},${pandal.longitude}&travelmode=walking`
    : (pandal.google_maps_search_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pandal.name + ' Durga Puja Kolkata')}`);

  return `
    <div style="min-width: 230px; max-width: 280px; padding: 4px; background: #0b132b; color: #f8fafc; border-radius: 12px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
        <span style="font-size: 11px; font-weight: 700; color: #e9c46a; text-transform: uppercase; letter-spacing: 0.5px;">
          ${pandal.area_division}
        </span>
        <span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 7px; border-radius: 999px; font-weight: 700; border: 1px solid rgba(52, 211, 153, 0.3);">
          ✓ Verified Pin
        </span>
      </div>
      <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 800; color: #ffffff; line-height: 1.3;">
        ${pandal.name}
      </h4>
      <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 8px; line-height: 1.4;">
        <div style="margin-bottom: 3px;">🚇 Metro: <strong style="color: #f1f5f9;">${pandal.nearest_metro}</strong></div>
        <div>🚶 Metro Walk: <strong style="color: #fde047;">${pandal.estimated_walking_distance_raw || 'N/A'}</strong></div>
        ${pandal.distance_from_user_km != null ? `
        <div style="margin-top: 6px; padding: 5px 8px; background: rgba(14, 165, 233, 0.18); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; color: #e0f2fe;">
          <span style="font-weight: 800; color: #38bdf8; font-size: 11px; display: flex; align-items: center; gap: 4px;">
            📍 Live GPS Walk: <span style="color: #ffffff; font-size: 12px;">${pandal.distance_from_user_km < 1 ? Math.round(pandal.distance_from_user_km * 1000) + ' m' : pandal.distance_from_user_km.toFixed(2) + ' km'}</span>
          </span>
          <span style="color: #bae6fd; font-size: 11px; font-weight: 700; background: rgba(2, 132, 199, 0.4); padding: 1px 6px; border-radius: 4px;">
            ~${pandal.walking_duration_mins || Math.max(1, Math.round(pandal.distance_from_user_km * 15))} min
          </span>
        </div>` : ''}
      </div>
      ${
        pandal.notes
          ? `<div style="font-size: 11px; color: #94a3b8; font-style: italic; margin-bottom: 8px; border-left: 2px solid #e9c46a; padding-left: 6px;">
              ${pandal.notes}
            </div>`
          : ''
      }
      <div style="display: flex; gap: 6px;">
        <button id="popup-select-${pandal.id}" style="
          flex: 1;
          background: linear-gradient(135deg, #d90429, #9b111e);
          color: #ffffff;
          border: 1px solid rgba(233, 196, 106, 0.4);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        ">
          Select Pandal
        </button>
        <a href="${gmapsWalkUrl}" target="_blank" rel="noopener noreferrer" style="
          background: rgba(14, 165, 233, 0.25);
          color: #7dd3fc;
          border: 1px solid rgba(56, 189, 248, 0.4);
          text-decoration: none;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
        ">
          🚶 Walk ↗
        </a>
      </div>
    </div>
  `;
}

function getCardinalDirection(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

export const MapView: React.FC<MapViewProps> = ({
  pandals,
  selectedPandal,
  onSelectPandal,
  userLocation,
  activeRoute,
  onRequestLocation,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const hasAutoCenteredUserRef = useRef<boolean>(false);
  const hasCenteredRealGpsRef = useRef<boolean>(false);
  const currentHeadingAngleRef = useRef<number>(0);
  const targetHeadingAngleRef = useRef<number>(0);
  const hasHeadingSensorRef = useRef<boolean>(false);
  const isHeadingInitializedRef = useRef<boolean>(false);

  // Active Map state ensuring markers and location layers bind cleanly upon initialization & remount
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Sets target heading angle for ultra-smooth 60/120fps hardware-accelerated interpolation
  const applyHeadingRotation = (headingDeg: number) => {
    targetHeadingAngleRef.current = ((headingDeg % 360) + 360) % 360;
    hasHeadingSensorRef.current = true;
    if (!isHeadingInitializedRef.current) {
      currentHeadingAngleRef.current = targetHeadingAngleRef.current;
      isHeadingInitializedRef.current = true;
      const coneEl = document.querySelector('.user-heading-cone') as HTMLElement | null;
      if (coneEl) {
        coneEl.style.transform = `rotate(${currentHeadingAngleRef.current}deg)`;
        coneEl.style.opacity = '1';
      }
    }
  };

  // Triggers compass sensor permissions on iOS Safari 13+ upon user gesture
  const requestCompassPermission = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          hasHeadingSensorRef.current = true;
        }
      } catch (err) {
        console.warn('Compass permission notice:', err);
      }
    }
  };

  // 3D Tilt-compensated compass heading calculator for mobile devices held at natural viewing angles
  const computeTiltCompensatedHeading = (alpha: number, beta: number, gamma: number): number => {
    const deg2rad = Math.PI / 180;
    const x = (beta || 0) * deg2rad; // Pitch
    const y = (gamma || 0) * deg2rad; // Roll
    const z = (alpha || 0) * deg2rad; // Yaw

    const cX = Math.cos(x);
    const cZ = Math.cos(z);
    const sX = Math.sin(x);
    const sY = Math.sin(y);
    const sZ = Math.sin(z);

    // Vector pointing out of the TOP of the device in world coordinates
    const vEast = -cZ * sY * sX - sZ * cX;
    const vNorth = -sZ * sY * sX + cZ * cX;

    let compass = Math.atan2(vEast, vNorth) * (180 / Math.PI);
    return ((compass % 360) + 360) % 360;
  };

  // 60fps/120fps requestAnimationFrame continuous damping loop for zero-lag, jitter-free spotlight rotation
  useEffect(() => {
    let animId: number;

    const animateCone = () => {
      const coneEl = document.querySelector('.user-heading-cone') as HTMLElement | null;
      if (coneEl && isHeadingInitializedRef.current) {
        const target = targetHeadingAngleRef.current;
        let current = ((currentHeadingAngleRef.current % 360) + 360) % 360;

        let diff = target - current;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;

        // Filter out micro-jitter from handheld sensor noise when stationary
        if (Math.abs(diff) > 0.15) {
          const absDiff = Math.abs(diff);
          // Dynamic critically-damped lerp factor: snappy during fast turns, silky smooth during subtle rotation
          const factor = absDiff > 45 ? 0.35 : absDiff > 15 ? 0.24 : 0.16;
          currentHeadingAngleRef.current += diff * factor;
          coneEl.style.transform = `rotate(${currentHeadingAngleRef.current}deg)`;
          coneEl.style.opacity = '1';
        }
      }
      animId = requestAnimationFrame(animateCone);
    };

    animId = requestAnimationFrame(animateCone);
    return () => cancelAnimationFrame(animId);
  }, []);

  // One-time user gesture trigger for iOS Safari compass permission
  useEffect(() => {
    const handleFirstGesture = () => {
      requestCompassPermission();
    };
    window.addEventListener('touchstart', handleFirstGesture, { once: true, passive: true });
    window.addEventListener('click', handleFirstGesture, { once: true, passive: true });
    return () => {
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
    };
  }, []);

  // Real-time device orientation & compass head-direction listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;

      // 1. iOS Safari native compass heading (0 = North)
      if (typeof (e as any).webkitCompassHeading === 'number') {
        heading = (e as any).webkitCompassHeading;
      }
      // 2. Android Chrome / standard orientation
      else if (e.alpha !== null && !isNaN(e.alpha)) {
        if (e.beta !== null && e.gamma !== null && Math.abs(e.beta) > 8) {
          heading = computeTiltCompensatedHeading(e.alpha, e.beta, e.gamma);
        } else {
          heading = (360 - e.alpha) % 360;
        }
      }

      if (heading !== null && !isNaN(heading)) {
        const screenAngle = (window.screen?.orientation?.angle) || (window.orientation as number) || 0;
        const trueHeading = (heading + screenAngle) % 360;
        applyHeadingRotation(trueHeading);
      }
    };

    let listeningAbsolute = false;
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation as any, { passive: true });
      listeningAbsolute = true;
    }
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });

    return () => {
      if (listeningAbsolute) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation as any);
      }
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);
  
  // Default to 100% PURE WATERMARK-FREE DARK MAP (No API keys needed)
  const [mapStyle, setMapStyle] = React.useState<'osm-dark' | 'esri-satellite' | 'osm-standard'>('osm-dark');

  // Initialize Map with bulletproof container validation
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if container was already initialized by Leaflet (e.g. React StrictMode or re-mount)
    const container = mapContainerRef.current as any;
    if (container._leaflet_id && mapRef.current) {
      mapRef.current.invalidateSize();
      return;
    }
    if (container._leaflet_id && !mapRef.current) {
      delete container._leaflet_id;
    }

    const map = L.map(container, {
      center: [22.56, 88.36],
      zoom: 12,
      zoomControl: false,
      attributionControl: true
    });

    // 100% Watermark-free OpenStreetMap base tiles (darkened seamlessly by .dark-map-tiles)
    const tileLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }
    ).addTo(map);

    tileLayerRef.current = tileLayer;

    // Resilient Marker Group: use MarkerClusterGroup if available, or native L.featureGroup
    let clusterGroup: any;
    if (typeof (L as any).markerClusterGroup === 'function') {
      try {
        clusterGroup = (L as any).markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 45,
          spiderfyOnMaxZoom: true,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            let sizeClass = 'marker-cluster-small';
            let size = 38;
            if (count > 10) {
              sizeClass = 'marker-cluster-medium';
              size = 46;
            }
            if (count > 25) {
              sizeClass = 'marker-cluster-large';
              size = 54;
            }
            return L.divIcon({
              html: `<div><span>${count}</span></div>`,
              className: `marker-cluster ${sizeClass}`,
              iconSize: L.point(size, size)
            });
          }
        });
      } catch (err) {
        console.warn('MarkerClusterGroup initialization warning; falling back to L.featureGroup', err);
        clusterGroup = L.featureGroup();
      }
    } else {
      clusterGroup = L.featureGroup();
    }

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
    mapRef.current = map;
    setMapInstance(map);

    // Multi-stage size recalculation so tiles never stay blank or grey
    const invalidate = () => {
      try {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      } catch {
        // ignore
      }
    };

    invalidate();
    requestAnimationFrame(invalidate);
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 300);
    const t3 = setTimeout(invalidate, 800);
    const t4 = setTimeout(invalidate, 1500);

    const handleResize = () => {
      invalidate();
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      invalidate();
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (clusterGroupRef.current) {
        try {
          clusterGroupRef.current.clearLayers();
        } catch {
          // ignore
        }
        clusterGroupRef.current = null;
      }
      markersMapRef.current.clear();
      userMarkerRef.current = null;
      userCircleRef.current = null;
      routePolylineRef.current = null;
      tileLayerRef.current = null;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore
        }
        mapRef.current = null;
      }
      setMapInstance(null);
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Map Tile Switcher (100% Free, Zero Watermarks, Zero API Keys)
  useEffect(() => {
    const map = mapInstance || mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch {
        // ignore
      }
    }

    let url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    if (mapStyle === 'esri-satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri, Maxar, Earthstar Geographics';
    } else if (mapStyle === 'osm-standard') {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    }

    const newLayer = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(map);
    tileLayerRef.current = newLayer;
  }, [mapInstance, mapStyle]);

  const onSelectPandalRef = useRef(onSelectPandal);
  useEffect(() => {
    onSelectPandalRef.current = onSelectPandal;
  }, [onSelectPandal]);

  const userLocationRef = useRef(userLocation);
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const selectedPandalRef = useRef(selectedPandal);
  useEffect(() => {
    selectedPandalRef.current = selectedPandal;
  }, [selectedPandal]);

  const prevSelectedIdRef = useRef<string | null>(null);

  // Update Pandal Markers with high-performance delta reconciliation
  useEffect(() => {
    const map = mapInstance || mapRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    // Defensive check: if markersMapRef has entries but clusterGroup is empty (e.g. fresh map mount), clear map
    if (markersMapRef.current.size > 0 && clusterGroup.getLayers().length === 0) {
      markersMapRef.current.clear();
    }

    const verifiedPandals = pandals.filter(
      (p) => p.location_verified && p.latitude != null && p.longitude != null
    );
    const nextIds = new Set(verifiedPandals.map((p) => p.id));

    // Remove only markers that are no longer in pandals
    const toRemove: L.Marker[] = [];
    markersMapRef.current.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        toRemove.push(marker);
        markersMapRef.current.delete(id);
      }
    });

    if (toRemove.length > 0) {
      if (typeof clusterGroup.removeLayers === 'function') {
        clusterGroup.removeLayers(toRemove);
      } else {
        toRemove.forEach((m) => clusterGroup.removeLayer(m));
      }
    }

    // Add only new markers that don't already exist
    const toAdd: L.Marker[] = [];
    verifiedPandals.forEach((pandal) => {
      let marker = markersMapRef.current.get(pandal.id);
      if (!marker) {
        const isSelected = selectedPandalRef.current?.id === pandal.id;
        const icon = getPandalIcon(isSelected, !!pandal.has_caution);
        marker = L.marker([pandal.latitude!, pandal.longitude!], {
          icon,
          title: pandal.name
        });

        marker.bindPopup(() => generatePopupContent(pandal, userLocationRef.current), {
          closeButton: true,
          className: 'dark-festive-popup'
        });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`popup-select-${pandal.id}`);
          if (btn) {
            btn.onclick = () => onSelectPandalRef.current(pandal);
          }
        });

        marker.on('click', () => {
          onSelectPandalRef.current(pandal);
        });

        markersMapRef.current.set(pandal.id, marker);
        toAdd.push(marker);
      }
    });

    if (toAdd.length > 0) {
      if (typeof clusterGroup.addLayers === 'function') {
        clusterGroup.addLayers(toAdd);
      } else {
        toAdd.forEach((m) => clusterGroup.addLayer(m));
      }
    }
  }, [mapInstance, pandals]);

  // Instantaneous Selected Pandal Pan & Icon Switch (0ms overhead)
  useEffect(() => {
    const map = mapInstance || mapRef.current;
    if (!map) return;
    const prevId = prevSelectedIdRef.current;
    const currentId = selectedPandal?.id || null;
    prevSelectedIdRef.current = currentId;

    if (prevId && prevId !== currentId) {
      const prevMarker = markersMapRef.current.get(prevId);
      const prevPandal = pandals.find((p) => p.id === prevId);
      if (prevMarker && prevPandal) {
        prevMarker.setIcon(getPandalIcon(false, !!prevPandal.has_caution));
      }
    }

    if (currentId && selectedPandal) {
      const currMarker = markersMapRef.current.get(currentId);
      if (currMarker) {
        currMarker.setIcon(getPandalIcon(true, !!selectedPandal.has_caution));
        if (selectedPandal.location_verified && selectedPandal.latitude && selectedPandal.longitude) {
          map.setView([selectedPandal.latitude, selectedPandal.longitude], 15, {
            animate: true,
            duration: 0.5
          });
          setTimeout(() => {
            if (currMarker.isPopupOpen && !currMarker.isPopupOpen()) {
              currMarker.openPopup();
            }
          }, 300);
        }
      }
    }
  }, [mapInstance, selectedPandal, pandals]);

  // Smooth User Location Marker & Accuracy Circle (re-uses existing layers)
  useEffect(() => {
    const map = mapInstance || mapRef.current;
    if (!map) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        try {
          map.removeLayer(userMarkerRef.current);
        } catch {
          // ignore
        }
        userMarkerRef.current = null;
      }
      if (userCircleRef.current) {
        try {
          map.removeLayer(userCircleRef.current);
        } catch {
          // ignore
        }
        userCircleRef.current = null;
      }
      return;
    }

    // Defensive check: if existing marker/circle does not belong to the current map, reset them
    if (userMarkerRef.current && !map.hasLayer(userMarkerRef.current)) {
      userMarkerRef.current = null;
    }
    if (userCircleRef.current && !map.hasLayer(userCircleRef.current)) {
      userCircleRef.current = null;
    }

    const accuracyRadius = Math.min(Math.max(userLocation.accuracy || 25, 20), 400);

    // If marker and circle already exist on the current map, smoothly update coordinates without DOM recreation!
    if (userMarkerRef.current && userCircleRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      userCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      userCircleRef.current.setRadius(accuracyRadius);
      if (typeof userLocation.heading === 'number' && !hasHeadingSensorRef.current) {
        applyHeadingRotation(userLocation.heading);
      }

      // Smoothly re-center map if upgraded to real device GPS
      if (userLocation.isRealGps && !hasCenteredRealGpsRef.current && !selectedPandal) {
        hasCenteredRealGpsRef.current = true;
        map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 0.9 });
      }
      return;
    }

    // Auto-center map on user's location once upon initial synchronization
    if (!hasAutoCenteredUserRef.current && !selectedPandal) {
      hasAutoCenteredUserRef.current = true;
      if (userLocation.isRealGps) {
        hasCenteredRealGpsRef.current = true;
      }
      map.setView([userLocation.lat, userLocation.lng], 14, {
        animate: true,
        duration: 0.8
      });
    }

    // Google Maps Style Directional Heading Spotlight Beam Cone + Centered Blue Dot
    const userHtml = `
      <div class="user-marker-container" style="position: relative; width: 120px; height: 120px; pointer-events: none;">
        <!-- Directional Spotlight Beam Cone (pointing in the user's facing direction) -->
        <div class="user-heading-cone" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 120px;
          height: 120px;
          transform-origin: 60px 60px;
          transform: rotate(0deg);
          will-change: transform;
          pointer-events: none;
        ">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="userHeadingBeamGrad" cx="60" cy="60" r="56" fx="60" fy="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
                <stop offset="25%" stop-color="#0ea5e9" stop-opacity="0.6" />
                <stop offset="60%" stop-color="#0284c7" stop-opacity="0.25" />
                <stop offset="85%" stop-color="#0284c7" stop-opacity="0.08" />
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="userHeadingBeamCore" cx="60" cy="60" r="34" fx="60" fy="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#bae6fd" stop-opacity="0.8" />
                <stop offset="45%" stop-color="#38bdf8" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
              </radialGradient>
            </defs>
            <!-- 60° Directional Beam Sector (Pure spotlight beam, no arrows) -->
            <path d="M 60 60 L 32 11.5 A 56 56 0 0 1 88 11.5 Z" fill="url(#userHeadingBeamGrad)" filter="drop-shadow(0 -2px 10px rgba(56, 189, 248, 0.55))" />
            <!-- Inner luminous core for realistic flashlight beam depth -->
            <path d="M 60 60 L 43 30.5 A 34 34 0 0 1 77 30.5 Z" fill="url(#userHeadingBeamCore)" />
          </svg>
        </div>

        <!-- Central Google Maps Blue Location Dot with White Ring -->
        <div style="position: absolute; top: 48px; left: 48px; width: 24px; height: 24px; pointer-events: auto; cursor: pointer;">
          <div class="user-location-pulse">
            <div class="pulse-wave"></div>
            <div class="pulse-core"></div>
          </div>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'user-marker-icon',
      iconSize: [120, 120],
      iconAnchor: [60, 60],
      popupAnchor: [0, -32]
    });

    const uMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1200
    }).addTo(map);

    uMarker.on('click', () => {
      requestCompassPermission();
    });

    const uCircle = L.circle([userLocation.lat, userLocation.lng], {
      radius: accuracyRadius,
      color: '#38bdf8',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#0284c7',
      fillOpacity: 0.12,
      interactive: false
    }).addTo(map);

    uMarker.bindPopup(() => {
      const headingDeg = Math.round(((currentHeadingAngleRef.current % 360) + 360) % 360);
      const cardinal = getCardinalDirection(headingDeg);
      return `
        <div style="padding: 6px; font-size: 12px; color: #ffffff; background: #0b132b; border-radius: 8px;">
          <strong style="color: #38bdf8; display: block; margin-bottom: 3px;">📍 Your Live GPS Location</strong>
          <div style="color: #e2e8f0; font-size: 11px;">
            ${userLocationRef.current?.addressName || 'Position acquired'}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; padding: 4px 8px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 6px;">
            <span style="color: #7dd3fc; font-weight: 700; font-size: 11px;">🧭 Facing Direction:</span>
            <span style="color: #ffffff; font-weight: 800; font-size: 11px;">${headingDeg}° (${cardinal})</span>
          </div>
          <div style="color: #94a3b8; font-size: 10px; margin-top: 4px;">
            Accuracy: ±${Math.round(userLocationRef.current?.accuracy || 15)}m • Google Maps Direction Beam
          </div>
        </div>
      `;
    });

    userMarkerRef.current = uMarker;
    userCircleRef.current = uCircle;

    if (typeof userLocation.heading === 'number' && !hasHeadingSensorRef.current) {
      applyHeadingRotation(userLocation.heading);
    }
  }, [mapInstance, userLocation]);

  // Handle Route Polyline
  useEffect(() => {
    const map = mapInstance || mapRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      try {
        map.removeLayer(routePolylineRef.current);
      } catch {
        // ignore
      }
      routePolylineRef.current = null;
    }

    if (activeRoute && activeRoute.coordinates.length > 0) {
      const polyline = L.polyline(activeRoute.coordinates, {
        color: '#e63946',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: activeRoute.provider === 'haversine-direct' ? '8, 8' : undefined
      }).addTo(map);

      routePolylineRef.current = polyline;

      const bounds = polyline.getBounds();
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [mapInstance, activeRoute]);

  const fitAllMarkers = () => {
    const map = mapInstance || mapRef.current;
    if (!map) return;

    const verified = pandals.filter(
      (p) => p.location_verified && p.latitude != null && p.longitude != null
    );
    if (verified.length === 0) return;

    const latLngs: L.LatLngExpression[] = verified.map((p) => [p.latitude!, p.longitude!]);
    if (userLocation) {
      latLngs.push([userLocation.lat, userLocation.lng]);
    }
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14, animate: true });
  };

  const centerOnUser = () => {
    requestCompassPermission();
    const map = mapInstance || mapRef.current;
    if (userLocation && map) {
      map.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
    } else if (onRequestLocation) {
      onRequestLocation();
    }
  };

  return (
    <div
      style={{ isolation: 'isolate' }}
      className={`relative w-full h-full min-h-[380px] overflow-hidden ${className}`}
    >
      {/* Real Leaflet Map DOM Container */}
      <div 
        ref={mapContainerRef} 
        className={`w-full h-full min-h-[380px] ${mapStyle === 'osm-dark' ? 'dark-map-tiles' : ''}`}
        style={{ width: '100%', height: '100%', minHeight: '380px' }}
      />

      {/* Floating Map Controls in Dark Theme */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          onClick={fitAllMarkers}
          title="Fit all pandals on map"
          className="p-2.5 bg-darkBg-800/90 hover:bg-darkBg-700 text-festiveGold-400 border border-festiveGold-500/30 rounded-xl shadow-dark-card backdrop-blur-md transition-all active:scale-95 flex items-center justify-center"
        >
          <Compass className="w-5 h-5 text-festiveGold-400" />
        </button>

        <button
          onClick={centerOnUser}
          title={userLocation ? 'Center on My Location & Compass' : 'Locate My Position'}
          className="p-2.5 bg-darkBg-800/90 hover:bg-darkBg-700 text-sky-400 border border-sky-500/30 rounded-xl shadow-dark-card backdrop-blur-md transition-all active:scale-95 flex items-center justify-center"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            const next =
              mapStyle === 'osm-dark'
                ? 'esri-satellite'
                : mapStyle === 'esri-satellite'
                ? 'osm-standard'
                : 'osm-dark';
            setMapStyle(next);
          }}
          title={`Switch Map Style (Current: ${mapStyle === 'osm-dark' ? 'Midnight Dark' : mapStyle === 'esri-satellite' ? 'Satellite View' : 'Standard Street View'})`}
          className="p-2.5 bg-darkBg-800/90 hover:bg-darkBg-700 text-slate-200 border border-slate-700 rounded-xl shadow-dark-card backdrop-blur-md transition-all active:scale-95 flex items-center justify-center"
        >
          <Layers className="w-5 h-5" />
        </button>

        <div className="flex flex-col bg-darkBg-800/90 border border-slate-700 rounded-xl shadow-dark-card backdrop-blur-md overflow-hidden">
          <button
            onClick={() => (mapInstance || mapRef.current)?.zoomIn()}
            title="Zoom In"
            className="p-2 hover:bg-darkBg-700 text-white transition-colors flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-700" />
          <button
            onClick={() => (mapInstance || mapRef.current)?.zoomOut()}
            title="Zoom Out"
            className="p-2 hover:bg-darkBg-700 text-white transition-colors flex items-center justify-center"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend Badge Bottom Left in Dark Theme */}
      <div className="hidden sm:flex absolute bottom-3 left-3 z-20 items-center gap-3 bg-darkBg-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-festiveGold-500/30 shadow-dark-card text-xs text-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-festiveRed-600 border border-festiveGold-400"></span>
          <span className="font-semibold text-festiveGold-400">Verified Pandal</span>
        </div>
        <div className="w-px h-3 bg-slate-700"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-white"></span>
          <span className="font-semibold text-sky-300">You (Facing Direction Beam)</span>
        </div>
      </div>
    </div>
  );
};
