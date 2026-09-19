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

// Configure default icon fallback
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

import {
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Navigation,
  Compass,
  Wind,
  Waves,
  Thermometer,
  RotateCcw,
  ChevronDown,
  Anchor,
  Flag,
  Droplets,
  Ruler,
} from "lucide-react";
import { PortSelector } from "./PortSelector";
import { INDIAN_PORTS, IndianPort } from "../data/indianPorts";
import { INCIDENT_DATA } from "../data/incidentData";
import {
  simulateOilSpillHydrodynamics,
  HydrodynamicSimulationResult,
} from "../utils/spillHydrodynamics";

// Memoized DivIcon Caches for MapPanel
const panelPortIconCache = new Map<string, L.DivIcon>();
const panelVesselIconCache = new Map<string, L.DivIcon>();

// Custom Anchor DivIcon for Indian Ports with Caching
const createPortIcon = (isSelected: boolean) => {
  const key = isSelected ? "sel" : "norm";
  if (panelPortIconCache.has(key)) {
    return panelPortIconCache.get(key)!;
  }
  const icon = L.divIcon({
    className: "custom-port-marker",
    html: `
      <div style="
        width: ${isSelected ? "34px" : "28px"};
        height: ${isSelected ? "34px" : "28px"};
        border-radius: 9999px;
        background: ${isSelected ? "#185ADB" : "#0284C7"};
        color: white;
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="5" r="3"></circle>
          <line x1="12" y1="22" x2="12" y2="8"></line>
          <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
        </svg>
      </div>
    `,
    iconSize: [isSelected ? 34 : 28, isSelected ? 34 : 28],
    iconAnchor: [isSelected ? 17 : 14, isSelected ? 17 : 14],
    popupAnchor: [0, -16],
  });
  panelPortIconCache.set(key, icon);
  return icon;
};

// Custom Vessel DivIcon with Caching
const createVesselIcon = (isSuspect: boolean, heading: number = 312) => {
  const roundedHeading = Math.round(heading / 5) * 5;
  const key = `${isSuspect ? 1 : 0}_${roundedHeading}`;
  if (panelVesselIconCache.has(key)) {
    return panelVesselIconCache.get(key)!;
  }
  const icon = L.divIcon({
    className: "custom-vessel-marker",
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        ${
          isSuspect
            ? `<div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ""
        }
        <div style="
          width: ${isSuspect ? "22px" : "18px"};
          height: ${isSuspect ? "22px" : "18px"};
          border-radius: 9999px;
          background: ${isSuspect ? "#EF4444" : "#10B981"};
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${roundedHeading}deg);
        ">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <polygon points="12,2 22,22 12,17 2,22" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
  panelVesselIconCache.set(key, icon);
  return icon;
};

// Incident Constants
const INCIDENT_CENTER: [number, number] = [18.9997, 72.5502];
const DEFAULT_ZOOM = 9;

// Child controller component to access Map instance and handle debounced resizing/zoom
const MapController: React.FC<{
  targetCoords: [number, number] | null;
  targetZoom: number;
  mapMode: "Map" | "Satellite";
  onMapInstance?: (map: L.Map) => void;
}> = ({ targetCoords, targetZoom, mapMode, onMapInstance }) => {
  const map = useMap();
  const lastTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (onMapInstance) onMapInstance(map);

    let rAFId: number | null = null;
    let lastWidth = 0;
    let lastHeight = 0;

    const handleDebouncedResize = () => {
      if (rAFId) cancelAnimationFrame(rAFId);
      rAFId = requestAnimationFrame(() => {
        const container = map.getContainer();
        if (container) {
          const { clientWidth, clientHeight } = container;
          if (Math.abs(clientWidth - lastWidth) > 3 || Math.abs(clientHeight - lastHeight) > 3) {
            lastWidth = clientWidth;
            lastHeight = clientHeight;
            if (!(map as any)._animatingZoom && !(map as any)._moving) {
              map.invalidateSize({ debounceMoveend: true });
            }
          }
        }
      });
    };

    const container = map.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      lastWidth = container.clientWidth;
      lastHeight = container.clientHeight;
      resizeObserver = new ResizeObserver(handleDebouncedResize);
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", handleDebouncedResize);

    const timer = setTimeout(() => {
      if (!(map as any)._animatingZoom) {
        map.invalidateSize();
      }
    }, 150);

    return () => {
      if (rAFId) cancelAnimationFrame(rAFId);
      clearTimeout(timer);
      window.removeEventListener("resize", handleDebouncedResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [map, onMapInstance]);

  // Invalidate size on mapMode toggle
  useEffect(() => {
    const t = setTimeout(() => {
      if (!(map as any)._animatingZoom) {
        map.invalidateSize();
      }
    }, 50);
    return () => clearTimeout(t);
  }, [mapMode, map]);

  useEffect(() => {
    if (targetCoords) {
      const key = `${targetCoords[0].toFixed(4)},${targetCoords[1].toFixed(4)},${targetZoom}`;
      if (lastTargetRef.current !== key) {
        lastTargetRef.current = key;
        map.flyTo(targetCoords, targetZoom, {
          duration: 0.9,
          easeLinearity: 0.25,
          noMoveStart: true,
        });
      }
    }
  }, [targetCoords, targetZoom, map]);

  return null;
};

interface MapPanelProps {
  onOpenTrackModal?: () => void;
  onOpenInfoModal?: () => void;
  onTriggerToast?: (msg: string) => void;
}

export const MapPanel: React.FC<MapPanelProps> = ({
  onOpenTrackModal,
  onOpenInfoModal,
  onTriggerToast,
}) => {
  const [mapMode, setMapMode] = useState<"Map" | "Satellite">("Map");
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);
  const [layers, setLayers] = useState({
    oilSlick: true,
    hindcastTrack: true,
    forecastTrack: true,
    probableOrigin: true,
    vesselsAis: true,
    protectedAreas: true,
    fishingZones: true,
    ports: true,
  });
  const [noFlyRestrictedZones, setNoFlyRestrictedZones] = useState(false);
  const [selectedPort, setSelectedPort] = useState<IndianPort | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ coords: [number, number]; zoom: number }>({
    coords: INCIDENT_CENTER,
    zoom: DEFAULT_ZOOM,
  });

  const mapInstanceRef = useRef<L.Map | null>(null);
  const selectedPortMarkerRef = useRef<L.Marker | null>(null);

  // Fullscreen expansion state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Exit fullscreen on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Invalidate map size when fullscreen mode toggles
  useEffect(() => {
    const timers = [30, 100, 250, 600].map((ms) =>
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, ms)
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [isFullscreen]);

  // Handle Port Selection
  const handleSelectPort = (port: IndianPort) => {
    setSelectedPort(port);
    setFlyTarget({ coords: [port.lat, port.lng], zoom: 11 });
    if (onTriggerToast) {
      onTriggerToast(`Navigating to ${port.name} (${port.city})`);
    }
  };

  // Reset to Incident View
  const handleResetIncidentView = () => {
    setSelectedPort(null);
    setFlyTarget({ coords: INCIDENT_CENTER, zoom: DEFAULT_ZOOM });
    if (onTriggerToast) {
      onTriggerToast("Reset view to Mumbai High Offshore Incident");
    }
  };

  // Zoom handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  // Mock vessel count calculation near port
  const getNearPortVesselCount = (port: IndianPort) => {
    // Deterministic pseudo-random count between 4 and 18
    const hash = Math.round(port.lat * 10 + port.lng * 10) % 15;
    return hash + 4;
  };

  // Dynamic Hydrodynamic Oil Slick Simulation (Realistic multi-layer footprint)
  const hydroSim = useMemo<HydrodynamicSimulationResult>(() => {
    return simulateOilSpillHydrodynamics({
      centroid: INCIDENT_CENTER,
      windSpeedKts: 10.0,
      windDirDeg: 289,
      currentSpeedKts: 1.3,
      currentDirDeg: 189,
      releaseOffsetHours: -18.0,
      releaseVolumeM3: 18000,
      containmentEffPct: 35,
      chemicalDispersant: true,
      responseDelayHours: 3.0,
      turbulentDiffusion: 12.0,
    });
  }, []);

  const probableOriginCenter: [number, number] = hydroSim.probableOrigin;
  const hindcastTrackCoords: [number, number][] = [
    hydroSim.probableOrigin,
    [18.84, 72.53],
    [18.91, 72.54],
    INCIDENT_CENTER,
  ];

  const restrictedZoneCoords: [number, number][] = [
    [19.15, 72.40],
    [19.18, 72.70],
    [18.90, 72.68],
    [18.88, 72.38],
  ];

  const mpaZoneCoords: [number, number][] = [
    [18.65, 72.80],
    [18.75, 72.95],
    [18.55, 73.05],
    [18.45, 72.85],
  ];

  const fishingZoneCoords: [number, number][] = [
    [19.20, 72.50],
    [19.30, 72.75],
    [19.10, 72.85],
    [19.05, 72.60],
  ];

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] bg-white flex flex-col h-screen w-screen animate-fadeIn"
          : "rounded-2xl bg-white border border-[#E1EEF9] flex flex-col shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all relative min-h-[560px] w-full z-10"
      }
    >
      {/* Top Map Control Bar */}
      <div className="p-2.5 bg-white/95 backdrop-blur-md border-b border-[#E1EEF9] flex flex-wrap items-center justify-between gap-2 relative z-[1100]">
        {/* Left Cluster: Map/Sat, Layers, Port Selector, Reset Button */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Map / Satellite Toggle */}
          <div className="flex p-0.5 rounded-xl bg-slate-100/90 border border-[#E1EEF9]">
            <button
              type="button"
              onClick={() => setMapMode("Map")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mapMode === "Map"
                  ? "bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Map
            </button>
            <button
              type="button"
              onClick={() => setMapMode("Satellite")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mapMode === "Satellite"
                  ? "bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Layers (6) Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayersDropdown(!showLayersDropdown)}
              className="px-3 py-1 rounded-xl bg-white hover:bg-slate-50 border border-[#E1EEF9] text-xs font-semibold text-slate-700 shadow-[0_2px_8px_rgba(30,95,191,0.06)] flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Layers ({Object.values(layers).filter(Boolean).length})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLayersDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-[#E1EEF9] rounded-2xl shadow-[0_10px_30px_rgba(30,95,191,0.15)] p-3 z-50 animate-fadeIn text-xs">
                <div className="font-bold text-[#0B2545] mb-2 pb-1 border-b border-slate-100">
                  Tactical Map Layers
                </div>
                <div className="space-y-2">
                  {[
                    { key: "oilSlick", label: "Multi-Tier Oil Slick (Core/Sheen)" },
                    { key: "hindcastTrack", label: "Hindcast Track (Past)" },
                    { key: "forecastTrack", label: "Forecast Track (+48h)" },
                    { key: "probableOrigin", label: "Probable Origin Zone" },
                    { key: "vesselsAis", label: "Vessels (AIS)" },
                    { key: "ports", label: "Major Ports (Harbors)" },
                    { key: "protectedAreas", label: "Protected Areas (MPA)" },
                    { key: "fishingZones", label: "Fishing Zones" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={layers[item.key as keyof typeof layers]}
                        onChange={(e) =>
                          setLayers({ ...layers, [item.key]: e.target.checked })
                        }
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#185ADB] accent-[#185ADB]"
                      />
                      <span className="text-slate-700 text-xs">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Port Selector Dropdown */}
          <PortSelector
            onSelectPort={handleSelectPort}
            selectedPortName={selectedPort?.name}
          />

          {/* Contextual Back to Incident Button */}
          {selectedPort && (
            <button
              type="button"
              id="back-to-incident-button"
              onClick={handleResetIncidentView}
              className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer animate-fadeIn"
              title="Return to Mumbai High Offshore Incident View"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Back to Incident</span>
            </button>
          )}
        </div>

        {/* Right Cluster: No-Fly Toggle & Fullscreen */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
              No-Fly / Restricted Zones
            </span>
            <input
              type="checkbox"
              checked={noFlyRestrictedZones}
              onChange={(e) => setNoFlyRestrictedZones(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#185ADB] relative cursor-pointer" />
          </label>

          <button
            type="button"
            id="fullscreen-map-button"
            onClick={() => {
              const nextState = !isFullscreen;
              setIsFullscreen(nextState);
              if (onTriggerToast) {
                onTriggerToast(
                  nextState
                    ? "Map expanded to full screen (Press Esc or click Exit to collapse)."
                    : "Map collapsed back to panel view."
                );
              }
            }}
            className={`px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              isFullscreen
                ? "bg-[#0B2545] hover:bg-[#143966] text-white border-[#0B2545] shadow-sm"
                : "bg-white hover:bg-slate-50 border border-[#E1EEF9] text-slate-700 shadow-[0_2px_8px_rgba(30,95,191,0.06)]"
            }`}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand to Fullscreen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="text-xs">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map Body Container */}
      <div
        className={
          isFullscreen
            ? "relative flex-1 w-full h-[calc(100vh-56px)] overflow-hidden z-0"
            : "relative w-full h-[550px] min-h-[500px] overflow-hidden rounded-b-2xl z-0"
        }
      >
        <MapContainer
          center={INCIDENT_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={4}
          maxZoom={18}
          zoomControl={false}
          scrollWheelZoom={true}
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
          style={{
            width: "100%",
            height: isFullscreen ? "100%" : "550px",
            minHeight: isFullscreen ? "100%" : "500px",
          }}
        >
          {/* Dynamic Map Controller */}
          <MapController
            targetCoords={flyTarget.coords}
            targetZoom={flyTarget.zoom}
            mapMode={mapMode}
            onMapInstance={(map) => {
              mapInstanceRef.current = map;
            }}
          />

          {/* Conditional Tile Layers (Map vs Satellite) with Buffer */}
          {mapMode === "Map" ? (
            <TileLayer
              key="osm-map-layer"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains={["a", "b", "c"]}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
              maxNativeZoom={19}
              tileSize={256}
              updateWhenZooming={false}
              updateWhenIdle={false}
              updateInterval={100}
              keepBuffer={12}
              crossOrigin="anonymous"
            />
          ) : (
            <TileLayer
              key="esri-satellite-layer"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              maxNativeZoom={18}
              maxZoom={19}
              tileSize={256}
              updateWhenZooming={false}
              updateWhenIdle={false}
              updateInterval={100}
              keepBuffer={12}
              crossOrigin="anonymous"
            />
          )}

          {/* 1. REALISTIC MULTI-LAYER OIL SLICK (Core, Moderate, Sheen) */}
          {layers.oilSlick && (
            <>
              {/* Outer Light Sheen Layer */}
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
                  <div className="text-xs p-1">
                    <div className="font-bold text-sky-700">Light Peripheral Sheen (Bonn 1-2)</div>
                    <div className="text-[11px] text-slate-600">Total Area: {hydroSim.totalAreaKm2} km²</div>
                    <div className="text-[10px] text-slate-500 font-mono">18.9997°N, 72.5502°E</div>
                  </div>
                </Popup>
              </Polygon>

              {/* Moderate Contamination Layer */}
              <Polygon
                positions={hydroSim.moderateLayer.coordinates}
                pathOptions={{
                  color: hydroSim.moderateLayer.color,
                  fillColor: hydroSim.moderateLayer.fillColor,
                  fillOpacity: hydroSim.moderateLayer.fillOpacity,
                  weight: hydroSim.moderateLayer.weight,
                }}
              />

              {/* Heavy Core Layer */}
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
                  <div className="text-xs p-1">
                    <div className="font-bold text-rose-800">Heavy Viscous Core Emulsion</div>
                    <div className="text-[11px] text-slate-600">Core Area: {hydroSim.coreLayer.areaKm2} km²</div>
                    <div className="text-[10px] text-slate-500 font-mono">Thickness: &gt;100 µm</div>
                  </div>
                </Popup>
              </Polygon>
            </>
          )}

          {/* 2. Probable Origin Zone Circle */}
          {layers.probableOrigin && (
            <Circle
              center={probableOriginCenter}
              radius={hydroSim.originConfidenceRadiusKm * 1000}
              pathOptions={{
                color: "#F59E0B",
                fillColor: "#FBBF24",
                fillOpacity: 0.25,
                weight: 2,
                dashArray: "4 4",
              }}
            >
              <Popup>
                <div className="text-xs p-1">
                  <div className="font-bold text-amber-600">Probable Origin Zone</div>
                  <div className="text-[10px] text-slate-600">Confidence: {hydroSim.originConfidenceScorePct}%</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {probableOriginCenter[0].toFixed(4)}°N, {probableOriginCenter[1].toFixed(4)}°E
                  </div>
                </div>
              </Popup>
            </Circle>
          )}

          {/* 3. Hindcast Track (Past) */}
          {layers.hindcastTrack && (
            <Polyline
              positions={hindcastTrackCoords}
              pathOptions={{
                color: "#F59E0B",
                weight: 3,
                dashArray: "6 6",
              }}
            />
          )}

          {/* 4. Forecast Track (Future) & Dispersion Cone */}
          {layers.forecastTrack && (
            <>
              <Polyline
                positions={hydroSim.forecastLineCoords}
                pathOptions={{
                  color: "#38BDF8",
                  weight: 3,
                  dashArray: "4 4",
                }}
              />
              <Polygon
                positions={hydroSim.probabilityEnvelope}
                pathOptions={{
                  color: "#6366F1",
                  fillColor: "#818CF8",
                  fillOpacity: 0.18,
                  weight: 1.2,
                  dashArray: "2 2",
                }}
              />
            </>
          )}

          {/* 5. Restricted No-Fly Zone */}
          {noFlyRestrictedZones && (
            <Polygon
              positions={restrictedZoneCoords}
              pathOptions={{
                color: "#F43F5E",
                fillColor: "#F43F5E",
                fillOpacity: 0.2,
                weight: 2,
                dashArray: "5 5",
              }}
            >
              <Popup>
                <div className="text-xs p-1 font-bold text-rose-600">
                  RESTRICTED MARITIME &amp; AIRSPACE SAFETY ZONE
                </div>
              </Popup>
            </Polygon>
          )}

          {/* 6. Marine Protected Area (MPA) */}
          {layers.protectedAreas && (
            <Polygon
              positions={mpaZoneCoords}
              pathOptions={{
                color: "#0284C7",
                fillColor: "#38BDF8",
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: "4 3",
              }}
            >
              <Popup>
                <div className="text-xs p-1">
                  <div className="font-bold text-sky-600">Marine Protected Area (Sanctuary)</div>
                  <div className="text-[10px] text-slate-500">12.3% overlap projected</div>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* 7. Fishing Zone */}
          {layers.fishingZones && (
            <Polygon
              positions={fishingZoneCoords}
              pathOptions={{
                color: "#10B981",
                fillColor: "#34D399",
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: "3 3",
              }}
            />
          )}

          {/* 8. AIS Vessels Layer */}
          {layers.vesselsAis && (
            <>
              {/* Primary Suspect: MT PACIFIC VOYAGER */}
              <Marker
                position={[18.98, 72.58]}
                icon={createVesselIcon(true, 312)}
              >
                <Popup className="tactical-vessel-popup" minWidth={240}>
                  <div className="text-slate-800 p-1">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-1.5">
                      <div className="text-xs font-bold text-[#0B2545] flex items-center gap-1">
                        <Flag className="w-3.5 h-3.5 text-slate-500 shrink-0 inline mr-1" />
                        <span>MT PACIFIC VOYAGER</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                        98.8% Suspect
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono mb-2">
                      IMO 9438200 &nbsp;|&nbsp; Crude Oil Tanker
                    </div>

                    <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-200 mb-2">
                      <img src="/tanker.jpg" alt="Tanker" className="w-full h-full object-cover" />
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-center border-t border-slate-100 pt-1.5 mb-2">
                      <div>
                        <div className="text-slate-400">Speed</div>
                        <div className="font-bold text-rose-600">1.4 kts</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Course</div>
                        <div className="font-bold text-[#0B2545]">312°</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Last AIS</div>
                        <div className="font-bold text-slate-700">16:42 UTC</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={onOpenTrackModal}
                        className="py-1 px-2 rounded-lg bg-[#185ADB] text-[10px] font-bold text-white text-center cursor-pointer shadow-2xs"
                      >
                        View Track
                      </button>
                      <button
                        type="button"
                        onClick={onOpenInfoModal}
                        className="py-1 px-2 rounded-lg bg-white border border-slate-300 text-[10px] font-bold text-slate-700 text-center cursor-pointer shadow-2xs"
                      >
                        More Info &rarr;
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Other AIS Vessels in sector */}
              <Marker position={[19.12, 72.45]} icon={createVesselIcon(false, 148)}>
                <Popup>
                  <div className="text-xs p-1">
                    <div className="font-bold text-[#0B2545]">CMA CGM ANTARES</div>
                    <div className="text-[10px] text-slate-500">Container Vessel · 14.8 kts</div>
                  </div>
                </Popup>
              </Marker>

              <Marker position={[18.82, 72.35]} icon={createVesselIcon(false, 180)}>
                <Popup>
                  <div className="text-xs p-1">
                    <div className="font-bold text-[#0B2545]">MV NORDIC TRADER</div>
                    <div className="text-[10px] text-slate-500">Bulk Carrier · 11.2 kts</div>
                  </div>
                </Popup>
              </Marker>

              <Marker position={[19.22, 72.65]} icon={createVesselIcon(false, 45)}>
                <Popup>
                  <div className="text-xs p-1">
                    <div className="font-bold text-[#0B2545]">SAGAR SHAKTI</div>
                    <div className="text-[10px] text-slate-500">Supply Vessel · 9.1 kts</div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* 9. Major Indian Ports Markers */}
          {layers.ports &&
            INDIAN_PORTS.map((port) => {
              const isSelected = selectedPort?.name === port.name;
              const nearVesselCount = getNearPortVesselCount(port);

              return (
                <Marker
                  key={port.name}
                  position={[port.lat, port.lng]}
                  icon={createPortIcon(isSelected)}
                  ref={(ref) => {
                    if (isSelected) selectedPortMarkerRef.current = ref;
                  }}
                >
                  <Popup minWidth={210}>
                    <div className="text-slate-800 p-1">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 mb-1.5">
                        <Anchor className="w-4 h-4 text-sky-600 shrink-0" />
                        <div className="text-xs font-bold text-[#0B2545] leading-tight">
                          {port.name}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 mb-2">
                        {port.city}
                      </div>

                      <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-xs mb-2">
                        <div className="text-[10px] text-slate-500 font-sans">
                          Active Shipping Traffic
                        </div>
                        <div className="font-bold text-[#185ADB] mt-0.5">
                          {nearVesselCount} vessels currently near port (&lt;50km)
                        </div>
                      </div>

                      <div className="text-[9px] font-mono text-slate-400 mb-2">
                        Coords: {port.lat.toFixed(4)}°N, {port.lng.toFixed(4)}°E
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onTriggerToast) {
                            onTriggerToast(`Viewing Port Operations telemetry for ${port.name}`);
                          }
                        }}
                        className="w-full py-1 px-2 rounded-lg bg-[#0B2545] hover:bg-[#143966] text-white text-[10px] font-bold text-center cursor-pointer transition-colors shadow-2xs"
                      >
                        Inspect Port Operations &rarr;
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* Environmental Conditions Mini-Card (Bottom-Left Floating Overlay) */}
        <div className="absolute bottom-3 left-3 bg-[#0B1D35]/90 backdrop-blur-md border border-slate-700/60 rounded-2xl p-2.5 shadow-xl text-[10px] text-white z-[500] max-w-[270px] pointer-events-auto">
          <div className="flex items-center gap-1.5 font-bold text-slate-200 pb-1 border-b border-slate-700/50 mb-1.5">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Environmental Conditions</span>
          </div>
          <div className="text-[9px] text-slate-300 font-mono mb-1">
            12 Sep 2026 17:00 UTC
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono">
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-sky-400" />
              <span>5.1 m/s (289°W)</span>
            </div>
            <div className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span>0.67 m/s (189°S)</span>
            </div>
            <div className="flex items-center gap-1">
              <Waves className="w-3 h-3 text-sky-300" />
              <span>1.0 m waves</span>
            </div>
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>28.3°C SST</span>
            </div>
          </div>
        </div>

        {/* Tactical Scale Bar */}
        <div className="absolute bottom-3 left-[285px] hidden md:flex items-center gap-2 bg-[#0B1D35]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/60 text-[9px] font-mono text-slate-200 z-[500] pointer-events-none shadow-lg">
          <div className="w-14 border-b-2 border-l border-r border-sky-400 h-1.5" />
          <span>0 &nbsp; 25 &nbsp; 50 km</span>
        </div>

        {/* Zoom Controls (+ / - / Recenter) */}
        <div className="absolute right-3 bottom-12 flex flex-col gap-1.5 z-[1000]">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetIncidentView}
            className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center cursor-pointer"
            title="Recenter to Incident"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tactical Legend (Bottom-Right Overlay) */}
        <div className="absolute bottom-3 right-3 bg-[#0B1D35]/95 backdrop-blur-md border border-slate-700 rounded-2xl p-2.5 shadow-xl text-[9px] text-slate-200 z-[1000] max-w-[210px]">
          <div className="font-bold text-white mb-1 border-b border-slate-700/60 pb-0.5 flex items-center justify-between">
            <span>Tactical Legend</span>
            <span className="text-[8.5px] text-sky-400 font-mono">Bonn Scale</span>
          </div>
          <div className="grid grid-cols-1 gap-1 font-medium text-[8.5px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-[#1C0D02] border border-amber-900 shrink-0" />
              <span>Heavy Core (&gt;100 µm • Bonn 5)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-[#B45309] border border-amber-600 shrink-0" />
              <span>Moderate (5–50 µm • Bonn 3–4)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-[#0284C7] border border-sky-400 shrink-0" />
              <span>Light Sheen (&lt;1 µm • Bonn 1–2)</span>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-700/50">
              <div className="w-2.5 h-2.5 rounded border border-dashed border-amber-400 shrink-0" />
              <span>Probable Origin (T-18h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 border-b-2 border-dashed border-sky-400 shrink-0" />
              <span>Forecast Corridor (+48h)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rotate-45 bg-emerald-500 shrink-0" />
              <span>AIS Vessel Telemetry</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
