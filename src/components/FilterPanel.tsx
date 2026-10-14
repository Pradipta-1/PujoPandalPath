import React from 'react';
import type { FilterOptions, AreaDivision } from '../types/pandal';
import { Filter, RotateCcw, X, Sparkles } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterOptions;
  allMetroStations: string[];
  divisionCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  hasUserLocation: boolean;
  onUpdateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  onResetFilters: () => void;
  onClose?: () => void;
}

const DIVISIONS: AreaDivision[] = [
  'North Kolkata',
  'Central Kolkata',
  'South Kolkata',
  'East Kolkata & Salt Lake',
  'Naktala & Haridevpur',
  'Behala & Barisha',
  'Kalyani, Nadia'
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  allMetroStations,
  divisionCounts,
  totalCount,
  filteredCount,
  hasUserLocation,
  onUpdateFilter,
  onResetFilters,
  onClose
}) => {
  return (
    <div
      style={{ backgroundColor: '#0d0d0d' }}
      className="bg-[#0d0d0d] border-2 border-festiveGold-500/40 rounded-2xl p-2.5 sm:p-3 shadow-[0_12px_40px_rgba(0,0,0,0.95)] space-y-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-festiveGold-500/20 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-festiveRed-600 to-amber-500 p-0.5 shadow-sm flex items-center justify-center">
            <Filter className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-festive">
            Filter Pandals
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-festiveRed-600/30 text-amber-300 border border-festiveGold-400/40 font-bold">
            {filteredCount} / {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onResetFilters}
            className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all font-bold active:scale-95"
            title="Reset all filters"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close filter modal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Division Pills */}
      <div>
        <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          <span>Geographical Area</span>
        </label>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onUpdateFilter('division', 'All')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
              filters.division === 'All'
                ? 'bg-gradient-to-r from-festiveRed-600 to-rose-600 text-white border border-festiveGold-300 shadow-sm font-black'
                : 'bg-[#171717] hover:bg-[#222222] text-slate-200 border border-neutral-700/80 font-semibold'
            }`}
          >
            All <span className="text-amber-300 font-bold ml-0.5">({totalCount})</span>
          </button>
          {DIVISIONS.map((div) => {
            const isSelected = filters.division === div;
            const count = divisionCounts[div] || 0;
            return (
              <button
                key={div}
                onClick={() => onUpdateFilter('division', div)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-festiveRed-600 to-rose-600 text-white border border-festiveGold-300 shadow-sm font-black'
                    : 'bg-[#171717] hover:bg-[#222222] text-slate-200 border border-neutral-700/80 font-semibold'
                }`}
              >
                <span>{div.replace(' Kolkata', '').replace(' & Salt Lake', '')}</span>
                <span className={`ml-1 font-bold ${isSelected ? 'text-amber-200' : 'text-amber-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metro & Sort Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">
            🚇 Nearest Metro
          </label>
          <select
            value={filters.metroStation}
            onChange={(e) => onUpdateFilter('metroStation', e.target.value)}
            className="w-full bg-[#171717] border border-neutral-700 hover:border-festiveGold-400 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none transition-colors"
          >
            <option value="All">All Metro Stations</option>
            {allMetroStations.map((metro) => (
              <option key={metro} value={metro} className="bg-[#171717] text-white">
                {metro}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">
            ↕ Sort Order
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onUpdateFilter('sortBy', e.target.value as any)}
            className="w-full bg-[#171717] border border-neutral-700 hover:border-festiveGold-400 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none transition-colors"
          >
            <option value="recommended" className="bg-[#171717] text-white">Recommended (Route Order)</option>
            <option value="name" className="bg-[#171717] text-white">Name (A–Z)</option>
            <option value="pdf-distance" className="bg-[#171717] text-white">PDF Walking Distance</option>
            {hasUserLocation && (
              <option value="user-distance" className="bg-[#171717] text-white">Distance from My GPS</option>
            )}
          </select>
        </div>
      </div>

      {/* Radius (when user location active) */}
      {hasUserLocation && (
        <div className="pt-1.5 border-t border-neutral-800 space-y-1">
          <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider">
            🏃 Walking Radius:
          </label>
          <div className="flex gap-1.5">
            {[
              { label: 'All', val: 'all' },
              { label: '1 km', val: 1 },
              { label: '3 km', val: 3 },
              { label: '5 km', val: 5 }
            ].map((r) => {
              const isSelected = filters.radiusKm === r.val;
              return (
                <button
                  key={r.label}
                  onClick={() => onUpdateFilter('radiusKm', r.val as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-festiveGold-400 text-black font-black border border-amber-300'
                      : 'bg-[#171717] text-slate-200 border border-neutral-700 hover:border-festiveGold-400'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Apply Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-1 py-2 bg-gradient-to-r from-festiveRed-600 to-rose-700 hover:from-festiveRed-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl border border-festiveGold-400/50 shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <span>Apply Filter • View {filteredCount} Pandals</span>
        </button>
      )}
    </div>
  );
};
