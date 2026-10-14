import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, MapPin, ChevronRight, Navigation, Sparkles, Mic } from 'lucide-react';
import type { Pandal } from '../types/pandal';
import { searchPandals } from '../utils/search';
import { formatDistance } from '../utils/geo';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  allPandals: Pandal[];
  onSelectSuggestion?: (pandal: Pandal) => void;
  onSubmit?: () => void;
  placeholder?: string;
  variant?: 'default' | 'omnibox' | 'pill';
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  allPandals,
  onSelectSuggestion,
  onSubmit,
  placeholder = 'Search pandals by name, metro station, or area...',
  variant = 'default',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isListening, setIsListening] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Intelligent ranked & phonetic suggestions
  const allResults = useMemo(() => {
    if (!value.trim() || value.trim().length < 1) return [];
    return searchPandals(allPandals, value);
  }, [value, allPandals]);

  const suggestions = useMemo(() => {
    return allResults.slice(0, 12);
  }, [allResults]);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';
        recognition.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript;
          if (transcript) {
            onChange(transcript);
            setIsOpen(true);
          }
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      } catch {
        recognitionRef.current = null;
      }
    }
  }, [onChange]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      inputRef.current?.focus();
      return;
    }
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

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

  const handleSelect = (pandal: Pandal) => {
    setIsOpen(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(pandal);
    } else {
      onChange(pandal.name);
    }
  };

  const handleSearchSubmit = () => {
    if (suggestions.length > 0) {
      const target = selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
      handleSelect(target);
    } else if (onSubmit) {
      onSubmit();
    }
    setIsOpen(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSearchSubmit();
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
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
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
        // The capturing group makes odd entries the matched terms. Avoid
        // RegExp.test here because the global flag makes it stateful across
        // successive suggestion fragments.
        i % 2 === 1 ? (
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
      className={`relative w-full ${isOpen ? 'z-[9999]' : 'z-20'} ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* 1. OMNIBOX VARIANT (Home Page Hero - matching user's reference mockup) */}
      {variant === 'omnibox' && (
        <div className="relative flex items-center bg-[#0d0d0d]/95 border-2 border-[#e6b85c] rounded-full px-5 py-3 sm:py-3.5 shadow-[0_0_22px_rgba(230,184,92,0.32)] backdrop-blur-xl focus-within:border-festiveGold-300 focus-within:shadow-[0_0_28px_rgba(255,215,0,0.5)] transition-all">
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none selection:bg-festiveRed-600 font-medium"
          />
          <div className="flex items-center shrink-0 ml-2">
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  inputRef.current?.focus();
                }}
                className="p-1 mr-1 text-slate-400 hover:text-white rounded-full transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-1 transition-all rounded-full ${
                isListening
                  ? 'text-festiveRed-500 animate-pulse bg-festiveRed-500/20'
                  : 'text-[#f5d08a] hover:text-white'
              }`}
              title={isListening ? 'Listening... Speak now' : 'Voice Search'}
            >
              <Mic className="w-5 h-5 text-[#f5d08a]" />
            </button>

            {/* Subtle Vertical Divider */}
            <span className="w-[1px] h-5 bg-slate-600/80 mx-2 sm:mx-3" />

            <button
              type="button"
              onClick={handleSearchSubmit}
              className="p-1 text-[#f5d08a] hover:text-white transition-colors active:scale-95"
              title="Search"
            >
              <Search className="w-5 h-5 text-[#f5d08a]" />
            </button>
          </div>
        </div>
      )}

      {/* 2. PILL VARIANT (Map Floating Search Bar) */}
      {variant === 'pill' && (
        <div className="relative flex items-center h-9 px-3 rounded-full bg-[#111111]/95 border-2 border-festiveGold-400 text-xs text-white shadow-[0_0_12px_rgba(255,215,0,0.3)] backdrop-blur-md focus-within:border-festiveGold-300 focus-within:ring-1 focus-within:ring-festiveGold-400/50 w-full transition-all">
          <Search
            className="w-3.5 h-3.5 text-festiveGold-400 mr-2 shrink-0 cursor-pointer"
            onClick={handleSearchSubmit}
          />
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
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none selection:bg-festiveRed-600"
          />
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-0.5 text-slate-400 hover:text-white rounded-full transition-colors shrink-0 ml-1"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      )}

      {/* 3. DEFAULT VARIANT (Sidebar Directory) */}
      {variant === 'default' && (
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
              backgroundColor: '#121212',
              color: '#ffffff',
              colorScheme: 'dark'
            }}
            className="w-full pl-10 pr-10 py-2.5 bg-[#121212] text-white placeholder:text-slate-400 rounded-xl border-2 border-festiveGold-400 focus:border-festiveGold-300 focus:ring-2 focus:ring-festiveGold-400/40 text-sm outline-none transition-all shadow-[0_0_12px_rgba(255,215,0,0.25)]"
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
      )}

      {/* Autocomplete Dropdown - 100% OPAQUE Solid Obsidian Black Surface */}
      {isOpen && value.trim().length > 0 && (
        <div
          ref={listRef}
          style={{
            backgroundColor: '#101010',
            opacity: 1,
            zIndex: 9999
          }}
          className={`absolute top-full mt-2 bg-[#101010] border-2 border-festiveGold-400 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.98),0_0_20px_rgba(255,215,0,0.35)] overflow-hidden z-[9999] ${
            variant === 'pill'
              ? 'left-0 w-[calc(100vw-36px)] sm:w-[380px] max-w-[420px]'
              : 'left-0 right-0'
          }`}
        >
          {/* Header Status Bar */}
          <div className="px-3.5 py-2 bg-[#161616] border-b border-neutral-800 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-festiveGold-400">
              <Sparkles className="w-3.5 h-3.5 text-festiveGold-400" />
              <span>
                {allResults.length > 0
                  ? `Found ${allResults.length} matching ${allResults.length === 1 ? 'pandal' : 'pandals'}`
                  : `No pandal found for "${value}"`}
              </span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Live Search
            </span>
          </div>

          {/* Suggestions List */}
          {suggestions.length > 0 ? (
            <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800/80 p-1.5 custom-scrollbar">
              {suggestions.map((pandal, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={pandal.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(pandal)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      backgroundColor: isSelected ? '#222222' : '#101010'
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between group transition-colors border ${
                      isSelected
                        ? 'border-festiveGold-400 shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                        : 'border-transparent hover:bg-[#181818]'
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
                Try typing part of the name (e.g. <span className="text-festiveGold-400">Santosh</span>, <span className="text-festiveGold-400">Bagbazar</span>), Zone, or Metro station.
              </p>
            </div>
          )}

          {/* Footer Shortcuts Navigation Bar */}
          <div className="px-3.5 py-1.5 bg-[#141414] border-t border-neutral-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Use ↑↓ to navigate • Enter to select</span>
            <span>Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
};
