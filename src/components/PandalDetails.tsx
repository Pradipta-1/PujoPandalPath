import React from 'react';
import type { Pandal, UserLocation } from '../types/pandal';
import { 
  X, 
  Navigation, 
  Footprints, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  Plus, 
  Check, 
  Share2 
} from 'lucide-react';
import { formatDistance, getGoogleMapsNavigationUrl } from '../utils/geo';

interface PandalDetailsProps {
  pandal: Pandal;
  userLocation: UserLocation | null;
  isInItinerary?: boolean;
  onRequestLocation?: () => void;
  onClose: () => void;
  onStartRoute: (pandal: Pandal) => void;
  onToggleItinerary: (pandal: Pandal) => void;
}

export const PandalDetails: React.FC<PandalDetailsProps> = ({
  pandal,
  userLocation,
  isInItinerary = false,
  onRequestLocation,
  onClose,
  onStartRoute,
  onToggleItinerary
}) => {
  const gmapsUrl = getGoogleMapsNavigationUrl(pandal, userLocation);
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    const text = `Explore ${pandal.name} (${pandal.area_division}) - Nearest Metro: ${pandal.nearest_metro}. Navigated with PandalPath Kolkata 2026.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: pandal.name,
          text: text,
          url: window.location.href
        });
      } catch {
        // ignore
      }
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-darkBg-800 border border-festiveGold-500/40 rounded-2xl p-4 sm:p-5 shadow-dark-card animate-in fade-in duration-200 space-y-3.5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-festiveGold-400 bg-festiveGold-500/10 px-2.5 py-0.5 rounded-full border border-festiveGold-500/20">
              {pandal.area_division}
            </span>

            {pandal.location_verified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Verified Destination Pin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Coordinates Unverified in PDF
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white leading-tight font-festive">
            {pandal.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Category: <span className="text-festiveGold-400 font-bold">{pandal.category}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 rounded-xl bg-darkBg-900 border border-slate-700/50">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Associated Metro Hub
          </span>
          <span className="text-sm font-bold text-white block mt-0.5">
            🚇 {pandal.nearest_metro || 'Location to verify'}
          </span>
          {pandal.metro_nearest_dist && (
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Hub note: {pandal.metro_nearest_dist}
            </span>
          )}
        </div>

        <div className="p-3 rounded-xl bg-darkBg-900 border border-slate-700/50">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            PDF Route Estimate
          </span>
          <span className="text-sm font-bold text-festiveGold-400 block mt-0.5">
            🚶 {pandal.estimated_walking_distance_raw || 'Not available'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            From metro station
          </span>
        </div>
      </div>

      {/* Synchronized Live Distance from User */}
      {pandal.distance_from_user_km != null ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 to-slate-900 border border-sky-500/40 text-xs text-sky-200 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
            <div>
              <span className="text-[10px] uppercase text-sky-400 font-extrabold tracking-wider block">Live GPS Walking Distance</span>
              <strong className="text-base text-white font-extrabold">{formatDistance(pandal.distance_from_user_km)}</strong>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-sky-200 bg-sky-900/80 border border-sky-500/30 px-3 py-1 rounded-xl block">
              ~{pandal.walking_duration_mins} min walk
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">festival crowd pace</span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-darkBg-900/90 border border-slate-800 text-xs text-slate-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-[11px]">Sync device GPS to calculate live walking distance & route.</span>
          </div>
          {onRequestLocation && (
            <button
              onClick={onRequestLocation}
              className="px-2.5 py-1 bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white rounded-lg text-[11px] font-bold border border-sky-500/40 shrink-0 transition-colors"
            >
              Sync GPS
            </button>
          )}
        </div>
      )}

      {/* Original Source Notes */}
      {pandal.notes && (
        <div className="p-3 rounded-xl bg-darkBg-900 border border-slate-800 border-l-4 border-l-festiveGold-500 text-xs text-slate-200">
          <div className="flex items-center gap-1 font-bold text-festiveGold-400 text-[11px] uppercase mb-0.5">
            <BookOpen className="w-3.5 h-3.5" />
            Original Route Notes
          </div>
          <p className="italic leading-relaxed">{pandal.notes}</p>
        </div>
      )}

      {/* Caution Warnings */}
      {pandal.has_caution && (
        <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-xs text-red-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-red-400 uppercase text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5" />
            Visitor Advisory Notice
          </div>
          {pandal.caution_reasons.map((reason, idx) => (
            <p key={idx} className="text-[11px] leading-relaxed text-red-300">
              • {reason}
            </p>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-700/60 flex flex-wrap gap-2">
        {pandal.location_verified && (
          <button
            onClick={() => onStartRoute(pandal)}
            className="flex-1 py-2.5 px-3 bg-festiveRed-600 hover:bg-festiveRed-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
          >
            <Footprints className="w-4 h-4" />
            Walk Route
          </button>
        )}

        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
        >
          <ExternalLink className="w-4 h-4 text-festiveGold-400" />
          Google Maps
        </a>

        <button
          onClick={() => onToggleItinerary(pandal)}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
            isInItinerary
              ? 'bg-festiveGold-500/20 border-festiveGold-400 text-festiveGold-400'
              : 'bg-darkBg-900 hover:bg-darkBg-700 border-slate-700 text-slate-300'
          }`}
        >
          {isInItinerary ? (
            <>
              <Check className="w-4 h-4 text-festiveGold-400" />
              <span>In Plan</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add to Plan</span>
            </>
          )}
        </button>

        <button
          onClick={handleShare}
          className="p-2.5 bg-darkBg-900 hover:bg-darkBg-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
          title="Share pandal"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {copied && (
        <p className="text-center text-xs text-emerald-400 font-bold animate-pulse">
          Link copied to clipboard!
        </p>
      )}
    </div>
  );
};
