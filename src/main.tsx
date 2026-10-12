import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import L from 'leaflet';

// Ensure global Leaflet is attached before any plugin or component evaluates
if (typeof window !== 'undefined') {
  (window as any).L = L;
}

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
