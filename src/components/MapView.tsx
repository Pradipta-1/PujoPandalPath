import React, { useEffect, useRef } from 'react';
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
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Map Tile Switcher (100% Free, Zero Watermarks, Zero API Keys)
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
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

    const newLayer = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(mapRef.current);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Update Pandal Markers
  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    markersMapRef.current.clear();

    const verifiedPandals = pandals.filter(
      (p) => p.location_verified && p.latitude != null && p.longitude != null
    );

    verifiedPandals.forEach((pandal) => {
      const isSelected = selectedPandal?.id === pandal.id;

      // Pure Dark Festive Glowing Pin
      const pinColor = isSelected ? '#d90429' : '#0b132b';
      const strokeColor = isSelected ? '#ffd166' : '#e9c46a';

      const pinHtml = `
        <div class="festive-pin ${isSelected ? 'festive-pin-active' : ''}" style="cursor: pointer;">
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
              pandal.has_caution
                ? `<span style="position:absolute; top:-2px; right:-2px; background:#f59e0b; color:#000; font-size:10px; font-weight:900; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; border:1.5px solid #fff; box-shadow:0 0 8px rgba(245,158,11,0.8);">!</span>`
                : ''
            }
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: 'custom-pandal-icon',
        iconSize: [38, 48],
        iconAnchor: [19, 48],
        popupAnchor: [0, -48]
      });

      const marker = L.marker([pandal.latitude!, pandal.longitude!], {
        icon: customIcon,
        title: pandal.name
      });

      // Navigation & Walking Directions URL
      const gmapsWalkUrl = (userLocation && pandal.latitude && pandal.longitude)
        ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${pandal.latitude},${pandal.longitude}&travelmode=walking`
        : (pandal.google_maps_search_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pandal.name + ' Durga Puja Kolkata')}`);

      // Pure Dark Popup Content with Live GPS Walking Distance
      const popupContent = `
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

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'dark-festive-popup'
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-select-${pandal.id}`);
        if (btn) {
          btn.onclick = () => onSelectPandal(pandal);
        }
      });

      marker.on('click', () => {
        onSelectPandal(pandal);
      });

      clusterGroup.addLayer(marker);
      markersMapRef.current.set(pandal.id, marker);
    });
  }, [pandals, onSelectPandal, userLocation]);

  // Handle selected pandal pan and popup open
  useEffect(() => {
    if (!mapRef.current || !selectedPandal) return;
    if (!selectedPandal.location_verified || !selectedPandal.latitude || !selectedPandal.longitude) return;

    const marker = markersMapRef.current.get(selectedPandal.id);
    if (marker) {
      mapRef.current.setView([selectedPandal.latitude, selectedPandal.longitude], 15, {
        animate: true,
        duration: 0.6
      });
      setTimeout(() => {
        marker.openPopup();
      }, 350);
    }
  }, [selectedPandal]);

  // Handle User Location Marker & Accuracy Circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userCircleRef.current) {
      map.removeLayer(userCircleRef.current);
      userCircleRef.current = null;
    }

    if (userLocation) {
      // Auto-center map on user's location once upon initial synchronization
      if (!hasAutoCenteredUserRef.current && !selectedPandal) {
        hasAutoCenteredUserRef.current = true;
        map.setView([userLocation.lat, userLocation.lng], 14, {
          animate: true,
          duration: 0.8
        });
      }

      const userHtml = `
        <div class="user-location-pulse" title="Your Current Location (${userLocation.addressName || 'Live'})">
          <div class="pulse-wave"></div>
          <div class="pulse-core"></div>
        </div>
      `;
      const userIcon = L.divIcon({
        html: userHtml,
        className: 'user-marker-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const uMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1200
      }).addTo(map);

      // Add accuracy radius indicator (clamped to realistic display size)
      const accuracyRadius = Math.min(Math.max(userLocation.accuracy || 25, 20), 400);
      const uCircle = L.circle([userLocation.lat, userLocation.lng], {
        radius: accuracyRadius,
        color: '#38bdf8',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#0284c7',
        fillOpacity: 0.12,
        interactive: false
      }).addTo(map);
      userCircleRef.current = uCircle;

      uMarker.bindPopup(`
        <div style="padding: 6px; font-size: 12px; color: #ffffff; background: #0b132b; border-radius: 8px;">
          <strong style="color: #38bdf8; display: block; margin-bottom: 2px;">📍 Your Live GPS Location</strong>
          <div style="color: #e2e8f0; font-size: 11px;">
            ${userLocation.addressName || 'Position acquired'}
          </div>
          <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">
            Accuracy: ±${Math.round(userLocation.accuracy || 15)}m • Real-time
          </div>
        </div>
      `);

      userMarkerRef.current = uMarker;
    }
  }, [userLocation]);

  // Handle Route Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
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
  }, [activeRoute]);

  const fitAllMarkers = () => {
    const map = mapRef.current;
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
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
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
          title={userLocation ? 'Center on My Location' : 'Locate My Position'}
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
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom In"
            className="p-2 hover:bg-darkBg-700 text-white transition-colors flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-700" />
          <button
            onClick={() => mapRef.current?.zoomOut()}
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
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
          <span className="font-semibold text-sky-300">Your Location</span>
        </div>
      </div>
    </div>
  );
};
