import React from 'react';
import type { CalculatedRoute, Pandal, UserLocation } from '../types/pandal';
import { 
  Footprints, 
  Clock, 
  ExternalLink, 
  X, 
  Navigation, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistance, getGoogleMapsNavigationUrl } from '../utils/geo';

interface RoutePanelProps {
  route: CalculatedRoute;
  destination: Pandal;
  userLocation: UserLocation | null;
  onClose: () => void;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
  route,
  destination,
  userLocation,
  onClose
}) => {
  const [showSteps, setShowSteps] = React.useState(false);
  const gmapsUrl = getGoogleMapsNavigationUrl(destination, userLocation);

  return (
    <div className="bg-darkBg-800 border border-festiveGold-500/40 rounded-2xl p-4 shadow-dark-card space-y-3 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-750">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-festiveRed-600 text-white flex items-center justify-center shadow-md">
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-festiveGold-400 uppercase tracking-wider">
              Walking Route To
            </h4>
            <p className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
              {destination.name}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-darkBg-900 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-festiveGold-400" />
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Distance</span>
            <span className="text-sm font-black text-white">{formatDistance(route.distanceKm)}</span>
          </div>
        </div>

        <div className="bg-darkBg-900 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-[10px] uppercase text-slate-400 block font-semibold">Walk Time</span>
            <span className="text-sm font-black text-emerald-400">~{route.durationMinutes} mins</span>
          </div>
        </div>
      </div>

      {/* Fallback notice */}
      {route.provider === 'haversine-direct' && (
        <div className="p-2.5 bg-amber-950/50 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <span>
            Showing estimated walking line. Open Google Maps below for real-time lane navigation.
          </span>
        </div>
      )}

      {/* Steps */}
      {route.steps.length > 0 && (
        <div>
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="w-full py-1.5 px-3 bg-darkBg-900 hover:bg-darkBg-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-between border border-slate-700 transition-colors"
          >
            <span>Turn-by-turn steps ({route.steps.length})</span>
            {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSteps && (
            <div className="mt-1.5 max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {route.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-darkBg-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2"
                >
                  <span className="w-4 h-4 rounded-full bg-festiveRed-600/30 text-festiveRed-400 text-[10px] flex items-center justify-center shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-white">{step.instruction}</p>
                    <span className="text-[10px] text-slate-400">
                      {step.distanceMeters > 0 ? `${step.distanceMeters}m` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 border-t border-slate-700/50 flex items-center gap-2">
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-3 bg-festiveRed-600 hover:bg-festiveRed-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Google Maps Voice Directions
        </a>

        <button
          onClick={onClose}
          className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
