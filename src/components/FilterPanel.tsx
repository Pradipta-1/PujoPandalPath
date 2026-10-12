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
      style={{ backgroundColor: '#070d1e' }}
      className="bg-[#070d1e] border-2 border-festiveGold-500/40 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(233,196,106,0.15)] space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-festiveGold-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-festiveRed-600 to-amber-500 p-0.5 shadow-glow-red flex items-center justify-center">
            <Filter className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-black text-white uppercase tracking-wider font-festive">
            Filter Pandals
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-festiveRed-600/30 text-amber-300 border border-festiveGold-400/40 font-extrabold shadow-sm">
            {filteredCount} / {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetFilters}
            className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all font-bold active:scale-95"
            title="Reset all filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close filter modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Division Pills */}
      <div>
        <label className="block text-xs font-black text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Geographical Area</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onUpdateFilter('division', 'All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filters.division === 'All'
                ? 'bg-gradient-to-r from-festiveRed-600 via-rose-600 to-festiveRed-600 text-white border-2 border-festiveGold-300 shadow-[0_0_16px_rgba(217,4,41,0.6)] font-black scale-102'
                : 'bg-[#0d1630] hover:bg-[#132047] text-slate-100 border border-slate-700/80 hover:border-festiveGold-400 font-semibold shadow-sm'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-festiveRed-600 via-rose-600 to-festiveRed-600 text-white border-2 border-festiveGold-300 shadow-[0_0_16px_rgba(217,4,41,0.6)] font-black scale-102'
                    : 'bg-[#0d1630] hover:bg-[#132047] text-slate-100 border border-slate-700/80 hover:border-festiveGold-400 font-semibold shadow-sm'
                }`}
              >
                <span>{div}</span>
                <span className={`ml-1 font-bold ${isSelected ? 'text-amber-200' : 'text-amber-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metro & Sort Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-xs font-black text-amber-400 uppercase tracking-wider mb-1.5">
            🚇 Nearest Metro
          </label>
          <select
            value={filters.metroStation}
            onChange={(e) => onUpdateFilter('metroStation', e.target.value)}
            className="w-full bg-[#0a1226] border-2 border-slate-700 hover:border-festiveGold-400 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none transition-colors shadow-inner"
          >
            <option value="All">All Metro Stations</option>
            {allMetroStations.map((metro) => (
              <option key={metro} value={metro} className="bg-[#0a1226] text-white">
                {metro}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black text-amber-400 uppercase tracking-wider mb-1.5">
            ↕ Sort Order
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onUpdateFilter('sortBy', e.target.value as any)}
            className="w-full bg-[#0a1226] border-2 border-slate-700 hover:border-festiveGold-400 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none transition-colors shadow-inner"
          >
            <option value="recommended" className="bg-[#0a1226] text-white">Recommended (Route Order)</option>
            <option value="name" className="bg-[#0a1226] text-white">Name (A–Z)</option>
            <option value="pdf-distance" className="bg-[#0a1226] text-white">PDF Walking Distance</option>
            {hasUserLocation && (
              <option value="user-distance" className="bg-[#0a1226] text-white">Distance from My GPS</option>
            )}
          </select>
        </div>
      </div>

      {/* Radius (when user location active) */}
      {hasUserLocation && (
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          <label className="block text-xs font-black text-amber-400 uppercase tracking-wider">
            🏃 Walking Radius:
          </label>
          <div className="flex gap-2">
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-festiveGold-400 text-darkBg-950 font-black border-2 border-amber-300 shadow-glow-gold'
                      : 'bg-[#0d1630] text-slate-200 border border-slate-700 hover:border-festiveGold-400 font-bold'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* High-impact Apply Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-2 py-3 bg-gradient-to-r from-festiveRed-600 via-rose-600 to-festiveRed-600 hover:from-festiveRed-500 hover:to-rose-500 text-white font-black text-sm rounded-xl border-2 border-festiveGold-400 shadow-[0_0_22px_rgba(217,4,41,0.55)] flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <span>Apply Filter • View {filteredCount} Pandals</span>
        </button>
      )}
    </div>
  );
};
