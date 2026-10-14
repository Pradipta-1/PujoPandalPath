import React from 'react';
import type { Pandal, UserLocation } from '../types/pandal';
import { 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle, 
  Footprints, 
  Plus, 
  Check,
  ArrowRight
} from 'lucide-react';
import { formatDistance, getGoogleMapsNavigationUrl, getMetroDistanceText } from '../utils/geo';

import durgaHeritageImg from '../assets/durga_heritage.jpg';
import grandThemeImg from '../assets/grand_theme.jpg';
import modernLightImg from '../assets/modern_light.jpg';
import southKolkataImg from '../assets/south_kolkata.jpg';

interface PandalCardProps {
  pandal: Pandal;
  isSelected?: boolean;
  isInItinerary?: boolean;
  userLocation?: UserLocation | null;
  onSelect: (pandal: Pandal) => void;
  onToggleItinerary?: (pandal: Pandal) => void;
  onStartRoute?: (pandal: Pandal) => void;
}

const getPandalThumb = (pandal: Pandal) => {
  if (pandal.area_division === 'North Kolkata' || pandal.name.includes('Bagbazar') || pandal.name.includes('Rajbari')) {
    return durgaHeritageImg;
  }
  if (pandal.area_division === 'East Kolkata & Salt Lake' || pandal.area_division === 'Naktala & Haridevpur') {
    return modernLightImg;
  }
  if (pandal.area_division === 'Behala & Barisha') {
    return southKolkataImg;
  }
  return grandThemeImg;
};

const getCrowdLevel = (pandal: Pandal) => {
  const highCrowd = [
    'Bagbazar Sarbojanin', 'College Square', 'Ekdalia Evergreen', 'Maddox Square',
    'Suruchi Sangha', 'Sreebhumi Sporting Club', 'Santosh Mitra Square', 'Kalyani ITI More Luminous Club'
  ];
  if (highCrowd.includes(pandal.name)) {
    return { label: 'High', color: 'text-rose-400 font-extrabold' };
  }
  if (pandal.area_division === 'North Kolkata' || pandal.area_division === 'South Kolkata') {
    return { label: 'Medium', color: 'text-amber-400 font-bold' };
  }
  return { label: 'Normal', color: 'text-emerald-400 font-semibold' };
};

export const PandalCard: React.FC<PandalCardProps> = React.memo(({
  pandal,
  isSelected = false,
  isInItinerary = false,
  userLocation,
  onSelect,
  onToggleItinerary,
  onStartRoute
}) => {
  const gmapsUrl = getGoogleMapsNavigationUrl(pandal, userLocation);
  const crowd = getCrowdLevel(pandal);
  const thumb = getPandalThumb(pandal);

  return (
    <div
      onClick={() => onSelect(pandal)}
      className={`group relative rounded-2xl p-3.5 transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-[#1a1a1a] border-[#a87830]/80 shadow-[0_0_14px_rgba(168,120,48,0.25)] ring-1 ring-[#a87830]/40'
          : 'bg-[#141414] hover:bg-[#1c1c1c] border-neutral-800 hover:border-neutral-600 shadow-dark-card'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Photo Thumbnail matching approved mobile mockup */}
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-neutral-700 shrink-0 relative bg-darkBg-950 shadow-sm">
          <img
            src={thumb}
            alt={pandal.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Content Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-festiveGold-400 bg-festiveGold-500/10 px-2 py-0.5 rounded-full border border-festiveGold-400/80 truncate max-w-[130px]">
              {pandal.area_division}
            </span>

            {pandal.location_verified ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                <HelpCircle className="w-2.5 h-2.5 text-amber-400" />
                Review
              </span>
            )}
          </div>

          <h3 className="text-sm font-black text-white group-hover:text-festiveGold-400 transition-colors line-clamp-1 font-festive">
            {pandal.name}
          </h3>

          {/* Quick Metrics matching mockup */}
          <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-1 flex-wrap">
            <span>
              🚇 Metro: <strong className="text-white">{pandal.nearest_metro || 'N/A'}</strong>
              {getMetroDistanceText(pandal) && (
                <span className="text-festiveGold-300 font-bold ml-1.5">
                  ({getMetroDistanceText(pandal)})
                </span>
              )}
            </span>
            <span>•</span>
            <span>Crowd: <span className={crowd.color}>{crowd.label}</span></span>
          </div>

          <div className="text-[11px] text-festiveGold-300 mt-0.5 font-bold">
            🚶 Walk: {pandal.walking_duration_mins != null ? `${pandal.walking_duration_mins} mins` : pandal.estimated_walking_distance_raw || 'Metro link'}
            {pandal.distance_from_user_km != null && (
              <span className="text-sky-300 ml-1.5">({formatDistance(pandal.distance_from_user_km)})</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons matching mobile bottom sheet mockup */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2">
        {pandal.location_verified && onStartRoute && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartRoute(pandal);
            }}
            className="flex-1 py-1.5 px-3 bg-gradient-to-r from-festiveRed-600 to-rose-800 hover:from-festiveRed-500 hover:to-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Footprints className="w-3.5 h-3.5 text-festiveGold-300" />
            <span>Walk</span>
            <ArrowRight className="w-3 h-3 text-festiveGold-300" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(pandal);
          }}
          className="py-1.5 px-2.5 bg-darkBg-900 hover:bg-darkBg-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-neutral-700 transition-colors active:scale-95"
        >
          <MapPin className="w-3.5 h-3.5 text-festiveGold-400" />
          <span>Pin</span>
        </button>

        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="py-1.5 px-2.5 bg-transparent hover:bg-[#1a1a1a] text-[#c49640] border border-neutral-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors active:scale-95"
          title="Open Google Maps navigation"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Maps</span>
        </a>

        {onToggleItinerary && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleItinerary(pandal);
            }}
            className={`p-1 rounded-xl text-xs font-bold transition-all border shrink-0 ${
              isInItinerary
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                : 'bg-darkBg-900 text-slate-400 hover:text-festiveGold-400 border-slate-800'
            }`}
            title={isInItinerary ? 'Remove from tour' : 'Add to tour'}
          >
            {isInItinerary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
});

PandalCard.displayName = 'PandalCard';
