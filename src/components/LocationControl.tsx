import React, { useState } from 'react';
import type { UserLocation } from '../types/pandal';
import { POPULAR_STARTING_POINTS } from '../hooks/useGeolocation';
import { 
  Navigation, 
  MapPin, 
  X, 
  Loader2, 
  AlertCircle, 
  Compass, 
  HelpCircle
} from 'lucide-react';

interface LocationControlProps {
  userLocation: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus?: string | null;
  onRequestLocation: () => Promise<UserLocation | null>;
  onClearLocation: () => void;
  onSetManualLocation: (lat: number, lng: number, name?: string) => void;
}

export const LocationControl: React.FC<LocationControlProps> = ({
  userLocation,
  isLoading,
  error,
  onRequestLocation,
  onClearLocation,
  onSetManualLocation
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHubPicker, setShowHubPicker] = useState(false);

  const handleRequestClick = async () => {
    if (!userLocation) {
      await onRequestLocation();
    }
  };

  return (
    <div className="relative">
      {/* Current Location State Bar */}
      {userLocation ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-[#181818] via-[#141414] to-[#101010] border-2 border-festiveGold-400/80 text-xs text-festiveGold-100 shadow-[0_0_16px_rgba(255,215,0,0.22)] backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${userLocation.isRealGps ? 'bg-emerald-400' : 'bg-festiveGold-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${userLocation.isRealGps ? 'bg-emerald-500' : 'bg-festiveGold-400'}`}></span>
            </span>
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 truncate">
                <span className="truncate font-black text-white block">
                  {userLocation.addressName || (userLocation.isRealGps ? 'Live Device GPS Active' : 'Auto-synced Location')}
                </span>
                {userLocation.isRealGps ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-festiveGold-500/20 text-festiveGold-300 border border-festiveGold-400/50 shrink-0">
                    Road-level GPS
                  </span>
                ) : userLocation.isAutoSynced ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 shrink-0">
                    Approximate network area
                  </span>
                ) : null}
                {userLocation.isRealGps ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
                    Live GPS Fix
                  </span>
                ) : isLoading ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0 animate-pulse">
                    Refining GPS...
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] text-slate-300 block">
                {userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E {userLocation.accuracy ? `(±${userLocation.accuracy}m)` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-festiveGold-400/30">
            <button
              onClick={() => onRequestLocation()}
              disabled={isLoading}
              title="Resynchronize Device GPS"
              className="px-2.5 py-1 bg-gradient-to-r from-festiveGold-500/20 to-amber-500/20 hover:from-festiveGold-500/35 hover:to-amber-500/35 text-festiveGold-300 hover:text-white rounded-lg text-[11px] font-bold border border-festiveGold-400/60 transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
            >
              <Navigation className={`w-3 h-3 text-festiveGold-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Auto-Syncing...' : 'Resync GPS'}</span>
            </button>
            <button
              onClick={() => setShowHubPicker(!showHubPicker)}
              className="text-[11px] font-bold text-festiveGold-400 hover:text-white transition-colors px-1 underline"
            >
              Change Hub
            </button>
            <button
              onClick={onClearLocation}
              title="Clear Location"
              className="p-1 text-festiveGold-400/80 hover:text-white rounded-md hover:bg-[#202020] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={handleRequestClick}
            disabled={isLoading}
            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-festiveRed-600 to-rose-700 hover:from-festiveRed-500 hover:to-rose-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(217,4,41,0.5)] border-2 border-festiveGold-300 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-festiveGold-300" />
                <span>Auto-Syncing Device GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-festiveGold-300" />
                <span>Sync My Device GPS</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowHubPicker(!showHubPicker)}
            title="Pick a Kolkata transit hub"
            className="py-2.5 px-3 bg-[#161616] hover:bg-[#222222] text-festiveGold-300 font-bold rounded-xl border-2 border-festiveGold-400/80 text-xs transition-colors flex items-center gap-1 shadow-sm active:scale-95"
          >
            <Compass className="w-3.5 h-3.5 text-festiveGold-400" />
            <span>Select Hub</span>
          </button>

          <button
            onClick={() => setShowExplanation(!showExplanation)}
            title="Privacy Info"
            className="p-2.5 bg-[#161616] hover:bg-[#222222] text-festiveGold-400/80 hover:text-white rounded-xl border-2 border-festiveGold-400/50 transition-colors shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Permission Explanation */}
      {showExplanation && (
        <div className="mt-2 p-3 bg-gradient-to-b from-[#181818] to-[#101010] border-2 border-festiveGold-400/80 rounded-xl text-xs text-slate-200 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-festiveGold-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              Instant Geolocation Auto-Sync
            </span>
            <button onClick={() => setShowExplanation(false)} className="text-festiveGold-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            With your browser permission, the map uses your device GPS for live routes and distances. After a GPS fix, the coordinate is sent to OpenStreetMap only to display the nearby road name; it is not stored on our server.
          </p>
        </div>
      )}

      {/* Error / Denial Warning Banner */}
      {error && !userLocation && (
        <div className="mt-2 p-2.5 bg-[#180a0a] border-2 border-red-500/60 rounded-xl text-xs text-red-200 flex items-start gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-300">{error}</p>
            <p className="text-[11px] text-red-400/90 mt-0.5">
              You can tap "Select Hub" to pick any major Kolkata metro station or junction instead.
            </p>
          </div>
        </div>
      )}

      {/* Starting Hub Picker Popover */}
      {showHubPicker && (
        <div className="mt-2 p-3 bg-[#141414] border-2 border-festiveGold-400 rounded-2xl shadow-[0_0_20px_rgba(255,215,0,0.3)] z-30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-white uppercase tracking-wider font-festive">
              Select Kolkata Starting Hub
            </span>
            <button onClick={() => setShowHubPicker(false)} className="text-festiveGold-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {POPULAR_STARTING_POINTS.map((hub) => (
              <button
                key={hub.name}
                onClick={() => {
                  onSetManualLocation(hub.lat, hub.lng, hub.name);
                  setShowHubPicker(false);
                }}
                className="text-left px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-festiveGold-500/20 text-slate-200 hover:text-white border border-festiveGold-400/50 hover:border-festiveGold-400 text-xs transition-colors flex items-center gap-1.5 font-medium"
              >
                <MapPin className="w-3 h-3 text-festiveGold-400 shrink-0" />
                <span className="truncate">{hub.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
