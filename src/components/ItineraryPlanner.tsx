import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Pandal, UserLocation } from '../types/pandal';
import { 
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
  X,
  Route,
  Info
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
  const [isCustomStartPoint, setIsCustomStartPoint] = useState<boolean>(false);
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

  useEffect(() => {
    if (!isCustomStartPoint && userLocation) {
      setStartPoint({
        name: userLocation.addressName || 'My Current Location (GPS)',
        lat: userLocation.lat,
        lng: userLocation.lng
      });
    }
  }, [userLocation, isCustomStartPoint]);

  const [isChangingStart, setIsChangingStart] = useState<boolean>(false);
  const [startSearchQuery, setStartSearchQuery] = useState<string>('');
  const [liveSearchResults, setLiveSearchResults] = useState<PlaceSuggestion[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [autoOptimize, setAutoOptimize] = useState<boolean>(true);
  const [hasJustOptimized, setHasJustOptimized] = useState<boolean>(false);

  const routeResult = useMemo<OptimizedRouteResult>(() => {
    return optimizePandalRoute(startPoint, itinerary);
  }, [startPoint, itinerary]);

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

  const prevItineraryLengthRef = React.useRef(itinerary.length);
  const prevStartPointRef = React.useRef(`${startPoint.lat},${startPoint.lng}`);

  useEffect(() => {
    const startPointKey = `${startPoint.lat},${startPoint.lng}`;
    const startChanged = startPointKey !== prevStartPointRef.current;
    const lengthChanged = itinerary.length !== prevItineraryLengthRef.current;
    if (autoOptimize && onReorderItinerary && itinerary.length > 1 && (lengthChanged || startChanged)) {
      const result = optimizePandalRoute(startPoint, itinerary);
      const isAlreadyOptimal = result.orderedPandals.every((p, i) => p.id === itinerary[i]?.id);
      if (!isAlreadyOptimal) {
        onReorderItinerary(result.orderedPandals);
        setHasJustOptimized(true);
        setTimeout(() => setHasJustOptimized(false), 3000);
      }
    }
    prevItineraryLengthRef.current = itinerary.length;
    prevStartPointRef.current = startPointKey;
  }, [itinerary.length, autoOptimize, onReorderItinerary, startPoint]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPredefinedStart = (hub: { name: string; lat: number; lng: number }) => {
    setStartPoint({ name: hub.name, lat: hub.lat, lng: hub.lng });
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
      setStartPoint({ name: pandal.name, lat: pandal.latitude, lng: pandal.longitude });
      setIsCustomStartPoint(true);
      setIsChangingStart(false);
      setStartSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSelectPlaceAsStart = (place: PlaceSuggestion) => {
    setStartPoint({ name: place.name, lat: place.lat, lng: place.lng });
    setIsCustomStartPoint(true);
    setIsChangingStart(false);
    setStartSearchQuery('');
    setLiveSearchResults([]);
    setShowSuggestions(false);
  };

  // Instant local search — shows from first keystroke
  const localSuggestions = useMemo<PlaceSuggestion[]>(() => {
    if (!startSearchQuery.trim()) return [];
    return searchKolkataPlaces(startSearchQuery, allPandals);
  }, [startSearchQuery, allPandals]);

  const combinedSuggestions = useMemo<PlaceSuggestion[]>(() => {
    const seen = new Set<string>();
    const list: PlaceSuggestion[] = [];
    localSuggestions.forEach((item) => {
      const key = `${item.name.toLowerCase()}-${item.lat.toFixed(3)}`;
      if (!seen.has(key)) { seen.add(key); list.push(item); }
    });
    liveSearchResults.forEach((item) => {
      const key = `${item.name.toLowerCase()}-${item.lat.toFixed(3)}`;
      if (!seen.has(key)) { seen.add(key); list.push(item); }
    });
    return list.slice(0, 10);
  }, [localSuggestions, liveSearchResults]);

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

  // Show suggestions immediately from 1st char; debounce live search at 3+ chars
  useEffect(() => {
    if (startSearchQuery.trim().length >= 1) {
      setShowSuggestions(true);
    }
    if (startSearchQuery.trim().length >= 3) {
      const timer = setTimeout(() => { handleExecutePlaceSearch(); }, 400);
      return () => clearTimeout(timer);
    } else {
      setLiveSearchResults([]);
    }
  }, [startSearchQuery, handleExecutePlaceSearch]);

  if (itinerary.length === 0) {
    return (
      <div className="bg-darkBg-800 border border-slate-700/60 rounded-2xl p-5 text-center shadow-dark-card space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-festiveGold-500/20 border border-festiveGold-500/30 flex items-center justify-center text-festiveGold-400">
          <Route className="w-7 h-7" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white">Your Parikrama Plan is Empty</h4>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Browse pandals and tap <strong className="text-festiveGold-400">+ Plan</strong> on any 5&ndash;6 pandals.
            The algorithm will <strong className="text-white">auto-sort them into the shortest walking tour</strong> from your starting point!
          </p>
        </div>
        <div className="text-left bg-darkBg-900/80 border border-slate-700/40 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-black text-festiveGold-400 uppercase tracking-wider">How the algorithm works</p>
          <div className="space-y-1.5">
            {[
              { icon: '📍', text: 'Pick any 5\u20136 pandals from the directory' },
              { icon: '🧮', text: 'Branch & Bound algorithm finds the minimum-distance visit order' },
              { icon: '🗺️', text: 'Stops are automatically re-ordered nearest-first from your start' },
              { icon: '🚶', text: 'Tap \u201cLaunch Full Tour\u201d to open turn-by-turn walking in Google Maps' }
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="text-base leading-none shrink-0">{step.icon}</span>
                <span>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-darkBg-800/95 border border-festiveGold-500/30 rounded-2xl p-4 shadow-dark-card space-y-3.5 backdrop-blur-md">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-festiveGold-500/20 text-festiveGold-400 border border-festiveGold-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Parikrama Plan ({itinerary.length} Pandals)
            </h3>
            <p className="text-[11px] text-slate-300">
              Shortest Tour: <strong className="text-festiveGold-400">{formatDistance(routeResult.totalDistanceKm)}</strong> &bull; ~<strong>{routeResult.totalMinutes} min walk</strong>
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

      {/* ── STARTING POINT ── */}
      <div className="bg-darkBg-900/90 border border-sky-500/30 rounded-xl overflow-hidden">
        {/* Always-visible row */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center shrink-0">
              <Navigation className="w-3 h-3 text-sky-300" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-sky-400 block font-bold uppercase tracking-wider">
                Starting Point {isCustomStartPoint ? '(Custom)' : '(Live GPS)'}
              </span>
              <p className="text-xs font-bold text-white truncate" title={startPoint.name}>
                {startPoint.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsChangingStart(!isChangingStart);
              if (!isChangingStart) setTimeout(() => searchInputRef.current?.focus(), 120);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-festiveGold-300 hover:text-festiveGold-200 text-xs font-bold border border-festiveGold-500/30 transition-all shrink-0 flex items-center gap-1"
          >
            <span>{isChangingStart ? 'Close' : 'Change'}</span>
            {isChangingStart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable Change-Start drawer */}
        {isChangingStart && (
          <div className="border-t border-slate-800 bg-darkBg-950/60 p-3 space-y-3 animate-fadeIn">

            {/* Use live GPS */}
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

            {/* ── Search box with instant suggestions ── */}
            <div className="relative">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Search className="w-3 h-3 text-festiveGold-400" />
                Search any place, metro or landmark in Kolkata
              </p>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  {isSearchingLive
                    ? <Loader2 className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-festiveGold-400 animate-spin" />
                    : <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  }
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={startSearchQuery}
                    onChange={(e) => { setStartSearchQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleExecutePlaceSearch(); }
                      if (e.key === 'Escape') setShowSuggestions(false);
                    }}
                    placeholder="e.g. Sovabazar, Howrah, Park Street, Karunamoyee..."
                    className="w-full pl-8 pr-7 py-2 bg-darkBg-950 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-festiveGold-400 focus:ring-1 focus:ring-festiveGold-400/30 transition-colors"
                  />
                  {startSearchQuery && (
                    <button
                      type="button"
                      onClick={() => { setStartSearchQuery(''); setShowSuggestions(false); searchInputRef.current?.focus(); }}
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleExecutePlaceSearch}
                  disabled={!startSearchQuery.trim() || isSearchingLive}
                  className="px-3 py-2 bg-festiveGold-500 hover:bg-festiveGold-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-darkBg-950 font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 transition-all shadow-sm"
                >
                  {isSearchingLive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </div>

              {/* Suggestions dropdown — shows from the very first character */}
              {showSuggestions && startSearchQuery.trim().length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-darkBg-950/98 border border-slate-600/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden max-h-60 overflow-y-auto"
                >
                  {combinedSuggestions.length > 0 ? (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-bold text-festiveGold-400/90 uppercase tracking-wider bg-slate-900/90 border-b border-slate-800 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
                        <span className="flex items-center gap-1">
                          {isSearchingLive && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                          {isSearchingLive ? 'Searching...' : `${combinedSuggestions.length} places found`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-normal">Tap to set as start</span>
                      </div>
                      {combinedSuggestions.map((place) => {
                        const iconMap: Record<string, React.ReactNode> = {
                          metro: <Train className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
                          railway: <Train className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
                          landmark: <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
                          pandal: <Sparkles className="w-3.5 h-3.5 text-festiveGold-400 shrink-0" />,
                        };
                        const badgeMap: Record<string, string> = {
                          metro: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
                          railway: 'bg-sky-950/70 text-sky-300 border-sky-800/60',
                          landmark: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
                          pandal: 'bg-festiveGold-950/70 text-festiveGold-300 border-festiveGold-800/60',
                        };
                        return (
                          <button
                            key={place.id}
                            type="button"
                            onClick={() => handleSelectPlaceAsStart(place)}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-800/90 text-xs text-white flex items-center justify-between border-b border-slate-800/40 last:border-b-0 transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {iconMap[place.category] ?? <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                              <div className="truncate">
                                <div className="font-semibold text-slate-100 group-hover:text-festiveGold-300 truncate">{place.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{place.category.toUpperCase()}{place.area ? ` \u2022 ${place.area}` : ''}</div>
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 font-medium ${badgeMap[place.category] ?? 'bg-purple-950/70 text-purple-300 border-purple-800/60'}`}>
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
                      <div className="text-slate-300 font-medium">No places found for &quot;{startSearchQuery}&quot;.</div>
                      <div className="text-[11px] text-slate-500 mt-1">Try typing more, or press Search to look online.</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Popular hubs */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase">Popular Kolkata Starting Points:</span>
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

            {/* Start at one of planned pandals */}
            {itinerary.length > 0 && (
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase">Or Start At One of Your Planned Pandals:</span>
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

      {/* ── ALGORITHM CONTROLS ── */}
      <div className="space-y-2">
        {/* Auto-sort status badge */}
        <div className={`px-3 py-2 rounded-xl border text-[11px] flex items-center justify-between transition-all ${
          autoOptimize
            ? 'bg-gradient-to-r from-emerald-950/80 to-darkBg-900 border-emerald-500/40 text-emerald-200'
            : 'bg-darkBg-900 border-slate-700 text-slate-400'
        }`}>
          <span className="flex items-center gap-1.5 font-bold">
            <Zap className={`w-3.5 h-3.5 ${autoOptimize ? 'text-emerald-400 fill-emerald-400' : 'text-slate-500'}`} />
            {autoOptimize
              ? <span>Auto-Sorted: <span className="text-white">Nearest-distance order</span></span>
              : <span>Manual order (auto-sort is off)</span>
            }
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoOptimize}
              onChange={(e) => setAutoOptimize(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-darkBg-900 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span className="text-[10px] text-slate-400">{autoOptimize ? 'On' : 'Off'}</span>
          </label>
        </div>

        {routeResult.distanceSavedKm > 0 && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center justify-between font-bold animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <span>🎉 Algorithm saved:</span>
              <span className="text-white">~{routeResult.distanceSavedKm} km shorter</span>
            </span>
            <span className="text-emerald-400 text-[10px]">Optimal Tour</span>
          </div>
        )}

        {hasJustOptimized && (
          <div className="px-3 py-1 rounded-lg bg-sky-950/80 border border-sky-400/40 text-[11px] text-sky-200 flex items-center gap-1.5 font-bold animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Re-sorted for minimum distance from {startPoint.name}!</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => runOptimization(false)}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 via-festiveGold-600 to-amber-700 hover:from-amber-500 hover:to-festiveGold-500 text-darkBg-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-glow-gold transition-all active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-darkBg-950" />
            <span>Re-sort Shortest Route</span>
          </button>
          <button
            onClick={() => runOptimization(true)}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-festiveRed-600 to-festiveRed-700 hover:from-festiveRed-500 hover:to-festiveRed-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-glow-red transition-all active:scale-[0.98]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Sort &amp; Open Maps</span>
          </button>
        </div>
      </div>

      {/* ── ROUTE STOPS with visual connectors ── */}
      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {/* Start node */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-6 h-6 rounded-full bg-sky-500 border-2 border-sky-300 flex items-center justify-center shrink-0 shadow-sm">
            <Navigation className="w-3 h-3 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-sky-300 uppercase tracking-wider leading-none">Start</p>
            <p className="text-xs font-semibold text-white truncate">{startPoint.name}</p>
          </div>
          <Info className="w-3 h-3 text-slate-600 shrink-0" />
        </div>

        {itinerary.map((pandal, idx) => {
          const leg = routeResult.legs[idx];
          return (
            <React.Fragment key={pandal.id}>
              {/* Connector line with distance */}
              {leg && (
                <div className="flex items-center gap-1.5 pl-[11px] py-0.5">
                  <div className="flex flex-col items-center gap-[2px]">
                    <div className="w-[2px] h-2.5 bg-gradient-to-b from-sky-500/50 to-festiveGold-500/50 rounded" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] ml-0.5">
                    <Footprints className="w-2.5 h-2.5 text-festiveGold-500/80 shrink-0" />
                    <span className="font-bold text-festiveGold-400">{formatDistance(leg.distanceKm)}</span>
                    <span className="text-slate-500">~{leg.walkingMinutes}&nbsp;min</span>
                  </div>
                </div>
              )}

              {/* Stop card */}
              <div className="rounded-xl bg-darkBg-900 hover:bg-slate-800/60 border border-slate-700/60 text-xs transition-colors overflow-hidden">
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <div
                    onClick={() => onSelectPandal(pandal)}
                    className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                  >
                    <span className="w-6 h-6 rounded-full bg-festiveRed-600 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate hover:text-festiveGold-400 transition-colors">
                        {pandal.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {pandal.area_division} &bull; 🚇 {pandal.nearest_metro}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      disabled={idx === 0}
                      onClick={() => { setAutoOptimize(false); onMoveUp(idx); }}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === itinerary.length - 1}
                      onClick={() => { setAutoOptimize(false); onMoveDown(idx); }}
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
                {leg && (
                  <div className="px-2.5 pb-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">From {idx === 0 ? 'Start' : `Stop ${idx}`}</span>
                    <a
                      href={leg.googleMapsLegUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 hover:bg-sky-900/60 transition-colors"
                    >
                      <span>Walk Leg ↗</span>
                    </a>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Total summary ── */}
      <div className="px-3 py-2 bg-darkBg-900/60 border border-festiveGold-500/20 rounded-xl flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Total walking distance:</span>
        <span className="font-black text-festiveGold-400">
          {formatDistance(routeResult.totalDistanceKm)} &bull; ~{routeResult.totalMinutes}&nbsp;min
        </span>
      </div>

      {/* ── Launch Google Maps ── */}
      <div className="pt-1 border-t border-slate-700/60">
        <a
          href={routeResult.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-festiveGold-400 to-amber-500 hover:from-amber-400 hover:to-festiveGold-300 text-darkBg-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-glow-gold transition-all active:scale-[0.98]"
        >
          <ExternalLink className="w-4 h-4 text-darkBg-950" />
          <span>Launch Full Tour in Google Maps ({itinerary.length} Stops)</span>
        </a>
      </div>
    </div>
  );
};
