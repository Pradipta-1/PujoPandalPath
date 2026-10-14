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
    <div className="bg-gradient-to-b from-[#141414] to-[#0a0a0a] border-2 border-festiveGold-400 rounded-2xl p-4 shadow-[0_0_20px_rgba(205,162,80,0.22)] space-y-3 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-festiveGold-400/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-festiveRed-600 to-rose-700 text-white flex items-center justify-center shadow-md border border-festiveGold-300">
            <Footprints className="w-4 h-4 text-festiveGold-200" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-festiveGold-400 uppercase tracking-wider font-festive">
              Walking Route To
            </h4>
            <p className="text-sm font-black text-white truncate max-w-[200px] sm:max-w-xs font-festive">
              {destination.name}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-festiveGold-400 hover:text-white rounded-lg hover:bg-[#202020] border border-festiveGold-400/30 transition-colors"
          title="Close route panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="bg-[#161616] p-2.5 rounded-xl border border-festiveGold-400/60 flex items-center gap-2 shadow-sm">
          <Navigation className="w-4 h-4 text-festiveGold-400 shrink-0" />
          <div>
            <span className="text-[10px] uppercase text-festiveGold-400/90 block font-bold tracking-wider">Distance</span>
            <span className="text-sm font-black text-white">{formatDistance(route.distanceKm)}</span>
          </div>
        </div>

        <div className="bg-[#161616] p-2.5 rounded-xl border border-festiveGold-400/60 flex items-center gap-2 shadow-sm">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] uppercase text-festiveGold-400/90 block font-bold tracking-wider">Walk Time</span>
            <span className="text-sm font-black text-emerald-400">~{route.durationMinutes} mins</span>
          </div>
        </div>
      </div>

      {/* Fallback notice */}
      {route.provider === 'haversine-direct' && (
        <div className="p-2.5 bg-[#180a0a] border border-festiveGold-400/50 rounded-xl text-[11px] text-festiveGold-200 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-festiveGold-400" />
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
            className="w-full py-2 px-3 bg-[#161616] hover:bg-[#202020] text-slate-200 text-xs font-bold rounded-xl flex items-center justify-between border border-festiveGold-400/60 transition-colors shadow-sm"
          >
            <span>Turn-by-turn steps ({route.steps.length})</span>
            {showSteps ? <ChevronUp className="w-4 h-4 text-festiveGold-400" /> : <ChevronDown className="w-4 h-4 text-festiveGold-400" />}
          </button>

          {showSteps && (
            <div className="mt-1.5 max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {route.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-[#161616] border border-festiveGold-400/40 text-xs text-slate-200 flex items-start gap-2"
                >
                  <span className="w-4 h-4 rounded-full bg-festiveRed-600/30 text-rose-300 border border-festiveGold-400/40 text-[10px] flex items-center justify-center shrink-0 font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{step.instruction}</p>
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
      <div className="pt-2 border-t border-festiveGold-400/30 flex items-center gap-2">
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-3 bg-gradient-to-r from-festiveRed-600 to-rose-700 hover:from-festiveRed-500 hover:to-rose-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(217,4,41,0.5)] border-2 border-festiveGold-300 transition-all active:scale-95"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Google Maps Voice Directions</span>
        </a>

        <button
          onClick={onClose}
          className="py-2.5 px-3.5 bg-[#161616] hover:bg-[#222222] text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border-2 border-festiveGold-400/70 active:scale-95 shadow-sm"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
