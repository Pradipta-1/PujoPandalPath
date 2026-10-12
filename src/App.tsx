import { useState, useEffect } from 'react';
import type { Pandal, AreaDivision } from './types/pandal';
import { useGeolocation } from './hooks/useGeolocation';
import { usePandalSearch } from './hooks/usePandalSearch';
import { useRouting } from './hooks/useRouting';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';

export function App() {
  // Navigation view: 'home' (Landing Page) by default, or 'explore' (Live Map Navigator)
  const [currentView, setCurrentView] = useState<'home' | 'explore'>('home');
  const [selectedPandal, setSelectedPandal] = useState<Pandal | null>(null);

  // Itinerary stored 100% on local device browser storage (NO external database)
  const [itinerary, setItinerary] = useState<Pandal[]>(() => {
    try {
      const saved = localStorage.getItem('pandalpath_itinerary_2026');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('pandalpath_itinerary_2026', JSON.stringify(itinerary));
    } catch {
      // ignore
    }
  }, [itinerary]);

  // Live Geolocation
  const {
    userLocation,
    isLoading: isLoadingLocation,
    error: locationError,
    requestLocation,
    clearLocation,
    setManualLocation
  } = useGeolocation();

  // Search, Filters & Sorting
  const {
    allPandals,
    filteredPandals,
    totalCount,
    filteredCount,
    filters,
    allMetroStations,
    divisionCounts,
    updateFilter,
    resetFilters
  } = usePandalSearch(userLocation);

  // Pedestrian Routing
  const {
    activeRoute,
    calculateWalkingRoute,
    clearRoute
  } = useRouting();

  // Route calculation handler
  const handleStartRoute = async (destination: Pandal) => {
    let origin = userLocation;
    if (!origin) {
      origin = await requestLocation();
    }
    if (origin) {
      await calculateWalkingRoute(origin, destination);
    } else {
      setManualLocation(22.5645, 88.3524, 'Esplanade / Dharmatala');
      await calculateWalkingRoute(
        { lat: 22.5645, lng: 88.3524, addressName: 'Esplanade / Dharmatala' },
        destination
      );
    }
  };

  const handlePandalSelect = (pandal: Pandal | null) => {
    setSelectedPandal(pandal);
  };

  // Synchronize selectedPandal with latest distance values from allPandals whenever userLocation updates
  const synchronizedSelectedPandal = selectedPandal
    ? allPandals.find((p) => p.id === selectedPandal.id) || selectedPandal
    : null;

  const handleToggleItinerary = (pandal: Pandal) => {
    setItinerary((prev) => {
      const exists = prev.some((p) => p.id === pandal.id);
      if (exists) {
        return prev.filter((p) => p.id !== pandal.id);
      } else {
        return [...prev, pandal];
      }
    });
  };

  const handleRemoveFromItinerary = (pandalId: string) => {
    setItinerary((prev) => prev.filter((p) => p.id !== pandalId));
  };

  const handleMoveItineraryUp = (index: number) => {
    if (index <= 0) return;
    setItinerary((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveItineraryDown = (index: number) => {
    if (index >= itinerary.length - 1) return;
    setItinerary((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleClearItinerary = () => {
    setItinerary([]);
  };

  // Switch to explore when selecting a pandal or division from the home landing page
  const handleSelectPandalFromHome = (pandal: Pandal) => {
    setSelectedPandal(pandal);
    setCurrentView('explore');
  };

  const handleSelectDivisionFromHome = (division: AreaDivision) => {
    updateFilter('division', division);
    setCurrentView('explore');
  };

  return (
    <div className="w-full min-h-screen bg-darkBg-950 text-slate-100 font-sans selection:bg-festiveRed-600 selection:text-white">
      {currentView === 'home' ? (
        <Home
          allPandals={allPandals}
          userLocation={userLocation}
          isLoadingLocation={isLoadingLocation}
          locationError={locationError}
          onRequestLocation={requestLocation}
          onClearLocation={clearLocation}
          onSetManualLocation={setManualLocation}
          onSelectPandal={handleSelectPandalFromHome}
          onSelectDivision={handleSelectDivisionFromHome}
          onNavigateToExplore={() => setCurrentView('explore')}
          selectedPandal={synchronizedSelectedPandal}
          activeRoute={activeRoute}
        />
      ) : (
        <Explore
          allPandals={allPandals}
          filteredPandals={filteredPandals}
          selectedPandal={synchronizedSelectedPandal}
          onSelectPandal={handlePandalSelect}
          userLocation={userLocation}
          isLoadingLocation={isLoadingLocation}
          locationError={locationError}
          onRequestLocation={requestLocation}
          onClearLocation={clearLocation}
          onSetManualLocation={setManualLocation}
          activeRoute={activeRoute}
          onStartRoute={handleStartRoute}
          onClearRoute={clearRoute}
          itinerary={itinerary}
          onToggleItinerary={handleToggleItinerary}
          onRemoveFromItinerary={handleRemoveFromItinerary}
          onMoveUp={handleMoveItineraryUp}
          onMoveDown={handleMoveItineraryDown}
          onClearItinerary={handleClearItinerary}
          filters={filters}
          allMetroStations={allMetroStations}
          divisionCounts={divisionCounts}
          totalCount={totalCount}
          filteredCount={filteredCount}
          onUpdateFilter={updateFilter}
          onResetFilters={resetFilters}
          onNavigateHome={() => setCurrentView('home')}
        />
      )}
    </div>
  );
}

export default App;
