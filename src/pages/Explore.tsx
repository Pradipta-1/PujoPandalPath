import React, { useState } from 'react';
import type { Pandal, UserLocation, CalculatedRoute, FilterOptions, AreaDivision } from '../types/pandal';
import { MapView } from '../components/MapView';
import { SearchBar } from '../components/SearchBar';
import { LocationControl } from '../components/LocationControl';
import { FilterPanel } from '../components/FilterPanel';
import { PandalCard } from '../components/PandalCard';
import { PandalDetails } from '../components/PandalDetails';
import { RoutePanel } from '../components/RoutePanel';
import { ItineraryPlanner } from '../components/ItineraryPlanner';
import { MobileBottomSheet } from '../components/MobileBottomSheet';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home as HomeIcon, 
  Filter, 
  Calendar, 
  List,
  Info,
  Navigation
} from 'lucide-react';
import rawQualityNotes from '../data/quality_notes.json';

interface ExploreProps {
  allPandals: Pandal[];
  filteredPandals: Pandal[];
  selectedPandal: Pandal | null;
  onSelectPandal: (pandal: Pandal | null) => void;
  userLocation: UserLocation | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  onRequestLocation: () => Promise<UserLocation | null>;
  onClearLocation: () => void;
  onSetManualLocation: (lat: number, lng: number, name?: string) => void;
  activeRoute: CalculatedRoute | null;
  onStartRoute: (pandal: Pandal) => void;
  onClearRoute: () => void;
  itinerary: Pandal[];
  onToggleItinerary: (pandal: Pandal) => void;
  onRemoveFromItinerary: (pandalId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onClearItinerary: () => void;
  onReorderItinerary?: (newItinerary: Pandal[]) => void;
  filters: FilterOptions;
  allMetroStations: string[];
  divisionCounts: Record<string, number>;
  totalCount: number;
  filteredCount: number;
  onUpdateFilter: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  onResetFilters: () => void;
  onNavigateHome: () => void;
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

export const Explore: React.FC<ExploreProps> = ({
  allPandals,
  filteredPandals,
  selectedPandal,
  onSelectPandal,
  userLocation,
  isLoadingLocation,
  locationError,
  onRequestLocation,
  onClearLocation,
  onSetManualLocation,
  activeRoute,
  onStartRoute,
  onClearRoute,
  itinerary,
  onToggleItinerary,
  onRemoveFromItinerary,
  onMoveUp,
  onMoveDown,
  onClearItinerary,
  onReorderItinerary,
  filters,
  allMetroStations,
  divisionCounts,
  totalCount,
  filteredCount,
  onUpdateFilter,
  onResetFilters,
  onNavigateHome
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'directory' | 'itinerary' | 'filters' | 'advisories'>('directory');
  const [mobileTab, setMobileTab] = useState<'directory' | 'details' | 'itinerary'>('directory');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const hasActiveFilters = 
    filters.division !== 'All' || 
    filters.metroStation !== 'All' || 
    filters.radiusKm !== 'all' || 
    filters.hasCautionOnly || 
    filters.verificationStatus !== 'all' ||
    (filters.sortBy !== 'user-distance' && filters.sortBy !== 'recommended');

  const itineraryIdSet = React.useMemo(() => new Set(itinerary.map((p) => p.id)), [itinerary]);

  const handlePandalSelect = React.useCallback((pandal: Pandal | null) => {
    onSelectPandal(pandal);
    if (pandal) {
      setMobileTab('details');
    }
  }, [onSelectPandal]);

  const handleSuggestionSelect = React.useCallback((pandal: Pandal) => {
    onUpdateFilter('searchQuery', '');
    handlePandalSelect(pandal);
  }, [handlePandalSelect, onUpdateFilter]);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-darkBg-950 text-slate-100 font-sans">
      {/* 100% Pure Dark Theme Top Navigation Header */}
      <header
        style={{ backgroundColor: '#040711' }}
        className="shrink-0 z-[1500] bg-[#040711] text-white border-b border-festiveGold-500/30 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-dark-card"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onNavigateHome}
            className="py-1 px-2.5 sm:py-1.5 sm:px-3 bg-darkBg-800 hover:bg-darkCard-800 text-festiveGold-400 border border-festiveGold-500/40 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 shadow-md shrink-0"
            title="Return to Landing Page"
          >
            <HomeIcon className="w-3.5 h-3.5 text-festiveGold-400 shrink-0" />
            <span className="hidden sm:inline">Landing Page</span>
            <span className="sm:hidden font-semibold">Home</span>
          </button>

          <div className="h-4 sm:h-5 w-px bg-slate-800 shrink-0" />

          <div className="min-w-0 flex items-center gap-1.5">
            <span className="text-sm shrink-0">🪔</span>
            <div>
              <h1 className="text-xs sm:text-base font-black text-white flex items-center gap-1 font-festive leading-tight truncate">
                <span>PandalPath</span>
                <span className="text-festiveGold-400 font-festive">2026</span>
              </h1>
              <p className="text-[10px] text-slate-400 hidden md:block">
                Live Pedestrian Navigation • 6 Official Divisions + Kalyani Hub
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Header Right Badge (Perfect Visual Balance) */}
        <div className="flex items-center md:hidden shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-darkBg-800/90 border border-festiveGold-500/30 text-xs font-bold shadow-sm">
            <span className="text-[10px] text-slate-400 font-semibold">Pujas:</span>
            <span className="text-festiveGold-400 font-extrabold">{filteredCount}</span>
            <span className="text-slate-500 font-normal">/</span>
            <span className="text-slate-400 font-medium">{totalCount}</span>
          </div>
        </div>

        {/* Desktop Quick Tab Controls */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center bg-darkBg-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setSidebarTab('directory');
                setSidebarOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                sidebarTab === 'directory' && sidebarOpen
                  ? 'bg-festiveRed-600 text-white shadow-glow-red'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Pandals ({filteredCount})</span>
            </button>

            <button
              onClick={() => {
                setSidebarTab('filters');
                setSidebarOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                sidebarTab === 'filters' && sidebarOpen
                  ? 'bg-festiveRed-600 text-white shadow-glow-red'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <button
              onClick={() => {
                setSidebarTab('itinerary');
                setSidebarOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                sidebarTab === 'itinerary' && sidebarOpen
                  ? 'bg-festiveGold-500 text-darkBg-950 font-black shadow-glow-gold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Plan ({itinerary.length})</span>
            </button>

            <button
              onClick={() => {
                setSidebarTab('advisories');
                setSidebarOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                sidebarTab === 'advisories' && sidebarOpen
                  ? 'bg-festiveRed-600 text-white shadow-glow-red'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Advisories</span>
            </button>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-darkBg-900 hover:bg-darkCard-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-colors"
            title={sidebarOpen ? 'Collapse Directory' : 'Open Directory'}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Split Layout: Interactive Map + Dark Sidebar */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Collapsible Dark Sidebar */}
        <aside
          className={`hidden md:flex flex-col z-20 bg-darkBg-900 border-r border-slate-800 transition-all duration-300 shadow-dark-card ${
            sidebarOpen ? 'w-[400px] lg:w-[440px]' : 'w-0 -translate-x-full overflow-hidden'
          }`}
        >
          {/* Quick Search & Location Bar */}
          <div className="relative z-30 p-3.5 border-b border-slate-800 space-y-2.5 shrink-0 bg-darkBg-950/70">
            <SearchBar
              value={filters.searchQuery}
              onChange={(val) => onUpdateFilter('searchQuery', val)}
              allPandals={allPandals}
              onSelectSuggestion={handleSuggestionSelect}
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

            {/* Quick Division Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 pt-1">
              <button
                onClick={() => onUpdateFilter('division', 'All')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-colors border ${
                  filters.division === 'All'
                    ? 'bg-festiveRed-600 text-white border-festiveGold-400 shadow-glow-red'
                    : 'bg-darkBg-900 text-slate-300 border-slate-700/60 hover:border-festiveGold-500/40'
                }`}
              >
                All ({totalCount})
              </button>
              {DIVISIONS.map((div) => (
                <button
                  key={div}
                  onClick={() => onUpdateFilter('division', div)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-colors border ${
                    filters.division === div
                      ? 'bg-festiveRed-600 text-white border-festiveGold-400 shadow-glow-red'
                      : 'bg-darkBg-900 text-slate-300 border-slate-700/60 hover:border-festiveGold-500/40'
                  }`}
                >
                  {div.replace(' Kolkata', '')} ({divisionCounts[div] || 0})
                </button>
              ))}
            </div>

            {/* Quick GPS Nearest Sort Toggle */}
            {userLocation && (
              <div className="pt-1.5">
                <button
                  onClick={() =>
                    onUpdateFilter(
                      'sortBy',
                      filters.sortBy === 'user-distance' ? 'recommended' : 'user-distance'
                    )
                  }
                  className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center justify-between border transition-all ${
                    filters.sortBy === 'user-distance'
                      ? 'bg-sky-600/30 text-sky-200 border-sky-400 shadow-sm'
                      : 'bg-darkBg-900 text-slate-300 border-slate-700 hover:text-white hover:border-sky-500/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-sky-400" />
                    <span>Sort by Nearest (Live GPS Walk)</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/30">
                    {filters.sortBy === 'user-distance' ? '✓ Active' : 'Enable'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Active Walking Route Banner */}
          {activeRoute && selectedPandal && (
            <div className="p-3 shrink-0 border-b border-slate-800 bg-festiveRed-950/40">
              <RoutePanel
                route={activeRoute}
                destination={selectedPandal}
                userLocation={userLocation}
                onClose={onClearRoute}
              />
            </div>
          )}

          {/* Sidebar Tabs Content in 100% Dark Theme */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-darkBg-900/95">
            {sidebarTab === 'filters' && (
              <FilterPanel
                filters={filters}
                allMetroStations={allMetroStations}
                divisionCounts={divisionCounts}
                totalCount={totalCount}
                filteredCount={filteredCount}
                hasUserLocation={!!userLocation}
                onUpdateFilter={onUpdateFilter}
                onResetFilters={onResetFilters}
              />
            )}

            {sidebarTab === 'itinerary' && (
              <ItineraryPlanner
                itinerary={itinerary}
                userLocation={userLocation}
                allPandals={allPandals}
                onRemovePandal={onRemoveFromItinerary}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onClearItinerary={onClearItinerary}
                onReorderItinerary={onReorderItinerary}
                onSelectPandal={handlePandalSelect}
              />
            )}

            {sidebarTab === 'advisories' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-darkBg-800 rounded-2xl border border-festiveGold-500/30">
                  <h3 className="text-xs font-bold text-festiveGold-400 uppercase mb-1">
                    Official Survey Notes & Public Advisories
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Extracted verbatim from Kolkata Durga Puja 2026 route survey sheets.
                  </p>
                  <div className="space-y-2">
                    {rawQualityNotes.map((note) => (
                      <div key={note.id} className="p-2.5 sm:p-3 rounded-xl bg-darkBg-900 border border-slate-700/60 space-y-1.5 text-xs">
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 font-bold text-white">
                          <span className="text-xs leading-snug break-words flex-1">
                            {note.title}
                          </span>
                          <span className="text-[10px] text-festiveGold-400 bg-festiveGold-500/10 px-2.5 py-0.5 rounded-full border border-festiveGold-500/20 whitespace-nowrap self-start xs:self-auto shrink-0 inline-flex items-center">
                            {note.status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{note.content}</p>
                        <span className="text-[10px] text-slate-500 block pt-0.5">
                          {note.division} • Survey Page {note.page}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {sidebarTab === 'directory' && (
              <>
                {/* Selected Pandal Card Details */}
                {selectedPandal && (
                  <div className="mb-3">
                    <PandalDetails
                      pandal={selectedPandal}
                      userLocation={userLocation}
                      isInItinerary={itinerary.some((p) => p.id === selectedPandal.id)}
                      onRequestLocation={onRequestLocation}
                      onClose={() => onSelectPandal(null)}
                      onStartRoute={onStartRoute}
                      onToggleItinerary={onToggleItinerary}
                    />
                  </div>
                )}

                {/* Directory List Cards */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
                    <span>
                      {filters.division === 'All' ? 'All Kolkata Pandals' : filters.division}
                    </span>
                    <span className="text-festiveGold-400 font-bold">{filteredCount} pandals</span>
                  </div>

                  {userLocation && (
                    <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-950/90 to-slate-900 border border-sky-500/40 text-xs text-sky-200 flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-1.5 font-bold text-sky-300">
                        <Navigation className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                        <span>Sorted Nearest to: <strong className="text-white">{userLocation.addressName || 'Your Location'}</strong></span>
                      </span>
                      <span className="text-[10px] font-extrabold text-sky-300 bg-sky-950 px-2 py-0.5 rounded-full border border-sky-500/30">
                        Walking Order
                      </span>
                    </div>
                  )}

                  {filteredPandals.length === 0 ? (
                    <div className="p-6 text-center bg-darkBg-800 rounded-2xl border border-slate-700/60 space-y-2">
                      <p className="text-sm font-bold text-white">No pandals match current filters.</p>
                      <button
                        onClick={onResetFilters}
                        className="text-xs text-festiveGold-400 font-bold underline"
                      >
                        Reset all filters
                      </button>
                    </div>
                  ) : (
                    filteredPandals.map((pandal) => (
                      <PandalCard
                        key={pandal.id}
                        pandal={pandal}
                        isSelected={selectedPandal?.id === pandal.id}
                        isInItinerary={itineraryIdSet.has(pandal.id)}
                        userLocation={userLocation}
                        onSelect={handlePandalSelect}
                        onToggleItinerary={onToggleItinerary}
                        onStartRoute={onStartRoute}
                      />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* 100% Full-Screen Leaflet Map */}
        <main className="flex-1 relative w-full h-full min-h-[380px] bg-darkBg-950">
          {/* Floating Filter Option: Just below the Home button in Picture 2 */}
          <div className="absolute top-3 left-3 z-[1000]">
            <button
              onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
              className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xl border-2 active:scale-95 ${
                hasActiveFilters
                  ? 'bg-gradient-to-r from-festiveRed-600 to-rose-700 text-white border-festiveGold-300 shadow-[0_0_15px_rgba(217,4,41,0.6)]'
                  : 'bg-[#080f24] hover:bg-[#0e193c] text-festiveGold-300 border-festiveGold-500/50 hover:border-festiveGold-400 shadow-dark-card'
              }`}
              title="Filter Pandals"
            >
              <Filter className="w-3.5 h-3.5 text-festiveGold-400" />
              <span>Filter</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-festiveGold-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Floating Filter Panel right below the Home button */}
          {isFilterModalOpen && (
            <div className="absolute top-12 left-3 z-[1200] w-[calc(100vw-24px)] max-w-sm sm:max-w-md max-h-[80vh] overflow-y-auto animate-fadeIn">
              <FilterPanel
                filters={filters}
                allMetroStations={allMetroStations}
                divisionCounts={divisionCounts}
                totalCount={totalCount}
                filteredCount={filteredCount}
                hasUserLocation={!!userLocation}
                onUpdateFilter={onUpdateFilter}
                onResetFilters={onResetFilters}
                onClose={() => setIsFilterModalOpen(false)}
              />
            </div>
          )}

          <MapView
            pandals={filteredPandals}
            selectedPandal={selectedPandal}
            onSelectPandal={handlePandalSelect}
            userLocation={userLocation}
            activeRoute={activeRoute}
            onRequestLocation={onRequestLocation}
            className="w-full h-full"
          />
        </main>
      </div>

      {/* Mobile Draggable Dark Bottom Sheet (< 768px) */}
      <div className="md:hidden relative z-[2000]">
        <MobileBottomSheet
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          resultCount={filteredCount}
          itineraryCount={itinerary.length}
        >
          {/* Search & Location Controls within Bottom Sheet */}
          <div className="relative z-30 space-y-2 mb-2.5">
            <SearchBar
              value={filters.searchQuery}
              onChange={(val) => onUpdateFilter('searchQuery', val)}
              allPandals={allPandals}
              onSelectSuggestion={handleSuggestionSelect}
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

          {/* Active Route on Mobile */}
          {activeRoute && selectedPandal && (
            <div className="mb-2.5">
              <RoutePanel
                route={activeRoute}
                destination={selectedPandal}
                userLocation={userLocation}
                onClose={onClearRoute}
              />
            </div>
          )}

          {/* Details Tab */}
          {mobileTab === 'details' && selectedPandal && (
            <PandalDetails
              pandal={selectedPandal}
              userLocation={userLocation}
              isInItinerary={itinerary.some((p) => p.id === selectedPandal.id)}
              onRequestLocation={onRequestLocation}
              onClose={() => setMobileTab('directory')}
              onStartRoute={onStartRoute}
              onToggleItinerary={onToggleItinerary}
            />
          )}

          {/* Itinerary Tab */}
          {mobileTab === 'itinerary' && (
            <ItineraryPlanner
              itinerary={itinerary}
              userLocation={userLocation}
              allPandals={allPandals}
              onRemovePandal={onRemoveFromItinerary}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onClearItinerary={onClearItinerary}
              onReorderItinerary={onReorderItinerary}
              onSelectPandal={handlePandalSelect}
            />
          )}

          {/* Directory Tab */}
          {mobileTab === 'directory' && (
            <div className="space-y-2.5 pb-6">
              {/* Horizontal finger-scrollable pandal types / divisions */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none no-scrollbar touch-pan-x -mx-1 px-1">
                {(['All', ...DIVISIONS] as (AreaDivision | 'All')[]).map((div) => {
                  const isSelected = filters.division === div;
                  const count = div === 'All' ? totalCount : (divisionCounts[div as AreaDivision] || 0);
                  return (
                    <button
                      key={div}
                      onClick={() => onUpdateFilter('division', div)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-r from-festiveRed-600 to-rose-700 text-white border-festiveGold-400 shadow-[0_0_10px_rgba(217,4,41,0.5)] font-black'
                          : 'bg-[#0b132b] text-slate-300 border-slate-700/70 hover:border-festiveGold-500/40'
                      }`}
                    >
                      <span>{div}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${isSelected ? 'bg-black/40 text-festiveGold-300' : 'bg-slate-800 text-festiveGold-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {userLocation && (
                <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-950/90 to-slate-900 border border-sky-500/40 text-xs text-sky-200 flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-1.5 font-bold text-sky-300">
                    <Navigation className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    <span>Sorted Nearest: <strong className="text-white">{userLocation.addressName || 'Your Location'}</strong></span>
                  </span>
                  <span className="text-[10px] font-extrabold text-sky-300 bg-sky-950 px-2 py-0.5 rounded-full border border-sky-500/30">
                    Walking Order
                  </span>
                </div>
              )}

              {filteredPandals.map((pandal) => (
                <PandalCard
                  key={pandal.id}
                  pandal={pandal}
                  isSelected={selectedPandal?.id === pandal.id}
                  isInItinerary={itineraryIdSet.has(pandal.id)}
                  userLocation={userLocation}
                  onSelect={handlePandalSelect}
                  onToggleItinerary={onToggleItinerary}
                  onStartRoute={onStartRoute}
                />
              ))}
            </div>
          )}
        </MobileBottomSheet>
      </div>
    </div>
  );
};
