import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Pandal, UserLocation } from '../types/pandal';
import { 
  Calendar, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Sparkles,
  MapPin,
  Navigation,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  Zap,
  Footprints,
  Train,
  Building2,
  Loader2,
  X
} from 'lucide-react';
import { formatDistance } from '../utils/geo';
import { 
  optimizePandalRoute, 
  type StartingLocation, 
  type OptimizedRouteResult 
} from '../utils/routeOptimizer';
import { 
  searchKolkataPlaces, 
  geocodeKolkataPlaceLive, 
  type PlaceSuggestion 
} from '../utils/kolkataPlaces';
import { POPULAR_STARTING_POINTS } from '../hooks/useGeolocation';

interface ItineraryPlannerProps {
  itinerary: Pandal[];
  userLocation: UserLocation | null;
  allPandals?: Pandal[];
  onRemovePandal: (pandalId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onClearItinerary: () => void;
  onReorderItinerary?: (newItinerary: Pandal[]) => void;
  onSelectPandal: (pandal: Pandal) => void;
}

export const ItineraryPlanner: React.FC<ItineraryPlannerProps> = ({
  itinerary,
  userLocation,
  allPandals = [],
  onRemovePandal,
  onMoveUp,
  onMoveDown,
  onClearItinerary,
  onReorderItinerary,
  onSelectPandal
}) => {
  // Whether the user has chosen a custom starting point (vs following live GPS)
  const [isCustomStartPoint, setIsCustomStartPoint] = useState<boolean>(false);
  
  // Active starting location
  const [startPoint, setStartPoint] = useState<StartingLocation>(() => {
    if (userLocation) {
      return {
        name: userLocation.addressName || 'My Current Location (GPS)',
        lat: userLocation.lat,
        lng: userLocation.lng
      };
    }
    return {
      name: 'Esplanade / Dharmatala (Central Hub)',
      lat: 22.5645,
      lng: 88.3524
    };
  });

  // Keep startPoint in sync with live userLocation unless user opted for a custom point
  useEffect(() => {
    if (!isCustomStartPoint && userLocation) {
      setStartPoint({
        name: userLocation.addressName || 'My Current Location (GPS)',
        lat: userLocation.lat,
        lng: userLocation.lng
      });
    }
  }, [userLocation, isCustomStartPoint]);

  // UI state for the starting point modal/dropdown
  const [isChangingStart, setIsChangingStart] = useState<boolean>(false);
  const [startSearchQuery, setStartSearchQuery] = useState<string>('');
  const [liveSearchResults, setLiveSearchResults] = useState<PlaceSuggestion[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Auto-optimize toggle (defaults to true for instant automated shortest tour)
  const [autoOptimize, setAutoOptimize] = useState<boolean>(true);

  // Track optimization feedback notifications
  const [hasJustOptimized, setHasJustOptimized] = useState<boolean>(false);

  // Calculate current optimized route result
  const routeResult = useMemo<OptimizedRouteResult>(() => {
    return optimizePandalRoute(startPoint, itinerary);
  }, [startPoint, itinerary]);

  // Execute optimization algorithm and apply the shortest ordering to the itinerary
  const runOptimization = useCallback((shouldRedirect = false) => {
    if (!onReorderItinerary || itinerary.length <= 1) {
      if (shouldRedirect && routeResult.googleMapsUrl) {
        window.open(routeResult.googleMapsUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    const result = optimizePandalRoute(startPoint, itinerary);
    onReorderItinerary(result.orderedPandals);
    setHasJustOptimized(true);
    setTimeout(() => setHasJustOptimized(false), 4000);

    if (shouldRedirect && result.googleMapsUrl) {
      window.open(result.googleMapsUrl, '_blank', 'noopener,noreferrer');
    }
  }, [onReorderItinerary, itinerary, startPoint, routeResult.googleMapsUrl]);

  // Auto-optimize when new pandals are added or startPoint changes if autoOptimize is enabled
  const prevItineraryLengthRef = React.useRef(itinerary.length);
  const prevStartPointRef = React.useRef(`${startPoint.lat},${startPoint.lng}`);

  useEffect(() => {
    const startPointKey = `${startPoint.lat},${startPoint.lng}`;
    const startChanged = startPointKey !== prevStartPointRef.current;
    const lengthChanged = itinerary.length !== prevItineraryLengthRef.current;

    if (
      autoOptimize &&
      onReorderItinerary &&
      itinerary.length > 1 &&
      (lengthChanged || startChanged)
    ) {
      const result = optimizePandalRoute(startPoint, itinerary);
      // Only trigger reorder if the optimal order is different from current
      const isAlreadyOptimal = result.orderedPandals.every((p, i) => p.id === itinerary[i]?.id);
      if (!isAlreadyOptimal) {
        onReorderItinerary(result.orderedPandals);
      }
    }
    prevItineraryLengthRef.current = itinerary.length;
    prevStartPointRef.current = startPointKey;
  }, [itinerary.length, autoOptimize, onReorderItinerary, startPoint]);

  // Set custom start point handlers
  const handleSelectPredefinedStart = (hub: { name: string; lat: number; lng: number }) => {
    setStartPoint({
      name: hub.name,
      lat: hub.lat,
      lng: hub.lng
    });
    setIsCustomStartPoint(true);
    setIsChangingStart(false);
    setStartSearchQuery('');
    setShowSuggestions(false);
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setStartPoint({
        name: userLocation.addressName || 'My Current Location (GPS)',
        lat: userLocation.lat,
        lng: userLocation.lng
      });
      setIsCustomStartPoint(false);
      setIsChangingStart(false);
      setStartSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSelectPandalAsStart = (pandal: Pandal) => {
    if (pandal.latitude != null && pandal.longitude != null) {
      setStartPoint({
        name: pandal.name,
        lat: pandal.latitude,
        lng: pandal.longitude
      });
      setIsCustomStartPoint(true);
      setIsChangingStart(false);
      setStartSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSelectPlaceAsStart = (place: PlaceSuggestion) => {
    setStartPoint({
      name: place.name,
      lat: place.lat,
      lng: place.lng
    });
    setIsCustomStartPoint(true);
    setIsChangingStart(false);
    setStartSearchQuery('');
    setLiveSearchResults([]);
    setShowSuggestions(false);
  };

  // 1. Instant local search across Metros, Landmarks, Stations & Pandals
  const localSuggestions = useMemo<PlaceSuggestion[]>(() => {
    if (!startSearchQuery.trim()) return [];
    return searchKolkataPlaces(startSearchQuery, allPandals);
  }, [startSearchQuery, allPandals]);

  // 2. Combine and deduplicate local and live geocoded results
  const combinedSuggestions = useMemo<PlaceSuggestion[]>(() => {
    const seen = new Set<string>();
    const list: PlaceSuggestion[] = [];

    localSuggestions.forEach((item) => {
      const key = `${item.name.toLowerCase()}-${item.lat.toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    });

    liveSearchResults.forEach((item) => {
      const key = `${item.name.toLowerCase()}-${item.lat.toFixed(3)}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    });

    return list.slice(0, 10);
  }, [localSuggestions, liveSearchResults]);

  // 3. Search action (runs on Search button click or Enter key)
  const handleExecutePlaceSearch = useCallback(async () => {
    if (!startSearchQuery.trim()) return;
    setShowSuggestions(true);
    setIsSearchingLive(true);
    try {
      const livePlaces = await geocodeKolkataPlaceLive(startSearchQuery);
      setLiveSearchResults(livePlaces);
    } finally {
      setIsSearchingLive(false);
    }
  }, [startSearchQuery]);

  // 4. Debounced live search if query length >= 3
  useEffect(() => {
    if (startSearchQuery.trim().length >= 3) {
      setShowSuggestions(true);
      const timer = setTimeout(() => {
        handleExecutePlaceSearch();
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setLiveSearchResults([]);
    }
  }, [startSearchQuery, handleExecutePlaceSearch]);

  if (itinerary.length === 0) {
    return (
      <div className="bg-darkBg-800 border border-slate-700/60 rounded-2xl p-5 text-center shadow-dark-card space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-festiveGold-500/20 border border-festiveGold-500/30 flex items-center justify-center text-festiveGold-400">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Your Parikrama Plan is Empty</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Select 5 to 7 pandals from the directory. The algorithm will automatically calculate the <strong>Shortest Walking Tour</strong> from your location and open turn-by-turn navigation in Google Maps!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-darkBg-800/95 border border-festiveGold-500/30 rounded-2xl p-4 shadow-dark-card space-y-3.5 backdrop-blur-md">
      {/* Header & Itinerary Count */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-festiveGold-500/20 text-festiveGold-400 border border-festiveGold-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Parikrama Plan ({itinerary.length} Pandals)</span>
            </h3>
            <p className="text-[11px] text-slate-300">
              Shortest Tour: <strong className="text-festiveGold-400">{formatDistance(routeResult.totalDistanceKm)}</strong> • ~<strong>{routeResult.totalMinutes} min walk</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onClearItinerary}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg font-semibold hover:bg-slate-800/80 border border-red-500/20"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Starting Location Bar with Quick Changer */}
      <div className="bg-darkBg-900/90 border border-slate-700/80 rounded-xl p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                Starting Point {isCustomStartPoint ? '(Custom)' : '(Live GPS)'}
              </span>
              <p className="text-xs font-bold text-white truncate" title={startPoint.name}>
                {startPoint.name}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsChangingStart(!isChangingStart)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-festiveGold-300 hover:text-festiveGold-200 text-xs font-bold border border-festiveGold-500/30 transition-all shrink-0 flex items-center gap-1"
          >
            <span>{isChangingStart ? 'Close' : 'Change'}</span>
            {isChangingStart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Change Starting Point Expandable Drawer */}
        {isChangingStart && (
          <div className="pt-2 border-t border-slate-800 space-y-2.5 animate-fadeIn">
            {/* Live GPS quick button */}
            {userLocation && (
              <button
                onClick={handleUseCurrentLocation}
                className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
                  !isCustomStartPoint
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50'
                    : 'bg-darkBg-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-sky-400" />
                  <span>My Current Location ({userLocation.addressName || 'Live GPS'})</span>
                </span>
                {!isCustomStartPoint && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </button>
            )}

            {/* Type or Search Any Place in / near Kolkata */}
            <div className="relative">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  {isSearchingLive ? (
                    <Loader2 className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-festiveGold-400 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  )}
                  <input
                    type="text"
                    value={startSearchQuery}
                    onChange={(e) => {
                      setStartSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleExecutePlaceSearch();
                      }
                    }}
                    placeholder="Search any place, metro, landmark (e.g. Sovabazar, Howrah)..."
                    className="w-full pl-8 pr-7 py-1.5 bg-darkBg-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-festiveGold-400 transition-colors"
                  />
                  {startSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartSearchQuery('');
                        setShowSuggestions(false);
                      }}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleExecutePlaceSearch}
                  disabled={!startSearchQuery.trim() || isSearchingLive}
                  className="px-3 py-1.5 bg-festiveGold-500 hover:bg-festiveGold-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-darkBg-950 font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 transition-all shadow-sm"
                  title="Search places"
                >
                  {isSearchingLive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Search</span>
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && startSearchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-darkBg-950/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden max-h-64 overflow-y-auto">
                  {combinedSuggestions.length > 0 ? (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-bold text-festiveGold-400/90 uppercase tracking-wider bg-slate-900/90 border-b border-slate-800 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
                        <span>Matching Places ({combinedSuggestions.length})</span>
                        <span className="text-[9px] text-slate-400 font-normal">Click to set as starting point</span>
                      </div>
                      {combinedSuggestions.map((place) => {
                        const getPlaceIcon = () => {
                          if (place.category === 'metro') return <Train className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
                          if (place.category === 'railway') return <Train className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
                          if (place.category === 'landmark') return <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
                          if (place.category === 'pandal') return <Sparkles className="w-3.5 h-3.5 text-festiveGold-400 shrink-0" />;
                          return <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
                        };

                        const getBadgeStyle = () => {
                          if (place.category === 'metro') return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60';
                          if (place.category === 'railway') return 'bg-sky-950/70 text-sky-300 border-sky-800/60';
                          if (place.category === 'landmark') return 'bg-amber-950/70 text-amber-300 border-amber-800/60';
                          if (place.category === 'pandal') return 'bg-festiveGold-950/70 text-festiveGold-300 border-festiveGold-800/60';
                          return 'bg-purple-950/70 text-purple-300 border-purple-800/60';
                        };

                        return (
                          <button
                            key={place.id}
                            type="button"
                            onClick={() => handleSelectPlaceAsStart(place)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-800/90 text-xs text-white flex items-center justify-between border-b border-slate-800/40 last:border-b-0 transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {getPlaceIcon()}
                              <div className="truncate">
                                <div className="font-semibold text-slate-100 group-hover:text-festiveGold-300 truncate">
                                  {place.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {place.category.toUpperCase()} {place.area ? `• ${place.area}` : ''}
                                </div>
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 font-medium ${getBadgeStyle()}`}>
                              {place.category}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : isSearchingLive ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-festiveGold-400" />
                      <span>Searching places across Kolkata...</span>
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      <div className="text-slate-300 font-medium">No places found matching "{startSearchQuery}".</div>
                      <div className="text-[11px] text-slate-500 mt-1">Press Search to search online or try typing another locality or metro name.</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Popular Starting Hubs Quick Chips */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase">
                Popular Kolkata Starting Points:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {POPULAR_STARTING_POINTS.map((hub) => (
                  <button
                    key={hub.name}
                    onClick={() => handleSelectPredefinedStart(hub)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      startPoint.name === hub.name
                        ? 'bg-festiveGold-500 text-darkBg-950 font-bold'
                        : 'bg-darkBg-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    {hub.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Added Pandals as Starting Point */}
            {itinerary.length > 0 && (
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase">
                  Or Start At One of Your Planned Pandals:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {itinerary.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPandalAsStart(p)}
                      className="px-2 py-1 rounded-md text-[11px] bg-darkBg-800 text-festiveGold-300 hover:bg-slate-700 border border-slate-700 truncate max-w-[200px]"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Algorithm Banner & One-Click Sort Controls */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Main Sort Algorithm Button */}
          <button
            onClick={() => runOptimization(false)}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 via-festiveGold-600 to-amber-700 hover:from-amber-500 hover:to-festiveGold-500 text-darkBg-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-glow-gold transition-all active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-darkBg-950" />
            <span>Optimize Shortest Route</span>
          </button>

          {/* Sort & Launch directly to Google Maps */}
          <button
            onClick={() => runOptimization(true)}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-festiveRed-600 to-festiveRed-700 hover:from-festiveRed-500 hover:to-festiveRed-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-glow-red transition-all active:scale-[0.98]"
            title="Sorts pandals for minimum distance and immediately opens Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Sort & Open Google Maps</span>
          </button>
        </div>

        {/* Algorithm Feedback & Savings */}
        {routeResult.distanceSavedKm > 0 && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center justify-between font-bold animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <span>🎉 Algorithm Savings:</span>
              <span className="text-white">~{routeResult.distanceSavedKm} km shorter walk</span>
            </span>
            <span className="text-emerald-400 text-[10px]">Optimal Tour</span>
          </div>
        )}

        {hasJustOptimized && (
          <div className="px-3 py-1 rounded-lg bg-sky-950/80 border border-sky-400/40 text-[11px] text-sky-200 flex items-center gap-1.5 font-bold animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Pandals sorted sequentially for minimum distance from {startPoint.name}!</span>
          </div>
        )}

        {/* Auto-optimize toggle checkbox */}
        <label className="flex items-center gap-2 cursor-pointer pt-0.5 select-none text-[11px] text-slate-400 hover:text-slate-200">
          <input
            type="checkbox"
            checked={autoOptimize}
            onChange={(e) => setAutoOptimize(e.target.checked)}
            className="w-3.5 h-3.5 rounded bg-darkBg-900 border-slate-700 text-festiveGold-500 focus:ring-0"
          />
          <span>Auto-sort for minimum distance when adding pandals</span>
        </label>
      </div>

      {/* Sequential Stops with Leg-by-Leg Walking Distances */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {itinerary.map((pandal, idx) => {
          // Corresponding route leg for this pandal
          const leg = routeResult.legs[idx];

          return (
            <div
              key={pandal.id}
              className="p-2.5 rounded-xl bg-darkBg-900 hover:bg-darkCard-800 border border-slate-700/60 text-xs transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  onClick={() => onSelectPandal(pandal)}
                  className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                >
                  <span className="w-5 h-5 rounded-full bg-festiveRed-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 shadow-sm">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate hover:text-festiveGold-400">
                      {pandal.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {pandal.area_division} • 🚇 {pandal.nearest_metro}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => {
                      setAutoOptimize(false);
                      onMoveUp(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === itinerary.length - 1}
                    onClick={() => {
                      setAutoOptimize(false);
                      onMoveDown(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemovePandal(pandal.id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Leg Step-by-Step Info & Direct Walking Direction Link */}
              {leg && (
                <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 truncate text-slate-300">
                    <Footprints className="w-3 h-3 text-festiveGold-400 shrink-0" />
                    <span>From {idx === 0 ? 'Start' : `Stop ${idx}`}:</span>
                    <strong className="text-festiveGold-400">{formatDistance(leg.distanceKm)}</strong>
                    <span className="text-slate-400">(~{leg.walkingMinutes} min)</span>
                  </span>

                  <a
                    href={leg.googleMapsLegUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-0.5 shrink-0 px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 hover:bg-sky-900/60 transition-colors"
                    title="Open turn-by-turn walking route for this leg in Google Maps"
                  >
                    <span>Walk Leg ↗</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Primary Google Maps Multi-Stop Navigation Action */}
      <div className="pt-2 border-t border-slate-700/60">
        <a
          href={routeResult.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-3 bg-gradient-to-r from-festiveRed-600 via-festiveRed-700 to-festiveGold-600 hover:from-festiveRed-500 hover:to-festiveGold-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-glow-red transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5 text-white" />
          <span>Launch Full Shortest Tour in Google Maps ({itinerary.length} Stops)</span>
        </a>
      </div>
    </div>
  );
};
