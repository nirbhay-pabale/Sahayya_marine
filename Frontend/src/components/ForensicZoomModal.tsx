import React, { useState, useEffect } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Clock,
  Activity,
  Compass,
  Wind,
  Waves,
  Thermometer,
  Anchor,
  Shield,
  Fish,
  Navigation,
  Eye,
  Layers,
  FileText,
  Download,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  MapPin,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { INCIDENT_DATA } from "../data/incidentData";

export type ForensicZoomTab = "zones" | "evolution" | "dna" | "all";

interface ForensicZoomModalProps {
  isOpen: boolean;
  initialTab: ForensicZoomTab;
  onClose: () => void;
  onExportReport?: () => void;
}

export const ForensicZoomModal: React.FC<ForensicZoomModalProps> = ({
  isOpen,
  initialTab,
  onClose,
  onExportReport,
}) => {
  const [activeTab, setActiveTab] = useState<ForensicZoomTab>(initialTab);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Synchronize when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ==========================================
  // STATE: Slick Evolution (Hindcast & Forecast)
  // ==========================================
  const [evoIndex, setEvoIndex] = useState(2); // index 2 = "Now" (T-0)
  const [isEvoPlaying, setIsEvoPlaying] = useState(false);
  const [evoSpeed, setEvoSpeed] = useState<number>(1);
  const [evoShowParticles, setEvoShowParticles] = useState(true);
  const [evoShowGrid, setEvoShowGrid] = useState(true);
  const [evoShowBuffer12nm, setEvoShowBuffer12nm] = useState(true);
  const [evoShowVectors, setEvoShowVectors] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isEvoPlaying) {
      const intervalMs = 1400 / evoSpeed;
      timer = setInterval(() => {
        setEvoIndex((prev) => (prev + 1) % INCIDENT_DATA.timelineFrames.length);
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isEvoPlaying, evoSpeed]);

  // ==========================================
  // STATE: Spill DNA & 3D Stratigraphy
  // ==========================================
  const [dnaSubTab, setDnaSubTab] = useState<"3D" | "SAR" | "Cross-section" | "Thickness" | "Spectral">("3D");
  const [modelPitch, setModelPitch] = useState(25);
  const [modelYaw, setModelYaw] = useState(-20);
  const [dnaZoomLevel, setDnaZoomLevel] = useState(1);

  // ==========================================
  // STATE: Affected Zones GIS Filters
  // ==========================================
  const [filterCoastline, setFilterCoastline] = useState(true);
  const [filterMPA, setFilterMPA] = useState(true);
  const [filterFisheries, setFilterFisheries] = useState(true);
  const [filterPorts, setFilterPorts] = useState(true);
  const [selectedZoneDetail, setSelectedZoneDetail] = useState<string | null>("coastline");

  if (!isOpen) return null;

  const activeFrame = INCIDENT_DATA.timelineFrames[evoIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fadeIn">
      <div
        className={`bg-[#0A1628] border border-[#1E3A5F] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex flex-col transition-all duration-300 overflow-hidden ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-full max-w-7xl h-[92vh] max-h-[920px]"
        }`}
      >
        {/* =================================================================== */}
        {/* TOP NAVIGATION BAR                                                  */}
        {/* =================================================================== */}
        <div className="px-5 py-3.5 bg-[#07111E] border-b border-[#1A3456] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E5FBF] to-[#0EA5B7] flex items-center justify-center text-white shadow-md">
              <ZoomIn className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-display font-bold text-white tracking-wide">
                  FORENSIC DEEP-DIVE &amp; HIGH-RES ZOOM LAB
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-950/90 text-sky-300 border border-sky-600/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  HD 4K RENDER ENGINE
                </span>
              </div>
              <p className="text-[11px] font-body text-slate-400">
                Sentinel-1A SAR Calibration &bull; OpenDrift Lagrangian Hindcast/Forecast &bull; Bonn Stratigraphy
              </p>
            </div>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex items-center gap-1.5 bg-[#0C1E34] p-1 rounded-xl border border-[#1E3A5F]">
            <button
              onClick={() => setActiveTab("zones")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "zones"
                  ? "bg-[#1E5FBF] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#0EA5B7]" />
              <span className="hidden md:inline">1. Affected Zones GIS</span>
              <span className="md:hidden">Zones</span>
            </button>

            <button
              onClick={() => setActiveTab("evolution")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "evolution"
                  ? "bg-[#1E5FBF] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">2. Slick Evolution Theatre</span>
              <span className="md:hidden">Evolution</span>
            </button>

            <button
              onClick={() => setActiveTab("dna")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "dna"
                  ? "bg-[#1E5FBF] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">3. Spill DNA &amp; 3D Stratigraphy</span>
              <span className="md:hidden">Spill DNA</span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-[#0EA5B7] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Multi-View (All 3)</span>
              <span className="md:hidden">Multi</span>
            </button>
          </div>

          {/* Window Actions */}
          <div className="flex items-center gap-2">
            {onExportReport && (
              <button
                onClick={onExportReport}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Snapshot PDF</span>
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-[#0C1E34] hover:bg-[#1A3456] text-slate-300 hover:text-white border border-[#1E3A5F] transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Zoom"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/50 transition-colors cursor-pointer"
              title="Close Zoom View (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* MAIN BODY WORKSPACE (ZOOMED CONTENT)                                */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#081424] custom-scrollbar text-slate-200">
          {/* ================================================================= */}
          {/* VIEW 1: AFFECTED ZONES (PROXIMITY GIS RADAR)                       */}
          {/* ================================================================= */}
          {activeTab === "zones" && (
            <div className="space-y-4 h-full flex flex-col">
              {/* Top Filter & Telemetry HUD */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
                <div className="p-3 rounded-xl bg-[#0D1F38] border border-[#1E3E69] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Anchor className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Closest Coastline</div>
                      <div className="text-[10px] text-slate-400">Alibaug &amp; Raigad District</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-amber-400">38 km</div>
                    <div className="text-[9px] font-mono text-amber-500/80">ETA: 18h 42m</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0D1F38] border border-[#1E3E69] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-[#0EA5B7] border border-cyan-500/20">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Marine Protected Area</div>
                      <div className="text-[10px] text-slate-400">Malvan Marine Sanctuary</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-[#0EA5B7]">12.3% overlap</div>
                    <div className="text-[9px] font-mono text-cyan-400/80">25.8 km² threat</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0D1F38] border border-[#1E3E69] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Fish className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Fishing Corridors</div>
                      <div className="text-[10px] text-slate-400">Trawler Nursery Grounds</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-emerald-400">8.7% overlap</div>
                    <div className="text-[9px] font-mono text-emerald-400/80">18.1 km² nursery</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0D1F38] border border-[#1E3E69] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Critical Ports &amp; Rigs</div>
                      <div className="text-[10px] text-slate-400">JNPT + Bombay High</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-rose-400">Tier Z-03</div>
                    <div className="text-[9px] font-mono text-rose-400/80">High Vulnerability</div>
                  </div>
                </div>
              </div>

              {/* Main Split: GIS Interactive Radar + Proximity Details Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[480px]">
                {/* Left 2 Cols: Expanded Marine GIS Canvas */}
                <div className="lg:col-span-2 rounded-2xl bg-[#050D18] border border-[#1A3456] relative overflow-hidden flex flex-col justify-between p-4 shadow-inner">
                  {/* Background Satellite Map Texture */}
                  <img
                    src="/opendrift-trajectory-simulation.jpg"
                    alt="Expanded Proximity Map"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen pointer-events-none"
                  />

                  {/* SVG Tactical Vector Overlays */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 400">
                    {/* Range Rings from Spill Centroid (18.69°N, 72.38°E) */}
                    <g stroke="#1E5FBF" strokeWidth="0.8" opacity="0.35" fill="none" strokeDasharray="4 4">
                      <circle cx="280" cy="220" r="60" />
                      <circle cx="280" cy="220" r="120" />
                      <circle cx="280" cy="220" r="180" />
                      <circle cx="280" cy="220" r="240" />
                    </g>
                    <text x="285" y="165" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" opacity="0.8">10 NM</text>
                    <text x="285" y="105" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" opacity="0.8">20 NM</text>
                    <text x="285" y="45" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" opacity="0.8">30 NM</text>

                    {/* Maharashtra Shoreline Buffer (12 NM Baseline) */}
                    <path
                      d="M620,0 Q600,120 630,240 T650,400"
                      fill="none"
                      stroke="#0284C7"
                      strokeWidth="5"
                      opacity="0.9"
                    />
                    <path
                      d="M540,0 Q520,120 550,240 T570,400"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      opacity="0.75"
                    />
                    <text x="545" y="25" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      12 NM TERRITORIAL BASELINE
                    </text>

                    {/* Marine Protected Area Polygon (Malvan Sector) */}
                    {filterMPA && (
                      <g>
                        <polygon
                          points="360,260 480,240 520,330 400,370"
                          fill="#06B6D4"
                          fillOpacity="0.22"
                          stroke="#06B6D4"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                        />
                        <text x="410" y="295" fill="#67E8F9" fontSize="10" fontFamily="monospace" fontWeight="bold">
                          MALVAN MPA BUFFER (12.3% OVERLAP)
                        </text>
                      </g>
                    )}

                    {/* Artisanal Fishing Corridors */}
                    {filterFisheries && (
                      <g>
                        <polygon
                          points="200,100 340,80 380,180 240,210"
                          fill="#10B981"
                          fillOpacity="0.18"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                        <text x="230" y="145" fill="#6EE7B7" fontSize="9.5" fontFamily="monospace">
                          ARTISANAL NURSERY (8.7% OVERLAP)
                        </text>
                      </g>
                    )}

                    {/* Main Oil Slick Footprint */}
                    <g transform="rotate(-24.6 280 220)">
                      <ellipse cx="280" cy="220" rx="90" ry="36" fill="#06B6D4" opacity="0.2" />
                      <ellipse cx="280" cy="220" rx="68" ry="26" fill="#EF4444" opacity="0.85" />
                      <ellipse cx="280" cy="220" rx="38" ry="14" fill="#7F1D1D" opacity="0.95" />
                      <circle cx="280" cy="220" r="3.5" fill="#FEF08A" />
                      <text x="290" y="224" fill="#FEF08A" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        SPILL CENTROID (18.69°N, 72.38°E)
                      </text>
                    </g>

                    {/* Proximity Vectors with Distance Callouts */}
                    {filterCoastline && (
                      <g>
                        <line x1="280" y1="220" x2="620" y2="180" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 3" />
                        <rect x="420" y="185" width="95" height="20" rx="4" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
                        <text x="426" y="199" fill="#FDE68A" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          COASTLINE: 38 km
                        </text>
                      </g>
                    )}

                    {/* Key Offshore Platforms & Ports */}
                    {filterPorts && (
                      <g>
                        <circle cx="615" cy="80" r="5" fill="#38BDF8" />
                        <text x="560" y="75" fill="#BAE6FD" fontSize="9" fontFamily="monospace">JNPT / MUMBAI PORT</text>

                        <circle cx="180" cy="80" r="4" fill="#F43F5E" />
                        <text x="110" y="75" fill="#FDA4AF" fontSize="9" fontFamily="monospace">BOMBAY HIGH NORTH</text>
                      </g>
                    )}
                  </svg>

                  {/* Top Overlay Controls */}
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-[11px] font-mono text-sky-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>INCOIS ADVECTION VECTOR: 0.82 kts @ 068° ENE</span>
                    </div>

                    <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs">
                      <button
                        onClick={() => setFilterCoastline(!filterCoastline)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          filterCoastline ? "bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold" : "text-slate-400"
                        }`}
                      >
                        Coastline (38 km)
                      </button>
                      <button
                        onClick={() => setFilterMPA(!filterMPA)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          filterMPA ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold" : "text-slate-400"
                        }`}
                      >
                        MPA Sanctuary
                      </button>
                      <button
                        onClick={() => setFilterFisheries(!filterFisheries)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          filterFisheries ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold" : "text-slate-400"
                        }`}
                      >
                        Fishing Zones
                      </button>
                      <button
                        onClick={() => setFilterPorts(!filterPorts)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          filterPorts ? "bg-sky-500/30 text-sky-300 border border-sky-500/50 font-bold" : "text-slate-400"
                        }`}
                      >
                        Ports &amp; Rigs
                      </button>
                    </div>
                  </div>

                  {/* Bottom Telemetry Legend */}
                  <div className="relative z-10 flex items-center justify-between bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-mono">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-amber-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        Coastline Buffer (38 km)
                      </span>
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500/40 border border-cyan-400 inline-block" />
                        Malvan Marine Sanctuary
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-300">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/40 border border-emerald-400 inline-block" />
                        Trawler Grounds
                      </span>
                    </div>
                    <div className="text-slate-400">
                      Geographic Datum: WGS-84 &bull; Projection: Mercator
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Vulnerability & Response Matrix */}
                <div className="rounded-2xl bg-[#0D1F38] border border-[#1E3E69] p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider pb-2 border-b border-[#1E3E69] flex items-center justify-between">
                      <span>Vulnerability Risk Matrix</span>
                      <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/40">
                        CRITICAL SECTOR
                      </span>
                    </h3>

                    <div className="space-y-2 mt-3 text-xs">
                      <div
                        onClick={() => setSelectedZoneDetail("coastline")}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          selectedZoneDetail === "coastline"
                            ? "bg-[#162F52] border-[#0EA5B7]"
                            : "bg-[#0A182B] border-[#183152] hover:border-[#1E3E69]"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-white">
                          <span className="flex items-center gap-1.5">
                            <Anchor className="w-3.5 h-3.5 text-amber-400" />
                            Alibaug &amp; Raigad Shoreline
                          </span>
                          <span className="font-mono text-amber-400">38 km</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Sandy beaches with intertidal mudflats. High sensitivity index (ESI 8/10). Containment boom staging required at Revdanda Creek.
                        </p>
                      </div>

                      <div
                        onClick={() => setSelectedZoneDetail("mpa")}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          selectedZoneDetail === "mpa"
                            ? "bg-[#162F52] border-[#0EA5B7]"
                            : "bg-[#0A182B] border-[#183152] hover:border-[#1E3E69]"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-white">
                          <span className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-[#0EA5B7]" />
                            Malvan Marine Sanctuary
                          </span>
                          <span className="font-mono text-[#0EA5B7]">12.3% Overlap</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Coral reef ecosystem &amp; turtle nesting habitat. Surface dispersants strictly prohibited within 15 km buffer.
                        </p>
                      </div>

                      <div
                        onClick={() => setSelectedZoneDetail("fishing")}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          selectedZoneDetail === "fishing"
                            ? "bg-[#162F52] border-[#0EA5B7]"
                            : "bg-[#0A182B] border-[#183152] hover:border-[#1E3E69]"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-white">
                          <span className="flex items-center gap-1.5">
                            <Fish className="w-3.5 h-3.5 text-emerald-400" />
                            Artisanal Fishing Grounds
                          </span>
                          <span className="font-mono text-emerald-400">8.7% Nursery</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          248 active artisanal fishing vessels alerted. Advisory NAVAREA VIII broadcast active.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1E3E69] space-y-2">
                    <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                      <span>Shoreline Protection ETA:</span>
                      <strong className="text-emerald-400 font-bold">14h 20m Window</strong>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 h-full w-[65%]" />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Staging Booms</span>
                      <span className="text-amber-300">Skimmer Deployment</span>
                      <span>Beach Protection</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 2: SLICK EVOLUTION (OPENDRIFT SIMULATION THEATRE)            */}
          {/* ================================================================= */}
          {activeTab === "evolution" && (
            <div className="space-y-4 h-full flex flex-col">
              {/* Timeline Step Selector Strip (7 Full High-Res Step Cards) */}
              <div className="grid grid-cols-7 gap-2 shrink-0">
                {INCIDENT_DATA.timelineFrames.map((frame, idx) => {
                  const isSelected = evoIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setEvoIndex(idx)}
                      className={`rounded-xl overflow-hidden border p-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#1E5FBF] bg-sky-950/70 shadow-lg ring-2 ring-[#1E5FBF]"
                          : "border-[#1A3456] bg-[#0A182B] hover:border-[#1E5FBF]/50"
                      }`}
                    >
                      <div className="w-full h-12 rounded-lg bg-[#040C16] border border-[#132842] overflow-hidden mb-1.5 flex items-center justify-center relative shadow-inner">
                        <div className="absolute inset-0 bg-[radial-gradient(#1E5FBF_1px,transparent_1px)] bg-[size:6px_6px] opacity-25" />
                        <svg viewBox="0 0 60 30" className="w-full h-full p-1 relative z-10">
                          {idx === 0 && (
                            <g>
                              <circle cx="20" cy="18" r="4.5" fill="#F59E0B" opacity="0.85" />
                              <circle cx="20" cy="18" r="2" fill="#FEF3C7" />
                              <line x1="20" y1="18" x2="36" y2="12" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="2 2" />
                            </g>
                          )}
                          {idx === 1 && (
                            <g>
                              <path d="M16,20 Q28,16 40,12" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
                              <circle cx="40" cy="12" r="2.5" fill="#FBBF24" />
                            </g>
                          )}
                          {idx === 2 && (
                            <g>
                              <ellipse cx="30" cy="15" rx="18" ry="7" fill="#EF4444" opacity="0.4" transform="rotate(-18 30 15)" />
                              <ellipse cx="30" cy="15" rx="11" ry="4" fill="#EF4444" opacity="0.95" transform="rotate(-18 30 15)" />
                              <circle cx="30" cy="15" r="2" fill="#FDE047" className="animate-pulse" />
                            </g>
                          )}
                          {idx === 3 && (
                            <g>
                              <ellipse cx="34" cy="14" rx="20" ry="8" fill="#BE123C" opacity="0.5" transform="rotate(-14 34 14)" />
                              <ellipse cx="34" cy="14" rx="12" ry="4.2" fill="#E11D48" opacity="0.9" transform="rotate(-14 34 14)" />
                            </g>
                          )}
                          {idx === 4 && (
                            <g>
                              <ellipse cx="38" cy="13" rx="22" ry="9" fill="#9F1239" opacity="0.5" transform="rotate(-10 38 13)" />
                              <path d="M16,20 Q32,13 46,9" stroke="#FB7185" strokeWidth="1.5" strokeDasharray="1.5 1.5" opacity="0.8" />
                            </g>
                          )}
                          {idx === 5 && (
                            <g>
                              <ellipse cx="42" cy="12" rx="24" ry="10" fill="#881337" opacity="0.6" transform="rotate(-5 42 12)" />
                              <line x1="52" y1="2" x2="52" y2="28" stroke="#0284C7" strokeWidth="2" strokeDasharray="2 1" />
                            </g>
                          )}
                          {idx === 6 && (
                            <g>
                              <ellipse cx="46" cy="12" rx="26" ry="11" fill="#701A75" opacity="0.65" />
                              <line x1="52" y1="2" x2="52" y2="28" stroke="#0284C7" strokeWidth="2.5" />
                            </g>
                          )}
                        </svg>
                      </div>
                      <div className="text-xs font-display font-bold text-white">
                        {frame.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {frame.areaKm2} km²
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Scrubber Slider & Playback Bar */}
              <div className="p-3 rounded-xl bg-[#0D1F38] border border-[#1E3E69] flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsEvoPlaying(!isEvoPlaying)}
                    className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#0EA5B7] hover:from-[#174EA6] hover:to-[#0B8B9B] text-white flex items-center justify-center cursor-pointer shadow-md transition-all"
                  >
                    {isEvoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Step: {activeFrame.label}</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                        evoIndex === 2
                          ? "bg-rose-950 text-rose-300 border border-rose-600"
                          : evoIndex < 2
                          ? "bg-amber-950 text-amber-300 border border-amber-600"
                          : "bg-sky-950 text-sky-300 border border-sky-600"
                      }`}>
                        {evoIndex === 2 ? "OBSERVED SAR TRUTH" : evoIndex < 2 ? "LAGRANGIAN HINDCAST" : "OPENDRIFT FORECAST"}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      OpenDrift v1.9 &bull; 5,000 Lagrangian Elements &bull; ECMWF + INCOIS
                    </div>
                  </div>
                </div>

                {/* Scrubber Bar */}
                <div className="flex-1 max-w-xl px-2">
                  <input
                    type="range"
                    min="0"
                    max="6"
                    value={evoIndex}
                    onChange={(e) => setEvoIndex(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1E5FBF]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>T-24h (Release Zone)</span>
                    <span>T-12h</span>
                    <span className="text-rose-400 font-bold">Now (SAR Detection)</span>
                    <span>+12h</span>
                    <span>+24h</span>
                    <span>+36h</span>
                    <span>+48h (Coastal Intercept)</span>
                  </div>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Speed:</span>
                  <div className="flex items-center bg-[#071322] rounded-lg border border-[#1E3A5F] p-0.5 text-xs font-mono">
                    {[0.5, 1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setEvoSpeed(spd)}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          evoSpeed === spd ? "bg-[#1E5FBF] text-white font-bold" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expanded Simulation Screen (High Definition GIS Canvas) */}
              <div className="flex-1 rounded-2xl bg-[#040C16] border border-[#1A3456] relative overflow-hidden flex flex-col justify-between p-4 shadow-2xl min-h-[460px]">
                {/* Background Hydrodynamic Map Underlay */}
                <img
                  src="/opendrift-trajectory-simulation.jpg"
                  alt="OpenDrift Full Simulation Canvas"
                  className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen pointer-events-none scale-105"
                />

                {/* SVG Lagrangian Streamlines & Particles */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 420">
                  {/* Tactical Grid */}
                  {evoShowGrid && (
                    <g stroke="#1E5FBF" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 4">
                      <line x1="160" y1="0" x2="160" y2="420" />
                      <line x1="320" y1="0" x2="320" y2="420" />
                      <line x1="480" y1="0" x2="480" y2="420" />
                      <line x1="640" y1="0" x2="640" y2="420" />
                      <line x1="0" y1="105" x2="800" y2="105" />
                      <line x1="0" y1="210" x2="800" y2="210" />
                      <line x1="0" y1="315" x2="800" y2="315" />
                    </g>
                  )}

                  {/* 12NM Coastal Buffer */}
                  {evoShowBuffer12nm && (
                    <g>
                      <path d="M720,0 Q690,210 740,420" fill="none" stroke="#0284C7" strokeWidth="4" opacity="0.85" />
                      <path d="M640,0 Q610,210 660,420" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
                      <text x="645" y="25" fill="#38BDF8" fontSize="9" fontFamily="monospace" opacity="0.9">
                        12NM COASTAL BUFFER LINE
                      </text>
                    </g>
                  )}

                  {/* Full Hindcast-Forecast Drift Spine Line */}
                  <path
                    d="M120,280 Q260,240 400,190 T680,130"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />

                  {/* Dynamic Slick Footprint at Active Index */}
                  {(() => {
                    const stepCoords = [
                      { cx: 120, cy: 280, rx: 30, ry: 15, rot: -18, fill: "#F59E0B", opacity: 0.85, label: "ORIGIN (T-24h)" },
                      { cx: 230, cy: 250, rx: 45, ry: 20, rot: -20, fill: "#EA580C", opacity: 0.85, label: "T-12h" },
                      { cx: 350, cy: 215, rx: 65, ry: 28, rot: -24.6, fill: "#DC2626", opacity: 0.95, label: "SAR TRUTH (T-0)" },
                      { cx: 440, cy: 190, rx: 80, ry: 34, rot: -22, fill: "#BE123C", opacity: 0.9, label: "+12h Forecast" },
                      { cx: 530, cy: 165, rx: 95, ry: 40, rot: -18, fill: "#9F1239", opacity: 0.85, label: "+24h Forecast" },
                      { cx: 610, cy: 145, rx: 110, ry: 46, rot: -14, fill: "#881337", opacity: 0.8, label: "+36h Forecast" },
                      { cx: 680, cy: 130, rx: 125, ry: 52, rot: -10, fill: "#701A75", opacity: 0.75, label: "+48h Impact" },
                    ];
                    const p = stepCoords[evoIndex];

                    return (
                      <g transform={`rotate(${p.rot} ${p.cx} ${p.cy})`}>
                        {/* Outer Bonn Code 1-2 Sheen Fringe */}
                        <ellipse cx={p.cx} cy={p.cy} rx={p.rx * 1.35} ry={p.ry * 1.35} fill="#06B6D4" opacity="0.25" />
                        {/* Bonn Code 3-4 True Oil Plume */}
                        <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={p.fill} opacity={p.opacity} />
                        {/* Bonn Code 5 Dense Emulsion Core */}
                        <ellipse cx={p.cx} cy={p.cy} rx={p.rx * 0.55} ry={p.ry * 0.55} fill="#7F1D1D" opacity="0.95" />
                        {/* Centroid Reticle */}
                        <circle cx={p.cx} cy={p.cy} r="4" fill="#FEF08A" />
                        <line x1={p.cx - 10} y1={p.cy} x2={p.cx + 10} y2={p.cy} stroke="#FEF08A" strokeWidth="1" />
                        <line x1={p.cx} y1={p.cy - 10} x2={p.cx} y2={p.cy + 10} stroke="#FEF08A" strokeWidth="1" />
                      </g>
                    );
                  })()}

                  {/* Origin Backtrack Marker */}
                  <g transform="translate(120, 280)">
                    <circle cx="0" cy="0" r="6" fill="#F59E0B" opacity="0.9" />
                    <circle cx="0" cy="0" r="14" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.6" className="animate-ping" />
                    <rect x="12" y="-12" width="165" height="24" rx="4" fill="#0A182B" stroke="#F59E0B" strokeWidth="1" />
                    <text x="18" y="4" fill="#FDE68A" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                      ORIGIN PIN: 18.78°N, 72.51°E
                    </text>
                  </g>
                </svg>

                {/* Top Tactical Telemetry HUD */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sky-300 font-bold">INCOIS CURRENTS: 0.82 kts @ 068° ENE</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-amber-300">ECMWF WIND: 14.2 kts WSW</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-300">SST: 28.4°C</span>
                  </div>

                  <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-xl border border-white/15 text-xs">
                    <button
                      onClick={() => setEvoShowGrid(!evoShowGrid)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${evoShowGrid ? "bg-[#1E5FBF] text-white" : "text-slate-400"}`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setEvoShowBuffer12nm(!evoShowBuffer12nm)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${evoShowBuffer12nm ? "bg-[#1E5FBF] text-white" : "text-slate-400"}`}
                    >
                      12NM Buffer
                    </button>
                  </div>
                </div>

                {/* Bottom Weathering & Mass Balance Telemetry Strip */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-3 bg-black/85 backdrop-blur-md p-3 rounded-xl border border-white/15 text-xs font-mono">
                  <div className="space-y-0.5">
                    <div className="text-slate-400 text-[10px]">Surface Footprint Area:</div>
                    <div className="text-amber-400 font-bold text-sm">{activeFrame.areaKm2} km²</div>
                    <div className="text-[9px] text-slate-500">Aspect Ratio: 2.44 (Elongated)</div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-slate-400 text-[10px]">Active Slick Volume:</div>
                    <div className="text-white font-bold text-sm">
                      {Math.round(2260 * (1 - evoIndex * 0.045)).toLocaleString()} m³
                    </div>
                    <div className="text-[9px] text-emerald-400 font-semibold">Evaporated: {evoIndex * 4.5}%</div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-slate-400 text-[10px]">Distance to Coastline:</div>
                    <div className={`font-bold text-sm ${evoIndex > 4 ? "text-rose-400 animate-pulse" : "text-sky-300"}`}>
                      {[54.2, 38.6, 24.5, 18.2, 13.9, 9.4, 4.8][evoIndex]} NM ({Math.round([54.2, 38.6, 24.5, 18.2, 13.9, 9.4, 4.8][evoIndex] * 1.852)} km)
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {evoIndex > 4 ? "ALERT: Imminent Shoreline Contact" : "Clear of 12NM Territorial Waters"}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-slate-400 text-[10px]">ADIOS Weathering Balance:</div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex mt-1">
                      <div className="bg-rose-600 h-full w-[45%]" title="Emulsion 45%" />
                      <div className="bg-amber-500 h-full w-[25%]" title="Evaporated 25%" />
                      <div className="bg-sky-400 h-full w-[18%]" title="Dispersed 18%" />
                      <div className="bg-slate-400 h-full w-[12%]" title="Remaining 12%" />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-400">
                      <span>Emulsion</span>
                      <span>Evaporated</span>
                      <span>Dispersed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 3: SPILL DNA & 3D STRATIGRAPHY STUDIO                         */}
          {/* ================================================================= */}
          {activeTab === "dna" && (
            <div className="space-y-4 h-full flex flex-col">
              {/* Top DNA Sub-tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#0D1F38] border border-[#1E3E69] shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDnaSubTab("3D")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      dnaSubTab === "3D" ? "bg-[#1E5FBF] text-white shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    3D Interactive Mesh
                  </button>
                  <button
                    onClick={() => setDnaSubTab("SAR")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      dnaSubTab === "SAR" ? "bg-[#1E5FBF] text-white shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Sentinel-1 SAR Radar Scan
                  </button>
                  <button
                    onClick={() => setDnaSubTab("Cross-section")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      dnaSubTab === "Cross-section" ? "bg-[#1E5FBF] text-white shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Bonn 3D Stratigraphy
                  </button>
                  <button
                    onClick={() => setDnaSubTab("Thickness")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      dnaSubTab === "Thickness" ? "bg-[#1E5FBF] text-white shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Volumetric Thickness Audit
                  </button>
                  <button
                    onClick={() => setDnaSubTab("Spectral")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      dnaSubTab === "Spectral" ? "bg-[#1E5FBF] text-white shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Spectral Signature &amp; Fingerprint
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span>Class: <strong className="text-white">Heavy Arabian Crude</strong></span>
                  <span>Viscosity: <strong className="text-amber-400">480 cSt @ 28°C</strong></span>
                  <span>API Gravity: <strong className="text-sky-300">28.4°</strong></span>
                </div>
              </div>

              {/* Main Laboratory Split: 3D Visualizer + Geometry & Fingerprint Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[480px]">
                {/* Visualizer Canvas (2 Cols) */}
                <div
                  className="lg:col-span-2 rounded-2xl bg-[#050D18] border border-[#1A3456] relative overflow-hidden flex flex-col justify-between p-4 shadow-2xl cursor-move select-none"
                  onMouseMove={(e) => {
                    if (e.buttons === 1) {
                      setModelPitch((p) => Math.max(0, Math.min(60, p + e.movementY * 0.5)));
                      setModelYaw((y) => y + e.movementX * 0.5);
                    }
                  }}
                  title="Click & Drag to Rotate 3D Slick Geometry"
                >
                  {/* Mode 1: 3D Interactive Mesh */}
                  {dnaSubTab === "3D" && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div
                        className="relative transition-transform duration-75 flex items-center justify-center w-full h-full"
                        style={{
                          transform: `perspective(400px) rotateX(${modelPitch}deg) rotateY(${modelYaw}deg) scale(${dnaZoomLevel})`,
                        }}
                      >
                        <svg viewBox="0 0 400 240" className="w-96 h-60 overflow-visible">
                          {/* Radial Grid Mesh Lines */}
                          <g stroke="#1E5FBF" strokeWidth="0.5" opacity="0.3" fill="none">
                            <ellipse cx="200" cy="120" rx="160" ry="70" strokeDasharray="3 3" />
                            <ellipse cx="200" cy="120" rx="120" ry="50" strokeDasharray="3 3" />
                            <line x1="40" y1="120" x2="360" y2="120" />
                            <line x1="200" y1="50" x2="200" y2="190" />
                          </g>

                          {/* Tier 1: Outer Sheen Fringe Base */}
                          <ellipse
                            cx="200"
                            cy="120"
                            rx="150"
                            ry="65"
                            fill="#0E7490"
                            opacity="0.35"
                            transform="rotate(-24.6 200 120)"
                          />
                          {/* Tier 2: Viscous True Oil Body */}
                          <ellipse
                            cx="200"
                            cy="116"
                            rx="115"
                            ry="48"
                            fill="#EA580C"
                            opacity="0.8"
                            transform="rotate(-24.6 200 116)"
                          />
                          {/* Tier 3: Dense Emulsion Core */}
                          <ellipse
                            cx="200"
                            cy="110"
                            rx="75"
                            ry="32"
                            fill="#DC2626"
                            opacity="0.95"
                            transform="rotate(-24.6 200 110)"
                          />
                          {/* Core Peak Highlight */}
                          <ellipse
                            cx="195"
                            cy="106"
                            rx="40"
                            ry="16"
                            fill="#FEF08A"
                            opacity="0.6"
                            transform="rotate(-24.6 195 106)"
                          />

                          {/* Caliper Vectors in 3D Space */}
                          <g transform="rotate(-24.6 200 120)">
                            <line x1="50" y1="120" x2="350" y2="120" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 2" />
                            <text x="200" y="110" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                              MAJOR AXIS: 31.2 km &bull; ORIENTATION: 24.6°
                            </text>
                          </g>
                        </svg>
                      </div>

                      <div className="absolute bottom-3 right-3 text-xs font-mono text-slate-400 bg-black/70 px-2.5 py-1 rounded-lg border border-white/10 pointer-events-none">
                        Pitch: {Math.round(modelPitch)}° &bull; Yaw: {Math.round(modelYaw)}° &bull; Drag to rotate
                      </div>
                    </div>
                  )}

                  {/* Mode 2: SAR Radar Scan */}
                  {dnaSubTab === "SAR" && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src="/sar-oil-spill-radar.jpg"
                        alt="Sentinel-1 SAR Radar Scan"
                        className="absolute inset-0 w-full h-full object-cover opacity-85 mix-blend-screen pointer-events-none"
                      />
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 300">
                        {/* Radar Reticle */}
                        <g stroke="#38BDF8" strokeWidth="0.8" opacity="0.4" strokeDasharray="4 4" fill="none">
                          <circle cx="300" cy="150" r="90" />
                          <circle cx="300" cy="150" r="140" />
                          <line x1="300" y1="0" x2="300" y2="300" />
                          <line x1="0" y1="150" x2="600" y2="150" />
                        </g>
                        {/* Calipers */}
                        <g transform="rotate(-24.6 300 150)">
                          <rect x="180" y="110" width="240" height="80" rx="40" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 3" />
                          <text x="300" y="140" fill="#FDE68A" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                            SAR C-BAND BACKSCATTER: -24.8 dB
                          </text>
                          <text x="300" y="165" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                            Major: 31.2 km &bull; Minor: 12.8 km
                          </text>
                        </g>
                      </svg>
                      <div className="absolute top-3 left-3 bg-black/75 px-3 py-1 rounded-lg border border-white/10 text-xs font-mono text-rose-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>Sentinel-1A IW C-Band (VV/VH Calibrated)</span>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: 3D Stratigraphy Cross-Section */}
                  {dnaSubTab === "Cross-section" && (
                    <div className="relative w-full h-full flex flex-col justify-between p-4">
                      <img
                        src="/spill-dna-3d-cross-section.jpg"
                        alt="3D Stratigraphy Profile"
                        className="absolute inset-0 w-full h-full object-cover opacity-75 mix-blend-screen pointer-events-none"
                      />
                      <div className="relative z-10 flex justify-between items-center text-xs font-mono bg-black/75 px-3 py-1.5 rounded-xl border border-white/15">
                        <span className="text-sky-300 font-bold">BONN AGREEMENT 3D STRATIGRAPHY CUTAWAY</span>
                        <span className="text-amber-300">Heavy Emulsion Core: 1.5mm &bull; Sheen: 142 &mu;m</span>
                      </div>
                      <div className="relative z-10 grid grid-cols-3 gap-3 text-xs font-mono text-center">
                        <div className="bg-black/75 p-2.5 rounded-xl border border-white/15 text-rose-300">
                          <strong className="text-sm">Emulsion Core (Code 5)</strong>
                          <div className="text-[11px] text-slate-300 mt-0.5">Thickness: 1.5 mm &bull; 81.4% Total Volume</div>
                        </div>
                        <div className="bg-black/75 p-2.5 rounded-xl border border-white/15 text-amber-300">
                          <strong className="text-sm">True Oil Sheen (Code 4)</strong>
                          <div className="text-[11px] text-slate-300 mt-0.5">50 &ndash; 142 &mu;m &bull; 12.4% Volume</div>
                        </div>
                        <div className="bg-black/75 p-2.5 rounded-xl border border-white/15 text-sky-300">
                          <strong className="text-sm">Pycnocline Mixing Layer</strong>
                          <div className="text-[11px] text-slate-300 mt-0.5">Depth: 12.5 m &bull; Turbulent Diffusion</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 4: Volumetric Thickness Audit */}
                  {dnaSubTab === "Thickness" && (
                    <div className="w-full h-full p-4 flex flex-col justify-between text-xs font-mono">
                      <div className="flex justify-between items-center text-slate-200 border-b border-white/15 pb-2">
                        <span className="text-amber-300 font-bold text-sm">BONN AGREEMENT VOLUMETRIC AUDIT</span>
                        <span className="text-rose-400 font-bold text-base">TOTAL: 2,260 m³ (14,215 bbl)</span>
                      </div>

                      <div className="space-y-3 my-4">
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-xs bg-rose-600 inline-block" />
                            <strong>Code 5 (Dark Chocolate Emulsion &gt;200 &mu;m):</strong>
                          </span>
                          <span className="text-white font-bold">1,840 m³ (81.4%) &bull; 27.6 km²</span>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
                            <strong>Code 4 (Metallic / True Oil 50&ndash;200 &mu;m):</strong>
                          </span>
                          <span className="text-white font-bold">280 m³ (12.4%) &bull; 68.2 km²</span>
                        </div>

                        <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-600/40 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-xs bg-sky-400 inline-block" />
                            <strong>Code 1&ndash;3 (Rainbow / Silver Sheen 0.04&ndash;5 &mu;m):</strong>
                          </span>
                          <span className="text-white font-bold">140 m³ (6.2%) &bull; 180.2 km²</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                        <div className="bg-rose-600 h-full w-[81.4%]" />
                        <div className="bg-amber-500 h-full w-[12.4%]" />
                        <div className="bg-sky-400 h-full w-[6.2%]" />
                      </div>
                    </div>
                  )}

                  {/* Mode 5: Spectral Signature */}
                  {dnaSubTab === "Spectral" && (
                    <div className="w-full h-full p-4 flex flex-col justify-between text-xs font-mono">
                      <div className="flex justify-between items-center border-b border-white/15 pb-2 text-slate-200">
                        <span className="text-indigo-300 font-bold text-sm">RADAR BACKSCATTER ATTENUATION &amp; FINGERPRINT</span>
                        <span className="text-emerald-400 font-bold">MATCH: 98.6% HEAVY CRUDE</span>
                      </div>

                      <div className="my-3">
                        <svg viewBox="0 0 500 120" className="w-full h-32">
                          <line x1="40" y1="100" x2="480" y2="100" stroke="#334155" strokeWidth="1.5" />
                          <line x1="40" y1="20" x2="40" y2="100" stroke="#334155" strokeWidth="1.5" />
                          {/* Clean Sea Level Reference */}
                          <line x1="40" y1="35" x2="480" y2="35" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
                          <text x="45" y="30" fill="#38BDF8" fontSize="9">Clean Sea Level (-16.2 dB)</text>
                          {/* Oil Damping Curve */}
                          <path
                            d="M40,35 Q160,35 220,85 Q280,105 340,85 Q400,35 480,35"
                            fill="none"
                            stroke="#EF4444"
                            strokeWidth="3"
                          />
                          <circle cx="280" cy="100" r="4" fill="#FEF08A" />
                          <text x="290" y="95" fill="#FEF08A" fontSize="10" fontWeight="bold">-24.8 dB Attenuation Trough</text>
                        </svg>
                      </div>

                      <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-slate-300 space-y-1">
                        <div>&bull; Infrared C-H stretch absorption band observed @ 3.42 &mu;m (Aliphatic hydrocarbons).</div>
                        <div>&bull; Pristane/Phytane biomarker ratio: 1.42 (Signature match: Ras Tanura crude load).</div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Bar: Interactive Zoom Slider */}
                  <div className="relative z-10 flex items-center justify-between bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Zoom:</span>
                      <button
                        onClick={() => setDnaZoomLevel((z) => Math.max(0.7, z - 0.15))}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sky-300 font-bold">{Math.round(dnaZoomLevel * 100)}%</span>
                      <button
                        onClick={() => setDnaZoomLevel((z) => Math.min(2.0, z + 0.15))}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setModelPitch(25);
                        setModelYaw(-20);
                        setDnaZoomLevel(1);
                      }}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Perspective</span>
                    </button>
                  </div>
                </div>

                {/* Right 1 Col: Complete Geometric Calipers & Forensics */}
                <div className="rounded-2xl bg-[#0D1F38] border border-[#1E3E69] p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider pb-2 border-b border-[#1E3E69] flex items-center justify-between">
                      <span>Spill Geometry DNA</span>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/40">
                        ISO/IEC 17025
                      </span>
                    </h3>

                    <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#0A182B] border border-[#183152]">
                        <div className="text-slate-400 text-[10px]">Surface Area</div>
                        <div className="font-mono text-sm font-bold text-white mt-0.5">{INCIDENT_DATA.spillDNA.area}</div>
                        <div className="text-[9px] text-emerald-400">Sentinel-1 Calibrated</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#0A182B] border border-[#183152]">
                        <div className="text-slate-400 text-[10px]">Perimeter Length</div>
                        <div className="font-mono text-sm font-bold text-white mt-0.5">{INCIDENT_DATA.spillDNA.perimeter}</div>
                        <div className="text-[9px] text-sky-400">Fractal Dim: 1.34</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#0A182B] border border-[#183152]">
                        <div className="text-slate-400 text-[10px]">Major Axis Length</div>
                        <div className="font-mono text-sm font-bold text-sky-300 mt-0.5">{INCIDENT_DATA.spillDNA.lengthMajor}</div>
                        <div className="text-[9px] text-slate-400">Principal Spreading</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#0A182B] border border-[#183152]">
                        <div className="text-slate-400 text-[10px]">Minor Axis Width</div>
                        <div className="font-mono text-sm font-bold text-sky-300 mt-0.5">{INCIDENT_DATA.spillDNA.widthMinor}</div>
                        <div className="text-[9px] text-slate-400">Cross-Wind Spread</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#0A182B] border border-[#183152]">
                        <div className="text-slate-400 text-[10px]">Orientation Angle</div>
                        <div className="font-mono text-sm font-bold text-amber-400 mt-0.5">{INCIDENT_DATA.spillDNA.orientation}</div>
                        <div className="text-[9px] text-amber-500/80">NE-SW Advection</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#0A182B] border border-[#183152]">
                        <div className="text-slate-400 text-[10px]">Shape Index</div>
                        <div className="font-mono text-sm font-bold text-purple-400 mt-0.5">{INCIDENT_DATA.spillDNA.shapeIndex}</div>
                        <div className="text-[9px] text-slate-400">0.73 (Elongated)</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-[#1E3E69] space-y-1 text-xs">
                    <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fingerprint Match Certainty</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Geometry elongation angle (24.6°) exactly correlates with 94-minute AIS gap course of <strong className="text-rose-300">MT PACIFIC VOYAGER</strong> heading 024° at 13.8 kts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 4: MULTI-VIEW (ALL 3 PANELS SIDE-BY-SIDE EXPANDED)            */}
          {/* ================================================================= */}
          {activeTab === "all" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* Box 1: Affected Zones */}
              <div
                onClick={() => setActiveTab("zones")}
                className="rounded-2xl bg-[#0D1F38] border border-[#1E3E69] p-4 flex flex-col justify-between hover:border-[#1E5FBF] transition-all cursor-pointer group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1E3E69]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0EA5B7]" />
                      <h3 className="text-xs font-display font-bold text-white uppercase">
                        1. Affected Zones GIS
                      </h3>
                    </div>
                    <span className="text-[10px] text-sky-400 group-hover:underline flex items-center gap-1">
                      <span>Zoom</span>
                      <Maximize2 className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#0A182B] flex justify-between">
                      <span className="text-slate-300">Coastline Proximity:</span>
                      <span className="font-mono text-amber-400 font-bold">38 km (Raigad)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0A182B] flex justify-between">
                      <span className="text-slate-300">MPA Buffer Overlap:</span>
                      <span className="font-mono text-[#0EA5B7] font-bold">12.3% (25.8 km²)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0A182B] flex justify-between">
                      <span className="text-slate-300">Fishing Grounds:</span>
                      <span className="font-mono text-emerald-400 font-bold">8.7% (18.1 km²)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-[#1E3E69] flex justify-end">
                  <span className="text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                    Click to Open Full Proximity Radar &rarr;
                  </span>
                </div>
              </div>

              {/* Box 2: Slick Evolution */}
              <div
                onClick={() => setActiveTab("evolution")}
                className="rounded-2xl bg-[#0D1F38] border border-[#1E3E69] p-4 flex flex-col justify-between hover:border-[#1E5FBF] transition-all cursor-pointer group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1E3E69]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1E5FBF]" />
                      <h3 className="text-xs font-display font-bold text-white uppercase">
                        2. Slick Evolution Theatre
                      </h3>
                    </div>
                    <span className="text-[10px] text-sky-400 group-hover:underline flex items-center gap-1">
                      <span>Zoom</span>
                      <Maximize2 className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#0A182B] flex justify-between">
                      <span className="text-slate-300">Simulation Model:</span>
                      <span className="font-mono text-sky-300 font-bold">OpenDrift v1.9</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0A182B] flex justify-between">
                      <span className="text-slate-300">Lagrangian Particles:</span>
                      <span className="font-mono text-white font-bold">5,000 Elements</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0A182B] flex justify-between">
                      <span className="text-slate-300">Hindcast Origin Fix:</span>
                      <span className="font-mono text-amber-400 font-bold">18.78°N, 72.51°E</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-[#1E3E69] flex justify-end">
                  <span className="text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                    Click to Launch Simulation Theatre &rarr;
                  </span>
                </div>
              </div>

              {/* Box 3: Spill DNA */}
              <div
                onClick={() => setActiveTab("dna")}
                className="rounded-2xl bg-[#0D1F38] border border-[#1E3E69] p-4 flex flex-col justify-between hover:border-[#1E5FBF] transition-all cursor-pointer group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1E3E69]">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-display font-bold text-white uppercase">
                        3. Spill DNA &amp; Stratigraphy
                      </h3>
                    </div>
                    <span className="text-[10px] text-indigo-400 group-hover:underline flex items-center gap-1">
                      <span>Zoom</span>
                      <Maximize2 className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#0A182B] flex justify-between">
                      <span className="text-slate-300">Bonn Stratigraphy:</span>
                      <span className="font-mono text-rose-400 font-bold">Code 5 (1.5 mm core)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0A182B] flex justify-between">
                      <span className="text-slate-300">Total Volumetric Audit:</span>
                      <span className="font-mono text-white font-bold">2,260 m³ (81% core)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0A182B] flex justify-between">
                      <span className="text-slate-300">Chemical Biomarker:</span>
                      <span className="font-mono text-emerald-400 font-bold">98.6% Arabian Crude</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-[#1E3E69] flex justify-end">
                  <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    Click to Open 3D DNA Studio &rarr;
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForensicZoomModal;
