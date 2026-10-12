import React from 'react';
import type { Pandal, UserLocation } from '../types/pandal';
import { 
  Calendar, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Sparkles
} from 'lucide-react';
import { formatDistance, getGoogleMapsMultiStopUrl, calculateHaversineDistance, estimateWalkingMinutes } from '../utils/geo';

interface ItineraryPlannerProps {
  itinerary: Pandal[];
  userLocation: UserLocation | null;
  onRemovePandal: (pandalId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onClearItinerary: () => void;
  onSelectPandal: (pandal: Pandal) => void;
}

export const ItineraryPlanner: React.FC<ItineraryPlannerProps> = ({
  itinerary,
  userLocation,
  onRemovePandal,
  onMoveUp,
  onMoveDown,
  onClearItinerary,
  onSelectPandal
}) => {
  const stats = React.useMemo(() => {
    let totalDistKm = 0;
    const verifiedStops = itinerary.filter(p => p.location_verified && p.latitude && p.longitude);

    if (verifiedStops.length > 0) {
      let lastLat = userLocation ? userLocation.lat : verifiedStops[0].latitude!;
      let lastLng = userLocation ? userLocation.lng : verifiedStops[0].longitude!;
      const startIdx = userLocation ? 0 : 1;

      for (let i = startIdx; i < verifiedStops.length; i++) {
        const curr = verifiedStops[i];
        if (curr.latitude && curr.longitude) {
          totalDistKm += calculateHaversineDistance(lastLat, lastLng, curr.latitude, curr.longitude);
          lastLat = curr.latitude;
          lastLng = curr.longitude;
        }
      }
    }

    const totalMinutes = estimateWalkingMinutes(totalDistKm);
    return {
      totalDistKm,
      totalMinutes,
      verifiedCount: verifiedStops.length
    };
  }, [itinerary, userLocation]);

  const multiStopUrl = getGoogleMapsMultiStopUrl(itinerary, userLocation);

  if (itinerary.length === 0) {
    return (
      <div className="bg-darkBg-800 border border-slate-700/60 rounded-2xl p-5 text-center shadow-dark-card">
        <div className="w-10 h-10 mx-auto rounded-full bg-festiveGold-500/20 border border-festiveGold-500/30 flex items-center justify-center text-festiveGold-400 mb-2">
          <Calendar className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-white">Your Parikrama Plan is Empty</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
          Tap the <strong>+</strong> button on any pandal card to create a custom hopping route across Kolkata saved right on your device.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-darkBg-800 border border-festiveGold-500/30 rounded-2xl p-4 shadow-dark-card space-y-3.5 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-festiveGold-400" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              My Parikrama Plan ({itinerary.length} Pandals)
            </h3>
            <p className="text-[11px] text-slate-300">
              Est. Total: <strong className="text-festiveGold-400">{formatDistance(stats.totalDistKm)}</strong> • ~<strong>{stats.totalMinutes} min walk</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onClearItinerary}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded font-semibold hover:bg-slate-800"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Ordered Stops List */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {itinerary.map((pandal, idx) => (
          <div
            key={pandal.id}
            className="p-2.5 rounded-xl bg-darkBg-900 hover:bg-darkCard-800 border border-slate-700/60 flex items-center justify-between gap-2 text-xs transition-colors"
          >
            <div
              onClick={() => onSelectPandal(pandal)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
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
                onClick={() => onMoveUp(idx)}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                title="Move up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={idx === itinerary.length - 1}
                onClick={() => onMoveDown(idx)}
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
        ))}
      </div>

      {/* Google Maps Multi-Stop Action */}
      <div className="pt-2 border-t border-slate-700/60">
        <a
          href={multiStopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-3 bg-gradient-to-r from-festiveRed-600 via-festiveRed-700 to-festiveGold-600 hover:from-festiveRed-500 hover:to-festiveGold-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-glow-red transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5 text-white" />
          <span>Launch Multi-Stop Route in Google Maps</span>
        </a>
      </div>
    </div>
  );
};
