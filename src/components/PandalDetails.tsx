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
import { formatDistance, getGoogleMapsNavigationUrl, getMetroDistanceText } from '../utils/geo';

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
    <div className="bg-gradient-to-b from-[#141414] to-[#0a0a0a] border-2 border-festiveGold-400 rounded-2xl p-4 sm:p-5 shadow-[0_0_22px_rgba(255,215,0,0.35)] animate-in fade-in duration-200 space-y-3.5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider text-festiveGold-400 bg-festiveGold-500/10 px-2.5 py-0.5 rounded-full border border-festiveGold-400/80">
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
          <p className="text-xs text-slate-300 mt-1">
            Category: <span className="text-festiveGold-400 font-bold">{pandal.category}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-festiveGold-400 hover:text-white rounded-lg hover:bg-[#202020] border border-festiveGold-400/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="p-3 rounded-xl bg-[#161616] border-2 border-festiveGold-400/80 shadow-[0_0_10px_rgba(255,215,0,0.15)]">
          <span className="text-[10px] uppercase font-bold text-festiveGold-400 block tracking-wider">
            Associated Metro Hub
          </span>
          <span className="text-sm font-bold text-white block mt-0.5">
            🚇 {pandal.nearest_metro || 'Location to verify'}
            {getMetroDistanceText(pandal) && (
              <span className="text-festiveGold-300 font-bold ml-1.5 text-xs">
                ({getMetroDistanceText(pandal)})
              </span>
            )}
          </span>
          {pandal.metro_nearest_dist && (
            <span className="text-[11px] text-slate-300 block mt-0.5">
              Hub note: {pandal.metro_nearest_dist}
            </span>
          )}
        </div>

        <div className="p-3 rounded-xl bg-[#161616] border-2 border-festiveGold-400/80 shadow-[0_0_10px_rgba(255,215,0,0.15)]">
          <span className="text-[10px] uppercase font-bold text-festiveGold-400 block tracking-wider">
            PDF Route Estimate
          </span>
          <span className="text-sm font-bold text-festiveGold-300 block mt-0.5">
            🚶 {pandal.estimated_walking_distance_raw || 'Not available'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            From metro station
          </span>
        </div>
      </div>

      {/* Synchronized Live Distance from User */}
      {pandal.distance_from_user_km != null ? (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#181818] via-[#141414] to-[#101010] border-2 border-festiveGold-400 text-xs text-festiveGold-100 flex items-center justify-between shadow-[0_0_16px_rgba(255,215,0,0.25)]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-festiveGold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-festiveGold-500"></span>
            </span>
            <div>
              <span className="text-[10px] uppercase text-festiveGold-400 font-extrabold tracking-wider block">Live GPS Walking Distance</span>
              <strong className="text-base text-white font-extrabold">{formatDistance(pandal.distance_from_user_km)}</strong>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-festiveGold-300 bg-black/80 border-2 border-festiveGold-400/70 px-3 py-1 rounded-xl block shadow-sm">
              ~{pandal.walking_duration_mins} min walk
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">festival crowd pace</span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-[#161616] border-2 border-festiveGold-400/40 text-xs text-slate-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-festiveGold-400 shrink-0" />
            <span className="text-[11px]">Sync device GPS to calculate live walking distance & route.</span>
          </div>
          {onRequestLocation && (
            <button
              onClick={onRequestLocation}
              className="px-2.5 py-1 bg-gradient-to-r from-festiveGold-500/20 to-amber-500/20 hover:from-festiveGold-500/40 hover:to-amber-500/40 text-festiveGold-300 hover:text-white rounded-lg text-[11px] font-bold border border-festiveGold-400/60 shrink-0 transition-colors"
            >
              Sync GPS
            </button>
          )}
        </div>
      )}

      {/* Original Source Notes */}
      {pandal.notes && (
        <div className="p-3 rounded-xl bg-[#161616] border-2 border-festiveGold-400/70 border-l-4 border-l-festiveGold-400 text-xs text-slate-200">
          <div className="flex items-center gap-1 font-bold text-festiveGold-400 text-[11px] uppercase mb-0.5 tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            Original Route Notes
          </div>
          <p className="italic leading-relaxed text-slate-200">{pandal.notes}</p>
        </div>
      )}

      {/* Caution Warnings */}
      {pandal.has_caution && (
        <div className="p-3 rounded-xl bg-[#180a0a] border-2 border-red-500/60 text-xs text-red-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-red-400 uppercase text-[11px] tracking-wider">
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
      <div className="pt-2 border-t border-festiveGold-400/40 flex flex-wrap gap-2">
        {pandal.location_verified && (
          <button
            onClick={() => onStartRoute(pandal)}
            className="flex-1 py-2.5 px-3 bg-gradient-to-r from-festiveRed-600 to-rose-700 hover:from-festiveRed-500 hover:to-rose-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_14px_rgba(217,4,41,0.5)] border-2 border-festiveGold-300 transition-all active:scale-95"
          >
            <Footprints className="w-4 h-4 text-festiveGold-200" />
            Walk Route
          </button>
        )}

        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-400 via-festiveGold-400 to-amber-500 hover:from-amber-300 hover:to-festiveGold-300 text-[#200e02] font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_14px_rgba(255,215,0,0.5)] border-2 border-festiveGold-200 active:scale-95"
        >
          <ExternalLink className="w-4 h-4 text-[#200e02]" />
          <span>Google Maps</span>
        </a>

        <button
          onClick={() => onToggleItinerary(pandal)}
          className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 transition-all active:scale-95 ${
            isInItinerary
              ? 'bg-festiveGold-500/25 border-festiveGold-300 text-festiveGold-300 shadow-[0_0_10px_rgba(255,215,0,0.3)]'
              : 'bg-[#161616] hover:bg-[#222222] border-festiveGold-400/70 text-slate-200 hover:text-white'
          }`}
        >
          {isInItinerary ? (
            <>
              <Check className="w-4 h-4 text-festiveGold-300" />
              <span>In Plan</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-festiveGold-400" />
              <span>Add to Plan</span>
            </>
          )}
        </button>

        <button
          onClick={handleShare}
          className="p-2.5 bg-[#161616] hover:bg-[#222222] border-2 border-festiveGold-400/70 text-festiveGold-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-colors shadow-sm active:scale-95"
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
