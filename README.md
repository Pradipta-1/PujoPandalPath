# PandalPath Kolkata 2026 🪔
> **The Complete Durga Puja Pandal Navigator & Live Pedestrian Route Planner for Kolkata 2026**

![Theme](https://img.shields.io/badge/Festival-Durga_Puja_2026-d90429?style=for-the-badge)
![Pandals](https://img.shields.io/badge/Total_Pandals-79_Imported-e9c46a?style=for-the-badge)
![Verified Coordinates](https://img.shields.io/badge/Verified_Pins-71_Verified-10b981?style=for-the-badge)
![Divisions](https://img.shields.io/badge/Geographical_Areas-6_Divisions-3b82f6?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

---

## 🌟 Overview

**PandalPath Kolkata 2026** is a full-stack, mobile-first web application designed to help millions of revellers navigate Kolkata's Durga Puja. The application faithfully integrates every single pandal, metro grouping, estimated walking distance, and advisory note from all 6 pages of the official survey document `Kolkata_Durga_Puja_2026_Routes.pdf`.

### ✨ Key Features

1. **Complete 79-Pandal Database**:
   - **North Kolkata** (24 Pandals: Bagbazar Sarbojanin, Kumartuli Park, Shobhabazar Rajbari, Tala Prattoy, Sreebhumi, etc.)
   - **Central Kolkata** (5 Pandals: College Square, Santosh Mitra Square, Mohammad Ali Park, etc.)
   - **South Kolkata** (17 Pandals: Ekdalia Evergreen, Maddox Square, Tridhara, Suruchi Sangha, Deshapriya Park, etc.)
   - **East Kolkata & Salt Lake** (3 Pandals: Salt Lake FD Block, Mitali Sangha, Ultadanga Pallyshree)
   - **Naktala & Haridevpur** (8 Pandals: Naktala Udayan Sangha, Haridevpur 41 Pally, Ajeya Sanghati, etc.)
   - **Behala & Barisha** (22 Pandals: Behala Natun Dal, Barisha Club, Player's Corner, etc.)

2. **Interactive Festive Map (Leaflet + OpenStreetMap)**:
   - Custom Durga Trishul map pins with verification status badges.
   - Marker clustering via `leaflet.markercluster` for dense heritage areas.
   - Theme toggle (Dark Festive, Voyager, Standard OpenStreetMap).
   - "Fit All Markers" and "Center on My Location" floating controls.
   - Dynamic map resizing when drawer/sidebar toggles.

3. **Live Geolocation & Transit Hubs**:
   - Browser GPS integration via `navigator.geolocation` with accuracy radius.
   - Privacy-first: no background tracking or persistent server storage.
   - Manual starting hub selector (Esplanade, Shyambazar, Sealdah, Kalighat, Gariahat, Salt Lake, Behala Chowrasta).
   - Live pedestrian distance calculation and walking duration estimates.
   - Nearby radius filtering: 1 km, 3 km, 5 km, 10 km.

4. **Live Walking Navigation & Google Maps Fallback**:
   - Genuine pedestrian route calculation via public OSRM Foot Routing API.
   - On-map polyline route rendering with turn-by-turn walking steps.
   - Instant 1-tap fallback to **Google Maps Turn-by-Turn Voice Navigation** with destination coordinates.

5. **Multi-Pandal Parikrama Planner**:
   - Build a custom pandal hopping itinerary.
   - Reorder stops with move up/down controls.
   - Automatically calculates cumulative walking distance and estimated duration.
   - Launches multi-stop routes directly in Google Maps.

6. **Search, Autocomplete & Division Filters**:
   - Real-time search by pandal name, metro station, neighborhood, or committee note.
   - Division pills, metro station dropdown, verified/unverified filter, caution advisory toggles.
   - Sorting by recommended route order, name (A–Z), PDF walking distance, or live GPS distance.

7. **Mobile-First Draggable Bottom Sheet**:
   - Full-screen immersive map on mobile devices.
   - Draggable bottom sheet with 3 snap heights (peek, half, full).
   - Desktop split layout (65% map / 35% collapsible directory).

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS (Custom Festive Palette: Navy, Vermilion, Gold, Cream) |
| **Icons** | Lucide React |
| **Mapping Engine** | Leaflet 1.9.4 + OpenStreetMap / CARTO Basemaps |
| **Marker Clustering** | Leaflet.markercluster 1.5.3 |
| **Routing Provider** | OSRM Foot Routing API + Haversine Fallback + Google Maps Directions |
| **Typography** | Cinzel Decorative, Cinzel, Hind Siliguri, Inter (Google Fonts) |
| **Data Source** | `src/data/pandals.json` (faithfully extracted from `Kolkata_Durga_Puja_2026_Routes.pdf`) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Installation

```bash
# Clone the repository or navigate to workspace
cd "c:/Puja pandel map"

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Open your browser at `http://127.0.0.1:5173/` or `http://localhost:5173/`.

### Building for Production

```bash
# Type check and generate production bundle in /dist
npm run build
```

### Previewing the Production Build

```bash
npm run preview
```

---

## 📁 Project Structure

```
├── Kolkata_Durga_Puja_2026_Routes.pdf   # Primary source PDF
├── index.html                           # Root HTML with Google Fonts & Leaflet styles
├── package.json                         # Dependencies & scripts
├── tailwind.config.js                   # Festive color system tokens
├── tsconfig.json                        # TypeScript configuration
├── src/
│   ├── main.tsx                         # Entry point
│   ├── App.tsx                          # Root orchestrator & routing state
│   ├── index.css                        # Design system tokens, leaflet pins, alpana pattern
│   ├── types/
│   │   └── pandal.ts                    # TypeScript types (Pandal, Route, Filter, etc.)
│   ├── data/
│   │   ├── pandals.json                 # 79 records extracted from PDF
│   │   └── quality_notes.json           # PDF survey quality notes and public advisories
│   ├── utils/
│   │   └── geo.ts                       # Haversine distance, walking pace, GMaps URLs
│   ├── hooks/
│   │   ├── useGeolocation.ts            # Browser GPS hook with manual transit hubs
│   │   ├── usePandalSearch.ts           # Debounced search, division filters, distance sorting
│   │   └── useRouting.ts                # OSRM pedestrian routing engine & fallback
│   ├── components/
│   │   ├── MapView.tsx                  # Leaflet interactive map with custom pins & clusters
│   │   ├── SearchBar.tsx                # Autocomplete search bar
│   │   ├── PandalCard.tsx               # Pandal directory card with actions
│   │   ├── PandalDetails.tsx            # Comprehensive details drawer
│   │   ├── FilterPanel.tsx              # Division, metro & sort controls
│   │   ├── LocationControl.tsx          # GPS location prompt, accuracy badge & hub picker
│   │   ├── RoutePanel.tsx               # Turn-by-turn directions & route metric summary
│   │   ├── ItineraryPlanner.tsx         # Multi-stop parikrama planner
│   │   └── MobileBottomSheet.tsx        # Draggable touch bottom drawer
│   └── pages/
│       ├── Home.tsx                     # Landing hero, computed stats, division cards
│       └── Explore.tsx                  # Split layout map & directory navigator
```

---

## 🔒 Security, Privacy & Integrity Disclosures

1. **No Fabricated Pins**: The 8 pandals listed in the PDF with unverified locations (*Lalabagan Yubak Brinda*, *Surir Bagan*, *Maniktala Chaltabagan*, *Agradut Club*, *Bandhudal*, *Behala Buroshibtola Janakalyan Sangha*, *Sabarna Roy Choudhury*, and *Chamunda Puja Pandal*) are flagged with clear "Unverified" badges and open fallback search links rather than placing guessed pins on the map.
2. **Pedestrian Safety**: Route estimates in the PDF are planning guidelines from metro stations. Live directions utilize pedestrian routing. Always follow Kolkata Traffic Police barricades and one-way crowd control corridors during festival days.
3. **No Unsolicited Tracking**: Geolocation permissions are requested only upon user action and never tracked in the background.

---

## 📄 License

MIT © 2026 PandalPath Kolkata Team. Sourced from the 2026 Kolkata Durga Puja Planning Route Survey.
