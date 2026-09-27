import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Search, Navigation, ChevronRight, Loader2,
  Target, Layers, ArrowRight, AlertTriangle, CheckCircle2,
  Crosshair, LocateFixed, Gauge
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { GeocodeResult } from '../types';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom proposed location marker (gold/amber)
const proposedIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:32px; height:32px; background:linear-gradient(135deg,#F5D867,#D4A359);
    border:3px solid #FFFFFF; border-radius:50% 50% 50% 0; transform:rotate(-45deg);
    box-shadow:0 4px 14px rgba(0,0,0,0.6); cursor:grab;
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// ── Map click handler ─────────────────────────────────────────────────────

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Step indicator ────────────────────────────────────────────────────────

interface StepProps {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}

function Step({ number, label, active, done }: StepProps) {
  return (
    <div className={`flex items-center gap-2 transition-all duration-300 ${active ? 'opacity-100' : 'opacity-50'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
        done
          ? 'bg-emerald-500 border-emerald-500 text-black'
          : active
          ? 'bg-[#F5D867] border-[#F5D867] text-black ring-2 ring-[#F5D867]/30 shadow-sm'
          : 'bg-[#1c1c1c] border-[#333333] text-gray-400'
      }`}>
        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : number}
      </div>
      <span className={`text-xs font-bold tracking-wide ${active ? 'text-white' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

// ── Quick exploration hubs ───────────────────────────────────────────────

const INDIA_CENTER: [number, number] = [22.5, 78.5]; // Pan-India overview

const QUICK_LOCATIONS = [
  { name: 'Duliajan, Assam', lat: 27.3584, lng: 95.3182, basin: 'Assam Shelf' },
  { name: 'Dattapura, Waghodia, Vadodara', lat: 22.3000, lng: 73.1800, basin: 'Cambay' },
  { name: 'Ankleshwar, Gujarat', lat: 21.6264, lng: 73.0033, basin: 'Cambay' },
  { name: 'Barmer, Rajasthan', lat: 25.7521, lng: 71.3967, basin: 'Rajasthan' },
  { name: 'Kakinada, Andhra Pradesh', lat: 16.9500, lng: 82.2500, basin: 'KG Basin' },
  { name: 'Nagapattinam, Tamil Nadu', lat: 10.7656, lng: 79.8424, basin: 'Cauvery' },
  { name: 'Cuttack, Odisha', lat: 20.4625, lng: 85.8828, basin: 'Mahanadi' },
  { name: 'Mumbai Offshore', lat: 19.4200, lng: 71.3300, basin: 'Western Offshore' },
  { name: 'Vijayapuram, Andaman', lat: 11.6670, lng: 92.7400, basin: 'Andaman' }
];

export const PlanWell: React.FC = () => {
  const navigate = useNavigate();

  // Step state: 1=location, 2=depth, 3=analyzing
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Location
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState('');

  // Geocode search
  const [searchQuery, setSearchQuery] = useState('');
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Depth
  const [plannedDepth, setPlannedDepth] = useState<string>('3000');

  // Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map ref to programmatically pan & invalidateSize
  const mapRef = useRef<L.Map | null>(null);

  // Invalidate map size on mount and window resize
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 150);

    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Geocode search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    setSearchLoading(true);
    setShowResults(true);
    try {
      const results = await api.geocodePlace(searchQuery);
      setGeocodeResults(results);
    } catch {
      setGeocodeResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  // Handle map click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    const pos: [number, number] = [lat, lng];
    setMarkerPos(pos);
    setLocationName(`${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`);
    setStep(2);
  }, []);

  // Handle geocode selection
  const handleSelectGeocode = (result: GeocodeResult) => {
    const pos: [number, number] = [result.lat, result.lng];
    setMarkerPos(pos);
    setLocationName(result.display_name);
    setSearchQuery(result.display_name.split(',').slice(0, 2).join(', '));
    setShowResults(false);
    setStep(2);

    if (mapRef.current) {
      mapRef.current.flyTo(pos, 10, { animate: true, duration: 1.2 });
    }
  };

  // Browser geolocation
  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMarkerPos(coords);
        setLocationName(`${coords[0].toFixed(5)}°N, ${coords[1].toFixed(5)}°E (Device GPS)`);
        setStep(2);
        if (mapRef.current) mapRef.current.flyTo(coords, 10, { animate: true, duration: 1.2 });
      },
      () => {
        // Fallback Vadodara
        const vadodara: [number, number] = [22.3000, 73.1800];
        setMarkerPos(vadodara);
        setLocationName('Dattapura, Waghodia, Vadodara');
        setSearchQuery('Dattapura, Waghodia, Vadodara');
        setStep(2);
        mapRef.current?.flyTo(vadodara, 10, { animate: true, duration: 1.0 });
      }
    );
  };

  // Run analysis
  const handleAnalyze = async () => {
    if (!markerPos) {
      setError('Please select a drilling location on the map.');
      return;
    }

    const depthNum = parseFloat(plannedDepth);
    if (!depthValid) {
      setError('Please enter a valid planned depth between 100m and 12,000m.');
      return;
    }

    setError(null);
    setAnalyzing(true);
    setStep(3);

    try {
      const brief = await api.analyzeLocation({
        lat: markerPos[0],
        lng: markerPos[1],
        planned_depth_m: depthNum,
        location_name: locationName || undefined
      });

      // Store result in sessionStorage and navigate to brief page
      sessionStorage.setItem('nwis_engineering_brief', JSON.stringify(brief));
      navigate('/plan/brief');
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Please try again.');
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  };

  const depthNum = parseFloat(plannedDepth);
  const depthValid = depthNum >= 100 && depthNum <= 12000;

  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-hidden bg-[#0d0d0d] text-white">

      {/* ── Page Header / Workflow Bar (Fixed, never clipped) ─────────────── */}
      <header className="bg-[#141414] border-b border-[#262626] px-5 py-3 flex items-center justify-between shrink-0 z-10 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F5D867]/10 border border-[#F5D867]/30 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-[#F5D867]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">Plan New Well</h1>
              <span className="text-[10px] bg-[#F5D867]/15 text-[#F5D867] border border-[#F5D867]/30 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                Location Intelligence
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              Select a drilling location → Set planned depth → Analyze offset evidence
            </p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          <Step number={1} label="Location" active={step >= 1} done={step > 1} />
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <Step number={2} label="Depth" active={step >= 2} done={step > 2} />
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <Step number={3} label="Analyze" active={step === 3} done={false} />
        </div>
      </header>

      {/* ── Main Working Area: Map (Left) + Dark Control Panel (Right) ─────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] w-full h-full overflow-hidden">

        {/* ── Left Column: Leaflet Map ────────────────────────────────────── */}
        <div className="relative w-full h-full min-h-0 overflow-hidden bg-[#181818]">
          <MapContainer
            center={INDIA_CENTER}
            zoom={5}
            style={{ width: '100%', height: '100%' }}
            ref={mapRef as any}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onLocationSelect={handleMapClick} />

            {markerPos && (
              <>
                <Marker position={markerPos} icon={proposedIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <div className="font-bold text-amber-600 flex items-center gap-1">📍 Proposed Drilling Target</div>
                      <div className="text-gray-800 font-semibold mt-1">{locationName}</div>
                      <div className="text-gray-600 font-mono text-[11px] mt-0.5">
                        {markerPos[0].toFixed(5)}°N, {markerPos[1].toFixed(5)}°E
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Analysis radius circle (15km default) */}
                <Circle
                  center={markerPos}
                  radius={15000}
                  pathOptions={{
                    color: '#F5D867',
                    fillColor: '#F5D867',
                    fillOpacity: 0.08,
                    weight: 2,
                    dashArray: '8 4'
                  }}
                />
              </>
            )}
          </MapContainer>

          {/* Map instruction overlay (Dark semi-transparent card) */}
          {!markerPos && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
              <div className="bg-[#141414]/90 backdrop-blur-md rounded-2xl px-6 py-4 text-center border border-[#2E2E2E] shadow-2xl max-w-xs pointer-events-auto">
                <div className="w-10 h-10 rounded-full bg-[#F5D867]/10 border border-[#F5D867]/30 flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-5 h-5 text-[#F5D867]" />
                </div>
                <p className="text-white font-bold text-sm">Click anywhere on the map</p>
                <p className="text-gray-300 text-xs mt-1">or search a place to drop a proposed drilling location</p>
              </div>
            </div>
          )}

          {/* Custom Zoom Controls (Dark) */}
          <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-1">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="w-8 h-8 bg-[#181818]/90 hover:bg-[#252525] text-white rounded-lg flex items-center justify-center text-base font-bold border border-[#333333] backdrop-blur-sm shadow-xl transition-colors cursor-pointer"
              title="Zoom In"
            >+</button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="w-8 h-8 bg-[#181818]/90 hover:bg-[#252525] text-white rounded-lg flex items-center justify-center text-base font-bold border border-[#333333] backdrop-blur-sm shadow-xl transition-colors cursor-pointer"
              title="Zoom Out"
            >−</button>
          </div>

          {/* Coordinate Display Badge (Dark) */}
          {markerPos && (
            <div className="absolute bottom-4 left-4 z-[400] bg-[#141414]/90 backdrop-blur-sm text-gray-200 text-xs px-3 py-1.5 rounded-lg border border-[#2E2E2E] font-mono shadow-xl font-bold">
              {markerPos[0].toFixed(5)}°N &nbsp; {markerPos[1].toFixed(5)}°E
            </div>
          )}
        </div>

        {/* ── Right Column: Dark Engineering Control Panel (Independently scrollable) ── */}
        <aside className="w-full h-full min-h-0 bg-[#0d0d0d] border-t lg:border-t-0 lg:border-l border-[#262626] flex flex-col shrink-0 overflow-y-auto overflow-x-hidden p-4 space-y-4">

          {/* ── CARD 1: SELECT DRILLING LOCATION ────────────────────────────── */}
          <div className="bg-[#151515] border border-[#262626] rounded-xl p-4 shadow-sm space-y-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#F5D867] flex items-center justify-center text-black text-[11px] font-black">
                1
              </div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Select Drilling Location
              </h2>
            </div>

            {/* Search Input */}
            <div ref={searchRef} className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    className="w-full bg-[#1e1e1e] border border-[#333333] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#F5D867] focus:ring-1 focus:ring-[#F5D867]/40 transition-all font-medium"
                    placeholder="Search city, block, basin..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-3.5 py-2 bg-[#F5D867] hover:bg-[#e6c752] text-black rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm flex items-center justify-center"
                >
                  {searchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Geocode Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1c1c1c] border border-[#333333] rounded-xl shadow-2xl z-[500] overflow-hidden max-h-48 overflow-y-auto divide-y divide-[#262626]">
                  {searchLoading ? (
                    <div className="p-3 text-center text-gray-400 text-xs">Searching geocodes...</div>
                  ) : geocodeResults.length === 0 ? (
                    <div className="p-3 text-center text-gray-400 text-xs">No locations found</div>
                  ) : (
                    geocodeResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectGeocode(r)}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#282828] transition-colors cursor-pointer"
                      >
                        <div className="text-white text-xs font-semibold truncate">
                          {r.display_name.split(',').slice(0, 2).join(', ')}
                        </div>
                        <div className="text-gray-400 text-[11px] truncate">
                          {r.display_name}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* GPS Locate Button */}
            <button
              onClick={handleGeolocate}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1c1c1c] hover:bg-[#252525] border border-[#333333] rounded-xl text-xs text-gray-200 hover:text-white transition-all cursor-pointer font-semibold shadow-sm"
            >
              <LocateFixed className="w-3.5 h-3.5 text-sky-400" />
              Use current device location
            </button>

            {/* Quick-Select Regional Hubs */}
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                India-Wide Exploration Hubs
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_LOCATIONS.map((loc, i) => {
                  const isSelected = locationName === loc.name;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        const pos: [number, number] = [loc.lat, loc.lng];
                        setMarkerPos(pos);
                        setLocationName(loc.name);
                        setSearchQuery(loc.name);
                        setStep(2);
                        if (mapRef.current) {
                          mapRef.current.flyTo(pos, 10, { animate: true, duration: 1.0 });
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] transition-all border cursor-pointer font-medium ${
                        isSelected
                          ? 'bg-[#F5D867] text-black border-[#F5D867] font-bold shadow-sm'
                          : 'bg-[#1c1c1c] hover:bg-[#262626] border border-[#333333] text-gray-200 hover:text-white'
                      }`}
                    >
                      {loc.name.split(',')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Location Pill */}
            {markerPos ? (
              <div className="p-2.5 bg-[#F5D867]/10 border border-[#F5D867]/30 rounded-xl space-y-1">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#F5D867] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[#F5D867] text-[10px] font-bold uppercase tracking-wider">Target Selected</div>
                    <div className="text-white text-xs font-bold truncate leading-tight mt-0.5">{locationName}</div>
                    <div className="text-gray-400 text-[10px] font-mono mt-0.5">
                      {markerPos[0].toFixed(5)}°N, {markerPos[1].toFixed(5)}°E
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-gray-400 text-[11px] pt-0.5">
                <Crosshair className="w-3.5 h-3.5 text-[#F5D867]" />
                <span>Click on the map or choose a hub</span>
              </div>
            )}
          </div>

          {/* ── CARD 2: SET PLANNED DEPTH ───────────────────────────────────── */}
          <div className={`bg-[#151515] border border-[#262626] rounded-xl p-4 shadow-sm space-y-3 shrink-0 transition-opacity duration-200 ${!markerPos ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${step >= 2 ? 'bg-[#F5D867] text-black' : 'bg-[#222222] text-gray-400'}`}>
                2
              </div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Set Planned Depth
              </h2>
            </div>

            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min={100}
                max={12000}
                step={50}
                value={plannedDepth}
                onChange={e => setPlannedDepth(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#333333] rounded-xl pl-9 pr-16 py-2.5 text-white text-sm font-mono font-bold focus:outline-none focus:border-[#F5D867] focus:ring-1 focus:ring-[#F5D867]/40 transition-all"
                placeholder="3000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono font-semibold">
                m MD
              </span>
            </div>

            {/* Quick depth presets */}
            <div className="flex gap-1.5 flex-wrap">
              {[1500, 2500, 3000, 4000, 5000].map(d => {
                const isSelected = plannedDepth === String(d);
                return (
                  <button
                    key={d}
                    onClick={() => setPlannedDepth(String(d))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#F5D867] border-[#F5D867] text-black font-bold shadow-sm'
                        : 'bg-[#1c1c1c] hover:bg-[#252525] border border-[#333333] text-gray-200 hover:text-white'
                    }`}
                  >
                    {d}m
                  </button>
                );
              })}
            </div>

            {plannedDepth && !depthValid && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Depth must be between 100m and 12,000m</span>
              </div>
            )}
          </div>

          {/* ── CARD 3: ANALYZE DRILLING AREA ───────────────────────────────── */}
          <div className="bg-[#151515] border border-[#262626] rounded-xl p-4 shadow-sm space-y-4 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${step === 3 ? 'bg-[#F5D867] text-black animate-pulse' : 'bg-[#222222] text-gray-400'}`}>
                  3
                </div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Analyze Drilling Area
                </h2>
              </div>

              {/* Workflow checklist */}
              <div className="space-y-2 text-xs">
                {[
                  'Nearby offset wells (5 → 30 km radius)',
                  'Geological formation & stratigraphy correlation',
                  'Historical drilling hazards (±600m depth window)',
                  'Risk prediction & SHAP explainability',
                  'Supporting evidence from DDR & WCR archives'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-200 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F5D867] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Action Button */}
            <div className="pt-1">
              <button
                onClick={handleAnalyze}
                disabled={!markerPos || !depthValid || analyzing}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md ${
                  markerPos && depthValid && !analyzing
                    ? 'bg-gradient-to-r from-[#F5D867] to-[#e6c752] hover:from-[#e6c752] hover:to-[#d4b63e] text-black shadow-[#F5D867]/20 hover:scale-[1.01] cursor-pointer'
                    : 'bg-[#1c1c1c] text-gray-500 border border-[#2c2c2c] cursor-not-allowed'
                }`}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Analyzing Offset Evidence...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Analyze Drilling Area</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {markerPos && depthValid && !analyzing && (
                <p className="text-center text-gray-400 text-[10px] mt-2 font-mono font-medium">
                  {markerPos[0].toFixed(4)}°N, {markerPos[1].toFixed(4)}°E · {plannedDepth}m MD
                </p>
              )}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
};

export default PlanWell;
