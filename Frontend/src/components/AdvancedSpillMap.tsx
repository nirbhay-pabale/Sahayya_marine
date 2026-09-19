import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  Circle,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Anchor,
  Flag,
  Shield,
  AlertTriangle,
  Radio,
  Sliders,
  Play,
  Pause,
  Ruler,
  Info,
  Droplets,
  Eye,
  Crosshair,
  MapPin,
  Clock,
  Sparkles,
  Zap,
  Target,
  FileText,
  X,
} from "lucide-react";

import {
  SpillHydroParams,
  HydrodynamicSimulationResult,
  simulateOilSpillHydrodynamics,
  getBaselineSimulation,
} from "../utils/spillHydrodynamics";
import { INDIAN_PORTS, IndianPort } from "../data/indianPorts";
import { INCIDENT_DATA, VesselCandidate } from "../data/incidentData";
import { useLanguage } from "../context/LanguageContext";

// Fix Leaflet marker icons for bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ----------------------------------------------------------------------------
// CUSTOM LEAFLET DIV ICONS
// ----------------------------------------------------------------------------

// Tactical Spill Centroid Marker with Pulsing Sonar Ring
const createCentroidIcon = () =>
  L.divIcon({
    className: "tactical-centroid-marker",
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(225, 29, 72, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; inset: 2px; border-radius: 9999px; background: rgba(225, 29, 72, 0.25); border: 1.5px dashed #FDA4AF;"></div>
        <div style="width: 18px; height: 18px; border-radius: 9999px; background: #E11D48; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
          <div style="width: 5px; height: 5px; border-radius: 9999px; background: #FFFFFF;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

// Probable Origin Marker (Target Bulls-eye)
const createOriginIcon = () =>
  L.divIcon({
    className: "tactical-origin-marker",
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(245, 158, 11, 0.25); border: 2px dashed #F59E0B; animation: spin 12s linear infinite;"></div>
        <div style="width: 20px; height: 20px; border-radius: 9999px; background: #D97706; border: 2px solid #FFFFFF; box-shadow: 0 3px 10px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: #FFFFFF;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });

// Directional Vessel Marker
const createTacticalVesselIcon = (
  heading: number = 312,
  isSuspect: boolean = false,
  vesselName: string = "VESSEL"
) =>
  L.divIcon({
    className: "tactical-vessel-marker",
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        ${
          isSuspect
            ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(239, 68, 68, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ""
        }
        <div style="
          width: ${isSuspect ? "26px" : "22px"};
          height: ${isSuspect ? "26px" : "22px"};
          border-radius: 9999px;
          background: ${isSuspect ? "#E11D48" : "#0284C7"};
          border: 2px solid #FFFFFF;
          box-shadow: 0 4px 14px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${heading}deg);
          transition: transform 0.4s ease;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF">
            <polygon points="12,2 22,22 12,17 2,22" />
          </svg>
        </div>
        ${
          isSuspect
            ? `<div style="position: absolute; top: -8px; right: -8px; background: #991B1B; color: #FFFFFF; font-family: monospace; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; border: 1px solid white;">98.8%</div>`
            : ""
        }
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });

// Port Icon
const createPortMarkerIcon = (isSelected: boolean) =>
  L.divIcon({
    className: "tactical-port-marker",
    html: `
      <div style="
        width: ${isSelected ? "32px" : "26px"};
        height: ${isSelected ? "32px" : "26px"};
        border-radius: 9999px;
        background: ${isSelected ? "#185ADB" : "#0F172A"};
        color: ${isSelected ? "#FFFFFF" : "#38BDF8"};
        border: 2px solid ${isSelected ? "#FFFFFF" : "#38BDF8"};
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="5" r="3"></circle>
          <line x1="12" y1="22" x2="12" y2="8"></line>
          <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
        </svg>
      </div>
    `,
    iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
    iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
    popupAnchor: [0, -16],
  });

// Forecast Waypoint Icon
const createWaypointIcon = (stepHours: number) =>
  L.divIcon({
    className: "forecast-waypoint-marker",
    html: `
      <div style="
        background: rgba(11, 29, 53, 0.95);
        color: #38BDF8;
        border: 1.5px solid #38BDF8;
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        font-weight: 800;
        padding: 2px 5px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 3px;
        white-space: nowrap;
      ">
        <span style="width: 5px; height: 5px; border-radius: 9999px; background: #38BDF8;"></span>
        <span>+${stepHours}h</span>
      </div>
    `,
    iconSize: [44, 18],
    iconAnchor: [22, 9],
  });

// Coastline Impact Threat Marker
const createCoastThreatIcon = (threat: string) =>
  L.divIcon({
    className: "coast-threat-marker",
    html: `
      <div style="
        background: ${threat === "CRITICAL" ? "#E11D48" : threat === "HIGH" ? "#D97706" : "#0284C7"};
        color: #FFFFFF;
        font-family: 'Inter', sans-serif;
        font-size: 9.5px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 8px;
        border: 1.5px solid #FFFFFF;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
      ">
        <span>⚠</span>
        <span>LANDFALL ALERT</span>
      </div>
    `,
    iconSize: [110, 24],
    iconAnchor: [55, 12],
  });

// Offshore Oil Rig Icon
const createPlatformIcon = (name: string) =>
  L.divIcon({
    className: "oil-platform-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: #1E293B;
        border: 1.5px solid #F59E0B;
        color: #F59E0B;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      " title="${name}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20M7 7h10M5 12h14M7 17h10"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

// ----------------------------------------------------------------------------
// MAP CONTROLLER & INTERACTIVITY HELPER
// ----------------------------------------------------------------------------
const MapController: React.FC<{
  center: [number, number];
  zoom: number;
  onMapReady?: (map: L.Map) => void;
}> = ({ center, zoom, onMapReady }) => {
  const map = useMap();
  const lastTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (onMapReady) onMapReady(map);
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map, onMapReady]);

  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      const key = `${center[0].toFixed(4)},${center[1].toFixed(4)},${zoom}`;
      if (lastTargetRef.current !== key) {
        lastTargetRef.current = key;
        map.flyTo(center, zoom, { duration: 0.9, easeLinearity: 0.25, noMoveStart: true });
      }
    }
  }, [center, zoom, map]);

  return null;
};

// Distance Measurement Tool Sub-component
const DistanceMeasureTool: React.FC<{
  active: boolean;
  onDistanceMeasured: (km: number, nm: number) => void;
}> = ({ active, onDistanceMeasured }) => {
  const [points, setPoints] = useState<[number, number][]>([]);

  useMapEvents({
    click(e) {
      if (!active) return;
      const newPt: [number, number] = [e.latlng.lat, e.latlng.lng];
      if (points.length >= 2) {
        setPoints([newPt]);
      } else {
        const next = [...points, newPt];
        setPoints(next);
        if (next.length === 2) {
          const dLat = (next[1][0] - next[0][0]) * 111.0;
          const dLng = (next[1][1] - next[0][1]) * 111.0 * Math.cos((next[0][0] * Math.PI) / 180);
          const distKm = Number(Math.hypot(dLat, dLng).toFixed(2));
          const distNm = Number((distKm / 1.852).toFixed(2));
          onDistanceMeasured(distKm, distNm);
        }
      }
    },
  });

  if (!active || points.length === 0) return null;

  return (
    <>
      {points.map((pt, i) => (
        <CircleMarker
          key={i}
          center={pt}
          radius={6}
          pathOptions={{ color: "#38BDF8", fillColor: "#FFFFFF", fillOpacity: 1, weight: 2 }}
        />
      ))}
      {points.length === 2 && (
        <Polyline
          positions={points}
          pathOptions={{ color: "#38BDF8", weight: 3, dashArray: "4 4" }}
        />
      )}
    </>
  );
};

// ----------------------------------------------------------------------------
// COMPONENT PROPS
// ----------------------------------------------------------------------------
export interface AdvancedSpillMapProps {
  // Scenario & Simulation Parameters
  simulationParams?: Partial<SpillHydroParams>;
  initialCentroid?: [number, number];
  height?: string | number;
  className?: string;

  // External What-If parameter controls binding
  onParamsChange?: (newParams: SpillHydroParams) => void;
  showWhatIfControls?: boolean;
  showTimelineScrubber?: boolean;

  // Selected candidate / entity inspection callbacks
  onSelectVessel?: (vessel: VesselCandidate) => void;
  onOpenReportModal?: () => void;
  onTriggerToast?: (msg: string) => void;
}

export const AdvancedSpillMap: React.FC<AdvancedSpillMapProps> = ({
  simulationParams,
  initialCentroid = [18.9997, 72.5502],
  height = 580,
  className = "",
  onParamsChange,
  showWhatIfControls = true,
  showTimelineScrubber = true,
  onSelectVessel,
  onOpenReportModal,
  onTriggerToast,
}) => {
  const { t } = useLanguage();
  const mapRef = useRef<L.Map | null>(null);

  // 1. Simulation Parameters State (Synced with What-If)
  const [params, setParams] = useState<SpillHydroParams>({
    centroid: initialCentroid,
    windSpeedKts: simulationParams?.windSpeedKts ?? 10.0,
    windDirDeg: simulationParams?.windDirDeg ?? 289,
    currentSpeedKts: simulationParams?.currentSpeedKts ?? 1.3,
    currentDirDeg: simulationParams?.currentDirDeg ?? 189,
    releaseOffsetHours: simulationParams?.releaseOffsetHours ?? -18.0,
    releaseVolumeM3: simulationParams?.releaseVolumeM3 ?? 18000,
    containmentEffPct: simulationParams?.containmentEffPct ?? 35,
    chemicalDispersant: simulationParams?.chemicalDispersant ?? true,
    responseDelayHours: simulationParams?.responseDelayHours ?? 3.0,
    turbulentDiffusion: simulationParams?.turbulentDiffusion ?? 12.0,
  });

  // Update when external simulationParams prop changes
  useEffect(() => {
    if (simulationParams) {
      setParams((prev) => ({ ...prev, ...simulationParams }));
    }
  }, [simulationParams]);

  // 2. Compute Hydrodynamic Simulations (Active What-If vs Baseline)
  const activeSim = useMemo(() => simulateOilSpillHydrodynamics(params), [params]);
  const baselineSim = useMemo(() => getBaselineSimulation(params.centroid), [params.centroid]);

  // Notify parent of parameter changes if needed
  const handleUpdateParam = (key: keyof SpillHydroParams, val: any) => {
    const updated = { ...params, [key]: val };
    setParams(updated);
    if (onParamsChange) onParamsChange(updated);
  };

  // 3. View & Layer Modes
  const [scenarioMode, setScenarioMode] = useState<"whatif" | "baseline" | "comparison">("whatif");
  const [tileMode, setTileMode] = useState<"satellite" | "dark" | "street" | "nautical">("satellite");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showWhatIfDrawer, setShowWhatIfDrawer] = useState(false);

  // Measurement tool state
  const [isMeasureActive, setIsMeasureActive] = useState(false);
  const [measureResult, setMeasureResult] = useState<{ km: number; nm: number } | null>(null);

  // Timeline scrubber state (-24h to +48h)
  const [timelineStep, setTimelineStep] = useState<number>(0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);

  // Selected Port for rapid navigation
  const [selectedPort, setSelectedPort] = useState<IndianPort | null>(null);
  const [mapTarget, setMapTarget] = useState<{ center: [number, number]; zoom: number }>({
    center: params.centroid,
    zoom: 9,
  });

  // Active Tactical GIS Layers
  const [layers, setLayers] = useState({
    slickFootprint: true,
    probableOrigin: true,
    candidateOriginZones: true,
    reverseParticles: true,
    originUncertaintyEllipse: true,
    driftVectors: true,
    forecastPath: true,
    probabilityEnvelope: true,
    coastlineLandfall: true,
    vesselsAis: true,
    ports: true,
    marineProtectedAreas: true,
    fishingZones: true,
    shippingCorridors: true,
    offshorePlatforms: true,
    eezBoundary: true,
  });

  // Timeline Playback loop
  useEffect(() => {
    let interval: any = null;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setTimelineStep((prev) => {
          if (prev >= 48) return -24;
          return prev + 6;
        });
      }, 1400);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTimeline]);

  // Keyboard shortcut for fullscreen Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Tile URL resolver
  const getTileUrl = () => {
    switch (tileMode) {
      case "satellite":
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      case "dark":
        return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      case "nautical":
        return "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png";
      case "street":
      default:
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
  };

  // Environmental Data Constants
  const OFFSHORE_PLATFORMS: { name: string; coord: [number, number]; operator: string }[] = [
    { name: "Bombay High North (BHN)", coord: [19.42, 71.35], operator: "ONGC" },
    { name: "Bombay High South (BHS)", coord: [19.18, 71.42], operator: "ONGC" },
    { name: "Neelam & Heera Complex", coord: [18.82, 72.15], operator: "ONGC" },
    { name: "Bassein Gas Field Platform", coord: [19.35, 72.10], operator: "ONGC" },
  ];

  const SHIPPING_TSS_CORRIDOR: [number, number][] = [
    [19.65, 72.25],
    [19.25, 72.35],
    [18.95, 72.42],
    [18.65, 72.48],
    [18.25, 72.55],
    [17.85, 72.68],
  ];

  const MPA_ALISANCTUARY: [number, number][] = [
    [18.55, 72.82],
    [18.72, 72.80],
    [18.68, 72.96],
    [18.48, 72.94],
  ];

  const FISHING_GROUNDS: [number, number][] = [
    [19.25, 72.45],
    [19.38, 72.68],
    [19.15, 72.78],
    [19.05, 72.52],
  ];

  const EEZ_LINE_CORRIDOR: [number, number][] = [
    [20.5, 70.8],
    [19.8, 71.2],
    [19.0, 71.5],
    [18.2, 71.8],
    [17.4, 72.2],
  ];

  // Candidates
  const suspectVessel = INCIDENT_DATA.vessels[0];

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-[#E1EEF9] shadow-[0_6px_25px_rgba(30,95,191,0.12)] bg-[#041224] flex flex-col font-sans select-none antialiased ${
        isFullscreen ? "fixed inset-0 z-[99999] h-screen w-screen rounded-none border-none" : ""
      } ${className}`}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* ------------------------------------------------------------------- */}
      {/* 1. TOP MARITIME GIS TACTICAL CONTROL BAR                           */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative z-[1100] px-3.5 py-2.5 bg-[#0B2545]/95 backdrop-blur-md border-b border-sky-900/60 flex flex-wrap items-center justify-between gap-2.5 text-white text-xs">
        {/* Left: Mode Switcher & Scenario Toggle */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Scenario Selector */}
          <div className="flex p-0.5 rounded-xl bg-[#04162B] border border-sky-800/80 shadow-inner">
            <button
              type="button"
              onClick={() => setScenarioMode("whatif")}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                scenarioMode === "whatif"
                  ? "bg-gradient-to-r from-[#185ADB] to-[#38BDF8] text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Zap className="w-3 h-3 text-sky-200" />
              <span>What-If (Active)</span>
            </button>
            <button
              type="button"
              onClick={() => setScenarioMode("baseline")}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                scenarioMode === "baseline"
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <RotateCcw className="w-3 h-3 text-amber-200" />
              <span>Baseline</span>
            </button>
            <button
              type="button"
              onClick={() => setScenarioMode("comparison")}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                scenarioMode === "comparison"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Crosshair className="w-3 h-3 text-emerald-200" />
              <span>Overlay Comparison</span>
            </button>
          </div>

          {/* Basemap Switcher */}
          <div className="flex p-0.5 rounded-xl bg-[#04162B] border border-sky-800/80">
            {(["satellite", "dark", "street", "nautical"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTileMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-semibold capitalize transition-all cursor-pointer ${
                  tileMode === mode
                    ? "bg-[#1E5FBF] text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Layers Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="px-3 py-1.5 rounded-xl bg-[#04162B] hover:bg-[#0E2849] border border-sky-800/80 text-xs font-semibold text-sky-300 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Layers ({Object.values(layers).filter(Boolean).length})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLayerMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#081B33]/98 backdrop-blur-xl border border-sky-700/60 rounded-2xl shadow-2xl p-3 z-50 text-xs animate-fadeIn">
                <div className="font-bold text-sky-200 uppercase tracking-wider text-[10px] pb-1.5 mb-2 border-b border-sky-800/60 flex items-center justify-between">
                  <span>Tactical GIS Layers</span>
                  <button
                    onClick={() => setShowLayerMenu(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {[
                    { key: "slickFootprint", label: "Multi-Tier Oil Slick Footprint", color: "#E11D48" },
                    { key: "probableOrigin", label: "Most Probable Release Origin (◎)", color: "#EF4444" },
                    { key: "candidateOriginZones", label: "Candidate Release Zones (Alpha/Beta/Gamma)", color: "#F59E0B" },
                    { key: "reverseParticles", label: "Reverse Lagrangian Streamlines", color: "#38BDF8" },
                    { key: "originUncertaintyEllipse", label: "Origin Uncertainty Error Ellipse (95%)", color: "#818CF8" },
                    { key: "driftVectors", label: "Wind & Ocean Drift Vectors", color: "#38BDF8" },
                    { key: "forecastPath", label: "Forward Forecast Trajectory (+48h)", color: "#0EA5B7" },
                    { key: "probabilityEnvelope", label: "Stochastic Uncertainty Envelope", color: "#6366F1" },
                    { key: "coastlineLandfall", label: "Coastline Landfall Threat Zone", color: "#F43F5E" },
                    { key: "vesselsAis", label: "AIS Vessel Fleet & Historical Tracks", color: "#10B981" },
                    { key: "ports", label: "Major Ports & Harbors", color: "#38BDF8" },
                    { key: "marineProtectedAreas", label: "Marine Protected Areas (MPAs)", color: "#059669" },
                    { key: "fishingZones", label: "Commercial Fishing Grounds", color: "#FBBF24" },
                    { key: "offshorePlatforms", label: "Offshore Platforms (Bombay High)", color: "#FB923C" },
                    { key: "shippingCorridors", label: "Shipping TSS Traffic Lanes", color: "#818CF8" },
                    { key: "eezBoundary", label: "Territorial & EEZ Baselines", color: "#94A3B8" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-1 rounded-lg hover:bg-sky-950/60 cursor-pointer select-none text-[11px]"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-200">{item.label}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={layers[item.key as keyof typeof layers]}
                        onChange={(e) =>
                          setLayers({ ...layers, [item.key]: e.target.checked })
                        }
                        className="w-3.5 h-3.5 rounded border-sky-800 text-[#185ADB] accent-[#185ADB]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick What-If Drawer Toggle */}
          {showWhatIfControls && (
            <button
              type="button"
              onClick={() => setShowWhatIfDrawer(!showWhatIfDrawer)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                showWhatIfDrawer
                  ? "bg-sky-500 text-slate-950 border-sky-400 font-bold shadow-sm"
                  : "bg-[#04162B] text-sky-300 border-sky-800/80 hover:bg-[#0E2849]"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulator Parameters</span>
              {showWhatIfDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Right: Distance Measurement, Legend & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Distance Measurement Tool */}
          <button
            type="button"
            onClick={() => {
              setIsMeasureActive(!isMeasureActive);
              setMeasureResult(null);
            }}
            title="Click 2 points on map to measure Nautical Miles and Kilometers"
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              isMeasureActive
                ? "bg-amber-500 text-slate-950 border-amber-300 font-bold"
                : "bg-[#04162B] text-slate-300 border-sky-800/80 hover:text-white hover:bg-[#0E2849]"
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isMeasureActive ? "Measuring..." : "Measure"}
            </span>
          </button>

          {/* Legend Toggle */}
          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
              showLegend
                ? "bg-sky-950 text-sky-300 border-sky-700"
                : "bg-[#04162B] text-slate-400 border-sky-800/80 hover:text-white"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Legend</span>
          </button>

          {/* Reset View Button */}
          <button
            type="button"
            onClick={() => {
              setMapTarget({ center: params.centroid, zoom: 9 });
              if (onTriggerToast) onTriggerToast("Reset view to active oil slick centroid");
            }}
            title="Recenter Map on Spill"
            className="p-1.5 rounded-xl bg-[#04162B] hover:bg-[#0E2849] border border-sky-800/80 text-slate-300 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2.5 py-1.5 rounded-xl bg-[#04162B] hover:bg-[#0E2849] border border-sky-800/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand to Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Expand"}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. WHAT-IF PARAMETERS SLIDERS DRAWER (DIRECT DYNAMIC CONNECTION)    */}
      {/* ------------------------------------------------------------------- */}
      {showWhatIfDrawer && (
        <div className="relative z-[1050] px-4 py-3 bg-[#071930]/98 backdrop-blur-xl border-b border-sky-800/80 text-white animate-fadeIn grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Wind Speed & Direction */}
          <div className="bg-[#0B2545]/80 p-2.5 rounded-xl border border-sky-900/60">
            <div className="flex items-center justify-between font-bold text-sky-200 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>Wind Velocity</span>
              </span>
              <span className="font-mono text-cyan-300">{params.windSpeedKts} kts ({params.windDirDeg}°)</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="0.5"
              value={params.windSpeedKts}
              onChange={(e) => handleUpdateParam("windSpeedKts", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>0 kts (Calm)</span>
              <span>35 kts (Gale)</span>
            </div>
          </div>

          {/* Ocean Current Speed & Bearing */}
          <div className="bg-[#0B2545]/80 p-2.5 rounded-xl border border-sky-900/60">
            <div className="flex items-center justify-between font-bold text-cyan-200 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ocean Current</span>
              </span>
              <span className="font-mono text-cyan-300">{params.currentSpeedKts} kts ({params.currentDirDeg}°)</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.5"
              step="0.1"
              value={params.currentSpeedKts}
              onChange={(e) => handleUpdateParam("currentSpeedKts", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>0.1 kts</span>
              <span>3.5 kts (High Tidal)</span>
            </div>
          </div>

          {/* Booming Containment Recovery */}
          <div className="bg-[#0B2545]/80 p-2.5 rounded-xl border border-sky-900/60">
            <div className="flex items-center justify-between font-bold text-emerald-200 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Containment Booms</span>
              </span>
              <span className="font-mono text-emerald-300">{params.containmentEffPct}% Eff.</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={params.containmentEffPct}
              onChange={(e) => handleUpdateParam("containmentEffPct", parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>0% (Unmitigated)</span>
              <span>90% (Max Skimming)</span>
            </div>
          </div>

          {/* Response Delay & Dispersant */}
          <div className="bg-[#0B2545]/80 p-2.5 rounded-xl border border-sky-900/60 flex flex-col justify-between">
            <div className="flex items-center justify-between font-bold text-amber-200 mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Response Delay</span>
              </span>
              <span className="font-mono text-amber-300">{params.responseDelayHours}h</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={params.responseDelayHours}
              onChange={(e) => handleUpdateParam("responseDelayHours", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={params.chemicalDispersant}
                  onChange={(e) => handleUpdateParam("chemicalDispersant", e.target.checked)}
                  className="rounded text-sky-500 accent-sky-500"
                />
                <span>Apply Corexit Dispersant</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setParams({
                    centroid: initialCentroid,
                    windSpeedKts: 10.0,
                    windDirDeg: 289,
                    currentSpeedKts: 1.3,
                    currentDirDeg: 189,
                    releaseOffsetHours: -18.0,
                    releaseVolumeM3: 18000,
                    containmentEffPct: 0,
                    chemicalDispersant: false,
                    responseDelayHours: 0,
                    turbulentDiffusion: 12.0,
                  });
                  if (onTriggerToast) onTriggerToast("Parameters reset to baseline values");
                }}
                className="text-[10px] text-sky-400 hover:text-white underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 3. MAIN LEAFLET MAP CONTAINER                                       */}
      {/* ------------------------------------------------------------------- */}
      <div className="relative flex-1 w-full h-full overflow-hidden z-0">
        <MapContainer
          center={mapTarget.center}
          zoom={mapTarget.zoom}
          minZoom={4}
          maxZoom={19}
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
          style={{ width: "100%", height: "100%", background: "#041224" }}
        >
          {/* Dynamic Controller */}
          <MapController
            center={mapTarget.center}
            zoom={mapTarget.zoom}
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />

          {/* Interactive Distance Measuring Tool */}
          <DistanceMeasureTool
            active={isMeasureActive}
            onDistanceMeasured={(km, nm) => {
              setMeasureResult({ km, nm });
              if (onTriggerToast) onTriggerToast(`Distance measured: ${nm} NM (${km} km)`);
            }}
          />

          {/* Dynamic Tile Layer with Buffer */}
          <TileLayer
            key={`tile-layer-${tileMode}`}
            url={getTileUrl()}
            attribution="&copy; Sahayya Maritime GIS Engine"
            maxZoom={19}
            maxNativeZoom={18}
            tileSize={256}
            updateWhenZooming={false}
            updateWhenIdle={false}
            updateInterval={100}
            keepBuffer={12}
            crossOrigin="anonymous"
          />

          {/* --------------------------------------------------------------- */}
          {/* LAYER A: BASELINE GHOST SLICK & TRACK (When in Baseline/Comparison) */}
          {/* --------------------------------------------------------------- */}
          {(scenarioMode === "baseline" || scenarioMode === "comparison") && (
            <>
              {/* Baseline Sheen */}
              <Polygon
                positions={baselineSim.sheenLayer.coordinates}
                pathOptions={{
                  color: "#F59E0B",
                  fillColor: "#F59E0B",
                  fillOpacity: scenarioMode === "comparison" ? 0.22 : 0.45,
                  weight: 1.5,
                  dashArray: "4 4",
                }}
              >
                <Popup>
                  <div className="text-slate-900 p-1 text-xs">
                    <div className="font-bold text-amber-700">BASELINE UNMITIGATED SLICK</div>
                    <div className="text-[11px] text-slate-600">Area: {baselineSim.totalAreaKm2} km²</div>
                    <div className="text-[10px] text-slate-500">Unmitigated trajectory</div>
                  </div>
                </Popup>
              </Polygon>

              {/* Baseline Forecast Track */}
              <Polyline
                positions={baselineSim.forecastLineCoords}
                pathOptions={{ color: "#F59E0B", weight: 2.5, dashArray: "6 6" }}
              />
            </>
          )}

          {/* --------------------------------------------------------------- */}
          {/* LAYER B: ACTIVE WHAT-IF MULTI-LAYER HYDRODYNAMIC SLICK FOOTPRINT */}
          {/* --------------------------------------------------------------- */}
          {(scenarioMode === "whatif" || scenarioMode === "comparison") && layers.slickFootprint && (
            <>
              {/* 1. Light Outer Peripheral Sheen (Bonn Code 1-2) */}
              <Polygon
                positions={activeSim.sheenLayer.coordinates}
                pathOptions={{
                  color: activeSim.sheenLayer.color,
                  fillColor: activeSim.sheenLayer.fillColor,
                  fillOpacity: activeSim.sheenLayer.fillOpacity,
                  weight: activeSim.sheenLayer.weight,
                }}
              >
                <Popup className="slick-popup">
                  <div className="text-slate-900 p-1 text-xs font-sans">
                    <div className="font-bold text-[#0B2545] flex items-center gap-1 border-b pb-1 mb-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-500" />
                      <span>{activeSim.sheenLayer.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px]">
                      <div>
                        <span className="text-slate-500">Total Slick Area:</span>
                        <span className="font-bold font-mono ml-1 text-slate-800">{activeSim.totalAreaKm2} km²</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Thickness:</span>
                        <span className="font-bold font-mono ml-1 text-slate-800">{activeSim.sheenLayer.thicknessMicrons}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Bonn Code:</span>
                        <span className="font-bold ml-1 text-sky-700">{activeSim.sheenLayer.appearanceCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Mitigation:</span>
                        <span className="font-bold font-mono ml-1 text-emerald-600">-{activeSim.containmentFootprintReductionPct}%</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polygon>

              {/* 2. Moderate Contamination Layer (Bonn Code 3-4) */}
              <Polygon
                positions={activeSim.moderateLayer.coordinates}
                pathOptions={{
                  color: activeSim.moderateLayer.color,
                  fillColor: activeSim.moderateLayer.fillColor,
                  fillOpacity: activeSim.moderateLayer.fillOpacity,
                  weight: activeSim.moderateLayer.weight,
                }}
              />

              {/* 3. Heavy Viscous Core Layer (Bonn Code 5) */}
              <Polygon
                positions={activeSim.coreLayer.coordinates}
                pathOptions={{
                  color: activeSim.coreLayer.color,
                  fillColor: activeSim.coreLayer.fillColor,
                  fillOpacity: activeSim.coreLayer.fillOpacity,
                  weight: activeSim.coreLayer.weight,
                }}
              >
                <Popup>
                  <div className="text-slate-900 p-1 text-xs font-sans">
                    <div className="font-bold text-rose-800 flex items-center gap-1 border-b pb-1 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1C0D02]" />
                      <span>{activeSim.coreLayer.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Core Area: <span className="font-mono font-bold text-slate-900">{activeSim.coreLayer.areaKm2} km²</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Thickness: {activeSim.coreLayer.thicknessMicrons}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            </>
          )}

          {/* --------------------------------------------------------------- */}
          {/* LAYER C: PROBABILITY / UNCERTAINTY ENVELOPE CONE                */}
          {/* --------------------------------------------------------------- */}
          {layers.probabilityEnvelope && (scenarioMode === "whatif" || scenarioMode === "comparison") && (
            <Polygon
              positions={activeSim.probabilityEnvelope}
              pathOptions={{
                color: "#6366F1",
                fillColor: "#818CF8",
                fillOpacity: 0.15,
                weight: 1.2,
                dashArray: "3 3",
              }}
            >
              <Popup>
                <div className="text-xs p-1 text-slate-900">
                  <div className="font-bold text-indigo-700">Stochastic Uncertainty Envelope</div>
                  <div className="text-[10.5px] text-slate-600">
                    Turbulent oceanic diffusion dispersion buffer (95% confidence bounds).
                  </div>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* --------------------------------------------------------------- */}
          {/* LAYER D: FORWARD FORECAST CORRIDOR (+6h, +12h, +24h, +48h)       */}
          {/* --------------------------------------------------------------- */}
          {layers.forecastPath && (scenarioMode === "whatif" || scenarioMode === "comparison") && (
            <>
              {/* Forecast Trajectory Line */}
              <Polyline
                positions={activeSim.forecastLineCoords}
                pathOptions={{ color: "#0EA5B7", weight: 3, dashArray: "5 4" }}
              />

              {/* Waypoint Markers along Forecast Path */}
              {activeSim.forecastTrack.map((wp) => (
                <React.Fragment key={wp.stepHours}>
                  <Marker position={wp.coord} icon={createWaypointIcon(wp.stepHours)}>
                    <Popup>
                      <div className="text-slate-900 p-1 text-xs">
                        <div className="font-bold text-cyan-800 pb-1 border-b mb-1">
                          {wp.label} ({wp.timestamp})
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10.5px] font-mono">
                          <div>
                            <span className="text-slate-500">Projected Area:</span>
                            <div className="font-bold text-slate-800">{wp.sheenAreaKm2} km²</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Confidence:</span>
                            <div className="font-bold text-cyan-700">{wp.probabilityPct}%</div>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={wp.coord}
                    radius={wp.radiusKm * 1000}
                    pathOptions={{
                      color: "#0EA5B7",
                      fillColor: "#0EA5B7",
                      fillOpacity: 0.08,
                      weight: 1,
                      dashArray: "2 3",
                    }}
                  />
                </React.Fragment>
              ))}
            </>
          )}

          {/* --------------------------------------------------------------- */}
          {/* LAYER E: SPILL CENTROID & PROBABLE RELEASE ORIGIN               */}
          {/* --------------------------------------------------------------- */}
          {/* Spill Centroid Marker */}
          <Marker position={activeSim.slickCentroid} icon={createCentroidIcon()}>
            <Popup minWidth={240}>
              <div className="text-slate-900 p-1 text-xs font-sans">
                <div className="font-bold text-[#0B2545] flex items-center justify-between pb-1 border-b border-slate-200 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-rose-600" />
                    <span>Active Spill Centroid</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono font-bold">
                    LIVE
                  </span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coordinates:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {activeSim.slickCentroid[0].toFixed(4)}°N, {activeSim.slickCentroid[1].toFixed(4)}°E
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Area:</span>
                    <span className="font-mono font-bold text-slate-800">{activeSim.totalAreaKm2} km²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Net Drift Velocity:</span>
                    <span className="font-mono font-bold text-sky-700">
                      {activeSim.netDriftSpeedKts} kts ({activeSim.orientationBearingDeg}°)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining Volume:</span>
                    <span className="font-mono font-bold text-amber-700">{activeSim.remainingVolumeM3.toLocaleString()} m³</span>
                  </div>
                </div>
                {onOpenReportModal && (
                  <button
                    type="button"
                    onClick={onOpenReportModal}
                    className="w-full mt-2 py-1 px-2 rounded-lg bg-[#185ADB] hover:bg-[#1448B0] text-white text-[10px] font-bold text-center cursor-pointer transition-colors shadow-2xs"
                  >
                    Generate Forensic Stage Report &rarr;
                  </button>
                )}
              </div>
            </Popup>
          </Marker>

          {/* --------------------------------------------------------------- */}
          {/* LAYER E: PROBABLE OIL SPILL ORIGIN & REVERSE LAGRANGIAN MODULE  */}
          {/* --------------------------------------------------------------- */}
          {/* 1. Reverse Particle Trajectory Streamlines */}
          {layers.reverseParticles && activeSim.reverseStreamlines && activeSim.reverseStreamlines.map((sl) => (
            <Polyline
              key={sl.id}
              positions={sl.coordinates}
              pathOptions={{
                color: sl.id === "streamline-central" ? "#38BDF8" : "#7DD3FC",
                weight: sl.id === "streamline-central" ? 3.0 : 1.8,
                dashArray: "6 4",
                opacity: sl.opacity,
              }}
            />
          ))}

          {/* 2. 95% Origin Uncertainty Error Ellipse */}
          {layers.originUncertaintyEllipse && activeSim.originEllipse && (
            <Polygon
              positions={activeSim.originEllipse.coordinates}
              pathOptions={{
                color: "#818CF8",
                fillColor: "#6366F1",
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: "4 4",
              }}
            >
              <Popup>
                <div className="text-slate-900 p-1 text-xs">
                  <div className="font-bold text-indigo-800 pb-1 border-b mb-1">
                    95% Spatial Uncertainty Ellipse
                  </div>
                  <div className="text-[10.5px] text-slate-600">
                    Semi-Major Axis: <strong className="text-slate-800">{activeSim.originEllipse.semiMajorKm} km</strong> • Semi-Minor: <strong className="text-slate-800">{activeSim.originEllipse.semiMinorKm} km</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Orientation Bearing: {Math.round(activeSim.originEllipse.orientationDeg)}°
                  </div>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* 3. Multi-Tier Candidate Release Zones (Alpha / Beta / Gamma) */}
          {layers.candidateOriginZones && activeSim.originZones && activeSim.originZones.map((zone) => (
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
              <Popup minWidth={230}>
                <div className="text-slate-900 p-1 text-xs font-sans">
                  <div className="font-bold text-[#0B2545] flex items-center justify-between pb-1 border-b mb-1">
                    <span>{zone.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      zone.probabilityLevel === "HIGH" ? "bg-rose-100 text-rose-700" : zone.probabilityLevel === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-700"
                    }`}>
                      {zone.probabilityPct}% PROB.
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-600 mb-1.5 leading-tight">{zone.description}</p>
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono bg-slate-50 p-1.5 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-500 block">Center:</span>
                      <strong className="text-slate-800">{zone.center[0].toFixed(4)}°N, {zone.center[1].toFixed(4)}°E</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Suspect CPA:</span>
                      <strong className="text-rose-600">{zone.cpaVesselDistanceKm} km</strong>
                    </div>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* 4. Most Probable Release Origin Bulls-Eye Marker */}
          {layers.probableOrigin && (
            <>
              <Marker position={activeSim.probableOrigin} icon={createOriginIcon()}>
                <Popup minWidth={250}>
                  <div className="text-slate-900 p-1 text-xs font-sans">
                    <div className="font-bold text-amber-800 flex items-center justify-between pb-1 border-b border-slate-200 mb-1.5">
                      <span className="flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Most Probable Release Origin</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold">
                        {activeSim.originConfidenceScorePct}% CONF.
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Back-Calculated Coords:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {activeSim.probableOrigin[0].toFixed(4)}°N, {activeSim.probableOrigin[1].toFixed(4)}°E
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Time Window:</span>
                        <span className="font-mono text-slate-800">{activeSim.originTimeWindow}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Spatial Error Bounds:</span>
                        <span className="font-mono font-bold text-amber-700">±{activeSim.originConfidenceRadiusKm} km (Zone Alpha)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vessel Alignment:</span>
                        <span className="font-mono font-bold text-rose-600">MT PACIFIC VOYAGER (CPA: 0.6 km)</span>
                      </div>
                    </div>
                    {onOpenReportModal && (
                      <button
                        type="button"
                        onClick={onOpenReportModal}
                        className="w-full mt-2 py-1 px-2 rounded-lg bg-[#0B2545] hover:bg-[#143966] text-white text-[10px] font-bold text-center cursor-pointer transition-colors shadow-xs"
                      >
                        Generate Origin Analysis Report &rarr;
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Origin-to-Centroid Lagrangian Reverse Vector */}
              <Polyline
                positions={[activeSim.probableOrigin, activeSim.slickCentroid]}
                pathOptions={{ color: "#F59E0B", weight: 2.5, dashArray: "4 4" }}
              />
            </>
          )}

          {/* --------------------------------------------------------------- */}
          {/* LAYER F: COASTLINE LANDFALL PROXIMITY & IMPACT THREAT ZONE       */}
          {/* --------------------------------------------------------------- */}
          {layers.coastlineLandfall && (
            <>
              {/* Distance Line to Shoreline */}
              <Polyline
                positions={[activeSim.slickCentroid, activeSim.coastalThreat.nearestCoastPoint]}
                pathOptions={{
                  color: activeSim.coastalThreat.landfallThreat === "CRITICAL" ? "#E11D48" : "#F59E0B",
                  weight: 2.5,
                  dashArray: "3 4",
                }}
              />

              {/* Coastal Threat Alert Marker */}
              <Marker
                position={activeSim.coastalThreat.nearestCoastPoint}
                icon={createCoastThreatIcon(activeSim.coastalThreat.landfallThreat)}
              >
                <Popup minWidth={220}>
                  <div className="text-slate-900 p-1 text-xs">
                    <div className="font-bold text-rose-700 pb-1 border-b mb-1 flex items-center justify-between">
                      <span>{activeSim.coastalThreat.coastName}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                        {activeSim.coastalThreat.landfallThreat}
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Distance from Spill:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {activeSim.coastalThreat.distanceNm} NM ({activeSim.coastalThreat.distanceKm} km)
                        </span>
                      </div>
                      {activeSim.coastalThreat.estimatedLandfallHours && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Est. Landfall In:</span>
                          <span className="font-mono font-bold text-rose-600">
                            ~{activeSim.coastalThreat.estimatedLandfallHours} hours ({activeSim.coastalThreat.landfallTimestamp})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* --------------------------------------------------------------- */}
          {/* LAYER G: AIS VESSELS, HISTORICAL TRACKS & CORRELATION VECTORS   */}
          {/* --------------------------------------------------------------- */}
          {layers.vesselsAis && (
            <>
              {/* Primary Suspect: MT PACIFIC VOYAGER */}
              <Marker
                position={[18.82, 72.46]}
                icon={createTacticalVesselIcon(312, true, suspectVessel.name)}
              >
                <Popup className="vessel-popup" minWidth={240}>
                  <div className="text-slate-900 p-1 text-xs font-sans">
                    <div className="flex items-center justify-between pb-1 border-b mb-1.5">
                      <div className="font-bold text-[#0B2545] flex items-center gap-1">
                        <Flag className="w-3.5 h-3.5 text-slate-500" />
                        <span>{suspectVessel.name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                        {suspectVessel.score}% Suspect
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mb-1.5">
                      IMO {suspectVessel.imo} • Crude Oil Tanker • Flag: {suspectVessel.flag}
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-center bg-slate-50 p-1.5 rounded-lg border border-slate-200 mb-2">
                      <div>
                        <div className="text-slate-400">Speed</div>
                        <div className="font-bold text-rose-600">1.4 kts</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Heading</div>
                        <div className="font-bold text-[#0B2545]">312°</div>
                      </div>
                      <div>
                        <div className="text-slate-400">CPA to Origin</div>
                        <div className="font-bold text-rose-600">0.8 km</div>
                      </div>
                    </div>
                    {onSelectVessel && (
                      <button
                        type="button"
                        onClick={() => onSelectVessel(suspectVessel)}
                        className="w-full py-1 px-2 rounded-lg bg-[#0B2545] hover:bg-[#143966] text-white text-[10px] font-bold text-center cursor-pointer transition-colors"
                      >
                        Inspect Vessel Forensics &rarr;
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Suspect AIS Historical Track with Dark Gap section in dashed red */}
              <Polyline
                positions={[
                  [18.62, 72.35],
                  [18.70, 72.40],
                  [18.78, 72.46],
                ]}
                pathOptions={{ color: "#10B981", weight: 3 }}
              />
              <Polyline
                positions={[
                  [18.78, 72.46],
                  [18.82, 72.46],
                ]}
                pathOptions={{ color: "#E11D48", weight: 3.5, dashArray: "5 4" }}
              />

              {/* Vector connecting suspect vessel track to probable origin */}
              <Polyline
                positions={[[18.78, 72.46], activeSim.probableOrigin]}
                pathOptions={{ color: "#E11D48", weight: 1.8, dashArray: "2 3" }}
              />

              {/* Other Traffic Vessels */}
              <Marker position={[19.15, 72.38]} icon={createTacticalVesselIcon(148, false, "CMA CGM ANTARES")}>
                <Popup>
                  <div className="text-xs p-1 text-slate-900">
                    <div className="font-bold text-[#0B2545]">CMA CGM ANTARES</div>
                    <div className="text-[10px] text-slate-500 font-mono">Container Ship • 14.8 kts • 43.5% Score</div>
                  </div>
                </Popup>
              </Marker>

              <Marker position={[18.65, 72.25]} icon={createTacticalVesselIcon(180, false, "MV NORDIC TRADER")}>
                <Popup>
                  <div className="text-xs p-1 text-slate-900">
                    <div className="font-bold text-[#0B2545]">MV NORDIC TRADER</div>
                    <div className="text-[10px] text-slate-500 font-mono">Bulk Carrier • 11.2 kts • 31.2% Score</div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* --------------------------------------------------------------- */}
          {/* LAYER H: ENVIRONMENTAL & MARITIME INFRASTRUCTURE ZONES          */}
          {/* --------------------------------------------------------------- */}
          {/* Marine Protected Areas (MPAs) */}
          {layers.marineProtectedAreas && (
            <Polygon
              positions={MPA_ALISANCTUARY}
              pathOptions={{
                color: "#059669",
                fillColor: "#10B981",
                fillOpacity: 0.18,
                weight: 1.5,
                dashArray: "4 3",
              }}
            >
              <Popup>
                <div className="text-xs p-1 text-slate-900">
                  <div className="font-bold text-emerald-800">Marine Protected Sanctuary (Malvan-Alibaug Buffer)</div>
                  <div className="text-[10.5px] text-slate-600">Eco-sensitive coral reef and turtle nesting sanctuary.</div>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* Commercial Fishing Grounds */}
          {layers.fishingZones && (
            <Polygon
              positions={FISHING_GROUNDS}
              pathOptions={{
                color: "#D97706",
                fillColor: "#FBBF24",
                fillOpacity: 0.12,
                weight: 1.2,
                dashArray: "3 3",
              }}
            >
              <Popup>
                <div className="text-xs p-1 text-slate-900">
                  <div className="font-bold text-amber-800">Designated Coastal Fishing Grounds</div>
                  <div className="text-[10.5px] text-slate-600">Active artisan fisheries & aquaculture zone.</div>
                </div>
              </Popup>
            </Polygon>
          )}

          {/* Shipping TSS Traffic Corridors */}
          {layers.shippingCorridors && (
            <Polyline
              positions={SHIPPING_TSS_CORRIDOR}
              pathOptions={{ color: "#818CF8", weight: 4, opacity: 0.6, dashArray: "8 4" }}
            />
          )}

          {/* Offshore Oil Rigs */}
          {layers.offshorePlatforms &&
            OFFSHORE_PLATFORMS.map((plat) => (
              <Marker key={plat.name} position={plat.coord} icon={createPlatformIcon(plat.name)}>
                <Popup>
                  <div className="text-xs p-1 text-slate-900">
                    <div className="font-bold text-slate-900">{plat.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Operator: {plat.operator} • Offshore Asset</div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Major Indian Ports */}
          {layers.ports &&
            INDIAN_PORTS.slice(0, 6).map((port) => (
              <Marker
                key={port.name}
                position={[port.lat, port.lng]}
                icon={createPortMarkerIcon(selectedPort?.name === port.name)}
                eventHandlers={{
                  click: () => {
                    setSelectedPort(port);
                    setMapTarget({ center: [port.lat, port.lng], zoom: 11 });
                  },
                }}
              >
                <Popup minWidth={200}>
                  <div className="text-slate-900 p-1 text-xs">
                    <div className="font-bold text-[#0B2545]">{port.name}</div>
                    <div className="text-[10.5px] text-slate-500">{port.city}</div>
                    <div className="text-[9px] font-mono text-slate-400 mt-1">
                      {port.lat.toFixed(4)}°N, {port.lng.toFixed(4)}°E
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* EEZ Baseline Line */}
          {layers.eezBoundary && (
            <Polyline
              positions={EEZ_LINE_CORRIDOR}
              pathOptions={{ color: "#94A3B8", weight: 1.5, dashArray: "5 5" }}
            />
          )}
        </MapContainer>

        {/* ----------------------------------------------------------------- */}
        {/* 4. FLOATING VECTOR & TELEMETRY CARD (BOTTOM-LEFT OVERLAY)         */}
        {/* ----------------------------------------------------------------- */}
        <div className="absolute bottom-3 left-3 z-[600] bg-[#071930]/95 backdrop-blur-md border border-sky-800/80 rounded-2xl p-3 shadow-2xl text-white text-xs max-w-[290px] pointer-events-auto">
          <div className="flex items-center justify-between pb-1.5 border-b border-sky-800/60 mb-2">
            <span className="font-bold text-sky-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: "20s" }} />
              <span>Drift Hydrodynamics</span>
            </span>
            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-950 text-cyan-300 border border-sky-700">
              {activeSim.netDriftSpeedKts} kts ({activeSim.orientationBearingDeg}°)
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Wind className="w-3 h-3 text-sky-400" /> Wind Push:
              </span>
              <span className="font-bold text-slate-200">
                {params.windSpeedKts} kts ({params.windDirDeg}°)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-cyan-400" /> Ocean Current:
              </span>
              <span className="font-bold text-slate-200">
                {params.currentSpeedKts} kts ({params.currentDirDeg}°)
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-sky-900/60">
              <span className="text-slate-400">Shoreline Distance:</span>
              <span
                className={`font-bold ${
                  activeSim.coastalThreat.landfallThreat === "CRITICAL"
                    ? "text-rose-400"
                    : activeSim.coastalThreat.landfallThreat === "HIGH"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {activeSim.coastalThreat.distanceNm} NM ({activeSim.coastalThreat.distanceKm} km)
              </span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 5. FLOATING OIL CONCENTRATION & BONN AGREEMENT LEGEND (BOTTOM-RIGHT) */}
        {/* ----------------------------------------------------------------- */}
        {showLegend && (
          <div className="absolute bottom-3 right-3 z-[600] bg-[#071930]/95 backdrop-blur-md border border-sky-800/80 rounded-2xl p-3 shadow-2xl text-white text-xs max-w-[270px] pointer-events-auto">
            <div className="flex items-center justify-between font-bold text-sky-200 pb-1.5 border-b border-sky-800/60 mb-2">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Spill Concentrations (Bonn)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLegend(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-[10.5px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#1C0D02] border border-amber-900 shrink-0" />
                <div>
                  <div className="font-bold text-amber-200">Core / Heavy Emulsion</div>
                  <div className="text-[9.5px] text-slate-400 font-mono">&gt;100 µm • Bonn Code 5</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#B45309] border border-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-amber-300">Moderate Contamination</div>
                  <div className="text-[9.5px] text-slate-400 font-mono">5–50 µm • Bonn Code 3–4</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#0284C7] border border-sky-400 shrink-0" />
                <div>
                  <div className="font-bold text-sky-300">Light Sheen / Rainbow</div>
                  <div className="text-[9.5px] text-slate-400 font-mono">&lt;1 µm • Bonn Code 1–2</div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-sky-900/60">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shrink-0" />
                <span className="text-slate-300 font-mono text-[10px]">Probable Release Origin</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 bg-[#0EA5B7] shrink-0" />
                <span className="text-slate-300 font-mono text-[10px]">Forecast Corridor (+48h)</span>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* 6. MEASUREMENT RESULT CALLOUT (WHEN ACTIVE)                       */}
        {/* ----------------------------------------------------------------- */}
        {isMeasureActive && measureResult && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[700] bg-[#071930]/95 backdrop-blur-md border border-amber-400 rounded-xl px-4 py-2 shadow-2xl text-white text-xs flex items-center gap-3">
            <Ruler className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-amber-300">Measured Distance</div>
              <div className="font-mono text-xs">
                {measureResult.nm} NM &nbsp;|&nbsp; {measureResult.km} km
              </div>
            </div>
            <button
              onClick={() => setMeasureResult(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 7. TIMELINE PLAYBACK SCRUBBER (-24h to +48h)                        */}
      {/* ------------------------------------------------------------------- */}
      {showTimelineScrubber && (
        <div className="relative z-[1050] px-4 py-2 bg-[#081C35] border-t border-sky-900/80 flex items-center justify-between gap-4 text-xs text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
              className="p-1.5 rounded-lg bg-[#185ADB] hover:bg-[#1448B0] text-white cursor-pointer transition-colors"
            >
              {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <span className="font-mono text-cyan-300 font-bold text-[11px] min-w-[70px]">
              {timelineStep >= 0 ? `+${timelineStep}h Forecast` : `${timelineStep}h Hindcast`}
            </span>
          </div>

          <div className="flex-1 flex items-center gap-3">
            <span className="font-mono text-[10px] text-slate-400">-24h</span>
            <input
              type="range"
              min="-24"
              max="48"
              step="6"
              value={timelineStep}
              onChange={(e) => {
                setTimelineStep(parseInt(e.target.value));
                setIsPlayingTimeline(false);
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <span className="font-mono text-[10px] text-slate-400">+48h</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>{new Date(Date.now() + timelineStep * 3600000).toUTCString().slice(5, 22)} UTC</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSpillMap;
