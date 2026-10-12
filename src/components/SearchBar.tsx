import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, MapPin, ChevronRight, Navigation, Sparkles } from 'lucide-react';
import type { Pandal } from '../types/pandal';
import { searchPandals } from '../utils/search';
import { formatDistance } from '../utils/geo';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  allPandals: Pandal[];
  onSelectSuggestion?: (pandal: Pandal) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  allPandals,
  onSelectSuggestion,
  placeholder = 'Search pandals by name, metro station, or area...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Intelligent ranked & phonetic suggestions
  const suggestions = useMemo(() => {
    if (!value.trim() || value.trim().length < 1) return [];
    const results = searchPandals(allPandals, value);
    return results.slice(0, 8);
  }, [value, allPandals]);

  // Reset keyboard selection index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Handle clicking outside to dismiss
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
      if (target) {
        handleSelect(target);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelect = (pandal: Pandal) => {
    onChange(pandal.name);
    setIsOpen(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(pandal);
    }
  };

  // Helper to highlight matching text in pandal name
  const renderHighlightedName = (name: string, query: string) => {
    const cleanQ = query.trim();
    if (!cleanQ) return name;

    const tokens = cleanQ.split(/\s+/).filter(Boolean);
    const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!escaped) return name;

    try {
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = name.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            className="text-festiveGold-400 font-black underline decoration-festiveGold-400/60"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    } catch {
      return name;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isOpen ? 'z-50' : 'z-20'}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-festiveGold-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            backgroundColor: '#070d1e',
            color: '#ffffff',
            colorScheme: 'dark'
          }}
          className="w-full pl-10 pr-10 py-3 bg-[#070d1e] text-white placeholder:text-slate-400 rounded-xl border border-festiveGold-500/40 focus:border-festiveGold-400 focus:ring-2 focus:ring-festiveGold-500/30 text-sm outline-none transition-all shadow-dark-card"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown - 100% OPAQUE Solid Dark Surface (NO bleed-through) */}
      {isOpen && value.trim().length > 0 && (
        <div
          ref={listRef}
          style={{
            backgroundColor: '#070d1e',
            opacity: 1
          }}
          className="absolute top-full left-0 right-0 mt-2 bg-[#070d1e] border-2 border-festiveGold-500/60 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden z-[9999]"
        >
          {/* Header Status Bar */}
          <div className="px-3.5 py-2 bg-[#0b132b] border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-festiveGold-400">
              <Sparkles className="w-3.5 h-3.5 text-festiveGold-400" />
              <span>
                {suggestions.length > 0
                  ? `Found ${suggestions.length} matching pandals for "${value}"`
                  : `No exact pandal found for "${value}"`}
              </span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Live Search
            </span>
          </div>

          {/* Suggestions List */}
          {suggestions.length > 0 ? (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 p-1.5 custom-scrollbar">
              {suggestions.map((pandal, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={pandal.id}
                    type="button"
                    onClick={() => handleSelect(pandal)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      backgroundColor: isSelected ? '#141f3d' : '#070d1e'
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between group transition-colors border ${
                      isSelected
                        ? 'border-festiveGold-500/60 shadow-md'
                        : 'border-transparent hover:bg-[#101b38]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-festiveRed-600/20 text-festiveRed-500 border border-festiveRed-500/40 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-festiveRed-400" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate group-hover:text-festiveGold-400 transition-colors">
                          {renderHighlightedName(pandal.name, value)}
                        </div>

                        <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5 truncate flex-wrap">
                          <span className="text-[10px] font-bold text-festiveGold-400 bg-festiveGold-500/10 px-2 py-0.5 rounded-md border border-festiveGold-500/20">
                            {pandal.area_division}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            🚇 {pandal.nearest_metro}
                          </span>
                          {pandal.estimated_walking_distance_raw && (
                            <span className="text-slate-400 text-[11px]">
                              🚶 {pandal.estimated_walking_distance_raw}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {pandal.distance_from_user_km != null && (
                        <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-sky-300 bg-sky-950/80 px-2 py-1 rounded-lg border border-sky-500/30">
                          <Navigation className="w-3 h-3 text-sky-400" />
                          <span>{formatDistance(pandal.distance_from_user_km)}</span>
                        </div>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-colors ${
                          isSelected
                            ? 'text-festiveGold-400 translate-x-0.5'
                            : 'text-slate-500 group-hover:text-festiveGold-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">
                No matching pandals found for &quot;{value}&quot;
              </p>
              <p className="text-[11px] text-slate-400">
                Try searching by area (e.g. <span className="text-festiveGold-400">North</span>, <span className="text-festiveGold-400">Salt Lake</span>), Metro station, or key name.
              </p>
            </div>
          )}

          {/* Footer Shortcuts Navigation Bar */}
          <div className="px-3.5 py-1.5 bg-[#0b132b] border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Use ↑↓ to navigate • Enter to select</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
};
