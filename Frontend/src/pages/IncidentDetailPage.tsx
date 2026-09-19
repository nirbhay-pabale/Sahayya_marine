import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { getAvatarUrl } from "../services/api";
import {
  INCIDENT_DATA,
  VesselCandidate,
  RESPONSE_PRIORITY_ZONES,
  RECOVERY_MONITORING_DATA,
  ResponsePriorityZone,
  ActiveIncidentRecord,
} from "../data/incidentData";
import { StatusStepper } from "../components/StatusStepper";
import { IncidentMiniMap, MapVesselCandidate, MapCoastGuardAsset } from "../components/IncidentMiniMap";
import { EvidenceGraphModal } from "../components/EvidenceGraphModal";
import { ReportGenerationModal } from "../components/ReportGenerationModal";
import { generateIncidentTelemetryPdf } from "../services/incidentTelemetryPdfGenerator";
import sahayyaApi from "../services/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import {
  Home,
  Activity,
  Layers,
  Target,
  Navigation,
  Gauge,
  Wind,
  Waves,
  Thermometer,
  Compass,
  Edit3,
  AlertOctagon,
  Satellite,
  Clock,
  Shield,
  RotateCcw,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Share2,
  Download,
  FileText,
  MoreVertical,
  AlertTriangle,
  Ship,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  X,
  Plus,
  CheckSquare,
  Square,
  Eye,
  Info,
  ExternalLink,
  MapPin,
  Search,
  Bell,
  User,
  Settings,
  HelpCircle,
  LogOut,
  BarChart3,
  Map as MapIcon,
  Fish,
  Sparkles,
  Copy,
  Radio,
  RefreshCw,
  Cpu,
  Database,
  Crosshair,
  Send,
} from "lucide-react";

export const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId?: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const effectiveIncidentId = incidentId || INCIDENT_DATA.id;

  // =========================================================================
  // DYNAMIC API DATA STATE
  // =========================================================================
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [isLiveTelemetry, setIsLiveTelemetry] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("Syncing...");
  
  // Dynamic API payloads
  const [incidentDetail, setIncidentDetail] = useState<any>(null);
  const [spillDNA, setSpillDNA] = useState<any>(null);
  const [originZone, setOriginZone] = useState<any>(null);
  const [spillEvolutionData, setSpillEvolutionData] = useState<any>(null);
  const [impactData, setImpactData] = useState<any>(null);
  const [vesselAttributions, setVesselAttributions] = useState<any[]>([]);
  const [nearbyAssets, setNearbyAssets] = useState<any[]>([]);
  const [priorityZones, setPriorityZones] = useState<any[]>([]);
  const [forecastSnapshots, setForecastSnapshots] = useState<any[]>([]);

  // Layout / Topbar / Sidebar states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("Incidents");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editable Overview state (Panel A)
  const [overviewDescription, setOverviewDescription] = useState(INCIDENT_DATA.overview.description);
  const [overviewType, setOverviewType] = useState(INCIDENT_DATA.overview.type);
  const [overviewAgency, setOverviewAgency] = useState(INCIDENT_DATA.overview.agency);
  const [showEditOverviewModal, setShowEditOverviewModal] = useState(false);
  const [tempDescription, setTempDescription] = useState(overviewDescription);
  const [tempType, setTempType] = useState(overviewType);
  const [tempAgency, setTempAgency] = useState(overviewAgency);

  // Hero Carousel state (Panel B)
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Spill Evolution state (Panel E)
  const [evolutionDataSource, setEvolutionDataSource] = useState<"Observed" | "Model">("Observed");
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState(2); // default "Now"
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);

  // Vessel Candidate Inspection (Panel F)
  const [selectedCandidate, setSelectedCandidate] = useState<VesselCandidate | null>(null);
  const [showAllCandidatesModal, setShowAllCandidatesModal] = useState(false);

  // Incident Workspace Sub-Tabs (Tactical, Recovery, Digital Twin)
  const [activeIncidentTab, setActiveIncidentTab] = useState<"tactical" | "recovery" | "digitaltwin">("tactical");

  // Response Optimizer State (Stage 17)
  const [selectedPriorityZone, setSelectedPriorityZone] = useState<ResponsePriorityZone>(RESPONSE_PRIORITY_ZONES[0]);
  const [deployedAssets, setDeployedAssets] = useState<Record<string, boolean>>({
    "cg-1": true,
    "cg-2": false,
    "cg-3": false,
    "cg-4": true,
  });

  // Digital Twin Simulation State (Stage 20)
  const [simWindSpeed, setSimWindSpeed] = useState(5.1);
  const [simWindDir, setSimWindDir] = useState(289);
  const [simCurrentSpeed, setSimCurrentSpeed] = useState(0.67);
  const [twinMapLayer, setTwinMapLayer] = useState<"satellite" | "osm">("satellite");
  const [twinShowVectors, setTwinShowVectors] = useState(true);
  const [twinShowVessels, setTwinShowVessels] = useState(true);

  // Evidence Graph Modal
  const [evidenceModalCandidate, setEvidenceModalCandidate] = useState<VesselCandidate | null>(null);

  // Response Actions state (Panel J)
  const [responseStatus, setResponseStatus] = useState<"Planning" | "Active" | "Completed">("Planning");
  const [showResponseStatusDropdown, setShowResponseStatusDropdown] = useState(false);
  const [checklist, setChecklist] = useState(INCIDENT_DATA.responseChecklist);
  const [showResponsePlanModal, setShowResponsePlanModal] = useState(false);

  // Action Bar Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [showDetailedAnalysisModal, setShowDetailedAnalysisModal] = useState(false);
  const [showCompareModelModal, setShowCompareModelModal] = useState(false);
  const [showAllActivityModal, setShowAllActivityModal] = useState(false);

  const overflowMenuRef = useRef<HTMLDivElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // =========================================================================
  // FETCH DYNAMIC INCIDENT DATA FROM BACKEND API
  // =========================================================================
  const fetchIncidentData = async () => {
    setIsLoadingApi(true);
    try {
      const [
        incRes,
        dnaRes,
        originRes,
        evolutionRes,
        impactRes,
        attribRes,
        assetsRes,
        priorityRes,
        forecastRes,
      ] = await Promise.allSettled([
        sahayyaApi.incidents.get(effectiveIncidentId),
        sahayyaApi.incidents.getSpillDNA(effectiveIncidentId),
        sahayyaApi.incidents.getOriginZone(effectiveIncidentId),
        sahayyaApi.incidents.getSpillEvolution(effectiveIncidentId),
        sahayyaApi.incidents.getImpactAssessment(effectiveIncidentId),
        sahayyaApi.vessels.getAttributions(effectiveIncidentId),
        sahayyaApi.response.getNearbyAssets(18.78, 72.51),
        sahayyaApi.response.getPriorityZones(effectiveIncidentId),
        sahayyaApi.simulation.getForecast(effectiveIncidentId, 48),
      ]);

      let hasLive = false;

      if (incRes.status === "fulfilled" && incRes.value) {
        setIncidentDetail(incRes.value);
        if (incRes.value.description) {
          setOverviewDescription(incRes.value.description);
          setTempDescription(incRes.value.description);
        }
        if (incRes.value.investigating_agency) {
          setOverviewAgency(incRes.value.investigating_agency);
          setTempAgency(incRes.value.investigating_agency);
        }
        hasLive = true;
      }

      if (dnaRes.status === "fulfilled" && dnaRes.value) {
        setSpillDNA(dnaRes.value);
        hasLive = true;
      }

      if (originRes.status === "fulfilled" && originRes.value) {
        setOriginZone(originRes.value);
        hasLive = true;
      }

      if (evolutionRes.status === "fulfilled" && evolutionRes.value) {
        setSpillEvolutionData(evolutionRes.value);
        hasLive = true;
      }

      if (impactRes.status === "fulfilled" && impactRes.value) {
        setImpactData(impactRes.value);
        hasLive = true;
      }

      if (attribRes.status === "fulfilled" && Array.isArray(attribRes.value)) {
        setVesselAttributions(attribRes.value);
        hasLive = true;
      }

      if (assetsRes.status === "fulfilled" && Array.isArray(assetsRes.value)) {
        setNearbyAssets(assetsRes.value);
      }

      if (priorityRes.status === "fulfilled" && Array.isArray(priorityRes.value)) {
        setPriorityZones(priorityRes.value);
      }

      if (forecastRes.status === "fulfilled" && forecastRes.value?.snapshots) {
        setForecastSnapshots(forecastRes.value.snapshots);
      }

      setIsLiveTelemetry(hasLive);
      setLastUpdatedTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " UTC");
    } catch (err) {
      console.warn("API fallback to high-fidelity simulated telemetry:", err);
      setIsLiveTelemetry(false);
      setLastUpdatedTime(new Date().toLocaleTimeString("en-GB") + " (Simulated)");
    } finally {
      setIsLoadingApi(false);
    }
  };

  useEffect(() => {
    fetchIncidentData();
  }, [effectiveIncidentId]);

  // Scrubber timer
  useEffect(() => {
    let interval: any;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setSelectedTimelineIndex((prev) => (prev + 1) % 7);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  // Close overflow menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setShowOverflowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  // Derived Dynamic Data & Fallbacks
  const currentAreaKm2 = useMemo(() => {
    if (spillDNA?.area_km2) return spillDNA.area_km2;
    if (incidentDetail?.spill_area_km2) return incidentDetail.spill_area_km2;
    return 276.04;
  }, [spillDNA, incidentDetail]);

  const currentSeverityScore = useMemo(() => {
    if (incidentDetail?.severity_score) {
      const score = incidentDetail.severity_score;
      return score <= 10 ? Math.round(score * 10) : Math.round(score);
    }
    return 82;
  }, [incidentDetail]);

  const currentCoords = useMemo<[number, number]>(() => {
    if (originZone?.center_point?.coordinates) {
      const c = originZone.center_point.coordinates;
      return [c[1], c[0]];
    }
    if (incidentDetail?.location?.coordinates) {
      const c = incidentDetail.location.coordinates;
      return [c[1], c[0]];
    }
    return [18.78, 72.51];
  }, [originZone, incidentDetail]);

  const currentDistanceToCoast = useMemo(() => {
    if (impactData?.coastline_distance_km) return impactData.coastline_distance_km;
    return 38;
  }, [impactData]);

  const currentEtaHours = useMemo(() => {
    if (impactData?.eta_hours) return impactData.eta_hours;
    return 16.4;
  }, [impactData]);

  // Timeline frames (interactive calculation)
  const timelinePoints = useMemo(() => {
    const baseArea = currentAreaKm2;
    const offsets = [
      { label: "-24h", offset: "-24h", time: "11 Sep 17:00 UTC", area: Math.round(baseArea * 0.31 * 100) / 100, conf: 94.2, status: "Past (Hindcast)", dist: 78, lat: currentCoords[0] - 0.15, lon: currentCoords[1] - 0.12 },
      { label: "-12h", offset: "-12h", time: "12 Sep 05:00 UTC", area: Math.round(baseArea * 0.62 * 100) / 100, conf: 93.8, status: "Past (Hindcast)", dist: 58, lat: currentCoords[0] - 0.08, lon: currentCoords[1] - 0.06 },
      { label: "Now", offset: "0h", time: "12 Sep 17:00 UTC", area: baseArea, conf: 92.4, status: "Detected (Present)", dist: currentDistanceToCoast, lat: currentCoords[0], lon: currentCoords[1] },
      { label: "+12h", offset: "+12h", time: "13 Sep 05:00 UTC", area: Math.round(baseArea * 1.25 * 100) / 100, conf: 88.0, status: "Forecast (Projected)", dist: Math.max(8, currentDistanceToCoast - 12), lat: currentCoords[0] + 0.07, lon: currentCoords[1] + 0.08 },
      { label: "+24h", offset: "+24h", time: "13 Sep 17:00 UTC", area: Math.round(baseArea * 1.49 * 100) / 100, conf: 84.5, status: "Forecast (Projected)", dist: Math.max(4, currentDistanceToCoast - 22), lat: currentCoords[0] + 0.14, lon: currentCoords[1] + 0.17 },
      { label: "+36h", offset: "+36h", time: "14 Sep 05:00 UTC", area: Math.round(baseArea * 1.74 * 100) / 100, conf: 79.2, status: "Forecast (Projected)", dist: Math.max(1, currentDistanceToCoast - 31), lat: currentCoords[0] + 0.21, lon: currentCoords[1] + 0.25 },
      { label: "+48h", offset: "+48h", time: "14 Sep 17:00 UTC", area: Math.round(baseArea * 1.90 * 100) / 100, conf: 73.0, status: "Forecast (Projected)", dist: 0, lat: currentCoords[0] + 0.28, lon: currentCoords[1] + 0.33 },
    ];
    return offsets;
  }, [currentAreaKm2, currentCoords, currentDistanceToCoast]);

  const activeTimelineFrame = timelinePoints[selectedTimelineIndex] || timelinePoints[2];

  // Dynamic Map Vessel Candidates
  const dynamicMapVessels = useMemo<MapVesselCandidate[]>(() => {
    if (vesselAttributions && vesselAttributions.length > 0) {
      return vesselAttributions.map((va, idx) => {
        const v = va.vessel || {};
        let coords: [number, number] = [currentCoords[0] + 0.05 * (idx === 0 ? 1 : -idx), currentCoords[1] - 0.04 * (idx + 1)];
        if (v.latest_position?.coordinates) {
          const raw = v.latest_position.coordinates;
          if (Array.isArray(raw)) {
            coords = [raw[1], raw[0]];
          } else if (typeof raw === "string") {
            const parts = raw.split(" ").map(Number);
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              coords = [parts[1], parts[0]];
            }
          }
        }
        return {
          id: String(va.id || v.id || idx),
          name: v.name || `Vessel Candidate #${idx + 1}`,
          score: va.attribution_pct || va.overall_evidence_pct || 50,
          imo: v.imo_number || "9438200",
          type: (v.vessel_type || "Tanker").replace("_", " ").toUpperCase(),
          flag: v.flag_country || "Liberia",
          coords,
          heading: v.heading_deg || 312,
          speed: v.speed_kts || va.min_sog_kts || 1.4,
          rank: va.rank || idx + 1,
        };
      });
    }
    return [
      {
        name: "MT PACIFIC VOYAGER",
        score: 98.8,
        imo: "9438200",
        type: "Crude Oil Tanker",
        flag: "Liberia",
        coords: [18.82, 72.46],
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
        coords: [19.35, 72.15],
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
        coords: [18.36, 72.78],
        heading: 180,
        speed: 11.2,
        rank: 3,
      },
    ];
  }, [vesselAttributions, currentCoords]);

  // Dynamic Map Coast Guard Assets
  const dynamicMapAssets = useMemo<MapCoastGuardAsset[]>(() => {
    if (nearbyAssets && nearbyAssets.length > 0) {
      return nearbyAssets.slice(0, 6).map((cg) => ({
        id: cg.id,
        name: cg.name,
        asset_type: cg.asset_type,
        coordinates: cg.coordinates || [cg.current_location?.coordinates?.[1] || 18.78, cg.current_location?.coordinates?.[0] || 72.5],
        status: cg.status,
        distance_km: cg.distance_km,
      }));
    }
    return [
      { id: "cg-1", name: "ICGS Vikram", coordinates: [18.84, 72.62], status: "operational", distance_km: 13.4, asset_type: "offshore_patrol_vessel" },
      { id: "cg-2", name: "ICGS Samarth", coordinates: [18.72, 72.45], status: "operational", distance_km: 9.2, asset_type: "offshore_patrol_vessel" },
      { id: "cg-3", name: "Dornier CG-782", coordinates: [18.78, 72.5], status: "on_mission", distance_km: 1.1, asset_type: "patrol_aircraft" },
      { id: "cg-4", name: "ICGS C-438", coordinates: [18.85, 72.78], status: "operational", distance_km: 29.5, asset_type: "interceptor_boat" },
    ];
  }, [nearbyAssets]);

  // =========================================================================
  // DYNAMIC DIGITAL TWIN PHYSICS & DISPERSION ENGINE
  // =========================================================================
  const digitalTwinSimulation = useMemo(() => {
    const lat0 = currentCoords[0];
    const lon0 = currentCoords[1];

    // Wind blowing TO direction (180 deg opposite of where it comes from)
    const windToDeg = (simWindDir + 180) % 360;
    const windRad = (windToDeg * Math.PI) / 180;
    // Current direction approx 189 deg (South-Southwest)
    const currRad = (189 * Math.PI) / 180;

    // Wind drift speed in knots (standard 3.5% rule)
    const windDriftKts = simWindSpeed * 0.035 * 1.94384;
    const currKts = simCurrentSpeed * 1.94384;

    const u = windDriftKts * Math.sin(windRad) + currKts * Math.sin(currRad);
    const v = windDriftKts * Math.cos(windRad) + currKts * Math.cos(currRad);

    const netSpeedKts = Math.sqrt(u * u + v * v);
    const netHeadingDeg = (Math.atan2(u, v) * 180 / Math.PI + 360) % 360;

    // Elongation ratio & simulated area based on wind velocity
    const elongation = 1 + (simWindSpeed / 10);
    const dynamicArea = currentAreaKm2 * (1 + (simWindSpeed * 0.022) + (simCurrentSpeed * 0.05));

    const majorAxisDeg = 0.14 * Math.sqrt(dynamicArea / 276.04) * elongation;
    const minorAxisDeg = (0.08 * Math.sqrt(dynamicArea / 276.04)) / Math.sqrt(elongation);

    // Generate 14 rotated slick polygon vertices
    const slickVerts: [number, number][] = [];
    const rotRad = (netHeadingDeg * Math.PI) / 180;

    for (let i = 0; i < 14; i++) {
      const angle = (i * 2 * Math.PI) / 14;
      const x = minorAxisDeg * Math.cos(angle);
      const y = majorAxisDeg * Math.sin(angle);
      const dLat = -x * Math.sin(rotRad) + y * Math.cos(rotRad);
      const dLon = (x * Math.cos(rotRad) + y * Math.sin(rotRad)) / Math.cos((lat0 * Math.PI) / 180);
      slickVerts.push([lat0 + dLat, lon0 + dLon]);
    }

    // Generate 48h forecast trajectory curve (9 snapshots)
    const forecastPath: [number, number][] = [];
    const hoursSteps = [0, 6, 12, 18, 24, 30, 36, 42, 48];
    for (const h of hoursSteps) {
      const distNm = netSpeedKts * h;
      const dLat = (distNm * Math.cos(rotRad)) / 60;
      const dLon = (distNm * Math.sin(rotRad)) / (60 * Math.cos((lat0 * Math.PI) / 180));
      forecastPath.push([lat0 + dLat, lon0 + dLon]);
    }

    // Landfall ETA calculation
    const distKm = currentDistanceToCoast;
    const speedKmh = Math.max(0.4, netSpeedKts * 1.852);
    const landfallEtaHours = Math.max(1.2, Math.round((distKm / speedKmh) * 10) / 10);

    // Target coastline sector prediction
    let targetSector = "Alibaug & Raigad Shoreline";
    if (netHeadingDeg >= 30 && netHeadingDeg < 95) {
      targetSector = "Mumbai Harbor & JNPT Port Approaches";
    } else if (netHeadingDeg >= 95 && netHeadingDeg < 165) {
      targetSector = "Alibaug, Kashid & Murud Coastal Belt";
    } else if (netHeadingDeg >= 165 && netHeadingDeg < 230) {
      targetSector = "Ratnagiri Offshore Marine Corridor";
    } else {
      targetSector = "Open Arabian Sea (Offshore Drift)";
    }

    return {
      netSpeedKts,
      netHeadingDeg,
      dynamicArea,
      slickVerts,
      forecastPath,
      landfallEtaHours,
      targetSector,
    };
  }, [simWindSpeed, simWindDir, simCurrentSpeed, currentCoords, currentAreaKm2, currentDistanceToCoast]);

  const currentCarouselSlide = INCIDENT_DATA.carouselImages[carouselIndex];

  return (
    <div className="h-screen w-screen overflow-hidden bg-sky-canvas text-slate-800 font-sans select-none flex flex-col antialiased">
      {/* ======================================================================= */}
      {/* 1. TOP BAR (ENTERPRISE / MARITIME DEFENSE COMMAND DESIGN)               */}
      {/* ======================================================================= */}
      <header className="h-16 w-full shrink-0 bg-white border-b border-[#DCEEFC] px-4 lg:px-6 flex items-center justify-between z-40 relative shadow-[0_2px_12px_rgba(30,95,191,0.06)]">
        {/* Left: 2-Bar Sidebar Toggle + Emblem + Sahayya Brand */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            id="sidebar-toggle-button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              isSidebarOpen
                ? "bg-[#F0F7FD] hover:bg-[#E2F0FD] border-[#DCEEFC] text-slate-700"
                : "bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] border-[#1E5FBF] text-white shadow-sm ring-2 ring-sky-200/60"
            }`}
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <div className="flex flex-col items-center justify-center gap-1.5 w-5 py-0.5 pointer-events-none">
              <span
                className={`block h-[2.5px] rounded-full transition-all duration-300 ${
                  isSidebarOpen ? "w-5 bg-slate-700" : "w-5 bg-white"
                }`}
              />
              <span
                className={`block h-[2.5px] rounded-full transition-all duration-300 ${
                  isSidebarOpen ? "w-3.5 self-start bg-slate-700" : "w-5 bg-white"
                }`}
              />
            </div>
          </button>

          {/* Sahayya Official Logo & Brand */}
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <img 
              src="/sahayya-logo.png" 
              alt="Sahayya Logo" 
              className="h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-sm" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg sm:text-xl font-bold tracking-[0.14em] text-[#0B2545] leading-none">
                  {t("brand.name", "SAHAYYA")}
                </span>
                <span className="bg-sky-100 text-[#1E5FBF] border border-sky-300/60 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider font-body">
                  {t("brand.mdaOps", "COMMAND")}
                </span>
              </div>
              <p className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium font-body mt-0.5 hidden md:block">
                {t("brand.tagline", "Maritime Domain Awareness & Forensic Intelligence")}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search / Telemetry status */}
        <div className="hidden md:flex flex-1 max-w-md mx-6 font-body">
          <div className="relative w-full flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder={t("action.search", "Search vessel (IMO, MMSI), coordinates, or spill evidence...")}
              className="w-full pl-9 pr-12 py-1.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#1E5FBF] focus:bg-white focus:ring-1 focus:ring-[#1E5FBF] transition-all font-body"
            />
            <span className="absolute right-2.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-[#E1EEF9] text-slate-500 pointer-events-none">
              ⌘ K
            </span>
          </div>
        </div>

        {/* Right: Live Data Stream Badge + LanguageSwitcher + Bell + User Menu */}
        <div className="flex items-center gap-3">
          {/* Multi-Language Selector */}
          <LanguageSwitcher variant="light" />

          {/* Dynamic Telemetry Status Badge */}
          <div className="flex items-center gap-1.5">
            {isLiveTelemetry ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold font-body shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-mono text-[11px]">LIVE API STREAM</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold font-body shadow-2xs">
                <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="font-mono text-[10.5px]">SIMULATED / DEMO MODE</span>
              </div>
            )}
            <button
              onClick={fetchIncidentData}
              title="Refresh live intelligence telemetry"
              className="p-1.5 rounded-xl border border-[#E1EEF9] hover:bg-[#F0F7FD] text-slate-500 hover:text-[#1E5FBF] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApi ? "animate-spin text-[#1E5FBF]" : ""}`} />
            </button>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => triggerToast("All telemetry channels active (Copernicus SAR, INCOIS Wave, Coastal AIS).")}
            className="w-9 h-9 rounded-xl border border-[#E1EEF9] hover:bg-[#F0F7FD] flex items-center justify-center text-slate-600 transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-[#F0F7FD] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white text-xs font-black flex items-center justify-center shadow-sm overflow-hidden border border-sky-200">
                {user?.avatar_url ? (
                  <img
                    src={getAvatarUrl(user.avatar_url)}
                    alt={user.name || "Officer"}
                    className="w-full h-full object-cover"
                  />
                ) : user?.name ? (
                  user.name.slice(0, 2).toUpperCase()
                ) : (
                  "CG"
                )}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-[#0B2545]">
                  {user?.name || "Commander S. Kumar"}
                </div>
                <div className="text-[10px] text-slate-500">{user?.role || "Coast Guard Ops"}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E1EEF9] rounded-2xl shadow-[0_10px_30px_rgba(30,95,191,0.15)] p-2 z-50 animate-fadeIn">
                <div className="px-3 py-2 border-b border-slate-100 text-xs">
                  <div className="font-bold text-[#0B2545]">{user?.name || "S. Kumar"}</div>
                  <div className="text-[10px] text-slate-400">{user?.role || "Commander (West)"}</div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate("/settings");
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2 cursor-pointer mt-1"
                >
                  <span>{t("nav.settings", "Profile & Settings")}</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-xs text-rose-600 flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t("nav.signOut", "Logout")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================================= */}
      {/* 2. BODY LAYOUT: SIDEBAR + SCROLLABLE DASHBOARD CANVAS                   */}
      {/* ======================================================================= */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* Left Sidebar (Deep Navy Gradient, Incidents ACTIVE) */}
        <aside
          className={`h-full bg-gradient-to-b from-[#0B2545] to-[#123A66] flex flex-col justify-between items-center z-30 shrink-0 shadow-xl transition-all duration-300 ease-in-out ${
            isSidebarOpen
              ? "w-16 sm:w-20 py-4 opacity-100 translate-x-0 overflow-y-auto"
              : "w-0 p-0 opacity-0 -translate-x-full overflow-hidden pointer-events-none border-none"
          }`}
        >
          <div
            className={`flex flex-col items-center gap-4 w-full px-2 transition-opacity duration-200 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {[
              { id: "Dashboard", icon: Home, labelKey: "nav.home", fallback: "Home", path: "/dashboard" },
              { id: "Map", icon: MapIcon, labelKey: "nav.map", fallback: "Map", path: "/map" },
              { id: "Incidents", icon: Activity, labelKey: "nav.incidents", fallback: "Incidents", path: `/incidents/${effectiveIncidentId}` },
              { id: "Vessels", icon: Ship, labelKey: "nav.vessels", fallback: "Vessels", path: "/vessels" },
              { id: "Analysis", icon: BarChart3, labelKey: "nav.analysis", fallback: "Analysis", path: "/analysis" },
              { id: "Authority", icon: Send, labelKey: "nav.authority", fallback: "Submit to Authority", path: "/authority" },
              { id: "Settings", icon: Settings, labelKey: "nav.settings", fallback: "Settings", path: "/settings" },
              { id: "Help", icon: HelpCircle, labelKey: "nav.help", fallback: "Help", path: "/help" },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              const isIndigoAccent = item.id === "Analysis";
              const label = t(item.labelKey, item.fallback);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    if (item.path) {
                      navigate(item.path);
                    } else {
                      triggerToast(`Switched view to: ${label}`);
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                    isActive
                      ? isIndigoAccent
                        ? "bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-md shadow-indigo-950/40"
                        : "bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-white shadow-md shadow-blue-950/40"
                      : isIndigoAccent
                      ? "text-indigo-200 hover:text-white hover:bg-[#6366F1]/20"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                  title={label}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                  <span className="text-[9px] font-semibold tracking-tight truncate max-w-[56px]">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-1 text-center flex flex-col items-center">
            <div 
              onClick={() => navigate("/dashboard")}
              className="w-10 h-10 mx-auto mb-1.5 rounded-full p-1 bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
              title="Sahayya Maritime Intelligence"
            >
              <img src="/sahayya-logo.png" alt="Sahayya" className="w-full h-full object-contain" />
            </div>
            <p className="text-[9px] font-body text-slate-300 font-medium leading-tight">
              {t("brand.slogan", "Safer Oceans. Stronger Tomorrow.")}
            </p>
          </div>
        </aside>

        {/* Scrollable Main Content Canvas */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-auto bg-sky-canvas p-4 lg:p-6 custom-tactical-scrollbar">
          <div className="min-w-[1140px] max-w-[1600px] mx-auto flex flex-col space-y-5 pb-8">
            {/* ================================================================= */}
            {/* BREADCRUMB ROW & DATA FRESHNESS METRICS                           */}
            {/* ================================================================= */}
            <div className="flex items-center justify-between font-body text-xs text-slate-500">
              <nav className="flex items-center gap-2 font-medium">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-1 hover:text-[#0B2545] transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dashboard</span>
                </button>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => triggerToast("Active incident register: 1 active investigation.")}
                  className="hover:text-[#0B2545] transition-colors cursor-pointer text-[#1E5FBF]"
                >
                  Incidents
                </button>
                <span className="text-slate-300">/</span>
                <span className="font-semibold text-[#0B2545] font-mono">{effectiveIncidentId}</span>
              </nav>

              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-sky-600" />
                  <span>Telemetry Feed:</span>
                  <span className="font-bold text-[#0B2545]">{isLiveTelemetry ? "FastAPI Core v2.4" : "Offline Sandbox"}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Updated: {lastUpdatedTime}</span>
                </span>
              </div>
            </div>

            {/* ================================================================= */}
            {/* TITLE ROW & ACTIONS + STATUS STEPPER                            */}
            {/* ================================================================= */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="heading-page text-[#0B2545]">
                    {incidentDetail?.title || `${effectiveIncidentId} — Mumbai High Offshore`}
                  </h1>
                  <span className="bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs font-body badge-text">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    <span className="uppercase">{incidentDetail?.status || "Live Investigation"}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-body flex items-center gap-2">
                  <span>{incidentDetail?.region_name || "Arabian Sea (Maharashtra EEZ)"}</span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {currentCoords[0].toFixed(4)}°N, {currentCoords[1].toFixed(4)}°E
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="font-mono text-slate-500">
                    Detected: {incidentDetail?.detected_at ? new Date(incidentDetail.detected_at).toUTCString() : "12 Sep 2026 17:00 UTC"}
                  </span>
                </p>
              </div>

              {/* Action Buttons & Stepper Container */}
              <div className="flex flex-col sm:flex-row xl:flex-col items-end gap-3 w-full xl:w-auto font-body">
                {/* Top Action Row */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-3 py-1.5 rounded-xl border border-[#E1EEF9] bg-white hover:bg-[#F8FBFE] text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(30,95,191,0.06)] transition-all cursor-pointer btn-text"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share Command</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        triggerToast("Compiling official Telemetry Intelligence Report (PDF)...");
                        await generateIncidentTelemetryPdf({
                          incidentCode: effectiveIncidentId,
                          incidentTitle: incidentDetail?.title || INCIDENT_DATA.name,
                          regionName: incidentDetail?.region_name || "Arabian Sea (Maharashtra EEZ)",
                          status: incidentDetail?.status || "Live Investigation",
                          severityScore: currentSeverityScore,
                          coordinates: currentCoords,
                          detectedAt: incidentDetail?.detected_at || "2026-09-12T17:00:00Z",
                          investigatingAgency: incidentDetail?.investigating_agency || "Indian Coast Guard",
                          detectionSource: incidentDetail?.detection_source || "Sentinel-1A SAR (C-band)",
                          spillAreaKm2: currentAreaKm2,
                          spillDNA: spillDNA || {
                            perimeter_km: 94.6,
                            length_major_km: 32.4,
                            width_minor_km: 11.2,
                            orientation_deg: 38.5,
                            shape_index: 1.62,
                            thickness_min_mm: 0.05,
                            thickness_max_mm: 1.85,
                            volume_min_m3: 18500,
                            volume_max_m3: 42600,
                          },
                          weather: {
                            windSpeed: simWindSpeed,
                            windDir: simWindDir,
                            currentSpeed: simCurrentSpeed,
                            waves: "1.0 m (Hs)",
                            sst: "28.3°C",
                          },
                          impact: {
                            coastlineDistanceKm: currentDistanceToCoast,
                            etaHours: currentEtaHours,
                            coastlineRegion: impactData?.coastline_region || "Alibaug & Raigad Coastal Belt, Maharashtra",
                            mpaOverlapPct: impactData?.mpa_overlap_pct || 12.3,
                            mpaOverlapKm2: impactData?.mpa_overlap_km2 || 25.8,
                            fishingZoneOverlapPct: impactData?.fishing_zone_overlap_pct || 8.7,
                            fishingZoneOverlapKm2: impactData?.fishing_zone_overlap_km2 || 18.1,
                            riskLevel: impactData?.risk_level || "HIGH RISK",
                          },
                          vessels: dynamicMapVessels.map(v => ({
                            rank: v.rank,
                            name: v.name,
                            score: v.score,
                            imo: v.imo || "9438200",
                            type: v.type || "Tanker",
                            flag: v.flag || "Liberia",
                            cpa: `${(v.score > 80 ? 1.2 : 8.4)} km`,
                            minSog: `${v.speed} kts`,
                            aisGap: `${(v.score > 80 ? 94 : 0)} min`,
                          })),
                        });
                        triggerToast(`Downloaded Sahayya ${effectiveIncidentId} Telemetry Report (PDF)`);
                      } catch (err) {
                        console.error("PDF generation error:", err);
                        triggerToast("Failed to compile PDF document.");
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-[#E1EEF9] bg-white hover:bg-[#F8FBFE] text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-[0_2px_8px_rgba(30,95,191,0.06)] transition-all cursor-pointer btn-text"
                    title="Download certified telemetry intelligence report in PDF format"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export Telemetry</span>
                  </button>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0B2545] hover:bg-[#123A66] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer btn-text"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Generate PDF Dossier</span>
                  </button>

                  {/* Overflow Menu */}
                  <div className="relative" ref={overflowMenuRef}>
                    <button
                      onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                      className="w-8 h-8 rounded-xl border border-[#E1EEF9] bg-white hover:bg-[#F8FBFE] flex items-center justify-center text-slate-600 shadow-[0_2px_8px_rgba(30,95,191,0.06)] cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {showOverflowMenu && (
                      <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E1EEF9] rounded-2xl shadow-[0_12px_36px_rgba(30,95,191,0.18)] p-1.5 z-50 text-xs animate-fadeIn font-body">
                        <button
                          onClick={() => {
                            setShowOverflowMenu(false);
                            fetchIncidentData();
                            triggerToast("Forced resynchronization with Copernicus SAR / AIS API.");
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F8FBFE] text-slate-700 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                          <span>Re-fetch Telemetry</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowOverflowMenu(false);
                            triggerToast("Cloned incident record into sandbox workspace.");
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F8FBFE] text-slate-700 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Duplicate Incident</span>
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={() => {
                            setShowOverflowMenu(false);
                            triggerToast("Operation restricted: Active Coast Guard investigation locked.");
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>Lock / Archive File</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Stepper Component */}
                <div className="w-full sm:w-[540px] md:w-[580px] xl:w-[600px]">
                  <StatusStepper
                    stages={INCIDENT_DATA.statusStages}
                    onAdvanceStage={async (stageId) => {
                      const statusMap: Record<string, string> = {
                        detection: "analysis",
                        dna: "attributed",
                        hindcast: "attributed",
                        attribution: "response",
                        forecast: "response",
                        response: "contained",
                        recovery: "resolved",
                      };
                      const next = statusMap[stageId] || "analysis";
                      try {
                        await sahayyaApi.incidents.updateStatus(effectiveIncidentId, next);
                        triggerToast(`Incident status updated to: ${next.toUpperCase()}`);
                        fetchIncidentData();
                      } catch {
                        triggerToast(`Status advanced to: ${next.toUpperCase()}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* ROW OF 4 CORE STAT CARDS (DYNAMIC)                                */}
            {/* ================================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-body">
              {/* Card 1: Spill Area */}
              <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-display">
                    Detected Spill Area
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-[#0B2545] mt-1 font-mono">
                    {currentAreaKm2.toFixed(2)} km²
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded badge-text font-mono">
                      {spillDNA?.perimeter_km ? `Perimeter: ${spillDNA.perimeter_km} km` : "↑ 12.4% vs Pass"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isLiveTelemetry ? "SAR ML U-Net" : "Sentinel-1A SAR"}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#1E5FBF] border border-sky-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Probable Origin */}
              <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-display">
                    Probable Origin Centroid
                  </div>
                  <div className="text-xl font-semibold text-[#0B2545] mt-1 font-mono data-mono">
                    {currentCoords[0].toFixed(2)}°N, {currentCoords[1].toFixed(2)}°E
                  </div>
                  <div className="text-[10px] text-amber-600 font-semibold mt-1 font-body flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {originZone?.confidence_pct ? `${originZone.confidence_pct}% Hindcast Confidence` : "T - 18h to T - 30h"}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <Target className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Distance to Coast */}
              <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-display">
                    Distance to Coast
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-[#0B2545] mt-1 font-mono">
                    {currentDistanceToCoast.toFixed(1)} km
                  </div>
                  <div className="text-[11px] text-[#0EA5B7] font-semibold mt-1 font-body flex items-center gap-1">
                    <span>ETA ~ {currentEtaHours.toFixed(1)} hours</span>
                    <span className="text-slate-400 font-normal">({impactData?.coastline_region?.split(",")[0] || "Alibaug"})</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0EA5B7] border border-teal-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <Compass className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: Severity Score Gauge */}
              <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-display">
                    Severity Risk Index
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold tracking-tight text-[#0B2545] font-mono">
                      {currentSeverityScore}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ 100</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border badge-text ${
                      currentSeverityScore >= 80
                        ? "bg-rose-100 text-rose-700 border-rose-200"
                        : currentSeverityScore >= 50
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-emerald-100 text-emerald-700 border-emerald-200"
                    }`}>
                      {currentSeverityScore >= 80 ? "Critical Tier" : currentSeverityScore >= 50 ? "Moderate" : "Low Risk"}
                    </span>
                  </div>
                  {/* Gauge Arc Indicator */}
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden mt-2 border border-slate-200/60">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(10, currentSeverityScore))}%` }}
                    />
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <Gauge className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* ENVIRONMENTAL CONDITIONS BAR                                     */}
            {/* ================================================================= */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 font-body">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-[#1E5FBF]" />
                <span className="heading-section text-xs uppercase tracking-wider text-[#0B2545]">
                  Hydro-Meteorological Telemetry (Now)
                </span>
                <span className="text-[10px] font-mono text-slate-400">INCOIS / ECMWF Marine Buoy</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full md:w-auto text-xs">
                <div className="flex items-center gap-2">
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-body">Surface Wind</span>
                    <span className="font-mono font-bold text-slate-700 data-mono">5.1 m/s (289° WNW)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Waves className="w-3.5 h-3.5 text-[#0EA5B7]" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-body">Significant Waves</span>
                    <span className="font-mono font-bold text-slate-700 data-mono">1.0 m (Hs)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-[#1E5FBF]" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-body">Ocean Current</span>
                    <span className="font-mono font-bold text-slate-700 data-mono">0.67 m/s (189° S)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-body">Sea Surface Temp</span>
                    <span className="font-mono font-bold text-slate-700 data-mono">28.3°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* INCIDENT WORKSPACE SUB-TABS (Tactical, Recovery, Digital Twin)   */}
            {/* ================================================================= */}
            <div className="flex items-center justify-between gap-4 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E1EEF9] shadow-sm font-body">
              <div className="flex items-center gap-2 overflow-x-auto">
                {[
                  { id: "tactical", label: "Tactical Intelligence Dossier", icon: Activity, badge: "Forensic Active" },
                  { id: "recovery", label: "Recovery Monitoring", icon: Sparkles, badge: "Stage 21" },
                  { id: "digitaltwin", label: "Marine Digital Twin Simulator", icon: Compass, badge: "Stage 20" },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSel = activeIncidentTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveIncidentTab(t.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap btn-text ${
                        isSel
                          ? "bg-[#0B2545] text-white shadow-sm"
                          : "text-slate-600 hover:text-[#0B2545] hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t.label}</span>
                      {t.badge && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md badge-text ${
                            isSel ? "bg-white/20 text-white" : "bg-sky-100 text-[#1E5FBF]"
                          }`}
                        >
                          {t.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="hidden sm:flex items-center gap-2 pr-3 text-xs font-mono text-slate-500 data-mono">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>EEZ Grid: {currentCoords[0].toFixed(2)}°N / {currentCoords[1].toFixed(2)}°E</span>
              </div>
            </div>

            {activeIncidentTab === "tactical" && (
              <>
                {/* ================================================================= */}
                {/* MAIN ROW: 3 PANELS (Overview, Carousel, Dynamic Mini-Map)         */}
                {/* ================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* PANEL A: Incident Overview (4 cols) */}
                  <div className="lg:col-span-4 p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex flex-col justify-between font-body">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#1E5FBF]" />
                          <h2 className="heading-section text-xs uppercase tracking-wider text-[#0B2545]">
                            Incident Dossier Overview
                          </h2>
                        </div>
                        <button
                          onClick={() => {
                            setTempDescription(overviewDescription);
                            setTempType(overviewType);
                            setTempAgency(overviewAgency);
                            setShowEditOverviewModal(true);
                          }}
                          className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#0B2545] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Edit incident details"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <p className="body-description text-sm text-slate-700 leading-relaxed mt-3 p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] font-body">
                        {overviewDescription}
                      </p>

                      {/* 2x2 Detail Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                            <AlertOctagon className="w-3 h-3 text-amber-500" />
                            <span>Incident Classification</span>
                          </div>
                          <div className="font-bold text-[#0B2545] mt-0.5 font-body text-xs">{overviewType}</div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                            <Satellite className="w-3 h-3 text-[#1E5FBF]" />
                            <span>Detection Sensor</span>
                          </div>
                          <div className="font-bold text-[#0B2545] mt-0.5 font-mono text-xs">
                            {incidentDetail?.detection_source || INCIDENT_DATA.overview.source}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Detected Timestamp</span>
                          </div>
                          <div className="font-bold text-[#0B2545] mt-0.5 font-mono text-xs truncate">
                            {incidentDetail?.detected_at ? new Date(incidentDetail.detected_at).toUTCString().slice(5, 22) : INCIDENT_DATA.overview.detected}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                            <Shield className="w-3 h-3 text-emerald-600" />
                            <span>Lead Agency</span>
                          </div>
                          <div className="font-bold text-[#0B2545] mt-0.5 truncate font-body text-xs">{overviewAgency}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#E1EEF9] flex items-center justify-between text-[10px] text-slate-500 font-body">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="font-bold text-emerald-700">Audit Status: Verified Evidence</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono">
                        <RotateCcw className="w-3 h-3 text-slate-400" />
                        <span>Sync: {lastUpdatedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* PANEL B: Hero Image Carousel (4 cols) */}
                  <div className="lg:col-span-4 p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-[#1E5FBF]" />
                          <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                            Tactical Imagery ({carouselIndex + 1}/{INCIDENT_DATA.carouselImages.length})
                          </h2>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">Click to enlarge</span>
                      </div>

                      {/* Hero Visual Container */}
                      <div
                        onClick={() => setLightboxImage(currentCarouselSlide.url)}
                        className="relative mt-3 h-52 rounded-2xl overflow-hidden group cursor-zoom-in bg-black shadow-inner"
                      >
                        <img
                          src={currentCarouselSlide.url}
                          alt={currentCarouselSlide.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Floating Callout Label */}
                        <div className="absolute top-2.5 left-2.5 bg-[#0B2545]/90 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[10px] font-bold border border-white/20 flex items-center gap-1.5 shadow-md font-mono">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          <span>{currentCarouselSlide.callout}</span>
                        </div>

                        {/* Compass Icon Top Right */}
                        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/20">
                          <Compass className="w-4 h-4" />
                        </div>

                        {/* Chevrons */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarouselIndex((prev) =>
                              prev === 0 ? INCIDENT_DATA.carouselImages.length - 1 : prev - 1
                            );
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors shadow-md"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarouselIndex((prev) => (prev + 1) % INCIDENT_DATA.carouselImages.length);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors shadow-md"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Bottom Caption Overlay */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2 text-white font-body">
                          <div className="text-[11px] font-bold truncate">{currentCarouselSlide.title}</div>
                          <div className="text-[9px] text-slate-300 truncate">{currentCarouselSlide.caption}</div>
                        </div>
                      </div>
                    </div>

                    {/* Dot Indicators */}
                    <div className="mt-3 pt-2.5 border-t border-[#E1EEF9] flex items-center justify-center gap-1.5">
                      {INCIDENT_DATA.carouselImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCarouselIndex(idx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            carouselIndex === idx ? "w-6 bg-[#1E5FBF]" : "w-1.5 bg-slate-300 hover:bg-slate-400"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* PANEL C: Incident Location & Investigation Map (4 cols) */}
                  <div className="lg:col-span-4 p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <MapIcon className="w-4 h-4 text-[#1E5FBF]" />
                          <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                            Tactical Multi-Layer Map
                          </h2>
                        </div>
                        <button
                          onClick={() => navigate("/dashboard")}
                          className="text-[11px] font-semibold text-[#1E5FBF] hover:underline flex items-center gap-1 cursor-pointer font-body"
                        >
                          <span>Expanded View</span>
                          <span>&rarr;</span>
                        </button>
                      </div>

                      <div className="mt-3">
                        <IncidentMiniMap
                          incidentCode={effectiveIncidentId}
                          center={currentCoords}
                          originCoord={currentCoords}
                          vessels={dynamicMapVessels}
                          cgAssets={dynamicMapAssets}
                          onNavigateToFullMap={() => navigate("/dashboard")}
                          isSimulated={!isLiveTelemetry}
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-500 flex justify-between font-mono">
                      <span>Projection: WGS84 Mercator</span>
                      <span className="text-emerald-700 font-semibold">Feed: AIS + SAR Layers</span>
                    </div>
                  </div>
                </div>

                {/* ================================================================= */}
                {/* SECOND ROW: 3 PANELS (Spill Characteristics, Evolution, Vessels) */}
                {/* ================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* PANEL D: Forensic Spill Characteristics */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex flex-col justify-between font-body">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-indigo-50 text-[#6366F1] border border-indigo-200/60 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                            Forensic Spill Morphology (DNA)
                          </h2>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {spillDNA?.shape_index ? `Index: ${spillDNA.shape_index}` : "SAR Analyzed"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        {/* Dynamic SVG Footprint Geometry Illustration */}
                        <div className="w-24 h-24 rounded-2xl bg-[#0B1D35] border border-[#1E5FBF]/40 flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden p-2">
                          <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">
                            {/* Outer Dispersion Sheen */}
                            <path
                              d="M20,50 Q25,25 55,20 Q85,25 80,55 Q85,85 50,82 Q15,85 20,50 Z"
                              fill="rgba(239, 68, 68, 0.25)"
                              stroke="#EF4444"
                              strokeWidth="1.5"
                              strokeDasharray="2,2"
                            />
                            {/* Inner Heavy Crude Core */}
                            <ellipse
                              cx="52"
                              cy="50"
                              rx={spillDNA?.length_major_km ? Math.min(30, spillDNA.length_major_km) : 22}
                              ry={spillDNA?.width_minor_km ? Math.min(18, spillDNA.width_minor_km * 1.5) : 11}
                              transform={`rotate(${spillDNA?.orientation_deg || 38.5} 52 50)`}
                              fill="url(#slickGradient)"
                            />
                            {/* Principal Axis Line */}
                            <line
                              x1="28"
                              y1="68"
                              x2="76"
                              y2="32"
                              stroke="#FBBF24"
                              strokeWidth="1.2"
                              strokeDasharray="3,2"
                            />
                            {/* Centroid Point */}
                            <circle cx="52" cy="50" r="3" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
                            <defs>
                              <linearGradient id="slickGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#DC2626" />
                                <stop offset="50%" stopColor="#EA580C" />
                                <stop offset="100%" stopColor="#B45309" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                        {/* 2x2 Metric Grid */}
                        <div className="grid grid-cols-2 gap-1.5 flex-1 text-[10px] font-mono">
                          <div className="p-1.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                            <span className="text-slate-400 block font-sans text-[9px]">Surface Area</span>
                            <span className="font-bold text-[#0B2545]">{currentAreaKm2.toFixed(2)} km²</span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                            <span className="text-slate-400 block font-sans text-[9px]">Perimeter</span>
                            <span className="font-bold text-[#0B2545]">
                              {spillDNA?.perimeter_km ? `${spillDNA.perimeter_km} km` : "312.5 km"}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                            <span className="text-slate-400 block font-sans text-[9px]">Major Axis</span>
                            <span className="font-bold text-[#0B2545]">
                              {spillDNA?.length_major_km ? `${spillDNA.length_major_km} km` : "31.2 km"}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                            <span className="text-slate-400 block font-sans text-[9px]">Minor Axis</span>
                            <span className="font-bold text-[#0B2545]">
                              {spillDNA?.width_minor_km ? `${spillDNA.width_minor_km} km` : "12.8 km"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Thickness & Volume secondary rows */}
                      <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] font-mono">
                        <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                          <span className="text-slate-400 block font-sans text-[9px]">Estimated Thickness</span>
                          <span className="font-bold text-amber-600">
                            {spillDNA?.thickness_min_mm ? `${spillDNA.thickness_min_mm} – ${spillDNA.thickness_max_mm} mm` : "0.05 – 1.85 mm"}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                          <span className="text-slate-400 block font-sans text-[9px]">Calculated Volume</span>
                          <span className="font-bold text-rose-600">
                            {spillDNA?.volume_min_m3 ? `${Math.round(spillDNA.volume_min_m3).toLocaleString()} – ${Math.round(spillDNA.volume_max_m3).toLocaleString()} m³` : "18,500 – 42,600 m³"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowDetailedAnalysisModal(true)}
                      className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] hover:from-[#174EA6] hover:to-[#2275C6] text-white text-xs font-bold transition-all cursor-pointer text-center shadow-sm"
                    >
                      View Forensic Spectrometry Analysis &rarr;
                    </button>
                  </div>

                  {/* PANEL E: Spill Evolution (Interactive Timeline) */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#1E5FBF]" />
                          <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                            Kinematic Spill Evolution
                          </h2>
                        </div>

                        {/* Observed vs Model Toggle */}
                        <div className="flex items-center p-0.5 rounded-xl bg-[#F0F7FD] border border-[#E1EEF9] text-[10px] font-bold">
                          <button
                            onClick={() => setEvolutionDataSource("Observed")}
                            className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                              evolutionDataSource === "Observed"
                                ? "bg-[#1E5FBF] text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Observed
                          </button>
                          <button
                            onClick={() => setEvolutionDataSource("Model")}
                            className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                              evolutionDataSource === "Model"
                                ? "bg-[#1E5FBF] text-white shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            Lagrangian
                          </button>
                        </div>
                      </div>

                      {/* 7 Timeline Snapshot Cards */}
                      <div className="grid grid-cols-7 gap-1 mt-3">
                        {timelinePoints.map((f, idx) => {
                          const isSelected = selectedTimelineIndex === idx;
                          return (
                            <button
                              key={f.offset}
                              onClick={() => setSelectedTimelineIndex(idx)}
                              className={`rounded-xl overflow-hidden border p-1 text-center transition-all cursor-pointer ${
                                isSelected
                                  ? "border-[#1E5FBF] bg-sky-50 shadow-xs ring-1 ring-[#1E5FBF]"
                                  : "border-[#E1EEF9] bg-[#F8FBFE] hover:border-sky-300"
                              }`}
                            >
                              <div className="w-full h-7 rounded-lg bg-[#0B1D35] overflow-hidden mb-1 flex items-center justify-center">
                                <div
                                  className={`rounded-full ${
                                    idx < 2
                                      ? "w-2.5 h-2.5 bg-amber-500"
                                      : idx === 2
                                      ? "w-3 h-3 bg-rose-500 animate-pulse ring-2 ring-rose-300"
                                      : "w-3.5 h-3.5 bg-rose-600 opacity-80"
                                  }`}
                                />
                              </div>
                              <div className="text-[9px] font-bold text-[#0B2545] truncate">
                                {f.offset}
                              </div>
                              <div className="text-[7.5px] text-slate-400 font-mono truncate">
                                {f.area} km²
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Interactive Scrubber Slider */}
                      <div className="mt-3 px-1">
                        <input
                          type="range"
                          min="0"
                          max="6"
                          value={selectedTimelineIndex}
                          onChange={(e) => setSelectedTimelineIndex(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E5FBF]"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                          <span>-24h Hindcast</span>
                          <span className="text-rose-600 font-bold">
                            {activeTimelineFrame.offset} ({activeTimelineFrame.area} km² · {activeTimelineFrame.dist} km to coast)
                          </span>
                          <span>+48h Forecast</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#E1EEF9] flex items-center justify-between font-body">
                      <button
                        onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                        className="px-3 py-1.5 rounded-xl bg-[#F0F7FD] hover:bg-[#E1EEF9] text-[#0B2545] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-[#E1EEF9]"
                      >
                        {isPlayingTimeline ? <Pause className="w-3.5 h-3.5 text-rose-600" /> : <Play className="w-3.5 h-3.5 text-[#1E5FBF]" />}
                        <span>{isPlayingTimeline ? "Pause Playback" : "Play Simulation"}</span>
                      </button>

                      <button
                        onClick={() => setShowCompareModelModal(true)}
                        className="text-xs font-bold text-[#1E5FBF] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Compare with Model</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>

                  {/* PANEL F: Vessel Candidates Attribution */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex flex-col justify-between font-body">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <Ship className="w-4 h-4 text-[#0B2545]" />
                          <h2 className="heading-section text-xs uppercase tracking-wider text-[#0B2545]">
                            Vessel Attribution Roster ({dynamicMapVessels.length})
                          </h2>
                        </div>
                        <button
                          onClick={() => setShowAllCandidatesModal(true)}
                          className="text-[11px] font-semibold text-[#1E5FBF] hover:underline cursor-pointer font-body"
                        >
                          View Full Roster &rarr;
                        </button>
                      </div>

                      {/* Candidate Vessel Rows */}
                      <div className="mt-2.5 space-y-2">
                        {dynamicMapVessels.slice(0, 3).map((c) => {
                          const isTop = c.rank === 1;
                          return (
                            <div
                              key={c.name + c.rank}
                              onClick={() => {
                                const matched = INCIDENT_DATA.vessels.find((v) => v.rank === c.rank) || INCIDENT_DATA.vessels[0];
                                setSelectedCandidate(matched);
                              }}
                              className="p-2.5 rounded-xl bg-[#F8FBFE] hover:bg-[#EFF6FD] border border-[#E1EEF9] transition-all cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0B2545] font-body">
                                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                                    isTop ? "bg-rose-600 text-white font-bold" : "bg-slate-200 text-slate-700"
                                  }`}>
                                    {c.rank}
                                  </span>
                                  <span>{c.name}</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border font-mono ${
                                  c.score > 80
                                    ? "text-rose-700 bg-rose-50 border-rose-200"
                                    : c.score > 40
                                    ? "text-amber-700 bg-amber-50 border-amber-200"
                                    : "text-slate-700 bg-slate-100 border-slate-200"
                                }`}>
                                  {c.score}% Match
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500 mt-1 font-body flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-slate-600">IMO {c.imo}</span>
                                <span className="text-slate-300">&bull;</span>
                                <span>{c.type}</span>
                                <span className="text-slate-300">&bull;</span>
                                <span>{c.flag}</span>
                              </div>

                              <div className="grid grid-cols-3 gap-1 mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-600 text-center font-body">
                                <div>CPA: <span className="font-mono font-medium text-slate-800">{isTop ? "1.2 km" : "8.4 km"}</span></div>
                                <div>Min SOG: <span className="font-mono font-medium text-amber-600">{c.speed} kts</span></div>
                                <div>AIS Gap: <span className="font-mono font-medium text-rose-600">{isTop ? "94 min" : "0 min"}</span></div>
                              </div>

                              <div className="mt-2 pt-1.5 flex items-center justify-between border-t border-slate-100 font-body">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const matched = INCIDENT_DATA.vessels.find((v) => v.rank === c.rank) || INCIDENT_DATA.vessels[0];
                                    setEvidenceModalCandidate(matched);
                                  }}
                                  className="text-[11px] font-semibold text-[#1E5FBF] hover:underline flex items-center gap-1 cursor-pointer btn-text"
                                >
                                  <span>Inspect 7D Evidence Radar</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                                <span className="text-[9px] text-slate-400 font-mono">Forensic Verified</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 text-center">
                      Click vessel card to inspect spatiotemporal AIS trajectory correlation
                    </div>
                  </div>
                </div>

                {/* ================================================================= */}
                {/* THIRD ROW: 4 PANELS (Origin, Impact, Activity, Response)         */}
                {/* ================================================================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* PANEL G: Probable Origin Analysis */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex flex-col justify-between font-body">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-amber-500" />
                          <h2 className="heading-section text-xs uppercase tracking-wider text-[#0B2545]">
                            Probable Origin Analysis
                          </h2>
                        </div>
                      </div>

                      {/* Concentric Heatmap visual */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-[#0B1D35] border border-amber-300/40 flex items-center justify-center relative overflow-hidden shrink-0 shadow-inner">
                          <div className="w-12 h-12 rounded-full border border-amber-500/50 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border border-rose-500/70 bg-rose-500/30 flex items-center justify-center animate-pulse">
                              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" />
                            </div>
                          </div>
                        </div>

                        <p className="body-description text-sm text-slate-700 leading-relaxed font-body">
                          Reverse Lagrangian particle dispersion modeling calculated with HYCOM ocean current vectors.
                        </p>
                      </div>

                      {/* 2x2 Stat Grid */}
                      <div className="grid grid-cols-2 gap-1.5 mt-3 text-[10px] font-mono">
                        <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                          <span className="text-slate-400 block font-body text-[10px]">Origin Centroid</span>
                          <span className="font-bold text-[#0B2545] font-mono text-xs">
                            {currentCoords[0].toFixed(2)}°N, {currentCoords[1].toFixed(2)}°E
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                          <span className="text-slate-400 block font-body text-[10px]">Release Window</span>
                          <span className="font-bold text-amber-600 font-mono text-xs">
                            {originZone?.release_window_start ? "T - 18h to T - 30h" : "T - 18h to T - 30h"}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] col-span-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-body text-[10px]">Hindcast Convergence</span>
                            <span className="font-bold text-emerald-700 font-mono text-xs">
                              {originZone?.confidence_pct || 92.4} %
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full"
                              style={{ width: `${originZone?.confidence_pct || 92.4}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowOriginModal(true)}
                      className="w-full mt-3 py-1.5 rounded-xl border border-[#E1EEF9] hover:bg-[#F8FBFE] text-slate-700 text-xs font-semibold font-body transition-all cursor-pointer text-center"
                    >
                      View Full Origin Hindcast &rarr;
                    </button>
                  </div>

                  {/* PANEL H: Potential Impact Assessment */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex flex-col justify-between font-body">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-rose-500" />
                          <h2 className="heading-section text-xs uppercase tracking-wider text-[#0B2545]">
                            Ecological &amp; Coastline Impact
                          </h2>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 font-mono">
                          {impactData?.risk_level || "HIGH RISK"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] flex items-center justify-between font-body">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-slate-600">Est. Landfall ETA</span>
                          </div>
                          <span className="font-bold font-mono text-amber-600">~ {currentEtaHours.toFixed(1)} hours</span>
                        </div>

                        <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-slate-600">Vulnerable Sector</span>
                          </div>
                          <span className="font-bold text-rose-600 truncate max-w-[150px]">
                            {impactData?.coastline_region?.split(",")[0] || "Alibaug & Raigad (38 km)"}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-[#0EA5B7]" />
                            <span className="text-slate-600">MPA Sanctuary Overlap</span>
                          </div>
                          <span className="font-bold font-mono text-[#0EA5B7]">
                            {impactData?.mpa_overlap_pct ? `${impactData.mpa_overlap_pct}% (${impactData.mpa_overlap_km2} km²)` : "12.3% (25.8 km²)"}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Fish className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-slate-600">Fishing Zones</span>
                          </div>
                          <span className="font-bold font-mono text-emerald-600">
                            {impactData?.fishing_zone_overlap_pct ? `${impactData.fishing_zone_overlap_pct}% (${impactData.fishing_zone_overlap_km2} km²)` : "8.7% (18.1 km²)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerToast("Coastline, MPA buffer and artisanal fishing corridors highlighted on tactical map.")}
                      className="w-full mt-3 py-1.5 rounded-xl border border-[#E1EEF9] hover:bg-[#F8FBFE] text-[#1E5FBF] text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Highlight Impact Zones on Map &rarr;
                    </button>
                  </div>

                  {/* PANEL I: Recent Activity Audit Log */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#1E5FBF]" />
                          <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                            Activity &amp; Evidence Audit
                          </h2>
                        </div>
                        <button
                          onClick={() => setShowAllActivityModal(true)}
                          className="text-[11px] font-semibold text-[#1E5FBF] hover:underline cursor-pointer"
                        >
                          View All
                        </button>
                      </div>

                      {/* Vertical Timeline */}
                      <div className="mt-3 space-y-2 text-xs font-body">
                        {incidentDetail?.activity_logs?.length ? (
                          incidentDetail.activity_logs.slice(0, 5).map((act: any) => (
                            <div key={act.id} className="flex items-start gap-2">
                              {act.status === "done" || act.status === "completed" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-slate-700 leading-tight truncate">
                                  {act.event_text}
                                </div>
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  {act.occurred_at ? new Date(act.occurred_at).toUTCString().slice(17, 22) + " UTC" : "17:05 UTC"}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          INCIDENT_DATA.activityLog.slice(0, 5).map((act) => (
                            <div key={act.id} className="flex items-start gap-2">
                              {act.status === "completed" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-slate-700 leading-tight truncate">
                                  {act.text}
                                </div>
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">{act.time}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 text-[10px] text-slate-400 font-mono text-center border-t border-[#E1EEF9]">
                      Telemetry Node: INCOIS / CG West MRCC
                    </div>
                  </div>

                  {/* PANEL J: Operational Response Optimizer */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] hover:shadow-[0_6px_24px_rgba(30,95,191,0.12)] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9] relative">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-[#0B2545]" />
                          <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                            Response Optimizer
                          </h2>
                        </div>

                        {/* Status Dropdown */}
                        <button
                          onClick={() => setShowResponseStatusDropdown(!showResponseStatusDropdown)}
                          className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>{responseStatus}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {showResponseStatusDropdown && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-[#E1EEF9] rounded-xl shadow-xl p-1 z-30 text-xs">
                            {(["Planning", "Active", "Completed"] as const).map((st) => (
                              <button
                                key={st}
                                onClick={() => {
                                  setResponseStatus(st);
                                  setShowResponseStatusDropdown(false);
                                  triggerToast(`Response status updated to: ${st}`);
                                }}
                                className={`w-full text-left px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                  responseStatus === st ? "bg-[#1E5FBF] text-white" : "hover:bg-slate-100 text-slate-700"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Priority Zone Selector */}
                      <div className="mt-2.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-body">
                          Target Priority Zone
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {RESPONSE_PRIORITY_ZONES.map((z) => {
                            const isSel = selectedPriorityZone.id === z.id;
                            return (
                              <button
                                key={z.id}
                                onClick={() => setSelectedPriorityZone(z)}
                                className={`p-1.5 rounded-lg border text-left transition-all text-[10px] font-semibold flex items-center gap-1.5 ${
                                  isSel
                                    ? "bg-sky-50 border-[#1E5FBF] text-[#0B2545] shadow-2xs"
                                    : "bg-[#F8FBFE] border-[#E1EEF9] text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: z.color }}></span>
                                <span className="truncate font-body">Zone {z.priority}: {z.name.split(":")[1]?.trim() || z.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Real Coast Guard Assets Table */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 font-body">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          <span>Nearby Coast Guard Assets</span>
                          <span className="text-emerald-600 font-mono">{dynamicMapAssets.length} Operational</span>
                        </div>

                        <div className="space-y-1 text-xs">
                          {dynamicMapAssets.slice(0, 4).map((asset) => {
                            const isDeployed = deployedAssets[String(asset.id)];
                            return (
                              <div
                                key={asset.id}
                                className="p-1.5 rounded-lg bg-[#F8FBFE] border border-[#E1EEF9] flex items-center justify-between text-[10px]"
                              >
                                <div>
                                  <span className="font-bold text-[#0B2545]">{asset.name}</span>
                                  <span className="text-slate-400 ml-1 font-mono">
                                    ({asset.distance_km ? `${asset.distance_km.toFixed(1)} km` : "On Station"})
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    const next = !isDeployed;
                                    setDeployedAssets({ ...deployedAssets, [String(asset.id)]: next });
                                    triggerToast(`${asset.name}: ${next ? "Dispatch Orders Transmitted" : "Recalled"}`);
                                  }}
                                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                    isDeployed
                                      ? "bg-emerald-600 text-white"
                                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  {isDeployed ? "Deployed" : "Deploy"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recommendation Summary */}
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed font-body">
                        <span className="font-bold">Model Directive: </span>
                        Deploy 800m shoreline containment boom to {selectedPriorityZone.name.split(":")[0]} within 2h to prevent mangrove fouling.
                      </div>
                    </div>

                    <button
                      onClick={() => setShowResponsePlanModal(true)}
                      className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2545] to-[#1E5FBF] hover:from-[#123A66] hover:to-[#174EA6] text-white text-xs font-semibold font-body transition-all cursor-pointer text-center shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Execute Tactical Response Plan</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* =================================================================== */}
            {/* WORKSPACE TAB: RECOVERY MONITORING (Stage 21)                       */}
            {/* =================================================================== */}
            {activeIncidentTab === "recovery" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-6 p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] flex flex-col justify-between font-body">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                            Remediation &amp; Containment Progress
                          </h2>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-600">
                          {RECOVERY_MONITORING_DATA.overallRemediationPct}% Remediated
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Surface Hydrocarbon Recovery</span>
                          <span className="font-mono font-bold">{RECOVERY_MONITORING_DATA.containmentEfficiency}% Efficiency</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full"
                            style={{ width: `${RECOVERY_MONITORING_DATA.overallRemediationPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-5 space-y-2.5 text-xs">
                        {RECOVERY_MONITORING_DATA.milestones.map((m) => (
                          <div key={m.id} className="p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {m.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <span className={m.completed ? "font-semibold text-slate-800" : "text-slate-500"}>
                                {m.label}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400">{m.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6 p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] flex flex-col justify-between font-body">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#1E5FBF]" />
                          <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                            Water Quality &amp; Hydrocarbon Concentration Trend
                          </h2>
                        </div>
                        <span className="text-xs font-mono text-slate-500">4 Coastal Buoy Stations</span>
                      </div>

                      <div className="h-64 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={RECOVERY_MONITORING_DATA.waterQualityHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748B" }} />
                            <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                            <RechartsTooltip />
                            <Line type="monotone" dataKey="hydrocarbonsPpm" name="Hydrocarbons (ppm)" stroke="#EF4444" strokeWidth={2.5} />
                            <Line type="monotone" dataKey="wqiScore" name="WQI Health Score" stroke="#10B981" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* WORKSPACE TAB: MARINE DIGITAL TWIN SIMULATOR (Stage 20)             */}
            {/* =================================================================== */}
            {activeIncidentTab === "digitaltwin" && (
              <div className="space-y-5 animate-fadeIn font-body">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Controls & Live Physics Engine */}
                  <div className="lg:col-span-4 p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-[#1E5FBF]" />
                        <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Physics &amp; Wind Drag Tuning
                        </h2>
                      </div>
                      <span className="text-[10px] font-mono bg-sky-100 text-[#1E5FBF] px-2 py-0.5 rounded-full font-bold">
                        OpenDrift v1.9
                      </span>
                    </div>

                    {/* Wind Velocity Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-[#1E5FBF]" />
                          <span>Wind Velocity</span>
                        </span>
                        <span className="font-mono font-bold text-[#1E5FBF]">{simWindSpeed} m/s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        step="0.5"
                        value={simWindSpeed}
                        onChange={(e) => setSimWindSpeed(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E5FBF]"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
                        <span>0 m/s (Calm)</span>
                        <span>12 m/s (Gale)</span>
                        <span>25 m/s (Storm)</span>
                      </div>
                    </div>

                    {/* Wind Direction Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-amber-500" />
                          <span>Wind Direction</span>
                        </span>
                        <span className="font-mono font-bold text-amber-600">{simWindDir}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="5"
                        value={simWindDir}
                        onChange={(e) => setSimWindDir(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
                        <span>0° (N)</span>
                        <span>90° (E)</span>
                        <span>180° (S)</span>
                        <span>270° (W)</span>
                        <span>360°</span>
                      </div>
                    </div>

                    {/* Current Speed Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Waves className="w-3.5 h-3.5 text-[#0EA5B7]" />
                          <span>Current Speed</span>
                        </span>
                        <span className="font-mono font-bold text-[#0EA5B7]">{simCurrentSpeed} m/s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.05"
                        value={simCurrentSpeed}
                        onChange={(e) => setSimCurrentSpeed(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0EA5B7]"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
                        <span>0 m/s (Slack)</span>
                        <span>1.5 m/s</span>
                        <span>3.0 m/s (Strong)</span>
                      </div>
                    </div>

                    {/* Real-time Dynamic Physics Telemetry Grid */}
                    <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2 text-xs">
                      <div className="font-bold text-[#0B2545] text-[11px] uppercase tracking-wider flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span>Real-Time Hydrodynamic Drift</span>
                        <span className="text-emerald-700 font-mono text-[10px] animate-pulse">● Active</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Net Drift Velocity</span>
                          <span className="font-mono font-bold text-[#0B2545]">
                            {digitalTwinSimulation.netSpeedKts.toFixed(1)} kts
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block">
                            ({(digitalTwinSimulation.netSpeedKts * 1.852).toFixed(1)} km/h)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Dispersion Heading</span>
                          <span className="font-mono font-bold text-amber-600">
                            {Math.round(digitalTwinSimulation.netHeadingDeg)}°
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">24h Projected Area</span>
                          <span className="font-mono font-bold text-rose-600">
                            {(digitalTwinSimulation.dynamicArea * 1.35).toFixed(1)} km²
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Projected Landfall</span>
                          <span className="font-mono font-bold text-[#1E5FBF]">
                            ~ {digitalTwinSimulation.landfallEtaHours.toFixed(1)} h
                          </span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate font-semibold">{digitalTwinSimulation.targetSector}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSimWindSpeed(5.1);
                          setSimWindDir(289);
                          setSimCurrentSpeed(0.67);
                          triggerToast("Reset parameters to ambient satellite/buoy telemetry.");
                        }}
                        className="flex-1 py-2 rounded-xl border border-[#E1EEF9] hover:bg-[#F8FBFE] text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Reset Defaults
                      </button>
                      <button
                        onClick={() => triggerToast(`Digital Twin: Dynamic hydrodynamic dispersion simulated for ${digitalTwinSimulation.targetSector}`)}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] hover:from-[#174EA6] hover:to-[#2275C6] text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
                      >
                        Run Digital Twin Prediction
                      </button>
                    </div>
                  </div>

                  {/* Right Dynamic Map Canvas */}
                  <div className="lg:col-span-8 p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-600" />
                          <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                            Interactive Hydrodynamic Dispersion Canvas (Live Simulation)
                          </h2>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                            Live Morphing Active
                          </span>
                        </div>
                      </div>

                      {/* Simulation Status Overlay Banner */}
                      <div className="mt-3 p-2.5 rounded-xl bg-[#F0F7FD] border border-[#DCEEFC] flex items-center justify-between text-xs font-mono text-[#0B2545]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                          <span>
                            Wind: <strong className="text-[#1E5FBF]">{simWindSpeed} m/s @ {simWindDir}°</strong> &bull; Current: <strong className="text-[#0EA5B7]">{simCurrentSpeed} m/s</strong>
                          </span>
                        </div>
                        <div className="text-slate-600">
                          Dispersal Vector: <strong className="text-amber-600">{Math.round(digitalTwinSimulation.netHeadingDeg)}°</strong> &bull; ETA: <strong className="text-rose-600">~ {digitalTwinSimulation.landfallEtaHours.toFixed(1)}h</strong>
                        </div>
                      </div>

                      {/* Map with dynamic polygon & forecast trajectory */}
                      <div className="mt-3">
                        <IncidentMiniMap
                          center={currentCoords}
                          originCoord={currentCoords}
                          spillPolygon={digitalTwinSimulation.slickVerts}
                          forecastTrack={digitalTwinSimulation.forecastPath}
                          vessels={dynamicMapVessels}
                          cgAssets={dynamicMapAssets}
                          isSimulated={true}
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 font-mono flex justify-between">
                      <span>Eulerian Hydrodynamic Grid (INCOIS Coupling)</span>
                      <span>Dispersion Model Version: OpenDrift Lagrangian v1.9</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ======================================================================= */}
      {/* MODALS & POPUPS                                                         */}
      {/* ======================================================================= */}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-2xl bg-[#0B2545] border border-[#1E5FBF]/30 text-white text-xs font-semibold shadow-[0_10px_30px_rgba(30,95,191,0.2)] z-50 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Edit Overview Modal */}
      {showEditOverviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-body">
          <div className="w-full max-w-lg bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl p-5 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9] mb-3">
              <div className="text-sm font-bold text-[#0B2545] flex items-center gap-2 font-display">
                <Edit3 className="w-4 h-4 text-[#1E5FBF]" />
                <span>Edit Incident Overview</span>
              </div>
              <button
                onClick={() => setShowEditOverviewModal(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-body">
              <div>
                <label className="font-semibold text-slate-700 block mb-1 text-xs uppercase tracking-wider">Operational Description</label>
                <textarea
                  rows={4}
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E1EEF9] bg-[#F8FBFE] text-slate-800 text-sm leading-relaxed font-body focus:outline-none focus:border-[#1E5FBF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Incident Type</label>
                  <input
                    type="text"
                    value={tempType}
                    onChange={(e) => setTempType(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#E1EEF9] bg-[#F8FBFE] text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Investigating Agency</label>
                  <input
                    type="text"
                    value={tempAgency}
                    onChange={(e) => setTempAgency(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#E1EEF9] bg-[#F8FBFE] text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E1EEF9] flex justify-end gap-2">
              <button
                onClick={() => setShowEditOverviewModal(false)}
                className="px-3 py-1.5 rounded-xl border border-[#E1EEF9] text-xs font-semibold text-slate-600 hover:bg-[#F8FBFE]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setOverviewDescription(tempDescription);
                  setOverviewType(tempType);
                  setOverviewAgency(tempAgency);
                  setShowEditOverviewModal(false);
                  triggerToast("Incident overview updated successfully.");
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-xs font-bold text-white shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Hero Carousel */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20">
            <img src={lightboxImage} alt="Tactical Imagery" className="w-full h-full object-contain" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-body">
          <div className="w-full max-w-md bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl p-5 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9] mb-3">
              <div className="text-sm font-bold text-[#0B2545] flex items-center gap-2 font-display">
                <Share2 className="w-4 h-4 text-[#1E5FBF]" />
                <span>Share Incident Record</span>
              </div>
              <button onClick={() => setShowShareModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Generate a secure command link for authorized maritime defense and port control agencies:
            </p>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] text-xs font-mono">
              <input
                readOnly
                value={`https://sahayya.gov.in/incidents/${effectiveIncidentId}`}
                className="w-full bg-transparent text-slate-700 outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`https://sahayya.gov.in/incidents/${effectiveIncidentId}`);
                  setShowShareModal(false);
                  triggerToast("Secure Incident URL copied to clipboard.");
                }}
                className="px-3 py-1 rounded-lg bg-[#1E5FBF] hover:bg-[#174EA6] text-white text-[10px] font-bold cursor-pointer shrink-0"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Stage-Specific Generate Report Modal */}
      <ReportGenerationModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        stage={
          activeIncidentTab === "recovery"
            ? "response"
            : activeIncidentTab === "digitaltwin"
            ? "digitaltwin"
            : "incident"
        }
        incidentIdOrCode={effectiveIncidentId}
        incidentTitle={incidentDetail?.title || INCIDENT_DATA.name}
        currentData={{
          incidentId: effectiveIncidentId,
          incidentTitle: incidentDetail?.title || INCIDENT_DATA.name,
          overview: {
            summary: overviewDescription,
            slickAreaKm2: incidentDetail?.spill_area_km2 || 14.2,
            estimatedVolumeM3: 48000,
            coordinates: incidentDetail?.latitude ? [incidentDetail.latitude, incidentDetail.longitude] : [18.69, 72.38],
            confidenceScore: 94.6,
          },
          environmental: {
            windSpeedMs: simWindSpeed,
            windDirectionDeg: simWindDir,
            currentSpeedMs: simCurrentSpeed,
          },
          simulation: {
            simWindSpeed,
            simWindDir,
            simCurrentSpeed,
            netDriftKts: digitalTwinSimulation.netSpeedKts,
            netHeadingDeg: digitalTwinSimulation.netHeadingDeg,
            projectedArea24h: digitalTwinSimulation.dynamicArea * 1.35,
            landfallEtaHours: digitalTwinSimulation.landfallEtaHours,
            targetSector: digitalTwinSimulation.targetSector,
          },
          vessels: INCIDENT_DATA.vessels.map((v: any, i: number) => ({
            rank: i + 1,
            name: v.name,
            mmsi: v.mmsi || "636019842",
            imo: v.imo || "9314567",
            flag: v.flag,
            type: v.type,
            cpaKm: v.cpa || (v.score > 80 ? 1.2 : 8.4),
            minSogKts: v.minSog || v.speed || "3.4 kts",
            darkGapMin: v.aisGap || (v.score > 80 ? 94 : 0),
            liabilityScore: v.score,
          })),
        }}
      />

      {/* Vessel Forensic Evidence Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-body">
          <div className="w-full max-w-xl bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl p-5 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9] mb-3">
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-bold text-[#0B2545] font-display">
                  Vessel Forensic File &mdash; {selectedCandidate.name} ({selectedCandidate.score}%)
                </span>
              </div>
              <button onClick={() => setSelectedCandidate(null)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                  <div className="text-slate-500 text-[10px] font-sans">Trajectory Match</div>
                  <div className="text-lg font-black text-emerald-600">
                    {selectedCandidate.evidence?.trajectoryMatch || 99.4}%
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                  <div className="text-slate-500 text-[10px] font-sans">AIS Transponder Gap</div>
                  <div className="text-lg font-black text-rose-600">
                    {selectedCandidate.evidence?.aisAnomalyScore || 97.2}%
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] text-sm text-slate-700 leading-relaxed font-body">
                <div className="font-bold text-[#0B2545] mb-1 text-xs uppercase tracking-wide">Intelligence Assessment:</div>
                <p className="body-description text-sm text-slate-700 leading-relaxed">
                  {selectedCandidate.evidence?.notes ||
                    "Kinematic analysis shows vessel speed anomaly within the probable discharge ellipse during darkness."}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E1EEF9] flex justify-end gap-2">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-3 py-1.5 rounded-xl border border-[#E1EEF9] text-xs font-semibold text-slate-600 hover:bg-[#F8FBFE]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedCandidate(null);
                  triggerToast(`Forensic evidence dossier saved for IMO ${selectedCandidate.imo}`);
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-xs font-bold text-white shadow-sm"
              >
                Export Forensic Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Candidates Modal */}
      {showAllCandidatesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-body">
          <div className="w-full max-w-2xl bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl p-5 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9] mb-3">
              <div className="text-sm font-bold text-[#0B2545] font-display">
                AIS Candidate Correlation Roster ({dynamicMapVessels.length} Vessels in Time Window)
              </div>
              <button onClick={() => setShowAllCandidatesModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {dynamicMapVessels.map((v) => (
                <div
                  key={v.name + v.rank}
                  onClick={() => {
                    const matched = INCIDENT_DATA.vessels.find((item) => item.rank === v.rank) || INCIDENT_DATA.vessels[0];
                    setSelectedCandidate(matched);
                    setShowAllCandidatesModal(false);
                  }}
                  className="p-3 rounded-xl bg-[#F8FBFE] hover:bg-[#EFF6FD] border border-[#E1EEF9] flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-[#0B2545] flex items-center gap-1.5">
                      <span>#{v.rank} {v.name}</span>
                      <span className="text-[10px] font-mono bg-[#E1EEF9] text-slate-700 px-1 py-0.2 rounded font-semibold">
                        {v.flag}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      IMO {v.imo} &middot; {v.type} &middot; SOG {v.speed} kts &middot; Heading {v.heading}°
                    </div>
                  </div>
                  <div className={`text-base font-black font-mono ${v.score > 80 ? "text-rose-600" : "text-slate-700"}`}>
                    {v.score}% Match
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E1EEF9] flex justify-end">
              <button
                onClick={() => setShowAllCandidatesModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#0B2545] hover:bg-[#123A66] text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Plan Builder Modal */}
      {showResponsePlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-body">
          <div className="w-full max-w-xl bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl p-5 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9] mb-3">
              <div className="text-sm font-bold text-[#0B2545] flex items-center gap-2 font-display">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Create Incident Response Plan &mdash; Tier Z-03</span>
              </div>
              <button onClick={() => setShowResponsePlanModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-3 font-body">
              <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <div className="font-bold text-[#0B2545] mb-1 text-xs uppercase tracking-wide">Recommended Mission Profile:</div>
                <p className="body-description text-sm sm:text-[14.5px] text-slate-700 leading-relaxed font-body">
                  {INCIDENT_DATA.responsePlan.recommendation}
                </p>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1 text-xs uppercase tracking-wider">Assigned Response Assets:</div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  {INCIDENT_DATA.responsePlan.alternateAssets.map((asset, i) => (
                    <div key={i} className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] text-center">
                      <div className="font-bold text-[#0B2545] text-xs font-body">{asset.name}</div>
                      <div className="text-[10px] text-slate-500 font-body">{asset.type}</div>
                      <div className="text-[11px] text-emerald-700 font-bold mt-1 font-mono">ETA: {asset.eta}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E1EEF9] flex justify-end gap-2 font-body">
              <button
                onClick={() => setShowResponsePlanModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[#E1EEF9] text-xs font-semibold text-slate-600 hover:bg-[#F8FBFE] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResponsePlanModal(false);
                  triggerToast("Response plan dispatched to ICGS Vikram Ops Room.");
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] hover:from-[#174EA6] hover:to-[#2275C6] text-xs font-semibold text-white shadow-sm cursor-pointer"
              >
                Dispatch Command Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Origin Analysis Modal */}
      {showOriginModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-body">
          <div className="w-full max-w-lg bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl p-5 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9] mb-3">
              <div className="text-sm font-bold text-[#0B2545] flex items-center gap-2 font-display">
                <Target className="w-4 h-4 text-amber-500" />
                <span>Full Probable Origin Analysis</span>
              </div>
              <button onClick={() => setShowOriginModal(false)} className="cursor-pointer">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-3 font-body">
              <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <div className="font-bold text-[#0B2545] mb-1 text-xs uppercase tracking-wide">Particle Tracking Methodology</div>
                <p className="body-description text-sm sm:text-[14.5px] text-slate-700 leading-relaxed font-body">
                  OpenDrift Lagrangian simulation incorporating HYCOM ocean current vectors and ECMWF 10m wind drag coefficients. Back-tracked 30 hours from detection time to locate initial slick discharge ellipse.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                  <span className="text-slate-400 block font-sans text-[10px]">Calculated Centroid</span>
                  <span className="font-bold text-[#0B2545]">
                    {currentCoords[0].toFixed(4)}°N, {currentCoords[1].toFixed(4)}°E
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                  <span className="text-slate-400 block font-sans text-[10px]">Kinematic Uncertainty</span>
                  <span className="font-bold text-emerald-700">&plusmn; 4.2 km Radius</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E1EEF9] flex justify-end">
              <button
                onClick={() => setShowOriginModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#0B2545] text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analysis Modal */}
      {showDetailedAnalysisModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-body">
          <div className="w-full max-w-lg bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl p-5 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9] mb-3">
              <div className="text-sm font-bold text-[#0B2545] flex items-center gap-2 font-display">
                <Sparkles className="w-4 h-4 text-[#6366F1]" />
                <span>Detailed Spill Hydrocarbon Characterization</span>
              </div>
              <button onClick={() => setShowDetailedAnalysisModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <div className="font-bold text-[#0B2545] mb-1 font-display">Spectral &amp; Radar Signature Profile</div>
                <p className="font-mono text-[11px] leading-relaxed text-slate-700">
                  {INCIDENT_DATA.spillDNA.spectralSignature}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                  <span className="text-slate-400 block font-sans text-[10px]">Shape Index</span>
                  <span className="font-bold text-[#0B2545]">{spillDNA?.shape_index || INCIDENT_DATA.spillDNA.shapeIndex}</span>
                </div>
                <div className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                  <span className="text-slate-400 block font-sans text-[10px]">Slick Orientation</span>
                  <span className="font-bold text-[#0B2545]">
                    {spillDNA?.orientation_deg ? `${spillDNA.orientation_deg}° (NE-SW)` : INCIDENT_DATA.spillDNA.orientation}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E1EEF9] flex justify-end">
              <button
                onClick={() => setShowDetailedAnalysisModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#0B2545] text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare with Model Modal */}
      {showCompareModelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-body">
          <div className="w-full max-w-2xl bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl p-5 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9] mb-3">
              <div className="text-sm font-bold text-[#0B2545] font-display">
                Side-by-Side Dispersion: Observed SAR vs OpenDrift Model
              </div>
              <button onClick={() => setShowCompareModelModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <div className="font-bold text-[#0B2545] mb-1 font-display">Copernicus SAR Observed</div>
                <div className="h-32 rounded-lg bg-black overflow-hidden relative flex items-center justify-center mb-2">
                  <img src="/sar-pass.jpg" alt="SAR" className="w-full h-full object-cover" />
                </div>
                <div className="font-mono text-[10px] text-slate-600">
                  Area: {currentAreaKm2.toFixed(2)} km² · Confidence: 92.4%
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <div className="font-bold text-[#0B2545] mb-1 font-display">OpenDrift Model Run</div>
                <div className="h-32 rounded-lg bg-[#0F2035] overflow-hidden relative flex items-center justify-center mb-2">
                  <div className="w-20 h-12 rounded-full bg-gradient-to-r from-red-600 to-amber-500 blur-[2px] opacity-80" />
                </div>
                <div className="font-mono text-[10px] text-slate-600">
                  Area: {(currentAreaKm2 * 0.97).toFixed(2)} km² · Correlation: 94.8%
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E1EEF9] flex justify-end">
              <button
                onClick={() => setShowCompareModelModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#0B2545] text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Activity Modal */}
      {showAllActivityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-body">
          <div className="w-full max-w-lg bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl p-5 text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9] mb-3">
              <div className="text-sm font-bold text-[#0B2545] font-display">
                Complete Incident Audit &amp; Activity Log
              </div>
              <button onClick={() => setShowAllActivityModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
              {(incidentDetail?.activity_logs || INCIDENT_DATA.activityLog).map((act: any) => (
                <div key={act.id} className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {act.status === "done" || act.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className="text-slate-700 font-medium">{act.event_text || act.text}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[10px]">
                    {act.occurred_at ? new Date(act.occurred_at).toUTCString().slice(17, 22) + " UTC" : act.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#E1EEF9] flex justify-end">
              <button
                onClick={() => setShowAllActivityModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#0B2545] text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared 7D Evidence Graph Modal */}
      {evidenceModalCandidate && (
        <EvidenceGraphModal
          vessel={evidenceModalCandidate}
          onClose={() => setEvidenceModalCandidate(null)}
          onExportEvidence={() =>
            triggerToast(`Forensic evidence dossier exported for ${evidenceModalCandidate.name}`)
          }
        />
      )}
    </div>
  );
};

export default IncidentDetailPage;
