import React, { useState, useEffect, useMemo } from 'react';
import type { Pandal, UserLocation, AreaDivision, CalculatedRoute } from '../types/pandal';
import { SearchBar } from '../components/SearchBar';
import { LocationControl } from '../components/LocationControl';
import { MapView } from '../components/MapView';
import { 
  Compass, 
  MapPin, 
  Sparkles, 
  BookOpen, 
  ArrowRight,
  Award,
  Maximize2,
  Navigation
} from 'lucide-react';
import { formatDistance } from '../utils/geo';
import rawQualityNotes from '../data/quality_notes.json';

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

const DIVISIONS_META: { name: AreaDivision; tag: string; description: string; icon: string }[] = [
  {
    name: 'North Kolkata',
    tag: '25 Pujas',
    description: 'Heritage aristocracy, Bagbazar, Kumartuli, Shobhabazar Rajbari & Chorebagan.',
    icon: '🏰'
  },
  {
    name: 'Central Kolkata',
    tag: '6 Pujas',
    description: 'College Square lake reflections, Santosh Mitra Square & Lebutala Park.',
    icon: '✨'
  },
  {
    name: 'South Kolkata',
    tag: '23 Pujas',
    description: 'Ekdalia Evergreen, Maddox Square, Hazra Park, Babubagan, Sangha Sree & 95 Pally.',
    icon: '🌟'
  },
  {
    name: 'East Kolkata & Salt Lake',
    tag: '6 Pujas',
    description: 'Salt Lake FD Block, BJ Block, EC Block, Ultadanga Pallyshree & New Town.',
    icon: '🏛️'
  },
  {
    name: 'Naktala & Haridevpur',
    tag: '8 Pujas',
    description: 'Naktala Udayan Sangha, Haridevpur 41 Pally & Ajeya Sanghati.',
    icon: '🎨'
  },
  {
    name: 'Behala & Barisha',
    tag: '11 Pujas',
    description: 'Behala Natun Dal, Barisha Club, Behala Club, Buroshibtola Janakalyan & Sabarna Roy Choudhury.',
    icon: '🌺'
  },
  {
    name: 'Kalyani, Nadia',
    tag: '4 Mega Pujas',
    description: 'Grand architectural replicas, ITI More Luminous Club, Central Park, A-9 & A-2.',
    icon: '⚡'
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

export const Home: React.FC<HomeProps> = ({
  allPandals,
  userLocation,
  isLoadingLocation,
  locationError,
  onRequestLocation,
  onClearLocation,
  onSetManualLocation,
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

  // Dynamic tab for featured section: defaults to 'nearest' when userLocation exists
  const [featuredTab, setFeaturedTab] = useState<'nearest' | 'popular'>('popular');

  // Auto-switch to 'nearest' whenever userLocation is selected or updated
  useEffect(() => {
    if (userLocation) {
      setFeaturedTab('nearest');
    } else {
      setFeaturedTab('popular');
    }
  }, [userLocation?.lat, userLocation?.lng]);

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
  }, [allPandals, selectedDivisionFilter, userLocation]);

  return (
    <div className="min-h-screen bg-darkBg-900 text-slate-100 flex flex-col dark-alpana-pattern selection:bg-festiveRed-600 selection:text-white">
      {/* Top Sticky Navigation Bar */}
      <header
        style={{ backgroundColor: '#050814' }}
        className="sticky top-0 z-50 bg-[#050814] text-white border-b border-festiveGold-500/30 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-xl shadow-black/50"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-festiveRed-600 via-amber-500 to-festiveGold-500 p-0.5 shadow-glow-red flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-darkBg-950 rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
              <span className="text-base sm:text-xl">🪔</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-black tracking-tight text-white leading-tight font-festive truncate">
                PandalPath <span className="text-festiveGold-400">2026</span>
              </h1>
              <span className="hidden md:inline text-[10px] font-bold bg-festiveGold-500/20 text-festiveGold-300 border border-festiveGold-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                দুর্গোৎসব ২০২৬
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-wide truncate">
              <span className="sm:hidden">6 Zones + Kalyani • {totalPandals} Pandals</span>
              <span className="hidden sm:inline">Official 6 Divisions + Kalyani Hub • {totalPandals} Listed Pandals</span>
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToExplore}
          className="py-1.5 px-3 sm:py-2 sm:px-4 bg-gradient-to-r from-festiveRed-600 via-festiveRed-700 to-festiveRed-600 hover:from-festiveRed-500 hover:to-festiveRed-600 text-white border border-festiveGold-400/50 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-glow-red transition-all active:scale-95 shrink-0 whitespace-nowrap ml-2"
        >
          <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-festiveGold-300 shrink-0" />
          <span className="hidden sm:inline">Launch Live Map</span>
          <span className="sm:hidden">Live Map</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-festiveGold-300 shrink-0" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-12 pt-8 pb-8 sm:pt-12 sm:pb-10 text-center max-w-4xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-festiveGold-500/10 border border-festiveGold-500/30 text-xs font-bold text-festiveGold-400 shadow-sm animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-festiveGold-400" />
          <span>Kolkata Durga Puja 2026 Directory & Supplementary Hubs</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight font-festive">
          Discover Kolkata, <br />
          <span className="bg-gradient-to-r from-festiveGold-300 via-amber-200 to-festiveGold-400 bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(233,196,106,0.35)]">
            One Pandal at a Time
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Navigate all {totalPandals} pandals across North, Central, South Kolkata, Salt Lake, Naktala, Behala, and Kalyani. Real transit hubs, walking distance estimates, live GPS matching, and custom routes.
        </p>

        {/* Search & Location Bar */}
        <div className="relative z-30 max-w-2xl mx-auto bg-darkBg-800/95 border border-festiveGold-500/40 rounded-2xl p-4 shadow-dark-card space-y-3 backdrop-blur-xl">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
            }}
            allPandals={allPandals}
            onSelectSuggestion={(pandal) => {
              onSelectPandal(pandal);
              onNavigateToExplore();
            }}
            placeholder="Search pandals (e.g., Sreebhumi, Bagbazar, Maddox Square)..."
          />

          <div className="relative z-10">
            <LocationControl
              userLocation={userLocation}
              isLoading={isLoadingLocation}
              error={locationError}
              onRequestLocation={onRequestLocation}
              onClearLocation={onClearLocation}
              onSetManualLocation={onSetManualLocation}
            />
          </div>
        </div>

        {/* Dynamic Statistics with Clean, Bold Modern Typography */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-1">
          <div className="p-4 rounded-2xl bg-darkBg-800/90 border border-slate-700/60 shadow-dark-card backdrop-blur-md">
            <span className="text-3xl sm:text-4xl font-black text-festiveGold-400 block font-sans tracking-tight">
              {totalPandals}
            </span>
            <span className="text-xs text-slate-400 font-bold mt-1 block">Total Pandals</span>
          </div>

          <div className="p-4 rounded-2xl bg-darkBg-800/90 border border-slate-700/60 shadow-dark-card backdrop-blur-md">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 block font-sans tracking-tight">
              {verifiedCount}
            </span>
            <span className="text-xs text-slate-400 font-bold mt-1 block">GPS Verified Pins</span>
          </div>

          <div className="p-4 rounded-2xl bg-darkBg-800/90 border border-slate-700/60 shadow-dark-card backdrop-blur-md">
            <span className="text-3xl sm:text-4xl font-black text-sky-400 block font-sans tracking-tight">
              {divisionCount}
            </span>
            <span className="text-xs text-slate-400 font-bold mt-1 block">Geographical Areas</span>
          </div>

          <div className="p-4 rounded-2xl bg-darkBg-800/90 border border-slate-700/60 shadow-dark-card backdrop-blur-md">
            <span className="text-3xl sm:text-4xl font-black text-festiveRed-500 block font-sans tracking-tight">
              {metroCount}
            </span>
            <span className="text-xs text-slate-400 font-bold mt-1 block">Metro Hubs Linked</span>
          </div>
        </div>
      </section>

      {/* Embedded Live Interactive Pandal Map Section on Landing Page */}
      <section className="px-4 sm:px-6 lg:px-12 py-6 max-w-6xl mx-auto w-full space-y-3.5" id="home-live-map">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-darkBg-800/90 border border-festiveGold-500/30 p-3.5 sm:p-4 rounded-2xl backdrop-blur-md shadow-dark-card">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-festiveRed-600/20 border border-festiveRed-500/40 text-festiveGold-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-festiveGold-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white font-festive leading-tight">
                  Interactive Live Pandal Map
                </h3>
                <span className="text-[10px] font-sans font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {verifiedCount} Verified Pins
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-normal">
                Click any pandal pin below to view Metro routes, walking distance, and survey notes
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToExplore}
            className="py-2 px-3 sm:px-3.5 bg-festiveRed-600 hover:bg-festiveRed-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors shrink-0 whitespace-nowrap active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open Fullscreen Explorer</span>
          </button>
        </div>

        {/* Division Filter Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDivisionFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
              selectedDivisionFilter === 'All'
                ? 'bg-festiveRed-600 text-white border-festiveGold-400 shadow-glow-red'
                : 'bg-darkBg-900 text-slate-300 border-slate-700/60 hover:border-festiveGold-500/40'
            }`}
          >
            All Kolkata ({totalPandals})
          </button>
          {DIVISIONS_META.map((div) => {
            const count = allPandals.filter(p => p.area_division === div.name).length;
            return (
              <button
                key={div.name}
                onClick={() => setSelectedDivisionFilter(div.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                  selectedDivisionFilter === div.name
                    ? 'bg-festiveRed-600 text-white border-festiveGold-400 shadow-glow-red'
                    : 'bg-darkBg-900 text-slate-300 border-slate-700/60 hover:border-festiveGold-500/40'
                }`}
              >
                {div.icon} {div.name.replace(' Kolkata', '')} ({count})
              </button>
            );
          })}
        </div>

        {/* The Live Interactive Map */}
        <div className="w-full h-[520px] sm:h-[600px] rounded-3xl overflow-hidden border border-festiveGold-500/30 shadow-dark-card relative bg-darkBg-950">
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

      {/* Six Geographical Divisions Cards */}
      <section className="px-4 sm:px-6 lg:px-12 py-8 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-festive">
              Six Area Divisions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Curated directly from the official 2026 route planning survey
            </p>
          </div>

          <button
            onClick={onNavigateToExplore}
            className="text-xs text-festiveGold-400 hover:text-festiveGold-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>Open All on Full Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DIVISIONS_META.map((div) => (
            <div
              key={div.name}
              className="p-5 rounded-2xl bg-darkBg-800/80 hover:bg-darkCard-800 border border-slate-700/60 hover:border-festiveGold-500/50 transition-all duration-300 shadow-dark-card group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{div.icon}</span>
                <span className="text-xs font-bold text-festiveGold-400 bg-festiveGold-500/10 px-2.5 py-1 rounded-full border border-festiveGold-500/20">
                  {div.tag}
                </span>
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-festiveGold-400 transition-colors">
                {div.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                {div.description}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedDivisionFilter(div.name);
                    const el = document.getElementById('home-live-map');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs text-festiveGold-400 hover:text-festiveGold-300 font-bold"
                >
                  Filter Map Above
                </button>
                <button
                  onClick={() => {
                    onSelectDivision(div.name);
                    onNavigateToExplore();
                  }}
                  className="text-xs bg-darkBg-900 hover:bg-festiveRed-600 text-slate-200 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 font-bold flex items-center gap-1 transition-colors"
                >
                  <span>Explore Full Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Nearest to Me / Iconic Pandals Section */}
      <section className="px-4 sm:px-6 lg:px-12 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            {featuredTab === 'nearest' && userLocation ? (
              <div className="w-8 h-8 rounded-xl bg-sky-600/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shrink-0 shadow-sm">
                <Navigation className="w-4 h-4 text-sky-400 animate-pulse" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-festiveGold-500/20 border border-festiveGold-500/40 text-festiveGold-400 flex items-center justify-center shrink-0 shadow-sm">
                <Award className="w-4 h-4 text-festiveGold-400" />
              </div>
            )}
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-festive flex items-center gap-2 flex-wrap">
                <span>
                  {featuredTab === 'nearest' && userLocation
                    ? 'Nearest Pandals to You'
                    : 'Iconic Kolkata Landmarks'}
                </span>
                {featuredTab === 'nearest' && userLocation && (
                  <span className="text-[11px] font-sans font-extrabold text-sky-300 bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-500/40">
                    📍 {userLocation.addressName || 'Your Location'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {featuredTab === 'nearest' && userLocation
                  ? 'Automatically sorted nearest-to-farthest from your current position with pedestrian walking times'
                  : 'Famous pandals with high crowd volume and award-winning themes across Kolkata'}
              </p>
            </div>
          </div>

          {/* Toggle Pills between Nearest and Iconic */}
          {userLocation && (
            <div className="flex items-center bg-darkBg-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setFeaturedTab('nearest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  featuredTab === 'nearest'
                    ? 'bg-sky-600 text-white shadow-md border border-sky-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Nearest ({nearestPandals.length})</span>
              </button>
              <button
                onClick={() => setFeaturedTab('popular')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  featuredTab === 'popular'
                    ? 'bg-festiveGold-500/30 text-festiveGold-300 shadow-md border border-festiveGold-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Iconic ({popularPandals.length})</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(featuredTab === 'nearest' && userLocation ? nearestPandals : popularPandals).map((pandal, idx) => (
            <div
              key={pandal.id}
              className={`p-4 rounded-2xl bg-darkBg-800/90 hover:bg-darkCard-800 border shadow-dark-card transition-all group ${
                featuredTab === 'nearest' && idx === 0
                  ? 'border-sky-400/80 ring-1 ring-sky-400/40'
                  : 'border-slate-700/60 hover:border-festiveGold-500/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[10px] font-bold text-festiveGold-400 uppercase">
                  {pandal.area_division}
                </span>
                {featuredTab === 'nearest' ? (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      idx === 0
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    }`}
                  >
                    #{idx + 1} Nearest
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Verified Pin
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-festiveGold-400 transition-colors line-clamp-1">
                {pandal.name}
              </h4>
              <div className="mt-2 text-xs text-slate-400 space-y-1">
                <div>🚇 Metro: <strong className="text-slate-200">{pandal.nearest_metro}</strong></div>
                <div>🚶 Metro Walk: <strong className="text-festiveGold-400">{pandal.estimated_walking_distance_raw || 'N/A'}</strong></div>
                {pandal.distance_from_user_km != null && (
                  <div className="flex items-center justify-between text-sky-200 bg-gradient-to-r from-blue-950/80 to-slate-900 border border-sky-500/40 px-2.5 py-1.5 rounded-xl text-[11px] font-bold mt-1.5 shadow-sm">
                    <span className="flex items-center gap-1.5 text-sky-300">
                      <Navigation className="w-3 h-3 text-sky-400" />
                      Live Walk: <span className="text-white font-extrabold">{formatDistance(pandal.distance_from_user_km)}</span>
                    </span>
                    <span className="text-sky-300 font-extrabold bg-sky-900/60 px-1.5 py-0.5 rounded">
                      ~{pandal.walking_duration_mins} min
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectPandal(pandal);
                    const el = document.getElementById('home-live-map');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 py-1.5 bg-darkBg-900 hover:bg-festiveRed-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-slate-700"
                >
                  <MapPin className="w-3.5 h-3.5 text-festiveGold-400" />
                  View Above
                </button>
                <button
                  onClick={() => {
                    onSelectPandal(pandal);
                    onNavigateToExplore();
                  }}
                  className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors border border-slate-700"
                  title="Open in Full Navigator"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Official Survey Quality Notes & Transparency Section */}
      <section className="px-4 sm:px-6 lg:px-12 py-6 max-w-6xl mx-auto w-full">
        <div className="p-5 sm:p-6 rounded-2xl bg-darkBg-800/80 border border-festiveGold-500/30 shadow-dark-card">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-festiveGold-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Official Route Notes & Transparency Advisories
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-300 leading-relaxed">
            {rawQualityNotes.map((note) => (
              <div key={note.id} className="p-3 sm:p-3.5 rounded-xl bg-darkBg-900 border border-slate-700/60 space-y-1.5">
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 font-bold">
                  <span className="text-white text-xs sm:text-sm leading-snug break-words flex-1">
                    {note.title}
                  </span>
                  <span className="text-[10px] text-festiveGold-400 bg-festiveGold-500/10 px-2.5 py-0.5 rounded-full border border-festiveGold-500/20 whitespace-nowrap self-start xs:self-auto shrink-0 inline-flex items-center">
                    {note.status}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed">{note.content}</p>
                <span className="text-[10px] text-slate-500 block pt-0.5">
                  {note.division} • Page {note.page}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-darkBg-950 px-4 sm:px-8 py-5 text-center text-xs text-slate-500">
        <p className="text-sm text-festiveGold-400 font-bold mb-0.5 font-festive">
          PandalPath Kolkata 2026 • সম্পূর্ণ বাংলা দুর্গোৎসব ম্যাপ
        </p>
        <p>
          Data sourced faithfully from <code className="text-white font-semibold">Kolkata_Durga_Puja_2026_Routes.pdf</code>. 100% runs on your local device and browser.
        </p>
      </footer>
    </div>
  );
};
