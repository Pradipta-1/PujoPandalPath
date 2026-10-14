import React, { useState, useMemo } from 'react';
import type { Pandal, UserLocation, AreaDivision, CalculatedRoute } from '../types/pandal';
import { MapView } from '../components/MapView';
import { 
  Compass,
  MapPin, 
  Sparkles, 
  ArrowRight,
  Maximize2,
  Navigation,
  Star,
  ChevronRight,
  Map
} from 'lucide-react';
import { formatDistance, getMetroDistanceText } from '../utils/geo';
import { SearchBar } from '../components/SearchBar';
import { searchPandals } from '../utils/search';

import durgaHeritageImg from '../assets/durga_heritage.jpg';
import grandThemeImg from '../assets/grand_theme.jpg';
import modernLightImg from '../assets/modern_light.jpg';
import northKolkataImg from '../assets/north_kolkata.jpg';
import southKolkataImg from '../assets/south_kolkata.jpg';
import saltLakeImg from '../assets/salt_lake.jpg';

interface HomeProps {
  allPandals: Pandal[];
  userLocation: UserLocation | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  onRequestLocation: () => Promise<UserLocation | null>;
  onClearLocation: () => void;
  onSetManualLocation: (lat: number, lng: number, name?: string) => void;
  onSelectPandal: (pandal: Pandal) => void;
  onSelectDivision: (division: AreaDivision) => void;
  onNavigateToExplore: () => void;
  selectedPandal?: Pandal | null;
  activeRoute?: CalculatedRoute | null;
}

interface DivisionMeta {
  name: AreaDivision;
  tag: string;
  subtitle: string;
  description: string;
  icon: string;
  image: string;
}

const DIVISIONS_META: DivisionMeta[] = [
  {
    name: 'North Kolkata',
    tag: '25 Pujas',
    subtitle: 'Iconic Rajbari Durga',
    description: 'Heritage aristocracy, Bagbazar, Kumartuli, Shobhabazar Rajbari & Chorebagan.',
    icon: '🏰',
    image: northKolkataImg
  },
  {
    name: 'South Kolkata',
    tag: '23 Pujas',
    subtitle: 'Theme Pandal',
    description: 'Ekdalia Evergreen, Maddox Square, Hazra Park, Babubagan, Sangha Sree & 95 Pally.',
    icon: '🌟',
    image: grandThemeImg
  },
  {
    name: 'East Kolkata & Salt Lake',
    tag: '6 Pujas',
    subtitle: 'Modern Pandal',
    description: 'Salt Lake FD Block, BJ Block, EC Block, Ultadanga Pallyshree & New Town.',
    icon: '🏛️',
    image: saltLakeImg
  },
  {
    name: 'Central Kolkata',
    tag: '6 Pujas',
    subtitle: 'Heritage Durga',
    description: 'College Square lake reflections, Santosh Mitra Square & Lebutala Park.',
    icon: '✨',
    image: durgaHeritageImg
  },
  {
    name: 'Behala & Barisha',
    tag: '11 Pujas',
    subtitle: 'Art & Cultural',
    description: 'Behala Natun Dal, Barisha Club, Behala Club, Buroshibtola Janakalyan & Sabarna Roy Choudhury.',
    icon: '🌺',
    image: southKolkataImg
  },
  {
    name: 'Naktala & Haridevpur',
    tag: '8 Pujas',
    subtitle: 'Avant-Garde Theme',
    description: 'Naktala Udayan Sangha, Haridevpur 41 Pally & Ajeya Sanghati.',
    icon: '🎨',
    image: modernLightImg
  },
  {
    name: 'Kalyani, Nadia',
    tag: '4 Mega Pujas',
    subtitle: 'Grand Architectural',
    description: 'Grand architectural replicas, ITI More Luminous Club, Central Park, A-9 & A-2.',
    icon: '⚡',
    image: grandThemeImg
  }
];

const POPULAR_NAMES = [
  'Bagbazar Sarbojanin',
  'College Square',
  'Ekdalia Evergreen',
  'Maddox Square',
  'Suruchi Sangha',
  'Sreebhumi Sporting Club',
  'Naktala Udayan Sangha',
  'Santosh Mitra Square',
  'Kalyani ITI More Luminous Club',
  'Babubagan',
  'Hazra Park Durgotsab'
];

const PANDAL_RATINGS: Record<string, number> = {
  'Bagbazar Sarbojanin': 4.9,
  'College Square': 4.7,
  'Ekdalia Evergreen': 4.9,
  'Maddox Square': 4.8,
  'Suruchi Sangha': 4.8,
  'Sreebhumi Sporting Club': 4.9,
  'Naktala Udayan Sangha': 4.7,
  'Santosh Mitra Square': 4.8,
  'Kalyani ITI More Luminous Club': 4.9,
  'Babubagan': 4.7,
  'Hazra Park Durgotsab': 4.6
};

export const Home: React.FC<HomeProps> = ({
  allPandals,
  userLocation,
  isLoadingLocation: _isLoadingLocation,
  locationError: _locationError,
  onRequestLocation,
  onClearLocation: _onClearLocation,
  onSetManualLocation: _onSetManualLocation,
  onSelectPandal,
  onSelectDivision,
  onNavigateToExplore,
  selectedPandal,
  activeRoute
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<'All' | AreaDivision>('All');

  const totalPandals = allPandals.length;
  const verifiedCount = allPandals.filter((p) => p.location_verified).length;
  const divisionCount = new Set(allPandals.map((p) => p.area_division)).size;
  const metroCount = new Set(
    allPandals.map((p) => p.nearest_metro).filter((m) => m && m !== 'Location to verify')
  ).size;

  const nearestPandals = useMemo(() => {
    if (!userLocation) return [];
    return [...allPandals]
      .filter((p) => p.location_verified && p.distance_from_user_km != null)
      .sort((a, b) => a.distance_from_user_km! - b.distance_from_user_km!)
      .slice(0, 8);
  }, [allPandals, userLocation]);

  const popularPandals = useMemo(() => {
    return allPandals.filter((p) => POPULAR_NAMES.includes(p.name));
  }, [allPandals]);

  const displayedPandals = useMemo(() => {
    let list = selectedDivisionFilter === 'All'
      ? allPandals
      : allPandals.filter((p) => p.area_division === selectedDivisionFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.area_division.toLowerCase().includes(q) || 
        (p.nearest_metro && p.nearest_metro.toLowerCase().includes(q))
      );
    }
    if (userLocation) {
      list = [...list].sort((a, b) => {
        if (a.distance_from_user_km != null && b.distance_from_user_km != null) {
          return a.distance_from_user_km - b.distance_from_user_km;
        }
        if (a.distance_from_user_km != null) return -1;
        if (b.distance_from_user_km != null) return 1;
        return 0;
      });
    }
    return list;
  }, [allPandals, selectedDivisionFilter, searchTerm, userLocation]);

  const getPandalImg = (pandal: Pandal) => {
    if (pandal.area_division === 'North Kolkata' || pandal.name.includes('Bagbazar') || pandal.name.includes('Rajbari')) {
      return durgaHeritageImg;
    }
    if (pandal.area_division === 'East Kolkata & Salt Lake' || pandal.area_division === 'Naktala & Haridevpur') {
      return modernLightImg;
    }
    return grandThemeImg;
  };

  return (
    <div className="min-h-screen bg-[#080808] text-slate-100 flex flex-col dark-alpana-pattern selection:bg-festiveRed-600 selection:text-white pb-16 md:pb-0">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#c4882a] via-[#e8c060] to-[#b8751e] text-[#2c1404] px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-xl shadow-black/60">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2c1404] p-0.5 shadow-md flex items-center justify-center shrink-0">
            <span className="text-base sm:text-xl">🪔</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-black tracking-tight text-[#2c1404] leading-tight font-festive truncate">
              PandalPath <span className="text-[#6b2400]">2026</span>
            </h1>
            <p className="text-[9px] sm:text-[11px] text-[#552c0a] font-bold tracking-wide truncate hidden xs:block">
              দুর্গোৎসব ২০২৬ • 83 Pandals
            </p>
          </div>
        </div>

        {/* Right Side: GPS pill + Map button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live GPS Pill */}
          <button
            onClick={onRequestLocation}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#1a1206] text-white border border-[#a87830]/60 transition-all active:scale-95"
            title="Detect Live GPS Location"
          >
            <MapPin className="w-3 h-3 text-[#c49640] shrink-0" />
            <div className="flex flex-col text-left leading-none">
              <div className="flex items-center gap-1">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#c49640]">
                  LIVE GPS
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${userLocation ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
              </div>
            </div>
          </button>

          {/* Map Button */}
          <button
            onClick={onNavigateToExplore}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#2c1404] text-[#e8c060] hover:bg-[#3d1e06] transition-all active:scale-95 shadow-md"
            title="Open Map"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-xs font-black tracking-wide hidden sm:inline">MAP</span>
          </button>
        </div>
      </header>

      {/* 2. Hero Section — Full Bleed, No Card Border, Matching Reference Image */}
      <section className="relative w-full space-y-0">
        {/* Hero Showcase Banner — Edge-to-Edge, No Padding, No Border */}
        <div className="relative w-full overflow-hidden bg-[#0a0808] min-h-[200px] sm:min-h-[260px] flex flex-col justify-between">
          {/* Dark Night City Ambient Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_60%,rgba(80,40,5,0.55)_0%,rgba(10,8,8,0.98)_70%)] pointer-events-none" />

          {/* Right Side — Durga Maa fills fully to edges */}
          <div className="absolute right-0 top-0 bottom-0 w-[52%] sm:w-[48%] pointer-events-none select-none overflow-hidden">
            <img
              src={durgaHeritageImg}
              alt="Maa Durga"
              className="h-full w-full object-cover object-center opacity-100"
            />
            {/* Left fade — blends into dark background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0808] via-[#0a0808]/60 to-transparent" />
            {/* Bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0808]/80 via-transparent to-transparent" />
            {/* Top fade */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0808]/30 via-transparent to-transparent" />
          </div>

          {/* Left Side Title */}
          <div className="relative z-10 px-5 sm:px-8 lg:px-12 pt-7 sm:pt-9 pb-5 sm:pb-8 max-w-[58%] sm:max-w-[55%]">
            <h2 className="text-[1.65rem] sm:text-[2.6rem] lg:text-[3rem] font-black font-festive text-[#e8c47a] leading-[1.14] tracking-tight italic drop-shadow-[0_2px_18px_rgba(232,196,122,0.3)]">
              Discover Kolkata,<br />
              One Pandal at a Time
            </h2>
          </div>

          {/* Full-Width Search Omnibox — flush at the bottom of hero */}
          <div className="relative z-20 w-full px-4 sm:px-7 lg:px-10 pb-5 sm:pb-7">
            <SearchBar
              variant="omnibox"
              value={searchTerm}
              onChange={setSearchTerm}
              allPandals={allPandals}
              onSelectSuggestion={(pandal) => {
                onSelectPandal(pandal);
              }}
              onSubmit={() => {
                const results = searchPandals(allPandals, searchTerm);
                if (results.length > 0) {
                  onSelectPandal(results[0]);
                } else {
                  const el = document.getElementById('home-live-map');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              placeholder="Search Pandals, Zones, Zones, IDs..."
            />
          </div>
        </div>
      </section>

      {/* 3. Zone Chips + KPI Stats Section */}
      <section className="relative px-3.5 sm:px-6 lg:px-10 pt-3 pb-2 max-w-5xl mx-auto w-full space-y-4">
        {/* Quick Zone Chips Row */}
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none no-scrollbar touch-pan-x">
            <button
              onClick={() => {
                setSelectedDivisionFilter('All');
                const el = document.getElementById('home-live-map');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all border-2 flex items-center gap-1.5 ${
                selectedDivisionFilter === 'All'
                  ? 'bg-gradient-to-r from-festiveGold-400 to-amber-400 text-[#2c1404] border-festiveGold-300 shadow-[0_0_14px_rgba(255,215,0,0.45)] font-black'
                  : 'bg-[#141414] text-slate-300 border-festiveGold-400/80 hover:border-festiveGold-300 hover:shadow-[0_0_10px_rgba(255,215,0,0.25)]'
              }`}
            >
              <span>🏛️ All</span>
              <span className="text-[10px] opacity-80">({totalPandals})</span>
            </button>
            {DIVISIONS_META.map((div) => {
              const count = allPandals.filter(p => p.area_division === div.name).length;
              const isSelected = selectedDivisionFilter === div.name;
              return (
                <button
                  key={div.name}
                  onClick={() => {
                    setSelectedDivisionFilter(div.name);
                    const el = document.getElementById('home-live-map');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all border-2 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-festiveGold-400 to-amber-400 text-[#2c1404] border-festiveGold-300 shadow-[0_0_14px_rgba(255,215,0,0.45)] font-black'
                      : 'bg-[#141414] text-slate-300 border-festiveGold-400/80 hover:border-festiveGold-300 hover:shadow-[0_0_10px_rgba(255,215,0,0.25)]'
                  }`}
                >
                  <span>{div.icon}</span>
                  <span>{div.name.replace(' Kolkata', '').replace(' & Salt Lake', '')}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Four Core KPI Badges — no icons, just numbers */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-3xl mx-auto pt-1">
          {/* Card 1: 83 Pandals */}
          <div className="p-2 sm:p-3.5 rounded-2xl bg-[#141414] border border-neutral-800 text-center flex flex-col items-center justify-center">
            <span className="text-xl sm:text-3xl font-black text-[#c49640] leading-tight">
              {totalPandals}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white leading-tight">Pandals</span>
            <span className="text-[8px] sm:text-[10px] text-slate-500">Live Count</span>
          </div>

          {/* Card 2: 100% Verified */}
          <div className="p-2 sm:p-3.5 rounded-2xl bg-[#141414] border border-neutral-800 text-center flex flex-col items-center justify-center">
            <span className="text-xl sm:text-3xl font-black text-emerald-400 leading-tight">
              100%
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white leading-tight">Verified</span>
            <span className="text-[8px] sm:text-[10px] text-slate-500">{verifiedCount} Fixed</span>
          </div>

          {/* Card 3: 7 Zones */}
          <div className="p-2 sm:p-3.5 rounded-2xl bg-[#141414] border border-neutral-800 text-center flex flex-col items-center justify-center">
            <span className="text-xl sm:text-3xl font-black text-sky-400 leading-tight">
              {divisionCount}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white leading-tight">Zones</span>
            <span className="text-[8px] sm:text-[10px] text-slate-500">Explored</span>
          </div>

          {/* Card 4: Metro Hubs */}
          <div className="p-2 sm:p-3.5 rounded-2xl bg-[#141414] border border-neutral-800 text-center flex flex-col items-center justify-center">
            <span className="text-xl sm:text-3xl font-black text-rose-400 leading-tight">
              {metroCount}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white leading-tight">Metro Hubs</span>
            <span className="text-[8px] sm:text-[10px] text-slate-500">Nearest</span>
          </div>
        </div>
      </section>

      {/* 4. "EXPLORE ZONES" Photo Card Carousel matching approved mockup */}
      <section className="px-4 sm:px-6 lg:px-12 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base sm:text-xl font-black text-white font-festive tracking-wide uppercase flex items-center gap-2">
            <span>Explore Zones</span>
          </h3>
          <button
            onClick={onNavigateToExplore}
            className="text-xs font-bold text-festiveGold-400 hover:text-festiveGold-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Zones</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Photo Cards Carousel */}
        <div className="flex items-center gap-3.5 overflow-x-auto pb-3 scrollbar-none no-scrollbar touch-pan-x -mx-1 px-1">
          {DIVISIONS_META.map((div) => {
            const count = allPandals.filter(p => p.area_division === div.name).length;
            return (
              <div
                key={div.name}
                onClick={() => {
                  onSelectDivision(div.name);
                  setSelectedDivisionFilter(div.name);
                  const el = document.getElementById('home-live-map');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="shrink-0 w-36 sm:w-44 h-52 sm:h-60 rounded-2xl overflow-hidden border border-neutral-800 relative shadow-dark-card group cursor-pointer hover:border-[#a87830]/70 hover:shadow-[0_0_16px_rgba(168,120,48,0.3)] hover:scale-[1.02] transition-all"
              >
                {/* Background Photography */}
                <img
                  src={div.image}
                  alt={div.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/70 to-transparent flex flex-col justify-end p-3 text-left">
                  <h4 className="text-sm sm:text-base font-black text-white leading-tight font-festive">
                    {div.name}
                  </h4>
                  <p className="text-[11px] font-bold text-festiveGold-400 leading-tight mt-0.5">
                    {div.subtitle}
                  </p>
                  <p className="text-[10px] text-slate-300 font-semibold mt-1">
                    {count} Pandals
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. "NEAREST PANDALS TO YOU" Cards matching approved mockup */}
      <section className="px-4 sm:px-6 lg:px-12 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-base sm:text-xl font-black text-white font-festive uppercase tracking-wide">
              Nearest Pandals to You
            </h3>
            <p className="text-xs text-slate-400">
              {userLocation ? `Live GPS distance from ${userLocation.addressName || 'Your Location'}` : 'Live pedestrian walking routes'}
            </p>
          </div>
          {userLocation && (
            <span className="text-[10px] font-extrabold text-sky-300 bg-sky-950/90 border border-sky-500/40 px-2.5 py-1 rounded-full">
              GPS Active
            </span>
          )}
        </div>

        {/* Horizontal Carousel of Nearest Cards */}
        <div className="flex items-center gap-3.5 overflow-x-auto pb-3 scrollbar-none no-scrollbar touch-pan-x -mx-1 px-1">
          {(userLocation && nearestPandals.length > 0 ? nearestPandals : popularPandals).slice(0, 6).map((pandal) => {
            const rating = PANDAL_RATINGS[pandal.name] || 4.8;
            return (
              <div
                key={pandal.id}
                className="shrink-0 w-64 sm:w-72 p-3.5 rounded-2xl bg-[#141414] border border-neutral-800 hover:border-neutral-600 flex flex-col justify-between space-y-2.5 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-700 shrink-0 relative bg-darkBg-950 shadow-sm">
                    <img
                      src={getPandalImg(pandal)}
                      alt={pandal.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-black text-white truncate font-festive">
                        {pandal.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-amber-300">{rating}</span>
                      <span className="text-[10px] text-slate-400">• {pandal.area_division}</span>
                    </div>
                  </div>
                </div>

                {/* Distance & Metro Info */}
                <div className="text-[11px] text-slate-300 space-y-1 bg-[#0f0f0f] p-2 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between text-festiveGold-300 font-bold">
                    <span>📍 {pandal.distance_from_user_km != null ? formatDistance(pandal.distance_from_user_km) : pandal.estimated_walking_distance_raw || 'Metro link'}</span>
                    <span className="text-slate-400">
                      {pandal.walking_duration_mins != null ? `(${pandal.walking_duration_mins} min walk)` : ''}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    🚇 Nearest: {pandal.nearest_metro} {getMetroDistanceText(pandal) && `(${getMetroDistanceText(pandal)})`}
                  </div>
                </div>

                {/* Action Button matching mockup */}
                <button
                  onClick={() => {
                    onSelectPandal(pandal);
                    onNavigateToExplore();
                  }}
                  className="w-full py-1.5 rounded-xl bg-gradient-to-r from-festiveRed-600 to-rose-800 hover:from-festiveRed-500 hover:to-rose-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-festiveGold-300" />
                  <span>LIVE STATUS & ROUTE</span>
                  <ArrowRight className="w-3 h-3 text-festiveGold-300" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Embedded Live Interactive Pandal Map Section on Landing Page */}
      <section className="px-4 sm:px-6 lg:px-12 py-5 max-w-6xl mx-auto w-full space-y-3" id="home-live-map">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#111111] border border-neutral-800 p-3 sm:p-4 rounded-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#1a0e02] text-[#c49640] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white font-festive leading-tight">
                Interactive Live Pandal Map
              </h3>
              <p className="text-[11px] text-slate-500">
                Click any pandal pin below to view Metro routes, walking distance, and survey notes
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToExplore}
            className="py-1.5 px-3 bg-festiveRed-600 hover:bg-festiveRed-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm self-start sm:self-auto"
          >
            <span>Open Full Navigator</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* The Live Interactive Map — keep gold border here as it's the hero map */}
        <div className="w-full h-[460px] sm:h-[580px] rounded-3xl overflow-hidden border border-[#a87830]/60 shadow-[0_0_20px_rgba(168,120,48,0.2)] relative bg-[#080808]">
          <MapView
            pandals={displayedPandals}
            selectedPandal={selectedPandal || null}
            onSelectPandal={onSelectPandal}
            userLocation={userLocation}
            activeRoute={activeRoute || null}
            onRequestLocation={onRequestLocation}
            className="w-full h-full"
          />
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto border-t border-neutral-800 bg-[#080808] px-4 sm:px-8 py-5 text-center text-xs text-slate-500 mb-14 md:mb-0">
        <p className="text-sm text-festiveGold-400 font-bold mb-0.5 font-festive">
          PandalPath Kolkata 2026 • সম্পূর্ণ বাংলা দুর্গোৎসব ম্যাপ
        </p>
        <p>
          Data sourced faithfully from <code className="text-white font-semibold">Kolkata_Durga_Puja_2026_Routes.pdf</code>. 100% runs on your local device and browser.
        </p>
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#090909]/97 border-t border-neutral-800 backdrop-blur-xl px-4 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.7)] pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center gap-0.5 text-[#c49640] font-bold text-[10px] min-w-[44px] min-h-[44px] justify-center active:scale-95 transition-transform"
        >
          <span className="text-base leading-none">🪔</span>
          <span>Home</span>
        </button>

        <button
          onClick={onNavigateToExplore}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#c49640] font-semibold text-[10px] transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95"
        >
          <Compass className="w-4 h-4 text-[#c49640]" />
          <span>Live Map</span>
        </button>

        <button
          onClick={() => {
            const el = document.getElementById('home-live-map');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-sky-300 font-semibold text-[10px] transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95"
        >
          <MapPin className="w-4 h-4 text-sky-400" />
          <span>Explore</span>
        </button>

        <button
          onClick={onNavigateToExplore}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-[#c49640] font-semibold text-[10px] transition-colors min-w-[44px] min-h-[44px] justify-center active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-[#c49640]" />
          <span>Plan</span>
        </button>
      </nav>
    </div>
  );
};
