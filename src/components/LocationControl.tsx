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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-blue-950/70 border border-blue-500/30 text-xs text-sky-200 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
            <div className="min-w-0 truncate">
              <span className="truncate font-bold text-white block">
                {userLocation.addressName || 'Live Device GPS Active'}
              </span>
              <span className="text-[10px] text-sky-300 block">
                {userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E (±{userLocation.accuracy || 15}m)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-blue-900/40">
            <button
              onClick={() => onRequestLocation()}
              disabled={isLoading}
              title="Resynchronize Device GPS"
              className="px-2.5 py-1 bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 hover:text-white rounded-lg text-[11px] font-bold border border-sky-400/40 transition-colors flex items-center gap-1"
            >
              <Navigation className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing...' : 'Resync GPS'}</span>
            </button>
            <button
              onClick={() => setShowHubPicker(!showHubPicker)}
              className="text-[11px] font-bold underline text-sky-300 hover:text-white transition-colors px-1"
            >
              Change Hub
            </button>
            <button
              onClick={onClearLocation}
              title="Clear Location"
              className="p-1 text-sky-300 hover:text-white rounded-md hover:bg-blue-900/50 transition-colors"
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
            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-festiveRed-600 to-festiveRed-700 hover:from-festiveRed-500 hover:to-festiveRed-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Synchronizing Device GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-white" />
                <span>Sync My Device GPS</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowHubPicker(!showHubPicker)}
            title="Pick a Kolkata transit hub"
            className="py-2.5 px-3 bg-darkBg-800 hover:bg-darkCard-800 text-festiveGold-400 font-bold rounded-xl border border-festiveGold-500/30 text-xs transition-colors flex items-center gap-1"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Select Hub</span>
          </button>

          <button
            onClick={() => setShowExplanation(!showExplanation)}
            title="Privacy Info"
            className="p-2.5 bg-darkBg-800 hover:bg-darkCard-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Permission Explanation */}
      {showExplanation && (
        <div className="mt-2 p-3 bg-darkBg-800 border border-festiveGold-500/40 rounded-xl text-xs text-slate-200 shadow-dark-card">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-festiveGold-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              Geolocation Privacy
            </span>
            <button onClick={() => setShowExplanation(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Your location is processed entirely inside your browser on this local device to calculate walking routes to pandals. It is never saved to a remote server.
          </p>
        </div>
      )}

      {/* Error / Denial Warning Banner */}
      {error && !userLocation && (
        <div className="mt-2 p-2.5 bg-red-950/70 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">{error}</p>
            <p className="text-[11px] text-red-300 mt-0.5">
              You can tap "Select Hub" to pick any major Kolkata metro station or junction instead.
            </p>
          </div>
        </div>
      )}

      {/* Starting Hub Picker Popover */}
      {showHubPicker && (
        <div className="mt-2 p-3 bg-darkBg-800 border border-festiveGold-500/40 rounded-xl shadow-dark-card z-30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Select Kolkata Starting Hub
            </span>
            <button onClick={() => setShowHubPicker(false)} className="text-slate-400 hover:text-white">
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
                className="text-left px-2.5 py-1.5 rounded-lg bg-darkBg-900/90 hover:bg-festiveRed-600/20 text-slate-200 hover:text-white border border-slate-700/60 hover:border-festiveGold-500/50 text-xs transition-colors flex items-center gap-1.5 font-medium"
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
