import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Layers,
  Maximize2,
  Plus,
  Minus,
  MapPin,
  Compass,
  Navigation,
  Box,
  X,
  Shield,
  Fish,
  Anchor,
  Info,
  Activity,
  Sliders,
  Check,
} from "lucide-react";

import {
  simulateOilSpillHydrodynamics,
  HydrodynamicSimulationResult,
} from "../utils/spillHydrodynamics";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Map Invalidation helper to prevent gray tiles and smoothly center
const MapResizer: React.FC<{ is3D: boolean; center?: [number, number] }> = ({ is3D, center }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
        map.panTo(center, { animate: true, duration: 0.5 });
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [map, is3D, center]);
  return null;
};

// Custom Vessel Directional Icon with Nautical Heading and Pulsing Glow
const createMiniVesselIcon = (color: string, heading: number = 312, rank: number = 1, isTopCandidate: boolean = false) =>
  L.divIcon({
    className: "mini-vessel-marker",
    html: `
      <div style="
        position: relative;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${
          isTopCandidate
            ? `<div style="
                position: absolute;
                inset: -4px;
                border-radius: 9999px;
                background: ${color};
                opacity: 0.35;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>`
            : ""
        }
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          background: ${color};
          border: 2px solid #FFFFFF;
          box-shadow: 0 3px 10px rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${heading}deg);
          transition: transform 0.3s ease;
        ">
          <div style="
            width: 0;
            height: 0;
            border-left: 4.5px solid transparent;
            border-right: 4.5px solid transparent;
            border-bottom: 9px solid #FFFFFF;
          "></div>
        </div>
        <div style="
          position: absolute;
          top: -6px;
          right: -6px;
          background: #0B2545;
          color: #FFFFFF;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          font-weight: 800;
          width: 13px;
          height: 13px;
          border-radius: 9999px;
          border: 1.5px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">#${rank}</div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

// Coast Guard Asset Icon
const createCoastGuardAssetIcon = (type: string) =>
  L.divIcon({
    className: "cg-asset-marker",
    html: `
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: #0B2545;
        border: 2px solid #38BDF8;
        box-shadow: 0 2px 8px rgba(11,37,69,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #38BDF8;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

// Coastline City / Port Label Icon
const createCityLabelIcon = (name: string, isPort: boolean = false) =>
  L.divIcon({
    className: "city-label-marker",
    html: `
      <div style="
        background: rgba(11, 37, 69, 0.92);
        backdrop-filter: blur(6px);
        color: #FFFFFF;
        font-family: 'Inter', sans-serif;
        font-size: 9.5px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.25);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 3px;
        white-space: nowrap;
      ">
        ${isPort ? `<span style="color: #38BDF8;">⚓</span>` : `<span style="color: #F87171;">●</span>`}
        <span>${name}</span>
      </div>
    `,
    iconSize: [80, 20],
    iconAnchor: [40, 10],
  });

export interface MapVesselCandidate {
  id?: string;
  name: string;
  score: number;
  imo?: string;
  type?: string;
  flag?: string;
  coords: [number, number];
  heading?: number;
  speed?: number;
  rank: number;
}

export interface MapCoastGuardAsset {
  id: string | number;
  name: string;
  asset_type?: string;
  coordinates: [number, number];
  status?: string;
  distance_km?: number;
}

interface IncidentMiniMapProps {
  incidentCode?: string;
  center?: [number, number];
  originCoord?: [number, number];
  spillPolygon?: [number, number][];
  forecastTrack?: [number, number][];
  vessels?: MapVesselCandidate[];
  cgAssets?: MapCoastGuardAsset[];
  onSelectVessel?: (vessel: MapVesselCandidate) => void;
  onNavigateToFullMap?: () => void;
  isSimulated?: boolean;
}

export const IncidentMiniMap: React.FC<IncidentMiniMapProps> = ({
  incidentCode = "IN-MH-2026",
  center = [18.9997, 72.5502],
  originCoord = [18.78, 72.51],
  spillPolygon,
  forecastTrack,
  vessels = [],
  cgAssets = [],
  onSelectVessel,
  onNavigateToFullMap,
  isSimulated = false,
}) => {
  const [tileMode, setTileMode] = useState<"street" | "satellite" | "nautical">("satellite");
  const [is3D, setIs3D] = useState(false);
  const [isFullscreenModal, setIsFullscreenModal] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Active Layers Toggles
  const [layers, setLayers] = useState({
    slick: true,
    origin: true,
    forecast: true,
    vessels: true,
    assets: true,
    coastalZones: true,
    eezBoundary: true,
    mpaSanctuary: true,
  });

  const mapRef = useRef<L.Map | null>(null);
  const modalMapRef = useRef<L.Map | null>(null);

  // Dynamic Hydrodynamic Calculation for realistic multi-layer slick
  const hydroSim = useMemo<HydrodynamicSimulationResult>(() => {
    return simulateOilSpillHydrodynamics({
      centroid: center,
      windSpeedKts: 10.0,
      windDirDeg: 289,
      currentSpeedKts: 1.3,
      currentDirDeg: 189,
      releaseOffsetHours: -18.0,
      releaseVolumeM3: 18000,
      containmentEffPct: isSimulated ? 45 : 20,
      chemicalDispersant: isSimulated,
      responseDelayHours: isSimulated ? 2.0 : 4.0,
      turbulentDiffusion: 12.0,
    });
  }, [center, isSimulated]);

  // Fallback realistic slick polygon around center if none provided
  const effectiveSlickPolygon: [number, number][] =
    spillPolygon && spillPolygon.length >= 3
      ? spillPolygon
      : hydroSim.sheenLayer.coordinates;

  // Fallback forecast trajectory drifting towards Maharashtra / Alibaug coast
  const effectiveForecastTrack: [number, number][] =
    forecastTrack && forecastTrack.length >= 2
      ? forecastTrack
      : hydroSim.forecastLineCoords;

  // Default vessel candidate positions if none supplied
  const effectiveVessels: MapVesselCandidate[] =
    vessels.length > 0
      ? vessels
      : [
          {
            name: "MT PACIFIC VOYAGER",
            score: 98.8,
            imo: "9438200",
            type: "Crude Oil Tanker",
            flag: "Liberia",
            coords: [originCoord[0] + 0.04, originCoord[1] - 0.05],
            heading: 312,
            speed: 1.4,
            rank: 1,
          },
          {
            name: "CMA CGM ANTARES",
            score: 43.5,
            imo: "9723411",
            type: "Container Vessel",
            flag: "France",
            coords: [originCoord[0] + 0.55, originCoord[1] - 0.36],
            heading: 148,
            speed: 14.8,
            rank: 2,
          },
          {
            name: "MV NORDIC TRADER",
            score: 31.2,
            imo: "9315678",
            type: "Bulk Carrier",
            flag: "Panama",
            coords: [originCoord[0] - 0.42, originCoord[1] + 0.28],
            heading: 180,
            speed: 11.2,
            rank: 3,
          },
        ];

  // Indian Territorial Waters (12 NM) & Contiguous EEZ sample coordinates along Western Seaboard
  const territorialWatersLine: [number, number][] = [
    [19.65, 72.55],
    [19.25, 72.62],
    [18.95, 72.68],
    [18.65, 72.75],
    [18.25, 72.82],
    [17.85, 72.95],
  ];

  // Marine Protected Area (Malvan / Alibaug Buffer Polygon)
  const mpaPolygon: [number, number][] = [
    [18.55, 72.82],
    [18.7, 72.78],
    [18.65, 72.94],
    [18.5, 72.92],
  ];

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const getTileUrl = () => {
    if (tileMode === "satellite") {
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }
    if (tileMode === "nautical") {
      return "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png";
    }
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  };

  return (
    <>
      <div className="relative w-full h-[330px] rounded-2xl overflow-hidden border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] bg-[#0B1D35] flex flex-col font-sans">
        {/* Floating Top Telemetry Pill */}
        <div className="absolute top-2.5 left-2.5 z-[500] flex items-center gap-2 pointer-events-none">
          <div className="bg-[#0B2545]/92 backdrop-blur-md text-white px-2.5 py-1 rounded-xl shadow-md border border-white/20 flex items-center gap-1.5 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
            <span className="font-mono text-xs">
              {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E
            </span>
          </div>
          {isSimulated && (
            <span className="bg-amber-500/90 backdrop-blur-md text-slate-950 font-mono text-[9px] font-bold px-2 py-0.5 rounded-lg border border-amber-300 shadow">
              SIMULATED
            </span>
          )}
        </div>

        {/* Right Vertical Control Toolbar */}
        <div className="absolute top-2.5 right-2.5 z-[500] flex flex-col gap-1.5 shadow-md">
          {/* 3D Perspective Tilt Button */}
          <button
            type="button"
            onClick={() => setIs3D(!is3D)}
            title="Toggle Tactical 3D Perspective Tilt"
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-[11px] transition-all cursor-pointer border ${
              is3D
                ? "bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-white border-sky-400 shadow-sm"
                : "bg-white/95 backdrop-blur-sm text-[#0B2545] border-[#E1EEF9] hover:bg-slate-50"
            }`}
          >
            3D
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-sm text-slate-700 hover:text-[#0B2545] hover:bg-slate-50 border border-[#E1EEF9] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-sm text-slate-700 hover:text-[#0B2545] hover:bg-slate-50 border border-[#E1EEF9] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Tile Layer Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              title="Toggle Tactical Layers & Basemaps"
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
                showLayerMenu
                  ? "bg-[#1E5FBF] text-white border-sky-500 shadow-sm"
                  : "bg-white/95 backdrop-blur-sm text-slate-700 border-[#E1EEF9] hover:bg-slate-50"
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Layer Settings Dropdown */}
            {showLayerMenu && (
              <div className="absolute right-9 top-0 w-52 bg-white/95 backdrop-blur-md border border-[#E1EEF9] rounded-2xl shadow-2xl p-2.5 text-xs text-slate-700 font-sans z-[600] animate-fadeIn">
                <div className="font-bold text-[11px] text-[#0B2545] uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                  <Sliders className="w-3.5 h-3.5 text-[#1E5FBF]" />
                  <span>Map Layers</span>
                </div>

                {/* Basemap Selection */}
                <div className="mb-2">
                  <div className="text-[10px] text-slate-400 font-semibold mb-1">Basemap</div>
                  <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                    <button
                      onClick={() => setTileMode("satellite")}
                      className={`px-2 py-1 rounded-lg border text-center ${
                        tileMode === "satellite"
                          ? "bg-[#1E5FBF] text-white border-[#1E5FBF]"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      Satellite
                    </button>
                    <button
                      onClick={() => setTileMode("street")}
                      className={`px-2 py-1 rounded-lg border text-center ${
                        tileMode === "street"
                          ? "bg-[#1E5FBF] text-white border-[#1E5FBF]"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      Vector OSM
                    </button>
                  </div>
                </div>

                {/* Layer Toggles */}
                <div className="space-y-1 pt-1 border-t border-slate-100 text-[11px]">
                  <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>SAR Slick Polygon</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={layers.slick}
                      onChange={(e) => setLayers({ ...layers, slick: e.target.checked })}
                      className="rounded text-[#1E5FBF]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Probable Origin Zone</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={layers.origin}
                      onChange={(e) => setLayers({ ...layers, origin: e.target.checked })}
                      className="rounded text-[#1E5FBF]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0EA5B7]" />
                      <span>Drift Forecast Path</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={layers.forecast}
                      onChange={(e) => setLayers({ ...layers, forecast: e.target.checked })}
                      className="rounded text-[#1E5FBF]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>Vessel Candidates</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={layers.vessels}
                      onChange={(e) => setLayers({ ...layers, vessels: e.target.checked })}
                      className="rounded text-[#1E5FBF]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>MPA Sanctuary Buffer</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={layers.mpaSanctuary}
                      onChange={(e) => setLayers({ ...layers, mpaSanctuary: e.target.checked })}
                      className="rounded text-[#1E5FBF]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>12 NM Boundary Line</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={layers.eezBoundary}
                      onChange={(e) => setLayers({ ...layers, eezBoundary: e.target.checked })}
                      className="rounded text-[#1E5FBF]"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Expand */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateToFullMap) {
                onNavigateToFullMap();
              } else {
                setIsFullscreenModal(true);
              }
            }}
            title="Expand Full Tactical Investigation Canvas"
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-sm text-slate-700 hover:text-[#0B2545] hover:bg-slate-50 border border-[#E1EEF9] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Leaflet Map Canvas */}
        <div
          className={`w-full h-full transition-transform duration-500 ${
            is3D ? "scale-105 origin-bottom shadow-2xl" : ""
          }`}
          style={is3D ? { transform: "perspective(750px) rotateX(24deg)" } : undefined}
        >
          <MapContainer
            center={center}
            zoom={8}
            minZoom={4}
            maxZoom={18}
            zoomControl={false}
            attributionControl={false}
            preferCanvas={true}
            zoomAnimation={true}
            zoomAnimationThreshold={8}
            fadeAnimation={true}
            markerZoomAnimation={true}
            inertia={true}
            inertiaDeceleration={3400}
            inertiaMaxSpeed={1500}
            wheelDebounceTime={60}
            wheelPxPerZoomLevel={120}
            easeLinearity={0.2}
            zoomSnap={0.5}
            zoomDelta={0.5}
            ref={mapRef}
            className="w-full h-full"
          >
            <MapResizer is3D={is3D} center={center} />

            {/* Base Layer with Buffer */}
            <TileLayer
              url={getTileUrl()}
              maxZoom={18}
              maxNativeZoom={18}
              tileSize={256}
              updateWhenZooming={false}
              updateWhenIdle={false}
              updateInterval={100}
              keepBuffer={12}
              crossOrigin="anonymous"
            />

            {/* EEZ / 12 NM Territorial Line */}
            {layers.eezBoundary && (
              <Polyline
                positions={territorialWatersLine}
                pathOptions={{
                  color: "#38BDF8",
                  weight: 1.8,
                  dashArray: "4, 6",
                  opacity: 0.85,
                }}
              />
            )}

            {/* Marine Protected Sanctuary Buffer */}
            {layers.mpaSanctuary && (
              <Polygon
                positions={mpaPolygon}
                pathOptions={{
                  color: "#10B981",
                  fillColor: "#10B981",
                  fillOpacity: 0.22,
                  weight: 1.5,
                  dashArray: "3, 3",
                }}
              >
                <Popup>
                  <div className="text-xs font-sans p-1">
                    <div className="font-bold text-emerald-700 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Malvan Marine Sanctuary Buffer</span>
                    </div>
                    <div className="text-slate-600 mt-0.5 text-[11px]">
                      High Ecological Vulnerability Zone (Corals &amp; Turtle Nesting)
                    </div>
                  </div>
                </Popup>
              </Polygon>
            )}

            {/* Reverse Lagrangian Streamlines */}
            {layers.origin && hydroSim.reverseStreamlines && hydroSim.reverseStreamlines.map((sl) => (
              <Polyline
                key={sl.id}
                positions={sl.coordinates}
                pathOptions={{
                  color: "#38BDF8",
                  weight: 2.2,
                  dashArray: "5 4",
                  opacity: sl.opacity,
                }}
              />
            ))}

            {/* Origin 95% Uncertainty Error Ellipse */}
            {layers.origin && hydroSim.originEllipse && (
              <Polygon
                positions={hydroSim.originEllipse.coordinates}
                pathOptions={{
                  color: "#818CF8",
                  fillColor: "#6366F1",
                  fillOpacity: 0.14,
                  weight: 1.5,
                  dashArray: "4 4",
                }}
              />
            )}

            {/* Candidate Origin Release Zones (Alpha, Beta, Gamma) */}
            {layers.origin && hydroSim.originZones && hydroSim.originZones.map((zone) => (
              <Polygon
                key={zone.id}
                positions={zone.coordinates}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.fillColor,
                  fillOpacity: zone.fillOpacity,
                  weight: zone.id === "zone-alpha" ? 2.5 : 1.5,
                  dashArray: zone.id === "zone-alpha" ? undefined : "3 3",
                }}
              >
                <Popup>
                  <div className="text-xs font-sans p-1">
                    <div className="font-bold text-[#0B2545] flex items-center justify-between pb-1 border-b mb-1">
                      <span>{zone.name}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {zone.probabilityPct}% Prob
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 mb-1">{zone.description}</div>
                    <div className="font-mono text-[10px] text-slate-700">
                      Center: {zone.center[0].toFixed(4)}°N, {zone.center[1].toFixed(4)}°E
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {/* Probable Origin Zone (Ellipse / Circle with hindcast uncertainty) */}
            {layers.origin && originCoord && (
              <Circle
                center={originCoord}
                radius={hydroSim.originConfidenceRadiusKm * 1000}
                pathOptions={{
                  color: "#EF4444",
                  fillColor: "#DC2626",
                  fillOpacity: 0.35,
                  weight: 2,
                  dashArray: "4 4",
                }}
              >
                <Popup>
                  <div className="text-xs font-sans p-1">
                    <div className="font-bold text-rose-700 flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Most Probable Release Origin</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 mt-1">
                      {originCoord[0].toFixed(4)}°N, {originCoord[1].toFixed(4)}°E
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      OpenDrift Reverse Lagrangian Hindcast ({hydroSim.originTimeWindow})
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700 mt-1">
                      Confidence: {hydroSim.originConfidenceScorePct}% (High Certainty)
                    </div>
                  </div>
                </Popup>
              </Circle>
            )}

            {/* Multi-Tier Realistic Slick Contours (Core, Moderate, Sheen) */}
            {layers.slick && (
              <>
                {/* 1. Outer Sheen */}
                <Polygon
                  positions={hydroSim.sheenLayer.coordinates}
                  pathOptions={{
                    color: hydroSim.sheenLayer.color,
                    fillColor: hydroSim.sheenLayer.fillColor,
                    fillOpacity: hydroSim.sheenLayer.fillOpacity,
                    weight: hydroSim.sheenLayer.weight,
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans p-1">
                      <div className="font-bold text-sky-700 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Light Sheen Slick (Bonn 1-2)</span>
                      </div>
                      <div className="text-[11px] text-slate-700 mt-1">
                        Total Area: <span className="font-mono font-bold">{hydroSim.totalAreaKm2} km²</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Sentinel-1A SAR · 10m GSD Hydrodynamic Segmentation
                      </div>
                    </div>
                  </Popup>
                </Polygon>

                {/* 2. Moderate Contamination */}
                <Polygon
                  positions={hydroSim.moderateLayer.coordinates}
                  pathOptions={{
                    color: hydroSim.moderateLayer.color,
                    fillColor: hydroSim.moderateLayer.fillColor,
                    fillOpacity: hydroSim.moderateLayer.fillOpacity,
                    weight: hydroSim.moderateLayer.weight,
                  }}
                />

                {/* 3. Heavy Viscous Core */}
                <Polygon
                  positions={hydroSim.coreLayer.coordinates}
                  pathOptions={{
                    color: hydroSim.coreLayer.color,
                    fillColor: hydroSim.coreLayer.fillColor,
                    fillOpacity: hydroSim.coreLayer.fillOpacity,
                    weight: hydroSim.coreLayer.weight,
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans p-1">
                      <div className="font-bold text-rose-800">Heavy Core Emulsion</div>
                      <div className="text-[11px] text-slate-700">Area: {hydroSim.coreLayer.areaKm2} km²</div>
                      <div className="text-[10px] text-slate-500">Thickness: &gt;100 µm</div>
                    </div>
                  </Popup>
                </Polygon>
              </>
            )}

            {/* Stochastic Uncertainty Envelope */}
            {layers.forecast && (
              <Polygon
                positions={hydroSim.probabilityEnvelope}
                pathOptions={{
                  color: "#6366F1",
                  fillColor: "#818CF8",
                  fillOpacity: 0.15,
                  weight: 1.2,
                  dashArray: "3 3",
                }}
              />
            )}

            {/* Drift Forecast Trajectory */}
            {layers.forecast && (
              <Polyline
                positions={effectiveForecastTrack}
                pathOptions={{
                  color: "#0EA5B7",
                  weight: 3,
                  dashArray: "6, 6",
                  opacity: 0.9,
                }}
              />
            )}

            {/* Candidate Vessels */}
            {layers.vessels &&
              effectiveVessels.map((v, idx) => {
                const isTop = v.rank === 1 || v.score > 90;
                const markerColor = isTop ? "#EF4444" : v.score > 40 ? "#F59E0B" : "#10B981";
                return (
                  <Marker
                    key={v.name + idx}
                    position={v.coords}
                    icon={createMiniVesselIcon(markerColor, v.heading || 312, v.rank, isTop)}
                    eventHandlers={{
                      click: () => {
                        if (onSelectVessel) onSelectVessel(v);
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-sans p-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#0B2545]">{v.name}</span>
                          <span
                            className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isTop
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {v.score}% Score
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          IMO: {v.imo || "N/A"} · Type: {v.type || "Vessel"}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5 font-mono">
                          Pos: {v.coords[0].toFixed(2)}°N, {v.coords[1].toFixed(2)}°E · SOG:{" "}
                          {v.speed || 0} kts
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Coast Guard Assets */}
            {layers.assets &&
              cgAssets.map((cg) => (
                <Marker
                  key={cg.id}
                  position={cg.coordinates}
                  icon={createCoastGuardAssetIcon(cg.asset_type || "vessel")}
                >
                  <Popup>
                    <div className="text-xs font-sans p-1">
                      <div className="font-bold text-[#0B2545] flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-sky-600" />
                        <span>{cg.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        Status: <span className="text-emerald-700 font-bold">{cg.status || "Operational"}</span> · Dist:{" "}
                        {cg.distance_km ? `${cg.distance_km.toFixed(1)} km` : "On Station"}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Coastline Landmarks & Port Markers */}
            <Marker position={[18.96, 72.82]} icon={createCityLabelIcon("Mumbai Port", true)} />
            <Marker position={[18.66, 72.88]} icon={createCityLabelIcon("Alibaug Coast")} />
            <Marker position={[19.8, 72.7]} icon={createCityLabelIcon("Tarapur Zone")} />
          </MapContainer>
        </div>

        {/* Bottom Tactical Investigation Legend */}
        <div className="absolute bottom-2.5 left-2.5 z-[500] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E1EEF9] shadow-md text-[10px] text-slate-700 space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
              <span className="font-semibold text-[#0B2545]">SAR Slick</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5B7] shadow-2xs" />
              <span className="font-semibold text-[#0B2545]">Drift Vector</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
              <span className="font-semibold text-[#0B2545]">Origin Ellipse</span>
            </div>
          </div>
          <div className="pt-0.5 flex items-center justify-between font-mono text-[9px] text-slate-400 border-t border-slate-100">
            <span>0 NM</span>
            <div className="flex-1 mx-2 h-0.5 bg-slate-300 rounded-full" />
            <span>25 NM</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Expanded Investigation Map Modal */}
      {isFullscreenModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-6xl h-[88vh] bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-[#E1EEF9] flex items-center justify-between bg-[#F8FBFE]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#1E5FBF] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#0B2545] font-display">
                    Tactical Maritime Intelligence Canvas &mdash; {incidentCode}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    WGS84 Hydrographic Projection · Real-Time AIS &amp; SAR Multi-Layer Correlation
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsFullscreenModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Leaflet Canvas */}
            <div className="flex-1 relative w-full h-full bg-[#0B1D35]">
              <MapContainer
                center={center}
                zoom={9}
                zoomControl={true}
                ref={modalMapRef}
                className="w-full h-full"
              >
                <TileLayer url={getTileUrl()} maxZoom={18} />
                <Polygon
                  positions={effectiveSlickPolygon}
                  pathOptions={{ color: "#DC2626", fillColor: "#EF4444", fillOpacity: 0.62 }}
                />
                <Polyline
                  positions={effectiveForecastTrack}
                  pathOptions={{ color: "#0EA5B7", weight: 3.5, dashArray: "6,6" }}
                />
                <Circle
                  center={originCoord}
                  radius={11000}
                  pathOptions={{ color: "#F59E0B", fillColor: "#FBBF24", fillOpacity: 0.35, dashArray: "5,5" }}
                />
                {effectiveVessels.map((v, i) => (
                  <Marker
                    key={v.name + i}
                    position={v.coords}
                    icon={createMiniVesselIcon(v.rank === 1 ? "#EF4444" : "#F59E0B", v.heading || 312, v.rank, v.rank === 1)}
                  >
                    <Popup>
                      <div className="text-xs font-sans">
                        <div className="font-bold text-[#0B2545]">{v.name}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Attribution Score: {v.score}% · IMO: {v.imo}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                <Marker position={[18.96, 72.82]} icon={createCityLabelIcon("Mumbai Port", true)} />
                <Marker position={[18.66, 72.88]} icon={createCityLabelIcon("Alibaug Coast")} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
