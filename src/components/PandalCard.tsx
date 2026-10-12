import React from 'react';
import type { Pandal, UserLocation } from '../types/pandal';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  Footprints, 
  Plus, 
  Check 
} from 'lucide-react';
import { formatDistance, getGoogleMapsNavigationUrl } from '../utils/geo';

interface PandalCardProps {
  pandal: Pandal;
  isSelected?: boolean;
  isInItinerary?: boolean;
  userLocation?: UserLocation | null;
  onSelect: (pandal: Pandal) => void;
  onToggleItinerary?: (pandal: Pandal) => void;
  onStartRoute?: (pandal: Pandal) => void;
}

export const PandalCard: React.FC<PandalCardProps> = ({
  pandal,
  isSelected = false,
  isInItinerary = false,
  userLocation,
  onSelect,
  onToggleItinerary,
  onStartRoute
}) => {
  const gmapsUrl = getGoogleMapsNavigationUrl(pandal, userLocation);

  return (
    <div
      onClick={() => onSelect(pandal)}
      className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-darkCard-800 border-festiveGold-400 shadow-glow-gold ring-1 ring-festiveGold-400/50'
          : 'bg-darkBg-800/80 hover:bg-darkCard-800 border-slate-700/60 hover:border-festiveGold-500/40 shadow-dark-card'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-festiveGold-400 bg-festiveGold-500/10 px-2.5 py-1 rounded-full border border-festiveGold-500/20">
          {pandal.area_division}
        </span>

        {pandal.location_verified ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Verified Pin
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            <HelpCircle className="w-3 h-3 text-amber-400" />
            Pin Unverified
          </span>
        )}
      </div>

      {/* Pandal Title */}
      <h3 className="text-base font-bold text-white group-hover:text-festiveGold-400 transition-colors line-clamp-1">
        {pandal.name}
      </h3>

      {/* Metro & Distance Details */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-darkBg-900/80 rounded-xl p-2 border border-slate-700/40">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Nearest Metro</span>
          <span className="font-bold text-white truncate block mt-0.5">
            🚇 {pandal.nearest_metro || 'N/A'}
          </span>
        </div>

        <div className="bg-darkBg-900/80 rounded-xl p-2 border border-slate-700/40">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">PDF Est. Walk</span>
          <span className="font-bold text-festiveGold-400 block mt-0.5">
            🚶 {pandal.estimated_walking_distance_raw || 'Not available'}
          </span>
        </div>
      </div>

      {/* Synchronized Live GPS Walking Distance */}
      {pandal.distance_from_user_km != null && (
        <div className="mt-2.5 flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-blue-950/70 to-slate-900 border border-sky-500/35 text-xs text-sky-200 shadow-sm">
          <span className="flex items-center gap-1.5 font-bold text-[11px] text-sky-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <Navigation className="w-3 h-3 text-sky-400" />
            Walk: <span className="text-white font-extrabold">{formatDistance(pandal.distance_from_user_km)}</span>
          </span>
          <span className="text-sky-200 text-[11px] font-bold bg-sky-900/60 px-2 py-0.5 rounded-md border border-sky-600/30">
            ~{pandal.walking_duration_mins} min walk
          </span>
        </div>
      )}

      {/* Notes */}
      {pandal.notes && (
        <div className="mt-2.5 text-xs text-slate-300/90 italic bg-darkBg-900 p-2 rounded-xl border border-slate-800 border-l-2 border-l-festiveGold-500/80">
          {pandal.notes}
        </div>
      )}

      {/* Actions Bar */}
      <div className="mt-3.5 pt-3 border-t border-slate-700/50 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(pandal);
          }}
          className="flex-1 py-1.5 px-2.5 bg-darkBg-900 hover:bg-darkBg-700 text-slate-100 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-festiveGold-400" />
          View on Map
        </button>

        {pandal.location_verified && onStartRoute && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartRoute(pandal);
            }}
            title="Calculate walking path"
            className="py-1.5 px-3 bg-festiveRed-600 hover:bg-festiveRed-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-md transition-colors"
          >
            <Footprints className="w-3.5 h-3.5" />
            Walk
          </button>
        )}

        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Open in Google Maps"
          className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors border border-slate-700"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Maps
        </a>

        {onToggleItinerary && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleItinerary(pandal);
            }}
            title={isInItinerary ? 'Remove from Plan' : 'Add to Plan'}
            className={`p-1.5 rounded-xl border transition-all ${
              isInItinerary
                ? 'bg-festiveGold-500/20 border-festiveGold-400 text-festiveGold-400'
                : 'bg-darkBg-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isInItinerary ? <Check className="w-4 h-4 text-festiveGold-400" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};
