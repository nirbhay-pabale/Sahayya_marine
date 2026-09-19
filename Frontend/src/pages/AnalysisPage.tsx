import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  BarChart3,
  GitCompare,
  Sliders,
  Brain,
  History,
  Ship,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Scale,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Home,
  Map as MapIcon,
  Activity,
  Settings,
  HelpCircle,
  Menu,
  Info,
  Check,
  Compass,
  FileText,
  Download,
  Eye,
  Layers,
  Maximize2,
  X,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Lock,
  Radio,
  Crosshair,
  Wind,
  Clock,
  Droplets,
  Anchor,
  RefreshCw,
  Award,
  Target,
  FileCheck,
  Cpu,
  Waves,
  ShieldAlert,
  Flame,
  CheckSquare,
  FileCode,
  Zap,
  ArrowRight,
  Filter,
  Layers2,
  Database,
  Wifi,
  Navigation,
  Globe,
  SlidersHorizontal,
  MapPin,
  Leaf,
  DollarSign,
  TrendingUp,
  Trees,
  Fish,
  IndianRupee,
  Landmark,
  Building2,
  PieChart,
  Send,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Cell,
} from "recharts";
import { INCIDENT_DATA, VesselCandidate } from "../data/incidentData";
import { HISTORICAL_INCIDENTS, HistoricalIncident } from "../data/historicalIncidents";
import { IncidentMiniMap, MapVesselCandidate, MapCoastGuardAsset } from "../components/IncidentMiniMap";
import { AdvancedSpillMap } from "../components/AdvancedSpillMap";
import { simulateOilSpillHydrodynamics, OriginProbabilityZone, OriginEvidenceItem } from "../utils/spillHydrodynamics";
import { ReportGenerationModal } from "../components/ReportGenerationModal";
import { StageReportType } from "../services/stageReportPdfGenerator";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import sahayyaApi from "../services/api";

// ----------------------------------------------------------------------------
// CONSTANTS & PALETTES
// ----------------------------------------------------------------------------
export const VESSEL_COLORS: Record<string, { primary: string; light: string; badge: string; border: string }> = {
  "vessel-1": { primary: "#E11D48", light: "#FFE4E6", badge: "bg-rose-100 text-rose-700 border-rose-200", border: "#E11D48" }, // MT Pacific Voyager
  "vessel-2": { primary: "#D97706", light: "#FEF3C7", badge: "bg-amber-100 text-amber-700 border-amber-200", border: "#D97706" }, // CMA CGM Antares
  "vessel-3": { primary: "#6366F1", light: "#EEF2FF", badge: "bg-indigo-100 text-indigo-700 border-indigo-200", border: "#6366F1" }, // MV Nordic Trader
  "vessel-4": { primary: "#059669", light: "#D1FAE5", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", border: "#059669" }, // Sagar Shakti
};

export interface SatellitePassRecord {
  pass: string;
  actual: number;
  benchmark: number;
  sensor: string;
  date: string;
  windSpeed: string;
  polarization: string;
  dampingDb: string;
  areaKm2: number;
  incidenceAngle: string;
  resolution: string;
  rejectionStatus: string;
  backscatterContrast: string;
}

export const SATELLITE_ACCURACY_TREND: SatellitePassRecord[] = [
  {
    pass: "P-14",
    actual: 91.2,
    benchmark: 97.4,
    sensor: "Sentinel-1A C-SAR (IW)",
    date: "04 Sep 2026, 06:12 UTC",
    windSpeed: "4.8 m/s",
    polarization: "VV + VH Dual-Pol",
    dampingDb: "-6.4 dB",
    areaKm2: 8.4,
    incidenceAngle: "32.1°",
    resolution: "10m High-Res",
    rejectionStatus: "Non-Hazard Filters Cleared",
    backscatterContrast: "High Contrast (Normalized σ⁰ = -24.2 dB)",
  },
  {
    pass: "P-15",
    actual: 92.8,
    benchmark: 98.1,
    sensor: "Sentinel-1B C-SAR (IW)",
    date: "06 Sep 2026, 18:40 UTC",
    windSpeed: "5.4 m/s",
    polarization: "VV + VH Dual-Pol",
    dampingDb: "-7.1 dB",
    areaKm2: 9.9,
    incidenceAngle: "36.4°",
    resolution: "10m High-Res",
    rejectionStatus: "Non-Hazard Filters Cleared",
    backscatterContrast: "High Contrast (Normalized σ⁰ = -25.8 dB)",
  },
  {
    pass: "P-16",
    actual: 90.5,
    benchmark: 96.8,
    sensor: "RADARSAT-2 ScanSAR",
    date: "08 Sep 2026, 02:15 UTC",
    windSpeed: "3.2 m/s",
    polarization: "HH + HV Quad-Pol",
    dampingDb: "-5.8 dB",
    areaKm2: 11.2,
    incidenceAngle: "28.7°",
    resolution: "25m Wide",
    rejectionStatus: "Low-Wind Guard Band Checked",
    backscatterContrast: "Moderate Contrast (Normalized σ⁰ = -22.1 dB)",
  },
  {
    pass: "P-17",
    actual: 94.2,
    benchmark: 98.4,
    sensor: "Sentinel-1A Stripmap",
    date: "10 Sep 2026, 05:58 UTC",
    windSpeed: "5.0 m/s",
    polarization: "VV + VH Dual-Pol",
    dampingDb: "-7.6 dB",
    areaKm2: 12.8,
    incidenceAngle: "34.5°",
    resolution: "5m Stripmap",
    rejectionStatus: "Non-Hazard Filters Cleared",
    backscatterContrast: "High Contrast (Normalized σ⁰ = -26.4 dB)",
  },
  {
    pass: "P-18",
    actual: 93.6,
    benchmark: 98.0,
    sensor: "RISAT-1A (EOS-04) FRS-1",
    date: "11 Sep 2026, 11:22 UTC",
    windSpeed: "4.6 m/s",
    polarization: "RH / RV Circular Hybrid",
    dampingDb: "-7.2 dB",
    areaKm2: 13.5,
    incidenceAngle: "33.2°",
    resolution: "3m High-Res",
    rejectionStatus: "Non-Hazard Filters Cleared",
    backscatterContrast: "High Contrast (Normalized σ⁰ = -25.2 dB)",
  },
  {
    pass: "P-19",
    actual: 95.4,
    benchmark: 99.1,
    sensor: "Sentinel-1A IW GRD",
    date: "12 Sep 2026, 06:05 UTC",
    windSpeed: "5.3 m/s",
    polarization: "VV + VH Dual-Pol",
    dampingDb: "-8.1 dB",
    areaKm2: 14.0,
    incidenceAngle: "35.8°",
    resolution: "10m High-Res",
    rejectionStatus: "Biogenic Slick Rejection Confirmed",
    backscatterContrast: "Very High Contrast (Normalized σ⁰ = -27.8 dB)",
  },
  {
    pass: "Current",
    actual: 94.6,
    benchmark: 98.6,
    sensor: "Sentinel-1A + ECMWF ERA5",
    date: "Live Capture (12 Sep, 18:24 UTC)",
    windSpeed: "5.1 m/s @ 289°",
    polarization: "VV + VH Complex Tensor",
    dampingDb: "-7.8 dB",
    areaKm2: 14.2,
    incidenceAngle: "34.8°",
    resolution: "10m Ground Resolution",
    rejectionStatus: "Full Look-Alike Filter Active",
    backscatterContrast: "Very High Contrast (Normalized σ⁰ = -27.1 dB)",
  },
];

export const MODEL_BACKBONE_PROFILES = {
  "Adaptive U-Net v2.1": {
    name: "Adaptive U-Net v2.1",
    confidence: 94.6,
    rejectionRate: 98.2,
    latency: "4.2 min",
    coverage: "1,420 km²",
    subModel: "Adaptive U-Net v2.1",
    rejectionSub: "Biogenic films & wind shadows",
    latencySub: "Cloud GPU TensorRT Pipeline",
    coverageSub: "West Coast Indian EEZ ground truth",
    backboneDesc: "ResNet-50 Feature Pyramid Network with Dual-Pol Complex Tensor Layers.",
    f1Score: "0.962",
    iouScore: "0.914",
  },
  "Swin-Transformer v2": {
    name: "Swin-Transformer v2",
    confidence: 96.1,
    rejectionRate: 98.9,
    latency: "6.8 min",
    coverage: "1,420 km²",
    subModel: "Swin-B/16 Multi-Scale",
    rejectionSub: "Biogenic films & internal waves",
    latencySub: "FlashAttention-2 Cloud Pipeline",
    coverageSub: "West Coast Indian EEZ ground truth",
    backboneDesc: "Hierarchical Vision Transformer Backbone with Shifted Windows & FlashAttention-2.",
    f1Score: "0.978",
    iouScore: "0.938",
  },
  "ResNet-50 FPN Dual-Pol": {
    name: "ResNet-50 FPN Dual-Pol",
    confidence: 92.4,
    rejectionRate: 96.5,
    latency: "2.8 min",
    coverage: "1,420 km²",
    subModel: "ResNet-50 FPN Light",
    rejectionSub: "Calm ocean specular reflections",
    latencySub: "TensorRT FP16 Edge Pipeline",
    coverageSub: "West Coast Indian EEZ ground truth",
    backboneDesc: "ResNet-50 Feature Pyramid Network with Dual-Pol Complex Tensor Layers.",
    f1Score: "0.941",
    iouScore: "0.887",
  },
};

export interface EvidenceRecord {
  id: string;
  sensor: string;
  sensorType: string;
  time: string;
  observation: string;
  processingModel: string;
  result: string;
  hash: string;
  fullHash: string;
  status: "VERIFIED" | "VALIDATED" | "INTEGRITY_CHECK_PASS";
  confidence: number;
  rawPayload: Record<string, any>;
}

export const EVIDENCE_CHAIN_RECORDS: EvidenceRecord[] = [
  {
    id: "EVID-SAR-001",
    sensor: "Sentinel-1A C-SAR (IW Mode)",
    sensorType: "Satellite Synthetic Aperture Radar",
    time: "2026-09-18 14:14:43 UTC",
    observation: "Backscatter Damping Δσ⁰ = -7.8 dB across 14.2 km² surface footprint",
    processingModel: "Adaptive U-Net v2.1 + Dual-Pol Complex Tensor",
    result: "Confirmed mineral hydrocarbon slick; biogenic look-alikes rejected (VV/VH cross-ratio = 0.12)",
    hash: "a3f89b2c...7d1e",
    fullHash: "a3f89b2c94e82017df83c9201948ba02384f981029348bca1209384fac917d1e",
    status: "VERIFIED",
    confidence: 98.6,
    rawPayload: {
      sensor_id: "S1A_IW_GRDH_1SDV",
      orbit_pass: 194,
      incidence_angle_deg: 34.8,
      sigma0_mean_db: -27.1,
      damping_contrast_db: -7.8,
      footprint_coords: [[18.69, 72.38], [18.75, 72.41], [18.64, 72.35]],
      area_km2: 14.2,
      calibration: "ESA Level-1 Radiometric Normalization",
    },
  },
  {
    id: "EVID-AIS-002",
    sensor: "DG Shipping Class-A AIS Receiver",
    sensorType: "Terrestrial & Satellite AIS Network",
    time: "2026-09-18 11:20:00 UTC",
    observation: "Drastic speed drop 13.8 -> 1.4 kts with 94 min transponder blackout",
    processingModel: "Spatiotemporal Kinematic Anomaly Detector v3.4",
    result: "Coincident trajectory intersection with calculated Lagrangian origin centroid (CPA = 0.6 km)",
    hash: "f7c18a99...4b22",
    fullHash: "f7c18a992837190bb4c8109238410948bca10293840192834bfa901294874b22",
    status: "VERIFIED",
    confidence: 99.4,
    rawPayload: {
      mmsi: 636019842,
      vessel_name: "MT PACIFIC VOYAGER",
      imo: "9438200",
      speed_before_kts: 13.8,
      speed_during_kts: 1.4,
      ais_blackout_min: 94,
      gap_start_utc: "2026-09-18T10:32:00Z",
      gap_end_utc: "2026-09-18T12:06:00Z",
      drift_heading_deg: 312,
      cpa_distance_km: 0.6,
    },
  },
  {
    id: "EVID-LAG-003",
    sensor: "OpenDrift Lagrangian Hydrodynamic Kernel v1.9",
    sensorType: "Oceanic Advection & Diffusion Physics Engine",
    time: "2026-09-18 17:00:00 UTC",
    observation: "5,000 particle reverse hindcast integration over 18h release window",
    processingModel: "Runge-Kutta 4th Order Particle Dispersion",
    result: "High-probability release ellipse centered at 18.6398°N, 72.0032°E (Zone Alpha, 97.7% confidence)",
    hash: "9e44d1bc...33aa",
    fullHash: "9e44d1bc489201938bfa019283401928301928301928301928340192834a33aa",
    status: "INTEGRITY_CHECK_PASS",
    confidence: 97.7,
    rawPayload: {
      kernel_version: "OpenDrift v1.9.2-c",
      particle_count: 5000,
      time_step_sec: 180,
      windage_factor: 0.035,
      diffusion_coeff_m2s: 10.0,
      calculated_origin: [18.6398, 72.0032],
      uncertainty_radius_km: 1.5,
      convergence_rate_pct: 99.4,
    },
  },
  {
    id: "EVID-HYD-004",
    sensor: "INCOIS Oceanic Buoy OB-04",
    sensorType: "Moored Oceanographic Telemetry Buoy",
    time: "2026-09-18 16:30:00 UTC",
    observation: "Current speed 0.82 kts @ 68° ENE, wave height Hs = 1.8m @ 6.4s",
    processingModel: "INCOIS Coastal Ocean State Forecasting System",
    result: "Oceanic surface drift vector validated against acoustic Doppler current profiler (ADCP)",
    hash: "2b881a70...cc91",
    fullHash: "2b881a709283401928340192834019283019283019283401928340192834cc91",
    status: "VERIFIED",
    confidence: 96.2,
    rawPayload: {
      buoy_id: "INCOIS_OB04_MH",
      location: [18.72, 72.44],
      current_speed_kts: 0.82,
      current_direction_deg: 68,
      sea_surface_temp_c: 28.4,
      salinity_psu: 35.6,
      wave_height_m: 1.8,
      wave_period_s: 6.4,
    },
  },
  {
    id: "EVID-MET-005",
    sensor: "ECMWF IFS High-Resolution Atmospheric Model",
    sensorType: "Global Numerical Weather Prediction",
    time: "2026-09-18 16:00:00 UTC",
    observation: "10m surface wind field 14.2 kts (7.3 m/s) @ 289° WSW",
    processingModel: "ECMWF ERA5 Atmospheric Boundary Layer Reanalysis",
    result: "Consistent with observed coastal anemometer telemetry at Mumbai High offshore platform",
    hash: "c4819d0e...11bb",
    fullHash: "c4819d0e819283401928340192834019283401928301928301928340192811bb",
    status: "VERIFIED",
    confidence: 98.1,
    rawPayload: {
      model_grid: "0.1_deg_lat_lon",
      wind_speed_kts: 14.2,
      wind_direction_deg: 289,
      gust_kts: 18.5,
      surface_pressure_hpa: 1011.4,
      air_temp_c: 29.1,
      relative_humidity_pct: 82,
    },
  },
  {
    id: "EVID-RAD-006",
    sensor: "Mumbai Coastal VTS Radar Network",
    sensorType: "X-band Vessel Traffic Shore Radar",
    time: "2026-09-18 12:15:00 UTC",
    observation: "Target track echo confirmed vessel lingering at origin waypoint 18.64°N, 72.01°E",
    processingModel: "Multi-Sensor Track Fusion Filter (MSTF)",
    result: "Corroborates AIS blackout window with continuous radar kinematic plot",
    hash: "5d92a10f...88cc",
    fullHash: "5d92a10f918230192834019283401928301928301928340192834019283488cc",
    status: "VERIFIED",
    confidence: 99.1,
    rawPayload: {
      station_id: "VTS_MUMBAI_PRATAPGAD",
      target_track_id: "RAD-TGT-9482",
      rcs_db: 42.1,
      track_duration_min: 140,
      closest_point_approach_km: 0.5,
      signature_match: "Capesize Crude Tanker Hull Profile",
    },
  },
];

const CustomTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SatellitePassRecord;
    return (
      <div className="bg-[#0B2545] text-white p-3 rounded-xl shadow-xl border border-sky-400/30 text-xs font-mono space-y-1 z-50">
        <div className="font-bold text-sky-300 font-display flex items-center justify-between gap-3">
          <span>Pass {label}</span>
          <span className="text-[10px] bg-sky-900/80 px-1.5 py-0.5 rounded text-sky-200">
            {data.sensor}
          </span>
        </div>
        <div className="text-[11px] text-slate-300">{data.date}</div>
        <div className="border-t border-white/10 pt-1.5 space-y-0.5 text-[11px]">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Detection Accuracy:</span>
            <strong className="text-emerald-400 font-bold">{data.actual}%</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Baseline Benchmark:</span>
            <span className="text-emerald-300">{data.benchmark}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Damping (Δσ⁰):</span>
            <span className="text-sky-300">{data.dampingDb}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Wind Condition:</span>
            <span className="text-slate-200">{data.windSpeed}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export type AnalysisTab =
  | "pipeline"
  | "whatif"
  | "environmental"
  | "economic"
  | "confidence"
  | "historical"
  | "traceability";

export const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();

  // Navigation / Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("Analysis");

  // Sub-Tab State
  const initialTab = (searchParams.get("tab") as AnalysisTab) || "pipeline";
  const initialVesselQuery = searchParams.get("vessel") || "";
  const [activeTab, setActiveTab] = useState<AnalysisTab>(initialTab);

  // Notifications / Modals
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStage, setReportStage] = useState<StageReportType>("analysis");
  const [isRecalculating, setIsRecalculating] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // --------------------------------------------------------------------------
  // CANDIDATE VESSEL SELECTION
  // --------------------------------------------------------------------------
  const candidates: VesselCandidate[] = INCIDENT_DATA.vessels;
  const [selectedCandidate, setSelectedCandidate] = useState<VesselCandidate>(() => {
    if (initialVesselQuery) {
      const match = candidates.find(
        (c) =>
          c.name.toLowerCase().includes(initialVesselQuery.toLowerCase()) ||
          c.imo.includes(initialVesselQuery)
      );
      if (match) return match;
    }
    return candidates[0];
  });

  // --------------------------------------------------------------------------
  // 1. PROBABLE OIL SPILL ORIGIN & REVERSE LAGRANGIAN TUNING STATE
  // --------------------------------------------------------------------------
  const [releaseTimeOffsetHours, setReleaseTimeOffsetHours] = useState<number>(-18.0); // -36h to -6h
  const [originWindSpeedKts, setOriginWindSpeedKts] = useState<number>(14.2); // kts (ECMWF)
  const [originWindDirDeg, setOriginWindDirDeg] = useState<number>(289); // deg (WSW)
  const [originCurrentSpeedKts, setOriginCurrentSpeedKts] = useState<number>(0.82); // kts (INCOIS)
  const [originCurrentDirDeg, setOriginCurrentDirDeg] = useState<number>(68); // deg (ENE)
  const [windageFactor, setWindageFactor] = useState<number>(0.035); // 0.015 to 0.055
  const [currentScalar, setCurrentScalar] = useState<number>(1.0); // 0.5x to 2.0x
  const [diffusionCoefficient, setDiffusionCoefficient] = useState<number>(10.0); // m²/s (2 to 25)
  const [particleCount, setParticleCount] = useState<number>(5000);
  const [selectedOriginZoneId, setSelectedOriginZoneId] = useState<string>("zone-alpha");
  const [originTimelineHour, setOriginTimelineHour] = useState<number>(-18); // -36h to 0h
  const [isPlayingOriginTimeline, setIsPlayingOriginTimeline] = useState<boolean>(false);
  const [showOriginDetailsModal, setShowOriginDetailsModal] = useState<boolean>(false);

  // Dynamic Probable Origin Hydrodynamic Simulation
  const activeOriginSimulation = useMemo(() => {
    return simulateOilSpillHydrodynamics({
      centroid: [18.69, 72.38],
      windSpeedKts: originWindSpeedKts,
      windDirDeg: originWindDirDeg,
      currentSpeedKts: originCurrentSpeedKts,
      currentDirDeg: originCurrentDirDeg,
      releaseOffsetHours: releaseTimeOffsetHours,
      releaseVolumeM3: 18000,
      containmentEffPct: 0,
      chemicalDispersant: false,
      responseDelayHours: 0,
      turbulentDiffusion: diffusionCoefficient,
    });
  }, [
    originWindSpeedKts,
    originWindDirDeg,
    originCurrentSpeedKts,
    originCurrentDirDeg,
    releaseTimeOffsetHours,
    diffusionCoefficient,
  ]);

  // Origin Timeline Playback Animation Loop
  useEffect(() => {
    let timer: any = null;
    if (isPlayingOriginTimeline) {
      timer = setInterval(() => {
        setOriginTimelineHour((cur) => {
          if (cur >= 0) return -36;
          return cur + 3;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlayingOriginTimeline]);

  // --------------------------------------------------------------------------
  // 2. WHAT-IF SCENARIO SIMULATOR STATE (Side-by-Side Reality vs Scenario)
  // --------------------------------------------------------------------------
  const [whatIfWindSpeed, setWhatIfWindSpeed] = useState<number>(8.5); // m/s
  const [whatIfWindDir, setWhatIfWindDir] = useState<number>(240); // deg
  const [whatIfCurrentSpeed, setWhatIfCurrentSpeed] = useState<number>(1.2); // m/s
  const [whatIfBoomLength, setWhatIfBoomLength] = useState<number>(2500); // meters
  const [whatIfDispatchDelayHours, setWhatIfDispatchDelayHours] = useState<number>(3.0); // hours
  const [whatIfChemicalDispersant, setWhatIfChemicalDispersant] = useState<boolean>(true);

  // --------------------------------------------------------------------------
  // 3. GIS MAP & TIMELINE SCRUBBER STATE
  // --------------------------------------------------------------------------
  const [timelineHour, setTimelineHour] = useState<number>(0); // -24h to +48h
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [mapLayerToggles, setMapLayerToggles] = useState({
    slickPolygon: true,
    originEllipse: true,
    vesselTracks: true,
    reverseParticles: true,
    forecastPath: true,
    weatherVectors: true,
  });

  // --------------------------------------------------------------------------
  // 4. MODEL CONFIDENCE & REJECTION DIAGNOSTIC INTERACTION STATE
  // --------------------------------------------------------------------------
  const [selectedSatellitePass, setSelectedSatellitePass] = useState<string>("Current");
  const [selectedModelArch, setSelectedModelArch] = useState<string>("Adaptive U-Net v2.1");
  const [showAttributionDeepDive, setShowAttributionDeepDive] = useState<boolean>(false);
  const [simulatedRejectionWind, setSimulatedRejectionWind] = useState<number>(5.1);
  const [simulatedCrossPolDb, setSimulatedCrossPolDb] = useState<number>(-7.8);
  const [showSandbox, setShowSandbox] = useState<boolean>(false);

  const activePassData = useMemo(() => {
    return (
      SATELLITE_ACCURACY_TREND.find((p) => p.pass === selectedSatellitePass) ||
      SATELLITE_ACCURACY_TREND[6]
    );
  }, [selectedSatellitePass]);

  const currentModelProfile = useMemo(() => {
    return (
      (MODEL_BACKBONE_PROFILES as any)[selectedModelArch] ||
      MODEL_BACKBONE_PROFILES["Adaptive U-Net v2.1"]
    );
  }, [selectedModelArch]);

  // --------------------------------------------------------------------------
  // 5. WORKBENCH & STRATEGY SIMULATION INTERFACE STATE
  // --------------------------------------------------------------------------
  const [hindcastViewMode, setHindcastViewMode] = useState<"Dual" | "Overlap">("Dual");
  const [selectedTacticalStrategy, setSelectedTacticalStrategy] = useState<"immediate" | "delayed" | "zoneA">("immediate");
  const [spillDNAModalOpen, setSpillDNAModalOpen] = useState<boolean>(false);
  const [spillDNAViewMode, setSpillDNAViewMode] = useState<"3D" | "Cross-section" | "Thickness" | "Spectral">("3D");

  // --------------------------------------------------------------------------
  // 6. HISTORICAL ANALOGUE BENCHMARKING STATE
  // --------------------------------------------------------------------------
  const [selectedHistoricalId, setSelectedHistoricalId] = useState<string>("HIST-2010-03");
  const [historicalFilter, setHistoricalFilter] = useState<string>("ALL");

  const selectedHistoricalIncident = useMemo(() => {
    return (
      HISTORICAL_INCIDENTS.find((h) => h.id === selectedHistoricalId) ||
      HISTORICAL_INCIDENTS[1]
    );
  }, [selectedHistoricalId]);

  const filteredHistoricalIncidents = useMemo(() => {
    if (historicalFilter === "ARABIAN") {
      return HISTORICAL_INCIDENTS.filter((h) =>
        h.region.toLowerCase().includes("arabian")
      );
    }
    if (historicalFilter === "BAY_OF_BENGAL") {
      return HISTORICAL_INCIDENTS.filter((h) =>
        h.region.toLowerCase().includes("bengal")
      );
    }
    if (historicalFilter === "INDIAN_OCEAN") {
      return HISTORICAL_INCIDENTS.filter((h) =>
        h.region.toLowerCase().includes("indian ocean")
      );
    }
    if (historicalFilter === "HIGH_SEVERITY") {
      return HISTORICAL_INCIDENTS.filter((h) => h.severityScore >= 80);
    }
    return HISTORICAL_INCIDENTS;
  }, [historicalFilter]);

  // --------------------------------------------------------------------------
  // 7. EVIDENCE TRACEABILITY & INSPECTION MODAL STATE
  // --------------------------------------------------------------------------
  const [inspectedEvidence, setInspectedEvidence] = useState<EvidenceRecord | null>(null);

  // --------------------------------------------------------------------------
  // 8. ENVIRONMENTAL IMPACT ANALYSIS STATE & DATA
  // --------------------------------------------------------------------------
  const [envTimelineStep, setEnvTimelineStep] = useState<"Current" | "+6h" | "+12h" | "+24h" | "+48h">("Current");
  const [selectedEnvZoneId, setSelectedEnvZoneId] = useState<string>("env-1");

  const envTimelineOffsetHours = useMemo(() => {
    switch (envTimelineStep) {
      case "Current": return 0;
      case "+6h": return 6;
      case "+12h": return 12;
      case "+24h": return 24;
      case "+48h": return 48;
      default: return 0;
    }
  }, [envTimelineStep]);

  // Sensitive Ecological Zones Dataset
  const SENSITIVE_ECOLOGICAL_ZONES = [
    {
      id: "env-1",
      name: "Alibaug Mangrove Sanctuary & Coastal Nursery",
      type: "Mangrove Biome & Fish Breeding Nursery",
      category: "Critical Marine Habitat",
      distanceKm: 38.2,
      baseRiskTier: "CRITICAL EXPOSURE",
      areaKm2: 42.5,
      keySpecies: "Avicennia marina, Mud crab, Mangrove pitta, Mudskippers",
      sensitivityIndex: 9.6,
      coordinates: [18.641, 72.871] as [number, number],
      shorelineType: "Dense Tidal Prop-Root Mangroves & Intertidal Mudflats",
      recoveryYears: "8 - 15 Years",
    },
    {
      id: "env-2",
      name: "Murud Olive Ridley Sea Turtle Nesting Beaches",
      type: "Vulnerable Marine Reptile Nesting Coast",
      category: "Endangered Fauna Sanctuary",
      distanceKm: 44.5,
      baseRiskTier: "HIGH THREAT",
      areaKm2: 28.0,
      keySpecies: "Lepidochelys olivacea (Olive Ridley), Ghost crabs, Shorebirds",
      sensitivityIndex: 9.2,
      coordinates: [18.328, 72.955] as [number, number],
      shorelineType: "Sandy High-Energy Beaches & Dune Vegetation",
      recoveryYears: "4 - 7 Years",
    },
    {
      id: "env-3",
      name: "Elephanta Island Coral Patches & Marine Sanctuary",
      type: "Sub-Tidal Coral Reef & Heritage Buffer",
      category: "Coral Ecosystem & Heritage Zone",
      distanceKm: 52.0,
      baseRiskTier: "MODERATE DRIFT RISK",
      areaKm2: 18.2,
      keySpecies: "Porites lutea (Hard coral), Favia corals, Reef teleosts",
      sensitivityIndex: 8.8,
      coordinates: [18.963, 72.932] as [number, number],
      shorelineType: "Rocky Intertidal Reef Platform & Sandy Shelves",
      recoveryYears: "10 - 20 Years",
    },
    {
      id: "env-4",
      name: "Sassoon Docks & Alibaug Coastal Fishery Corridor",
      type: "Active Artisanal & Commercial Trawling Zone",
      category: "Fisheries Resource Domain",
      distanceKm: 32.0,
      baseRiskTier: "IMMEDIATE CATCH CONTAMINATION",
      areaKm2: 110.0,
      keySpecies: "Bombay Duck (Harpadon nehereus), Pomfret, Tiger prawns",
      sensitivityIndex: 9.0,
      coordinates: [18.720, 72.650] as [number, number],
      shorelineType: "Nearshore Coastal Pelagic & Demersal Fishing Grounds",
      recoveryYears: "2 - 5 Years",
    },
    {
      id: "env-5",
      name: "Revdanda Estuarine Mudflats & Salt Marshes",
      type: "Wetlands / Ramsar Candidate Estuary",
      category: "Estuarine Wetland Ecosystem",
      distanceKm: 41.0,
      baseRiskTier: "HIGH SEDIMENTATION RISK",
      areaKm2: 35.4,
      keySpecies: "Lesser Flamingo, Asian Dowitcher, Polychaete worms",
      sensitivityIndex: 8.5,
      coordinates: [18.552, 72.930] as [number, number],
      shorelineType: "Estuarine Soft Sediment & Saltmarsh Halophytes",
      recoveryYears: "5 - 10 Years",
    },
  ];

  // --------------------------------------------------------------------------
  // 9. ECONOMIC & COST IMPACT ANALYSIS STATE & DATA
  // --------------------------------------------------------------------------
  const [selectedEconomicAssetId, setSelectedEconomicAssetId] = useState<string>("econ-1");

  // Economic Assets Dataset
  const ECONOMIC_COASTAL_ASSETS = [
    {
      id: "econ-1",
      name: "Jawaharlal Nehru Port Trust (JNPT)",
      type: "Major Container Port & Navigation Fairway",
      location: "Navi Mumbai / Elephanta Channel",
      distanceKm: 48.0,
      annualTrafficValCr: "₹4,20,000 Cr",
      riskLevel: "MODERATE FAIRWAY RISK",
      potentialLossCr: "₹18.5 Cr / day",
      assetValue: "India's largest premier container hub; ship movement delays incur heavy demurrage.",
      coordinates: [18.950, 72.950] as [number, number],
    },
    {
      id: "econ-2",
      name: "Sassoon Docks & Ferry Wharf Fishing Hub",
      type: "Commercial Fish Landing & Export Terminal",
      location: "South Mumbai / Colaba",
      distanceKm: 34.5,
      annualTrafficValCr: "₹3,800 Cr",
      riskLevel: "HIGH ECONOMIC LOSS",
      potentialLossCr: "₹4.2 Cr / day",
      assetValue: "Direct fish catch bans, trawler fuel waste, cold storage spoilage.",
      coordinates: [18.915, 72.825] as [number, number],
    },
    {
      id: "econ-3",
      name: "Mumbai High Offshore Oil Platform B",
      type: "Offshore Crude Extraction & Pipeline Manifold",
      location: "Mumbai High West Basin",
      distanceKm: 18.0,
      annualTrafficValCr: "₹28,000 Cr",
      riskLevel: "OPERATIONAL INTEGRITY MONITORED",
      potentialLossCr: "₹8.0 Cr / day",
      assetValue: "Subsea pipelines and wellhead platform safety exclusion zone.",
      coordinates: [18.820, 72.250] as [number, number],
    },
    {
      id: "econ-4",
      name: "Alibaug & Murud Coastal Tourism & Resorts",
      type: "Hospitality & Recreational Beach Economy",
      location: "Raigad Coastal Belt",
      distanceKm: 38.0,
      annualTrafficValCr: "₹1,400 Cr",
      riskLevel: "HIGH SHORELINE DAMAGE",
      potentialLossCr: "₹2.5 Cr / day",
      assetValue: "Hotel cancellations, recreational beach closure, water sports shutdown.",
      coordinates: [18.650, 72.880] as [number, number],
    },
    {
      id: "econ-5",
      name: "Dharamtar Port & Industrial Waterway",
      type: "Bulk Cargo & Industrial River Port",
      location: "Amba River Estuary",
      distanceKm: 45.0,
      annualTrafficValCr: "₹6,500 Cr",
      riskLevel: "MODERATE ESTUARINE THREAT",
      potentialLossCr: "₹3.0 Cr / day",
      assetValue: "Steel and chemical barge transport transit corridor.",
      coordinates: [18.700, 73.020] as [number, number],
    },
  ];

  const evidenceBarData = useMemo(() => {
    const isTop = selectedCandidate.rank === 1;
    return [
      { name: "Time Match", score: isTop ? 99.4 : 38.0, fill: "#2563EB" },
      { name: "Route Alignment", score: isTop ? 98.2 : 41.5, fill: "#0EA5E9" },
      { name: "Physics Match", score: isTop ? 97.2 : 35.0, fill: "#EF4444" },
    ];
  }, [selectedCandidate]);

  // --------------------------------------------------------------------------
  // DYNAMIC COMPUTATIONS: REVERSE LAGRANGIAN & CORRELATION ENGINE
  // --------------------------------------------------------------------------
  const lagrangianOutput = useMemo(() => {
    // Base incident centroid
    const baseCentroid: [number, number] = [18.69, 72.38];
    const absOffset = Math.abs(releaseTimeOffsetHours);

    // Compute origin centroid by back-integrating wind and current vectors
    // V_drift = (Current * scalar) + (Wind * windage)
    const currentLatShift = (0.67 * currentScalar * 3600 * absOffset) / 111000 * 0.4;
    const currentLonShift = (0.67 * currentScalar * 3600 * absOffset) / 111000 * 0.7;
    const windLatShift = (5.1 * windageFactor * 3600 * absOffset) / 111000 * 0.3;
    const windLonShift = (5.1 * windageFactor * 3600 * absOffset) / 111000 * 0.8;

    const originLat = baseCentroid[0] - (currentLatShift + windLatShift);
    const originLon = baseCentroid[1] - (currentLonShift + windLonShift);

    // Candidate-specific spatiotemporal overlap & attribution score
    const isTopCandidate = selectedCandidate.rank === 1;
    const isSecond = selectedCandidate.rank === 2;
    const isThird = selectedCandidate.rank === 3;

    // Sensitivity degradation
    const timeMatchPenalty = Math.abs(absOffset - 18.0) * 1.8;
    const windagePenalty = Math.abs(windageFactor - 0.035) * 400;
    const currentPenalty = Math.abs(currentScalar - 1.0) * 12;

    let baseScore = isTopCandidate ? 98.8 : isSecond ? 43.5 : isThird ? 43.5 : 13.9;
    let computedAttribution = Math.max(
      5.0,
      Math.min(99.9, baseScore - timeMatchPenalty - windagePenalty - currentPenalty)
    );

    // Distance to calculated origin
    let calculatedCpaKm = isTopCandidate
      ? Math.max(0.4, 1.2 + Math.abs(absOffset - 18.0) * 0.3)
      : isSecond
      ? Math.max(25.0, 41.2 + absOffset * 0.2)
      : isThird
      ? Math.max(20.0, 39.8 + absOffset * 0.3)
      : 54.1;

    // Spatial overlap IoU
    let spatialIoU = isTopCandidate
      ? Math.max(60.0, 99.4 - (timeMatchPenalty + windagePenalty) * 0.8)
      : isSecond
      ? Math.max(10.0, 41.5 - timeMatchPenalty * 0.5)
      : isThird
      ? Math.max(12.0, 46.2 - timeMatchPenalty * 0.5)
      : 12.0;

    // Origin Bounding Box
    const originBbox = [
      (originLat - 0.04).toFixed(4),
      (originLon - 0.05).toFixed(4),
      (originLat + 0.04).toFixed(4),
      (originLon + 0.05).toFixed(4),
    ];

    // Morphing slick vertices based on release tuning
    const slickVertices: [number, number][] = [
      [baseCentroid[0] + 0.035, baseCentroid[1] - 0.045],
      [baseCentroid[0] + 0.055, baseCentroid[1] - 0.015],
      [baseCentroid[0] + 0.045, baseCentroid[1] + 0.035],
      [baseCentroid[0] + 0.015, baseCentroid[1] + 0.065],
      [baseCentroid[0] - 0.025, baseCentroid[1] + 0.055],
      [baseCentroid[0] - 0.045, baseCentroid[1] + 0.020],
      [baseCentroid[0] - 0.050, baseCentroid[1] - 0.025],
      [baseCentroid[0] - 0.020, baseCentroid[1] - 0.055],
    ];

    // Forecast trajectory based on windage and currents
    const forecastPath: [number, number][] = [
      baseCentroid,
      [baseCentroid[0] - 0.03, baseCentroid[1] + 0.05],
      [baseCentroid[0] - 0.07, baseCentroid[1] + 0.11],
      [baseCentroid[0] - 0.12, baseCentroid[1] + 0.18],
      [baseCentroid[0] - 0.18, baseCentroid[1] + 0.26],
    ];

    return {
      originCentroid: [originLat, originLon] as [number, number],
      originBbox,
      computedAttribution,
      calculatedCpaKm,
      spatialIoU,
      slickVertices,
      forecastPath,
      releaseWindowStr: `${Math.round(absOffset)} hours prior to acquisition (${(absOffset - 6).toFixed(0)}h – ${(absOffset + 6).toFixed(0)}h window)`,
      convergenceRating: computedAttribution > 80 ? "Optimal Convergence" : computedAttribution > 40 ? "Moderate Alignment" : "Divergent Vector",
    };
  }, [
    releaseTimeOffsetHours,
    windageFactor,
    currentScalar,
    selectedCandidate,
  ]);

  // --------------------------------------------------------------------------
  // DYNAMIC COMPUTATIONS: WHAT-IF SCENARIO SIMULATOR
  // --------------------------------------------------------------------------
  const whatIfScenarioOutput = useMemo(() => {
    // Net drift vector calculation: V_drift = V_current + 0.035 * V_wind
    const windRad = (whatIfWindDir * Math.PI) / 180;
    const currentRad = (142 * Math.PI) / 180; // Baseline current 142°

    const u_drift = whatIfCurrentSpeed * Math.sin(currentRad) + 0.035 * whatIfWindSpeed * Math.sin(windRad);
    const v_drift = whatIfCurrentSpeed * Math.cos(currentRad) + 0.035 * whatIfWindSpeed * Math.cos(windRad);

    const netSpeedMs = Math.sqrt(u_drift * u_drift + v_drift * v_drift);
    const netSpeedKts = netSpeedMs * 1.94384;
    let netHeadingDeg = (Math.atan2(u_drift, v_drift) * 180) / Math.PI;
    if (netHeadingDeg < 0) netHeadingDeg += 360;

    // 24-hour Projected Area (km²)
    const baselineArea = 14.2;
    const windSpreadMultiplier = 1 + (whatIfWindSpeed - 5.1) * 0.06;
    const boomContainmentReduction = (whatIfBoomLength / 5000) * 0.35;
    const dispersantReduction = whatIfChemicalDispersant ? 0.22 : 0.0;
    const delayExpansion = (whatIfDispatchDelayHours / 12) * 0.4;

    const netAreaMultiplier = Math.max(0.4, windSpreadMultiplier + delayExpansion - boomContainmentReduction - dispersantReduction);
    const projectedArea24h = baselineArea * 1.35 * netAreaMultiplier;

    // Landfall ETA (Hours to 38km shoreline)
    const distanceToCoastKm = 38.0;
    const netSpeedKmh = netSpeedKts * 1.852;
    const landfallEtaHours = Math.max(4.0, distanceToCoastKm / Math.max(0.5, netSpeedKmh));

    // Estimated Clean-Up Cost (Crores INR)
    const costPerKm2 = 2.4; // Crores INR per km²
    const estimatedCostCr = (projectedArea24h * costPerKm2).toFixed(1);

    // Baseline stats for direct side-by-side comparison
    const baselineSpeedKts = 1.4;
    const baselineHeadingDeg = 128;
    const baselineProjectedArea24h = 19.8;
    const baselineLandfallEta = 26.5;
    const baselineCostCr = "47.5";

    return {
      netSpeedKts,
      netHeadingDeg,
      projectedArea24h,
      landfallEtaHours,
      estimatedCostCr,
      baselineSpeedKts,
      baselineHeadingDeg,
      baselineProjectedArea24h,
      baselineLandfallEta,
      baselineCostCr,
      targetSector: netHeadingDeg > 100 && netHeadingDeg < 170 ? "Alibaug & Murud Coastline" : "Mumbai Harbor & Elephanta Gateway",
      riskLevel: landfallEtaHours < 16 ? "CRITICAL ESCALATION" : landfallEtaHours < 24 ? "HIGH PRIORITY" : "MODERATE ADVECTION",
    };
  }, [
    whatIfWindSpeed,
    whatIfWindDir,
    whatIfCurrentSpeed,
    whatIfBoomLength,
    whatIfDispatchDelayHours,
    whatIfChemicalDispersant,
  ]);

  // --------------------------------------------------------------------------
  // DYNAMIC COMPUTATIONS: ENVIRONMENTAL IMPACT ANALYSIS
  // --------------------------------------------------------------------------
  const environmentalImpactOutput = useMemo(() => {
    const hours = envTimelineOffsetHours;
    const areaScale = whatIfScenarioOutput.projectedArea24h / 19.8;
    const speedKmh = whatIfScenarioOutput.netSpeedKts * 1.852;

    // Dynamic slick area and affected exposure footprint
    const coreSlickAreaKm2 = Number((14.2 + hours * 0.42 * areaScale).toFixed(1));
    const totalExposureAreaKm2 = Number((276.0 + hours * 5.1 * areaScale).toFixed(1));

    // Proximity to closest shoreline
    const distToCoastKm = Math.max(0, Number((38.0 - hours * speedKmh * 0.85).toFixed(1)));
    const shorelineExposureKm = Number((18.5 + (hours / 48) * 24.2 * areaScale).toFixed(1));

    // Number of affected MPAs / protected zones at this timestep
    const affectedZonesCount = hours >= 24 ? 5 : hours >= 12 ? 4 : hours >= 6 ? 3 : 2;

    // Component Scores for Environmental Impact Formula
    const marineExposureScore = Math.min(100, (totalExposureAreaKm2 / 450) * 100);
    const coastalProximityScore = Math.max(20, Math.min(100, 100 - (distToCoastKm / 38.0) * 80));
    const mpaVulnerabilityScore = Math.min(100, affectedZonesCount * 19.5);
    const fisheriesImpactScore = Math.min(100, 68 + hours * 0.6 * areaScale);
    const waterQualityPahScore = Math.max(40, Math.min(100, 92 - hours * 0.4));

    // Overall Environmental Impact Score (0-100)
    const overallEnvScore = Number(
      (
        marineExposureScore * 0.2 +
        coastalProximityScore * 0.25 +
        mpaVulnerabilityScore * 0.25 +
        fisheriesImpactScore * 0.15 +
        waterQualityPahScore * 0.15
      ).toFixed(1)
    );

    const riskTier =
      overallEnvScore >= 80
        ? "CRITICAL ECOLOGICAL THREAT"
        : overallEnvScore >= 60
        ? "HIGH VULNERABILITY"
        : "MODERATE CONTAMINATION";

    // Dynamic environmental explanation points
    const envExplanationPoints = [
      {
        title: "Mangrove Prop-Root Asphyxiation Hazard",
        status: distToCoastKm < 15 ? "CRITICAL (LANDFALL IMMINENT)" : "HIGH (ADVECTING EASTWARD)",
        score: Math.round(coastalProximityScore),
        detail: `Slick centroid is ${distToCoastKm} km from Alibaug mangrove nurseries. Emulsified heavy hydrocarbon can coat pneumatophores causing respiratory failure.`,
      },
      {
        title: "Sea Turtle Nesting Shoreline Exposure",
        status: "ELEVATED RISK",
        score: Math.round(mpaVulnerabilityScore),
        detail: `Murud & Kashid beach sands lie in the direct ${Math.round(whatIfScenarioOutput.netHeadingDeg)}° forecast corridor, threatening hatching cycles and intertidal nesting zones.`,
      },
      {
        title: "Commercial Fisheries Catch Contamination",
        status: "ACTIVE BAN RECOMMENDED",
        score: Math.round(fisheriesImpactScore),
        detail: `420 artisanal trawlers in Sassoon Docks / Alibaug corridor face immediate catch bans due to dissolved aromatic hydrocarbon taint.`,
      },
      {
        title: "Water Column PAH Toxicity & Damping",
        status: "CONFIRMED (Δσ⁰ = -7.8 dB)",
        score: Math.round(waterQualityPahScore),
        detail: `Dissolved Polycyclic Aromatic Hydrocarbons exceed CPCB marine water quality thresholds (EPA Tier-1 exceeded).`,
      },
    ];

    return {
      coreSlickAreaKm2,
      totalExposureAreaKm2,
      distToCoastKm,
      shorelineExposureKm,
      affectedZonesCount,
      marineExposureScore,
      coastalProximityScore,
      mpaVulnerabilityScore,
      fisheriesImpactScore,
      waterQualityPahScore,
      overallEnvScore,
      riskTier,
      envExplanationPoints,
    };
  }, [envTimelineOffsetHours, whatIfScenarioOutput]);

  // --------------------------------------------------------------------------
  // DYNAMIC COMPUTATIONS: ECONOMIC & COST IMPACT ANALYSIS
  // --------------------------------------------------------------------------
  const economicImpactOutput = useMemo(() => {
    const areaScale = whatIfScenarioOutput.projectedArea24h / 19.8;
    const delayHours = whatIfDispatchDelayHours;
    const boomMeters = whatIfBoomLength;
    const dispersant = whatIfChemicalDispersant;

    // 1. Direct Response Expenditures (Crores INR)
    const vesselDeploymentCostCr = Number((8.5 + delayHours * 0.8).toFixed(2));
    const boomDeploymentCostCr = Number(((boomMeters / 1000) * 1.6).toFixed(2));
    const dispersantCostCr = dispersant ? 4.2 : 0.0;
    const wasteSludgeDisposalCostCr = Number((6.8 * areaScale).toFixed(2));
    const totalDirectResponseCostCr = Number(
      (
        vesselDeploymentCostCr +
        boomDeploymentCostCr +
        dispersantCostCr +
        wasteSludgeDisposalCostCr
      ).toFixed(2)
    );

    // 2. Environmental Restoration Cost (Crores INR)
    const mangroveRemediationCostCr = Number((14.5 * areaScale).toFixed(2));
    const beachSedimentFlushingCostCr = Number((5.8 * areaScale).toFixed(2));
    const postSpillEcologicalMonitoringCr = 3.5;
    const totalRestorationCostCr = Number(
      (
        mangroveRemediationCostCr +
        beachSedimentFlushingCostCr +
        postSpillEcologicalMonitoringCr
      ).toFixed(2)
    );

    // 3. Potential Economic Loss Ranges (Crores INR)
    const fisheriesLossMinCr = Number((12.0 * areaScale).toFixed(1));
    const fisheriesLossMaxCr = Number((18.5 * areaScale).toFixed(1));
    const portDelayLossMinCr = 6.0;
    const portDelayLossMaxCr = 12.0;
    const tourismLossMinCr = Number((3.5 * areaScale).toFixed(1));
    const tourismLossMaxCr = Number((6.5 * areaScale).toFixed(1));
    const totalEconomicLossMinCr = Number(
      (fisheriesLossMinCr + portDelayLossMinCr + tourismLossMinCr).toFixed(1)
    );
    const totalEconomicLossMaxCr = Number(
      (fisheriesLossMaxCr + portDelayLossMaxCr + tourismLossMaxCr).toFixed(1)
    );

    // Grand Total Estimated Impact
    const grandTotalMinCr = Number(
      (
        totalDirectResponseCostCr +
        totalRestorationCostCr +
        totalEconomicLossMinCr
      ).toFixed(1)
    );
    const grandTotalMaxCr = Number(
      (
        totalDirectResponseCostCr +
        totalRestorationCostCr +
        totalEconomicLossMaxCr
      ).toFixed(1)
    );

    // Cost Avoided by Early Response vs 8-hour delay scenario
    const delayed8hTotalCr = Number((grandTotalMaxCr * 1.65).toFixed(1));
    const costAvoidedCr = Number((delayed8hTotalCr - grandTotalMinCr).toFixed(1));

    // 4-Scenario Cost Model Table Data
    const costScenarios = [
      {
        scenario: "Immediate Containment (T + 0h)",
        tag: "Recommended Plan",
        tagColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
        directResponseCr: "₹14.5 Cr",
        restorationCr: "₹12.0 Cr",
        economicLossCr: "₹11.5 - ₹16.0 Cr",
        totalCostCr: "₹38.0 - ₹42.5 Cr",
        costDifferential: "- ₹28.5 Cr (Savings)",
        diffColor: "text-emerald-700 font-bold",
      },
      {
        scenario: "Baseline Reality (Current T + 2h)",
        tag: "Active Status",
        tagColor: "bg-sky-100 text-sky-800 border-sky-200",
        directResponseCr: `₹${totalDirectResponseCostCr} Cr`,
        restorationCr: `₹${totalRestorationCostCr} Cr`,
        economicLossCr: `₹${totalEconomicLossMinCr} - ₹${totalEconomicLossMaxCr} Cr`,
        totalCostCr: `₹${grandTotalMinCr} - ₹${grandTotalMaxCr} Cr`,
        costDifferential: "Baseline Datum",
        diffColor: "text-slate-700 font-bold",
      },
      {
        scenario: "Delayed Mobilization (T + 6h)",
        tag: "High Penalty",
        tagColor: "bg-amber-100 text-amber-800 border-amber-200",
        directResponseCr: "₹34.8 Cr",
        restorationCr: "₹38.5 Cr",
        economicLossCr: "₹32.0 - ₹46.0 Cr",
        totalCostCr: "₹105.3 - ₹119.3 Cr",
        costDifferential: "+ ₹56.8 Cr (Loss)",
        diffColor: "text-amber-700 font-bold",
      },
      {
        scenario: "Major Breached Spill (High Wind)",
        tag: "Worst-Case Escalation",
        tagColor: "bg-rose-100 text-rose-800 border-rose-200",
        directResponseCr: "₹52.0 Cr",
        restorationCr: "₹58.0 Cr",
        economicLossCr: "₹55.0 - ₹82.0 Cr",
        totalCostCr: "₹165.0 - ₹192.0 Cr",
        costDifferential: "+ ₹115.0 Cr (Extreme)",
        diffColor: "text-rose-700 font-bold",
      },
    ];

    // Cost by Response Category Bar Chart Data
    const costBreakdownChartData = [
      { category: "Skimming & PCVs", cost: vesselDeploymentCostCr, fill: "#1E5FBF" },
      { category: "Containment Boom", cost: boomDeploymentCostCr, fill: "#0EA5E9" },
      { category: "Dispersants", cost: dispersantCostCr, fill: "#10B981" },
      { category: "Sludge Disposal", cost: wasteSludgeDisposalCostCr, fill: "#F59E0B" },
      { category: "Mangrove Restore", cost: mangroveRemediationCostCr, fill: "#84CC16" },
      { category: "Fishery Compensation", cost: Number(((fisheriesLossMinCr + fisheriesLossMaxCr) / 2).toFixed(1)), fill: "#EF4444" },
      { category: "Port Demurrage", cost: Number(((portDelayLossMinCr + portDelayLossMaxCr) / 2).toFixed(1)), fill: "#8B5CF6" },
    ];

    // Exponential Cost vs Delay Curve Data
    const delayCurveData = [
      { delay: "0h (Immediate)", cost: 40.2, cleanupDays: 7, areaKm2: 14.2 },
      { delay: "2h (Baseline)", cost: Number(((grandTotalMinCr + grandTotalMaxCr) / 2).toFixed(1)), cleanupDays: 14, areaKm2: 19.8 },
      { delay: "4h", cost: 84.5, cleanupDays: 22, areaKm2: 28.5 },
      { delay: "6h", cost: 112.3, cleanupDays: 35, areaKm2: 38.0 },
      { delay: "8h (Severe Lag)", cost: 148.0, cleanupDays: 48, areaKm2: 52.4 },
    ];

    return {
      vesselDeploymentCostCr,
      boomDeploymentCostCr,
      dispersantCostCr,
      wasteSludgeDisposalCostCr,
      totalDirectResponseCostCr,
      totalRestorationCostCr,
      totalEconomicLossMinCr,
      totalEconomicLossMaxCr,
      grandTotalMinCr,
      grandTotalMaxCr,
      costAvoidedCr,
      costScenarios,
      costBreakdownChartData,
      delayCurveData,
    };
  }, [
    whatIfScenarioOutput,
    whatIfDispatchDelayHours,
    whatIfBoomLength,
    whatIfChemicalDispersant,
  ]);

  // --------------------------------------------------------------------------
  // MODEL CONFIDENCE BREAKDOWN MATRIX (Multi-Dimensional Radar Data)
  // --------------------------------------------------------------------------
  const modelConfidenceBreakdown = useMemo(() => {
    const isTop = selectedCandidate.rank === 1;
    const score = lagrangianOutput.computedAttribution;

    const timeMatch = isTop ? Math.max(65, 99.4 - Math.abs(releaseTimeOffsetHours + 18) * 2.5) : 38;
    const routeAlignment = isTop ? 98.2 : selectedCandidate.rank === 2 ? 41.5 : 35.0;
    const spatialOverlap = lagrangianOutput.spatialIoU;
    const aisConsistency = isTop ? 97.2 : selectedCandidate.rank === 2 ? 88.0 : 42.0;
    const physicsMatch = isTop ? Math.max(60, 94.7 - Math.abs(windageFactor - 0.035) * 500) : 35.0;
    const speedDropAnomaly = isTop ? 98.5 : 18.4;
    const environmentalFit = Math.max(60, 92.0 - Math.abs(currentScalar - 1.0) * 20);

    const radarData = [
      { metric: "Time Match", candidate: timeMatch, baseline: 85, benchmark: 90 },
      { metric: "Route Alignment", candidate: routeAlignment, baseline: 75, benchmark: 85 },
      { metric: "Spatial Overlap", candidate: spatialOverlap, baseline: 70, benchmark: 80 },
      { metric: "AIS Continuity", candidate: aisConsistency, baseline: 65, benchmark: 75 },
      { metric: "Physics Match", candidate: physicsMatch, baseline: 80, benchmark: 88 },
      { metric: "Kinematic Anomaly", candidate: speedDropAnomaly, baseline: 60, benchmark: 70 },
      { metric: "Environmental Fit", candidate: environmentalFit, baseline: 85, benchmark: 92 },
    ];

    const overallConfidence = (
      timeMatch * 0.2 +
      routeAlignment * 0.15 +
      spatialOverlap * 0.2 +
      aisConsistency * 0.15 +
      physicsMatch * 0.15 +
      speedDropAnomaly * 0.15
    ).toFixed(1);

    return { radarData, overallConfidence };
  }, [
    selectedCandidate,
    lagrangianOutput,
    releaseTimeOffsetHours,
    windageFactor,
    currentScalar,
  ]);

  // Hourly What-If Simulation Comparison Chart
  const hourlySimulationComparisonData = useMemo(() => {
    const hours = [0, 6, 12, 18, 24, 30, 36, 42, 48];
    return hours.map((h) => {
      const baseArea = 14.2 + h * 0.35;
      const whatIfArea = 14.2 + h * (whatIfScenarioOutput.projectedArea24h / 48) * (h > 12 ? 1.1 : 0.9);
      const baseDistance = Math.max(0, 38.0 - h * (1.4 * 1.852));
      const whatIfDistance = Math.max(0, 38.0 - h * (whatIfScenarioOutput.netSpeedKts * 1.852));
      return {
        hour: `+${h}h`,
        baselineArea: Number(baseArea.toFixed(1)),
        whatIfArea: Number(whatIfArea.toFixed(1)),
        baselineDistance: Number(baseDistance.toFixed(1)),
        whatIfDistance: Number(whatIfDistance.toFixed(1)),
      };
    });
  }, [whatIfScenarioOutput]);

  // Trigger recalculation toast indicator when tuning inputs change
  const triggerRecalculateFeedback = () => {
    setIsRecalculating(true);
    setTimeout(() => setIsRecalculating(false), 300);
  };

  // Map candidate vessels for IncidentMiniMap
  const dynamicMapVessels: MapVesselCandidate[] = useMemo(() => {
    return candidates.map((c) => ({
      id: c.id,
      name: c.name,
      rank: c.rank,
      score: c.id === selectedCandidate.id ? lagrangianOutput.computedAttribution : c.score,
      coords: (c.id === "vessel-1" ? [18.78, 72.51] : c.id === "vessel-2" ? [18.52, 72.84] : c.id === "vessel-3" ? [18.61, 72.15] : [19.12, 72.95]) as [number, number],
      heading: c.id === "vessel-1" ? 312 : c.id === "vessel-2" ? 148 : c.id === "vessel-3" ? 180 : 45,
      speed: parseFloat(c.minSog) || 3.4,
      type: c.type,
      flag: c.flag,
      imo: c.imo,
    }));
  }, [candidates, selectedCandidate, lagrangianOutput]);

  // Coast Guard responding assets for map
  const dynamicMapAssets: MapCoastGuardAsset[] = useMemo(() => {
    return [
      { id: "cg-1", name: "ICGS Samudra Prahari", asset_type: "Pollution Control Vessel", coordinates: [18.82, 72.45], status: "En Route Containment" },
      { id: "cg-2", name: "ICGS Sankalp", asset_type: "Offshore Patrol Vessel", coordinates: [18.55, 72.62], status: "On Station" },
    ];
  }, []);

  return (
    <div className="flex h-screen bg-[#F0F7FD] font-body text-slate-800 antialiased overflow-hidden selection:bg-[#1E5FBF]/20 selection:text-[#0B2545]">
      {/* ===================================================================== */}
      {/* 1. LEFT SIDEBAR NAVIGATION                                            */}
      {/* ===================================================================== */}
      <aside
        id="analysis-sidebar"
        className={`h-full bg-gradient-to-b from-[#0B2545] to-[#123A66] flex flex-col justify-between items-center z-30 shrink-0 shadow-xl transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "w-16 sm:w-20 py-4 opacity-100 translate-x-0 overflow-y-auto"
            : "w-0 p-0 opacity-0 -translate-x-full overflow-hidden pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {/* Sahayya Logo / Brand Icon */}
          <div
            onClick={() => navigate("/dashboard")}
            className="w-11 h-11 rounded-2xl p-1 bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer mb-2"
            title="Return to Dashboard"
          >
            <img src="/sahayya-logo.png" alt="Sahayya" className="w-full h-full object-contain" />
          </div>

          {[
            { id: "Dashboard", icon: Home, labelKey: "nav.home", fallback: "Home", path: "/dashboard" },
            { id: "Map", icon: MapIcon, labelKey: "nav.map", fallback: "Map", path: "/map" },
            { id: "Incidents", icon: Activity, labelKey: "nav.incidents", fallback: "Incidents", path: "/incidents/IN-MH-2026" },
            { id: "Vessels", icon: Ship, labelKey: "nav.vessels", fallback: "Vessels", path: "/vessels" },
            { id: "Analysis", icon: BarChart3, labelKey: "nav.analysis", fallback: "Analysis", path: "/analysis" },
            { id: "Authority", icon: Send, labelKey: "nav.authority", fallback: "Submit to Authority", path: "/authority" },
            { id: "Settings", icon: Settings, labelKey: "nav.settings", fallback: "Settings", path: "/settings" },
            { id: "Help", icon: HelpCircle, labelKey: "nav.help", fallback: "Help", path: "/help" },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const label = t(item.labelKey, item.fallback);
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  navigate(item.path);
                }}
                className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                  isActive
                    ? "bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-white shadow-md shadow-blue-950/40"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                title={label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium font-body truncate max-w-[56px]">{label}</span>
                {isActive && (
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-sky-300 rounded-r-full shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN ANALYSIS WORKSTATION CANVAS                                   */}
      {/* ===================================================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP COMMAND & PIPELINE HEADER */}
        <header className="h-16 bg-white border-b border-[#E1EEF9] px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0B2545] hover:bg-[#F8FBFE] border border-[#E1EEF9] transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <Layers className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-[#0B2545] font-display tracking-tight flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#1E5FBF]" />
                  <span>{t("analysis.title", "Forensic Attribution & Scenario Lab")}</span>
                </h1>
                <span className="text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  IN-MH-2026 Live
                </span>
                {isRecalculating && (
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Recalculating analysis...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-body hidden sm:block">
                {t("analysis.subtitle", "Flowchart Stages 11, 12, 18 • Probabilistic vessel attribution and Lagrangian hydrodynamic modeling.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Multi-Language Selector */}
            <LanguageSwitcher variant="light" />

            <button
              onClick={() => {
                setReleaseTimeOffsetHours(-18.0);
                setWindageFactor(0.035);
                setCurrentScalar(1.0);
                triggerToast("Reset parameters to baseline satellite/buoy telemetry.");
              }}
              className="px-3 py-1.5 rounded-xl border border-[#E1EEF9] bg-white hover:bg-[#F8FBFE] text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Restore baseline satellite & buoy parameters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("action.resetBaseline", "Reset Baseline")}</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] hover:from-[#174EA6] hover:to-[#2275C6] text-white text-xs font-bold font-body flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
              title="Generate certified forensic analysis report in PDF format"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t("action.generateAnalysisReport", "Generate Analysis Report")}</span>
            </button>
          </div>
        </header>

        {/* SUB-HEADER: LIVE DATA PIPELINE STATUS & WORKSPACE SUB-TABS */}
        <div className="bg-[#F8FBFE] border-b border-[#E1EEF9] px-6 py-2.5 flex items-center justify-between flex-wrap gap-3 shrink-0 font-body">
          {/* Workstation Sub-Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {[
              { id: "pipeline", label: t("analysis.tabs.originLab", "Oil Spill Origin & Forensic Lab"), icon: Compass },
              { id: "whatif", label: t("analysis.tabs.whatif", "What-If Hydrodynamic Simulator"), icon: Sliders },
              { id: "environmental", label: t("analysis.tabs.environmental", "Environmental Impact Analysis"), icon: Leaf },
              { id: "economic", label: t("analysis.tabs.economic", "Economic & Cost Impact Analysis"), icon: IndianRupee },
              { id: "confidence", label: t("analysis.tabs.confidence", "Model Confidence & Attribution Matrix"), icon: Target },
              { id: "historical", label: t("analysis.tabs.historical", "Historical Analogue Benchmarking"), icon: History },
              { id: "traceability", label: t("analysis.tabs.traceability", "Evidence Traceability & Chain of Custody"), icon: ShieldCheck },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSearchParams({ tab: tab.id, vessel: selectedCandidate.name });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#0B2545] text-white shadow-xs"
                      : "text-slate-600 hover:bg-[#E1EEF9] hover:text-[#0B2545]"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Real-Time Telemetry Feed Indicators */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Lagrangian Kernel: 5,000 Particles
            </span>
            <span>&bull;</span>
            <span className="text-slate-600">
              Wind: <strong className="text-[#1E5FBF]">5.1 m/s @ 289°</strong> &bull; Current: <strong className="text-[#0EA5B7]">0.67 m/s</strong>
            </span>
          </div>
        </div>

        {/* WORKSPACE CONTENT BODY (SCROLLABLE) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================================================================= */}
          {/* TAB 1: PROBABLE OIL SPILL ORIGIN & COUNTERFACTUAL FORENSICS LAB   */}
          {/* ================================================================= */}
          {activeTab === "pipeline" && (
            <div className="space-y-5 animate-fadeIn">
              {/* TOP COMMAND & DYNAMIC REVERSE LAGRANGIAN CONTROL RIBBON */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B2545] to-[#1E5FBF] flex items-center justify-center text-white shadow-md">
                      <Target className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                          STAGE 11 &amp; 12: ORIGIN BACK-TRACKING
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-[#0B2545] font-display">
                          Probable Oil Spill Origin Detection &amp; Hindcast Engine
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 font-body mt-0.5">
                        Back-tracking 5,000 Lagrangian particles driven by INCOIS ocean currents and ECMWF 10m wind fields to determine the release origin.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setReleaseTimeOffsetHours(-18.0);
                        setOriginWindSpeedKts(14.2);
                        setOriginWindDirDeg(289);
                        setOriginCurrentSpeedKts(0.82);
                        setOriginCurrentDirDeg(68);
                        setDiffusionCoefficient(10.0);
                        triggerToast("Reset origin model to baseline satellite & buoy parameters.");
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#E1EEF9] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Reset parameters to baseline"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Model</span>
                    </button>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0B2545] hover:bg-[#143966] text-white text-xs font-bold font-body flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      title="Export comprehensive origin analysis PDF dossier"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      <span>Generate Origin Analysis Report</span>
                    </button>
                  </div>
                </div>

                {/* DYNAMIC ENVIRONMENTAL & RELEASE-TIME CONTROLS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Control 1: Release-Time Window */}
                  <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Release Time Window:</span>
                      </span>
                      <span className="font-mono font-bold text-amber-600">
                        {Math.abs(releaseTimeOffsetHours).toFixed(0)}h Prior (T{releaseTimeOffsetHours > 0 ? `+${releaseTimeOffsetHours}` : releaseTimeOffsetHours}h)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-36.0"
                      max="-6.0"
                      step="1.0"
                      value={releaseTimeOffsetHours}
                      onChange={(e) => setReleaseTimeOffsetHours(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <button onClick={() => setReleaseTimeOffsetHours(-36)} className="hover:text-slate-700">T-36h</button>
                      <button onClick={() => setReleaseTimeOffsetHours(-24)} className="hover:text-slate-700">T-24h</button>
                      <button onClick={() => setReleaseTimeOffsetHours(-18)} className="font-bold text-amber-600">T-18h (Opt)</button>
                      <button onClick={() => setReleaseTimeOffsetHours(-12)} className="hover:text-slate-700">T-12h</button>
                      <button onClick={() => setReleaseTimeOffsetHours(-6)} className="hover:text-slate-700">T-6h</button>
                    </div>
                  </div>

                  {/* Control 2: Surface Wind Speed & Direction */}
                  <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Wind className="w-3.5 h-3.5 text-[#1E5FBF]" />
                        <span>ECMWF Wind Field:</span>
                      </span>
                      <span className="font-mono font-bold text-[#1E5FBF]">
                        {originWindSpeedKts.toFixed(1)} kts @ {originWindDirDeg}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2.0"
                      max="30.0"
                      step="0.5"
                      value={originWindSpeedKts}
                      onChange={(e) => setOriginWindSpeedKts(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E5FBF]"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>5 kts (Calm)</span>
                      <span>14.2 kts (Baseline)</span>
                      <span>30 kts (Squall)</span>
                    </div>
                  </div>

                  {/* Control 3: INCOIS Ocean Surface Current */}
                  <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Waves className="w-3.5 h-3.5 text-cyan-600" />
                        <span>INCOIS Surface Current:</span>
                      </span>
                      <span className="font-mono font-bold text-cyan-700">
                        {originCurrentSpeedKts.toFixed(2)} kts @ {originCurrentDirDeg}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.05"
                      value={originCurrentSpeedKts}
                      onChange={(e) => setOriginCurrentSpeedKts(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>0.2 kts (Slack)</span>
                      <span>0.82 kts (Baseline)</span>
                      <span>3.0 kts (High Tidal)</span>
                    </div>
                  </div>

                  {/* Control 4: Turbulent Diffusion */}
                  <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Turbulent Diffusion:</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-600">
                        {diffusionCoefficient.toFixed(1)} m²/s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4.0"
                      max="25.0"
                      step="1.0"
                      value={diffusionCoefficient}
                      onChange={(e) => setDiffusionCoefficient(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>4 m²/s (Laminar)</span>
                      <span>10 m²/s (Standard)</span>
                      <span>25 m²/s (Rough)</span>
                    </div>
                  </div>
                </div>

                {/* LIVE CALCULATED ORIGIN SUMMARY BANNER */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-sky-500/10 border border-amber-300/60 flex items-center justify-between flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-slate-700 font-semibold">Most Probable Release Origin:</span>
                    <strong className="font-mono text-sm text-[#0B2545] font-bold">
                      {activeOriginSimulation.probableOrigin[0].toFixed(4)}°N, {activeOriginSimulation.probableOrigin[1].toFixed(4)}°E
                    </strong>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                      Zone Alpha (±{activeOriginSimulation.originConfidenceRadiusKm} km)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600">
                    <span>
                      Confidence: <strong className="text-emerald-700 font-bold">{activeOriginSimulation.originExplanation.overallOriginConfidence}% High Certainty</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Suspect CPA: <strong className="text-rose-600 font-bold">{activeOriginSimulation.originZones[0]?.cpaVesselDistanceKm} km ({selectedCandidate.name})</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* 3-COLUMN PROBABLE ORIGIN WORKBENCH */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT COLUMN: CANDIDATE VESSELS & CANDIDATE ORIGIN ZONES (col-span-3) */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Candidate Vessels Box */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Ship className="w-3.5 h-3.5 text-[#1E5FBF]" />
                        <span>CANDIDATE VESSELS ({candidates.length})</span>
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">Case IN-MH</span>
                    </div>

                    <div className="space-y-2">
                      {candidates.map((c) => {
                        const isSelected = c.id === selectedCandidate.id;
                        const matchScore = isSelected ? lagrangianOutput.computedAttribution : c.score;
                        const isTop = c.rank === 1;

                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCandidate(c);
                              triggerToast(`Simulating reverse trajectory for ${c.name}`);
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white border-[#1E5FBF] ring-2 ring-[#1E5FBF]/20 shadow-sm"
                                : "bg-[#F8FBFE] border-[#E1EEF9] hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-[#0B2545] font-display uppercase tracking-tight truncate max-w-[140px]">
                                {c.name}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  isTop
                                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                                    : "bg-amber-100 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {matchScore.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                              <span>IMO {c.imo || "9438200"}</span>
                              <span className={isTop ? "text-rose-600 font-bold" : "text-slate-600"}>
                                CPA: {isTop ? `${activeOriginSimulation.originZones[0]?.cpaVesselDistanceKm || 0.6} km` : `${(c.rank * 14.2).toFixed(1)} km`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Candidate Origin Release Zones Box */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-amber-500" />
                        <span>CANDIDATE ORIGIN ZONES</span>
                      </h3>
                      <span className="text-[10px] font-mono text-emerald-600 font-bold">3 Surfaces</span>
                    </div>

                    <div className="space-y-2">
                      {activeOriginSimulation.originZones.map((zone: OriginProbabilityZone) => {
                        const isSelected = selectedOriginZoneId === zone.id;
                        return (
                          <div
                            key={zone.id}
                            onClick={() => {
                              setSelectedOriginZoneId(zone.id);
                              triggerToast(`Selected ${zone.name} (${zone.probabilityPct}% prob)`);
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white border-[#1E5FBF] ring-2 ring-[#1E5FBF]/20 shadow-xs"
                                : "bg-[#F8FBFE] border-[#E1EEF9] hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#0B2545] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                                <span>{zone.name.split("(")[0]}</span>
                              </span>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                zone.probabilityLevel === "HIGH" ? "bg-rose-100 text-rose-800" : zone.probabilityLevel === "MEDIUM" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"
                              }`}>
                                {zone.probabilityPct}% Prob
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                              <span>Area: {zone.areaKm2} km²</span>
                              <span>Suspect CPA: <strong className={zone.probabilityLevel === "HIGH" ? "text-rose-600 font-bold" : "text-slate-700"}>{zone.cpaVesselDistanceKm} km</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* CENTER COLUMN: REVERSE PARTICLE TRAJECTORY & PROBABLE ORIGIN MAP (col-span-6) */}
                <div className="lg:col-span-6 p-4 sm:p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <div>
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-[#1E5FBF]" />
                          <span>REVERSE PARTICLE TRAJECTORY &amp; PROBABLE ORIGIN MAP</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 font-body">
                          Back-tracking target: <strong className="text-[#1E5FBF]">{selectedCandidate.name}</strong> • Release window: <strong className="text-amber-600">{activeOriginSimulation.originTimeWindow}</strong>
                        </p>
                      </div>

                      {/* Dual / Overlap View Mode Toggle */}
                      <div className="flex items-center bg-[#F0F7FD] p-0.5 rounded-lg border border-[#E1EEF9] text-[10px] font-mono font-bold">
                        <button
                          onClick={() => setHindcastViewMode("Dual")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            hindcastViewMode === "Dual"
                              ? "bg-[#0B2545] text-white shadow-xs"
                              : "text-slate-600 hover:text-[#0B2545]"
                          }`}
                        >
                          Dual
                        </button>
                        <button
                          onClick={() => setHindcastViewMode("Overlap")}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            hindcastViewMode === "Overlap"
                              ? "bg-[#0B2545] text-white shadow-xs"
                              : "text-slate-600 hover:text-[#0B2545]"
                          }`}
                        >
                          Overlap
                        </button>
                      </div>
                    </div>

                    {/* Dark Marine Centerpiece GIS Interactive Map Canvas */}
                    <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-800 bg-[#051322] h-[380px]">
                      <IncidentMiniMap
                        center={[18.69, 72.38]}
                        originCoord={activeOriginSimulation.probableOrigin}
                        spillPolygon={activeOriginSimulation.sheenLayer.coordinates}
                        forecastTrack={activeOriginSimulation.forecastLineCoords}
                        vessels={dynamicMapVessels}
                        cgAssets={dynamicMapAssets}
                        isSimulated={true}
                      />

                      {/* Top-Left Telemetry Overlay: Correlation Variance */}
                      <div className="absolute top-3 left-3 z-[400] pointer-events-none">
                        <div className="bg-[#0B2545]/92 backdrop-blur-md px-3 py-1.5 rounded-lg border border-sky-400/30 text-left shadow-lg">
                          <span className="text-[10px] font-mono text-slate-300 block">Lagrangian Precision:</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            0.6% Discrepancy (99.4% Match)
                          </span>
                        </div>
                      </div>

                      {/* Top-Right Telemetry Overlay: Dual Reconstruction View */}
                      <div className="absolute top-3 right-3 z-[400] pointer-events-none">
                        <div className="bg-[#0B2545]/92 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[9px] font-mono font-bold text-slate-300 shadow-md uppercase tracking-wider">
                          ORIGIN HINDCAST VIEW
                        </div>
                      </div>

                      {/* Bottom Overlay Telemetry Pill Bar */}
                      <div className="absolute bottom-2 left-2 right-2 z-[400] pointer-events-none">
                        <div className="bg-[#0B2545]/92 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-400/20 text-[10px] font-mono flex items-center justify-between text-slate-300 flex-wrap gap-2 shadow-lg">
                          <div>
                            <span className="text-slate-400">Sentinel-1A SAR: </span>
                            <strong className="text-white">276.04 km²</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">INCOIS Current: </span>
                            <strong className="text-sky-300">{originCurrentSpeedKts} kts @ {originCurrentDirDeg}°</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">ECMWF Wind: </span>
                            <strong className="text-amber-300">{originWindSpeedKts} kts @ {originWindDirDeg}°</strong>
                          </div>
                          <div>
                            <span className="text-emerald-400 font-bold">Forensic: HIGH CERTAINTY</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Caption Note Below Map */}
                  <p className="text-xs text-slate-600 font-body leading-relaxed">
                    Counterfactual physics model runs reverse Lagrangian particle tracking driven by INCOIS ocean currents and ECMWF 10m wind fields to determine the release origin coordinates and suspect AIS track intersection.
                  </p>
                </div>

                {/* RIGHT COLUMN: ORIGIN EVIDENCE SCORE BREAKDOWN & WHY THIS ORIGIN PANEL (col-span-3) */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Evidence Score Breakdown Chart */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-mono">
                        ORIGIN EVIDENCE BREAKDOWN
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        {activeOriginSimulation.originExplanation.overallOriginConfidence}% Match
                      </span>
                    </div>

                    {/* Bar Chart Breakdown */}
                    <div className="h-36 w-full pt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: "Spatial Conv", score: activeOriginSimulation.originExplanation.spatialConvergenceScore, fill: "#2563EB" },
                            { name: "Time Match", score: activeOriginSimulation.originExplanation.temporalMatchScore, fill: "#0EA5E9" },
                            { name: "Env Fit", score: activeOriginSimulation.originExplanation.environmentalConsistencyScore, fill: "#10B981" },
                            { name: "Vessel AIS", score: activeOriginSimulation.originExplanation.vesselCorrelationScore, fill: "#EF4444" },
                          ]}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 8.5, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 8.5, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                          <RechartsTooltip />
                          <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                            {evidenceBarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Attribution Probability Box */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-xs font-bold font-mono text-rose-600 flex items-center justify-between">
                        <span>ATTRIBUTION: {selectedCandidate.rank === 1 ? "98.8%" : `${lagrangianOutput.computedAttribution.toFixed(1)}%`}</span>
                        <span className="text-[10px] text-slate-500 font-sans">Rank #{selectedCandidate.rank}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-body leading-snug">
                        {selectedCandidate.rank === 1
                          ? "Drastic speed drop from 13.8 to 1.4 kts correlates with 94 min transponder gap right along the central slick centroid. Hydrodynamic match is optimal."
                          : `Vessel trajectory maintains an offset of ${(selectedCandidate.rank * 14.2).toFixed(1)} km from the calculated Lagrangian release centroid with minimal kinematic anomaly.`}
                      </p>
                    </div>
                  </div>

                  {/* "WHY THIS ORIGIN?" Evidence Explanation Panel */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] space-y-2.5">
                    <div className="flex items-center justify-between pb-1.5 border-b border-[#E1EEF9]">
                      <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>WHY THIS ORIGIN?</span>
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">5 Points</span>
                    </div>

                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {activeOriginSimulation.originExplanation.evidenceList.map((item: OriginEvidenceItem, idx: number) => (
                        <div key={idx} className="p-2 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <strong className="text-[#0B2545] font-semibold">{item.title}</strong>
                            <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded ${
                              item.status === "OPTIMAL" || item.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
                            }`}>
                              {item.status} ({item.score}%)
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-tight font-body">{item.detail}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[9.5px] text-slate-400 font-body leading-tight">
                        &bull; Legal Note: Probabilistic intelligence evidence generated under IMO guidelines &mdash; not legal proof of liability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: WHAT-IF PREDICTIVE RESPONSE SIMULATOR                      */}
          {/* ================================================================= */}
          {activeTab === "whatif" && (
            <div className="space-y-6 animate-fadeIn">
              {/* TOP COMMAND HEADER (Matching Reference Screenshot 2) */}
              <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                        STAGE 18: REAL-TIME SIMULATOR
                      </span>
                      <h2 className="text-base font-bold text-[#0B2545] font-display">
                        Predictive Response Scenario Simulator
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 font-body mt-0.5">
                      Adjust environmental assumptions and response delays below to re-run the hydrodynamic containment model live across all 3 tactical operational plans.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setWhatIfWindSpeed(14.2 / 1.94384);
                        setWhatIfDispatchDelayHours(2.0);
                        setWhatIfBoomLength(1500);
                        triggerToast("Reset simulator to baseline ECMWF conditions.");
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#E1EEF9] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Defaults</span>
                    </button>
                    <button
                      onClick={() => {
                        triggerToast(`Applied Strategy: ${selectedTacticalStrategy.toUpperCase()} to operational response plan.`);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-body flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Selected Strategy</span>
                    </button>
                  </div>
                </div>

                {/* 3 PARAMETER SLIDERS ROW (Surface Wind, Mobilization Delay, Boom Length) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Slider 1: Surface Wind Speed */}
                  <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Wind className="w-3.5 h-3.5 text-[#1E5FBF]" />
                        <span>Surface Wind Speed (ECMWF):</span>
                      </span>
                      <span className="font-mono font-bold text-[#1E5FBF]">
                        {(whatIfWindSpeed * 1.94384).toFixed(1)} kts
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2.5"
                      max="15.5"
                      step="0.2"
                      value={whatIfWindSpeed}
                      onChange={(e) => setWhatIfWindSpeed(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E5FBF]"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>5 kts (Calm)</span>
                      <span>14.2 kts (Baseline)</span>
                      <span>30 kts (Squall)</span>
                    </div>
                  </div>

                  {/* Slider 2: Asset Mobilization Delay */}
                  <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Asset Mobilization Delay:</span>
                      </span>
                      <span className="font-mono font-bold text-amber-600">
                        +{whatIfDispatchDelayHours.toFixed(1)} Hours
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="8.0"
                      step="0.5"
                      value={whatIfDispatchDelayHours}
                      onChange={(e) => setWhatIfDispatchDelayHours(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>0h (Immediate)</span>
                      <span>2.0h (Baseline)</span>
                      <span>8h (High Delay)</span>
                    </div>
                  </div>

                  {/* Slider 3: Containment Boom Length */}
                  <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Anchor className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Containment Boom Length:</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-600">
                        {whatIfBoomLength} meters
                      </span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="3000"
                      step="100"
                      value={whatIfBoomLength}
                      onChange={(e) => setWhatIfBoomLength(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>500m (Light)</span>
                      <span>1500m (Standard)</span>
                      <span>3000m (Heavy Barrier)</span>
                    </div>
                  </div>
                </div>

                {/* AI Recommendation Banner */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-950 font-body">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="font-semibold text-emerald-900">AI Recommendation (Live Recalculated):</strong> Fastest containment at lowest cost (₹38L–₹50L), restricting Maharashtra coastline impact to 3.3%–5.5% and saving ~₹76L vs delayed dispatch despite higher initial mobilization speed.
                  </p>
                </div>

                {/* 3 TACTICAL STRATEGY CARDS (Matching Reference Screenshot 2) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Immediate Containment (T + 0h) - Recommended */}
                  <div
                    onClick={() => setSelectedTacticalStrategy("immediate")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      selectedTacticalStrategy === "immediate"
                        ? "bg-white border-emerald-400 ring-2 ring-emerald-300/50 shadow-md"
                        : "bg-white border-[#E1EEF9] hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          ★ RECOMMENDED
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700">86/100 Score</span>
                      </div>

                      <h4 className="font-bold text-sm text-[#0B2545] font-display">
                        Immediate Containment (T + 0h)
                      </h4>
                      <p className="text-xs text-slate-600 font-body leading-relaxed">
                        Deploy ICGS Vikram offshore barrier within 2 hours of SAR detection with high-speed ocean boom.
                      </p>

                      {/* Mini Simulation Diagram Canvas */}
                      <div className="relative h-20 w-full rounded-xl bg-[#0B1E36] overflow-hidden border border-slate-700 flex items-center justify-center">
                        <div className="w-16 h-10 rounded-full bg-rose-600/70 blur-[2px] border border-rose-400/50" />
                        <div className="absolute left-1/3 w-10 h-12 rounded-full border-2 border-dashed border-emerald-400 border-r-0" />
                        <div className="absolute right-4 h-16 w-1 rounded-full bg-amber-400" />
                        <span className="absolute bottom-1.5 left-4 text-[8px] font-mono text-emerald-300">BOOM SECURED</span>
                        <span className="absolute bottom-1.5 right-2 text-[8px] font-mono text-amber-300">COAST</span>
                      </div>

                      <div className="space-y-1 text-xs font-mono pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Coastline Impact Range:</span>
                          <strong className="text-emerald-600">3.3% - 5.5%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Spill Extent Range:</span>
                          <span className="text-slate-800">271 - 336 km²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Time to Contain:</span>
                          <span className="text-slate-800">12.3 - 17.4 h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Estimated Cost:</span>
                          <span className="text-slate-800">₹38 - ₹50L</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedTacticalStrategy === "immediate"
                          ? "bg-[#0B2545] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {selectedTacticalStrategy === "immediate" ? "Selected Strategy" : "Select Strategy"}
                    </button>
                  </div>

                  {/* Card 2: Delayed Mobilization (T + 6h) */}
                  <div
                    onClick={() => setSelectedTacticalStrategy("delayed")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      selectedTacticalStrategy === "delayed"
                        ? "bg-white border-rose-400 ring-2 ring-rose-300/50 shadow-md"
                        : "bg-white border-[#E1EEF9] hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Alternative Plan
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-600">24/100 Score</span>
                      </div>

                      <h4 className="font-bold text-sm text-[#0B2545] font-display">
                        Delayed Mobilization (T + 6h)
                      </h4>
                      <p className="text-xs text-slate-600 font-body leading-relaxed">
                        Wait for secondary SAR optical confirmation pass before surface fleet dispatch.
                      </p>

                      {/* Mini Simulation Diagram Canvas */}
                      <div className="relative h-20 w-full rounded-xl bg-[#0B1E36] overflow-hidden border border-slate-700 flex items-center justify-center">
                        <div className="w-24 h-12 rounded-full bg-rose-600/80 blur-[2px] border border-rose-500" />
                        <div className="absolute right-4 h-16 w-1 rounded-full bg-amber-400" />
                        <span className="absolute bottom-1.5 left-6 text-[8px] font-mono text-rose-300">SHORELINE BREACH</span>
                        <span className="absolute bottom-1.5 right-2 text-[8px] font-mono text-amber-300">COAST</span>
                      </div>

                      <div className="space-y-1 text-xs font-mono pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Coastline Impact Range:</span>
                          <strong className="text-rose-600">30.1% - 51.0%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Spill Extent Range:</span>
                          <span className="text-slate-800">407 - 504 km²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Time to Contain:</span>
                          <span className="text-slate-800">30.6 - 43.2 h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Estimated Cost:</span>
                          <span className="text-slate-800">₹106 - ₹139L</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedTacticalStrategy === "delayed"
                          ? "bg-[#0B2545] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {selectedTacticalStrategy === "delayed" ? "Selected Strategy" : "Select Strategy"}
                    </button>
                  </div>

                  {/* Card 3: Zone A Skimming Prioritization */}
                  <div
                    onClick={() => setSelectedTacticalStrategy("zoneA")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      selectedTacticalStrategy === "zoneA"
                        ? "bg-white border-amber-400 ring-2 ring-amber-300/50 shadow-md"
                        : "bg-white border-[#E1EEF9] hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Alternative Plan
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-600">70/100 Score</span>
                      </div>

                      <h4 className="font-bold text-sm text-[#0B2545] font-display">
                        Zone A Skimming Prioritization
                      </h4>
                      <p className="text-xs text-slate-600 font-body leading-relaxed">
                        Focus all skimming cutters exclusively on Alibaug turtle breeding beaches and mangrove nursery zones.
                      </p>

                      {/* Mini Simulation Diagram Canvas */}
                      <div className="relative h-20 w-full rounded-xl bg-[#0B1E36] overflow-hidden border border-slate-700 flex items-center justify-center">
                        <div className="w-18 h-10 rounded-full bg-rose-600/70 blur-[2px]" />
                        <div className="absolute right-10 h-10 w-2 rounded-full border-r-2 border-sky-400" />
                        <div className="absolute right-4 h-16 w-1 rounded-full bg-amber-400" />
                        <span className="absolute bottom-1.5 left-6 text-[8px] font-mono text-sky-300">ZONE A SHIELD</span>
                        <span className="absolute bottom-1.5 right-2 text-[8px] font-mono text-amber-300">COAST</span>
                      </div>

                      <div className="space-y-1 text-xs font-mono pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Coastline Impact Range:</span>
                          <strong className="text-amber-600">10.0% - 16.9%</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Spill Extent Range:</span>
                          <span className="text-slate-800">313 - 388 km²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Time to Contain:</span>
                          <span className="text-slate-800">18.7 - 26.4 h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Estimated Cost:</span>
                          <span className="text-slate-800">₹68 - ₹89L</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedTacticalStrategy === "zoneA"
                          ? "bg-[#0B2545] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {selectedTacticalStrategy === "zoneA" ? "Selected Strategy" : "Select Strategy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* PRIMARY VISUAL CENTERPIECE: ADVANCED REALISTIC GIS MAP (15 Core Capabilities) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-[#1E5FBF]" />
                    <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      Dynamic Hydrodynamic Spill Simulation Map (Bonn Scale &amp; Lagrangian Advection)
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSpillDNAModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#1E5FBF] border border-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Spill DNA &amp; Morphology</span>
                    </button>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                      Live Reactivity to Slider Inputs
                    </span>
                  </div>
                </div>

                <AdvancedSpillMap
                  simulationParams={{
                    centroid: [18.69, 72.38],
                    windSpeedKts: Number((whatIfWindSpeed * 1.94384).toFixed(1)),
                    windDirDeg: whatIfWindDir,
                    currentSpeedKts: Number((whatIfCurrentSpeed * 1.94384).toFixed(1)),
                    currentDirDeg: 189,
                    releaseVolumeM3: 18000,
                    containmentEffPct: Math.min(90, Math.round((whatIfBoomLength / 5000) * 80)),
                    chemicalDispersant: whatIfChemicalDispersant,
                    responseDelayHours: whatIfDispatchDelayHours,
                  }}
                  height={560}
                  onSelectVessel={(v) => {
                    setSelectedCandidate(v);
                    triggerToast(`Selected ${v.name} on simulation map`);
                  }}
                  onOpenReportModal={() => setShowReportModal(true)}
                  onTriggerToast={triggerToast}
                />
              </div>

              {/* Side-by-Side Reality vs Scenario Comparison Matrix */}
              <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
                  <div className="flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-[#1E5FBF]" />
                    <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      Side-by-Side Impact Matrix (Baseline vs. What-If Scenario)
                    </h2>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    whatIfScenarioOutput.riskLevel.includes("CRITICAL") ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {whatIfScenarioOutput.riskLevel}
                  </span>
                </div>

                {/* Side-by-Side Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Baseline Column */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-xs text-slate-700 uppercase font-display">
                        Baseline Ambient Telemetry
                      </span>
                      <span className="text-[10px] font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-600">
                        Current
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Net Drift Velocity:</span>
                        <strong className="text-slate-800">{whatIfScenarioOutput.baselineSpeedKts} kts</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Dispersion Heading:</span>
                        <strong className="text-slate-800">{whatIfScenarioOutput.baselineHeadingDeg}°</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">24h Projected Area:</span>
                        <strong className="text-slate-800">{whatIfScenarioOutput.baselineProjectedArea24h} km²</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Projected Landfall ETA:</span>
                        <strong className="text-slate-800">~ {whatIfScenarioOutput.baselineLandfallEta}h</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Est. Clean-up Cost:</span>
                        <strong className="text-slate-800">₹{whatIfScenarioOutput.baselineCostCr} Cr</strong>
                      </div>
                    </div>
                  </div>

                  {/* What-If Scenario Column */}
                  <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-sky-200 pb-1.5">
                      <span className="font-bold text-xs text-[#0B2545] uppercase font-display">
                        Simulated What-If Scenario
                      </span>
                      <span className="text-[10px] font-mono bg-sky-200 px-2 py-0.5 rounded text-sky-900 font-bold">
                        Active Model
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">Net Drift Velocity:</span>
                        <strong className="text-[#1E5FBF]">{whatIfScenarioOutput.netSpeedKts.toFixed(1)} kts</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">Dispersion Heading:</span>
                        <strong className="text-amber-600">{Math.round(whatIfScenarioOutput.netHeadingDeg)}°</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">24h Projected Area:</span>
                        <strong className="text-rose-600">{whatIfScenarioOutput.projectedArea24h.toFixed(1)} km²</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">Projected Landfall ETA:</span>
                        <strong className="text-rose-600">~ {whatIfScenarioOutput.landfallEtaHours.toFixed(1)}h</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">Est. Clean-up Cost:</span>
                        <strong className="text-[#0B2545]">₹{whatIfScenarioOutput.estimatedCostCr} Cr</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hourly Area & Distance Comparison Chart */}
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-bold text-[#0B2545] uppercase tracking-wider block font-display">
                    48-Hour Hydrodynamic Dispersion Projection (Area km² vs. Distance to Shore)
                  </span>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourlySimulationComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#64748B" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                        <RechartsTooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Area type="monotone" dataKey="whatIfArea" name="Simulated Scenario Area (km²)" stroke="#EF4444" fill="#FEE2E2" fillOpacity={0.5} strokeWidth={2} />
                        <Area type="monotone" dataKey="baselineArea" name="Baseline Reality Area (km²)" stroke="#1E5FBF" fill="#E0F2FE" fillOpacity={0.3} strokeWidth={2} />
                        <Line type="monotone" dataKey="whatIfDistance" name="Simulated Distance to Shore (km)" stroke="#D97706" strokeWidth={2} strokeDasharray="4 4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: ENVIRONMENTAL IMPACT FORENSICS & MPA EXPOSURE LAB          */}
          {/* ================================================================= */}
          {activeTab === "environmental" && (
            <div className="space-y-6 animate-fadeIn">
              {/* 1. TOP COMMAND & SCENARIO COUPLING RIBBON */}
              <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
                      <Leaf className="w-5 h-5 text-emerald-200" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                          STAGE 13 &amp; 14: ENVIRONMENTAL FORENSICS &amp; MPA EXPOSURE
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-[#0B2545] font-display">
                          Environmental &amp; Marine Habitat Impact Forensics
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 font-body mt-0.5">
                        Forensic quantification of hydrocarbon contamination across marine protected areas, mangrove biomes, coral reefs, commercial fishing zones, and coastal water quality.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                      environmentalImpactOutput.overallEnvScore >= 80
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : environmentalImpactOutput.overallEnvScore >= 60
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200"
                    }`}>
                      {environmentalImpactOutput.riskTier}
                    </span>
                    <button
                      onClick={() => {
                        setReportStage("environmental");
                        setShowReportModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold font-body flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      title="Generate certified environmental impact PDF dossier"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Generate Environmental Impact Report</span>
                    </button>
                  </div>
                </div>

                {/* Real-time What-If Reactivity Banner */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs font-body">
                  <div className="flex items-center gap-2 text-emerald-950">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="font-semibold">Connected to What-If Simulator:</strong> Hydrodynamic drift heading at{" "}
                      <strong className="font-mono text-emerald-900">{Math.round(whatIfScenarioOutput.netHeadingDeg)}°</strong>, wind speed{" "}
                      <strong className="font-mono text-emerald-900">{(whatIfWindSpeed * 1.94384).toFixed(1)} kts</strong>, mobilization lag{" "}
                      <strong className="font-mono text-emerald-900">+{whatIfDispatchDelayHours.toFixed(1)}h</strong>.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("whatif");
                      setSearchParams({ tab: "whatif", vessel: selectedCandidate.name });
                    }}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Tune Simulation Parameters &rarr;</span>
                  </button>
                </div>
              </div>

              {/* 2. TOP 4 DYNAMIC ENVIRONMENTAL KPI METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Spill Extent & Dispersed Exposure */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        SPILL EXTENT &amp; VOLUME
                      </span>
                      <Droplets className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-[#0B2545] font-display mt-2">
                      {environmentalImpactOutput.coreSlickAreaKm2} <span className="text-base font-medium text-slate-500">km²</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Exposure: <strong className="text-rose-600">{environmentalImpactOutput.totalExposureAreaKm2} km²</strong></span>
                    <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold border border-rose-200">240 µm Core</span>
                  </div>
                </div>

                {/* KPI 2: Distance to Coastline */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        COASTLINE PROXIMITY
                      </span>
                      <Compass className="w-4 h-4 text-[#1E5FBF]" />
                    </div>
                    <div className="text-3xl font-extrabold text-[#1E5FBF] font-display mt-2">
                      {environmentalImpactOutput.distToCoastKm} <span className="text-base font-medium text-slate-500">km</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Landfall ETA: <strong className="text-amber-600">~{whatIfScenarioOutput.landfallEtaHours.toFixed(1)}h</strong></span>
                    <span className="text-[10px] bg-sky-50 text-[#1E5FBF] px-1.5 py-0.5 rounded font-bold border border-sky-200">
                      {Math.round(whatIfScenarioOutput.netHeadingDeg)}° ESE
                    </span>
                  </div>
                </div>

                {/* KPI 3: Coastline Exposure Length */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        EST. SHORELINE EXPOSURE
                      </span>
                      <Waves className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-amber-600 font-display mt-2">
                      {environmentalImpactOutput.shorelineExposureKm} <span className="text-base font-medium text-slate-500">km</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Target: <strong className="text-slate-800">Alibaug-Murud</strong></span>
                    <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-bold border border-amber-200">High Risk</span>
                  </div>
                </div>

                {/* KPI 4: Sensitive Habitats Affected */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        SENSITIVE BIOMES IN DANGER
                      </span>
                      <Trees className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-600 font-display mt-2">
                      {environmentalImpactOutput.affectedZonesCount} <span className="text-base font-medium text-slate-500">/ 5 Zones</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Mangrove &amp; Coral</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-200">INCOIS GIS</span>
                  </div>
                </div>
              </div>

              {/* 3. 2-COLUMN MAIN ENVIRONMENTAL WORKBENCH GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: ENVIRONMENTAL IMPACT SCORE & "WHY THIS IMPACT?" (col-span-5) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Environmental Impact Score Card */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Dynamic Environmental Impact Score
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        98.4% Confidence
                      </span>
                    </div>

                    {/* Radial Score Centerpiece */}
                    <div className="flex items-center justify-center gap-6 p-4 rounded-2xl bg-gradient-to-br from-[#0B2545] to-[#123A66] text-white">
                      <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-700"
                            strokeWidth="3.2"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={
                              environmentalImpactOutput.overallEnvScore >= 80
                                ? "text-rose-500"
                                : environmentalImpactOutput.overallEnvScore >= 60
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }
                            strokeDasharray={`${environmentalImpactOutput.overallEnvScore}, 100`}
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl font-black font-display tracking-tight">
                            {environmentalImpactOutput.overallEnvScore}
                          </span>
                          <span className="text-[9px] font-mono text-slate-300">/ 100</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-sky-300 font-bold block">
                          Composite Threat Level
                        </span>
                        <h4 className="text-base font-extrabold font-display leading-tight text-white">
                          {environmentalImpactOutput.riskTier}
                        </h4>
                        <p className="text-[11px] text-slate-300 font-body leading-tight">
                          Weighted multi-pillar index evaluating coastal proximity, mangrove nurseries, and water column toxicity.
                        </p>
                      </div>
                    </div>

                    {/* 5-Pillar Score Breakdown Progress Bars */}
                    <div className="space-y-3 pt-1">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block font-mono">
                        Explainable Component Scores
                      </span>

                      {[
                        { label: "Marine Surface Exposure", score: environmentalImpactOutput.marineExposureScore, color: "bg-[#1E5FBF]" },
                        { label: "Coastal Proximity Vulnerability", score: environmentalImpactOutput.coastalProximityScore, color: "bg-rose-500" },
                        { label: "Protected Area (MPA) Danger", score: environmentalImpactOutput.mpaVulnerabilityScore, color: "bg-emerald-500" },
                        { label: "Commercial Fisheries Exposure", score: environmentalImpactOutput.fisheriesImpactScore, color: "bg-amber-500" },
                        { label: "Water Column PAH Toxicity", score: environmentalImpactOutput.waterQualityPahScore, color: "bg-indigo-500" },
                      ].map((p, idx) => (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between font-medium">
                            <span className="text-slate-700">{p.label}</span>
                            <span className="font-mono font-bold text-slate-900">{Math.round(p.score)}/100</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${p.color} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.min(100, Math.max(5, p.score))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* "WHY THIS IMPACT?" Panel */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#E1EEF9]">
                      <Brain className="w-4 h-4 text-[#1E5FBF]" />
                      <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                        WHY THIS IMPACT? &mdash; FORENSIC ATTRIBUTION LOGIC
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {environmentalImpactOutput.envExplanationPoints.map((pt, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1.5 transition-all hover:border-sky-200"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0B2545] font-display">
                              {pt.title}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              pt.status.includes("CRITICAL")
                                ? "bg-rose-100 text-rose-800"
                                : pt.status.includes("HIGH") || pt.status.includes("ACTIVE")
                                ? "bg-amber-100 text-amber-800"
                                : "bg-sky-100 text-sky-800"
                            }`}>
                              {pt.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-body leading-relaxed">
                            {pt.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sensitive Ecological Zones List */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <Trees className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Surveyed Marine Protected Areas &amp; Habitats
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Click to inspect</span>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {SENSITIVE_ECOLOGICAL_ZONES.map((zone) => {
                        const isSelected = selectedEnvZoneId === zone.id;
                        return (
                          <div
                            key={zone.id}
                            onClick={() => setSelectedEnvZoneId(zone.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                              isSelected
                                ? "bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-300/40 shadow-xs"
                                : "bg-[#F8FBFE] border-[#E1EEF9] hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#0B2545] font-display">
                                {zone.name}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                                {zone.distanceKm} km away
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 font-body">
                              <strong className="text-slate-800">Biome:</strong> {zone.type}
                            </div>
                            {isSelected && (
                              <div className="pt-2 mt-2 border-t border-emerald-200/60 space-y-1 text-[11px] font-mono text-slate-600">
                                <div>Key Species: <strong className="text-slate-800">{zone.keySpecies}</strong></div>
                                <div>Shoreline Type: <span className="text-slate-700">{zone.shorelineType}</span></div>
                                <div>Est. Ecological Recovery: <strong className="text-amber-700">{zone.recoveryYears}</strong></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: MAIN MAP VISUALIZATION + TIMELINE + HORIZON MATRIX (col-span-7) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Main Interactive Environmental Map Visualization */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <MapIcon className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Environmental Spill Footprint &amp; Protected Habitat Advection Map
                        </h3>
                      </div>

                      {/* 5-Step Timeline Selector (Current, +6h, +12h, +24h, +48h) */}
                      <div className="flex items-center gap-1 bg-[#F0F7FD] p-1 rounded-xl border border-[#E1EEF9]">
                        {(["Current", "+6h", "+12h", "+24h", "+48h"] as const).map((step) => {
                          const isActive = envTimelineStep === step;
                          return (
                            <button
                              key={step}
                              onClick={() => {
                                setEnvTimelineStep(step);
                                triggerToast(`Environmental simulation shifted to ${step} forecast horizon`);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                isActive
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-[#0B2545] hover:bg-white/80"
                              }`}
                            >
                              {step}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Environmental GIS Map Canvas */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                      <AdvancedSpillMap
                        simulationParams={{
                          centroid: [18.69, 72.38],
                          windSpeedKts: Number((whatIfWindSpeed * 1.94384).toFixed(1)),
                          windDirDeg: whatIfWindDir,
                          currentSpeedKts: Number((whatIfCurrentSpeed * 1.94384).toFixed(1)),
                          currentDirDeg: 189,
                          releaseVolumeM3: 18000,
                          containmentEffPct: Math.min(90, Math.round((whatIfBoomLength / 5000) * 80)),
                          chemicalDispersant: whatIfChemicalDispersant,
                          responseDelayHours: envTimelineOffsetHours,
                        }}
                        height={440}
                        onSelectVessel={(v) => {
                          setSelectedCandidate(v);
                          triggerToast(`Selected ${v.name} on environmental map`);
                        }}
                        onOpenReportModal={() => {
                          setReportStage("environmental");
                          setShowReportModal(true);
                        }}
                        onTriggerToast={triggerToast}
                      />

                      {/* Environmental Overlay Legend Badge */}
                      <div className="absolute bottom-3 left-3 bg-[#0B2545]/90 backdrop-blur-md text-white p-3 rounded-xl border border-sky-400/30 text-xs font-mono space-y-1.5 z-20 shadow-xl max-w-xs">
                        <div className="text-[10px] text-sky-300 font-bold uppercase">
                          Forecast Horizon: {envTimelineStep} (T+{envTimelineOffsetHours}h)
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500" />
                            <span>Heavy Core: {environmentalImpactOutput.coreSlickAreaKm2} km²</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-400" />
                            <span>Dispersed Exposure: {environmentalImpactOutput.totalExposureAreaKm2} km²</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-400" />
                            <span>Protected MPAs: {environmentalImpactOutput.affectedZonesCount} within plume</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Horizon Ecological Damage & Recovery Matrix */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Multi-Horizon Ecological Damage &amp; Recovery Trajectory
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">CPCB Marine Water Guidelines</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {/* Short-Term (0-72h) */}
                      <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-700 font-display">
                            Short-Term (0 &ndash; 72h)
                          </span>
                          <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                            Acute
                          </span>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside font-body">
                          <li>Surface film asphyxiation of pelagic ichthyoplankton</li>
                          <li>Direct feather fouling of coastal shorebirds</li>
                          <li>Dissolved aromatic hydrocarbon water-column surge</li>
                        </ul>
                      </div>

                      {/* Medium-Term (3-30d) */}
                      <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-700 font-display">
                            Medium-Term (3 &ndash; 30d)
                          </span>
                          <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                            Sub-Acute
                          </span>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside font-body">
                          <li>Mangrove pneumatophore coating &amp; salt-gland clogging</li>
                          <li>Benthic sediment contamination in intertidal mudflats</li>
                          <li>Trophic level bioaccumulation in artisanal fish catches</li>
                        </ul>
                      </div>

                      {/* Long-Term (1-5y) */}
                      <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-700 font-display">
                            Long-Term (1 &ndash; 5y)
                          </span>
                          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            Remediation
                          </span>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside font-body">
                          <li>Sub-surface tar ball persistence in intertidal zones</li>
                          <li>Multi-year recruitment deficit in Olive Ridley sea turtles</li>
                          <li>Bioremediation &amp; marsh sediment flushing required</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Water-Quality Risk & Chemical Toxicity Indicators */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#1E5FBF]" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Water Quality Risk Indicators &amp; Chemical Thresholds
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-sky-50 text-[#1E5FBF] px-2 py-0.5 rounded font-bold border border-sky-200">
                        EPA Tier-1 Exceeded
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1">
                        <span className="text-slate-400 text-[10px] block">Dissolved PAH Concentration</span>
                        <strong className="text-rose-600 text-sm block">8.4 µg/L (16.8x Limit)</strong>
                        <span className="text-[10px] text-slate-500 font-sans">Safe Threshold: &lt; 0.5 µg/L</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1">
                        <span className="text-slate-400 text-[10px] block">Dissolved Oxygen (DO) Depletion</span>
                        <strong className="text-amber-600 text-sm block">-42% in upper 5m</strong>
                        <span className="text-[10px] text-slate-500 font-sans">Hypoxic boundary threat</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1">
                        <span className="text-slate-400 text-[10px] block">SAR Backscatter Damping (Δσ⁰)</span>
                        <strong className="text-[#1E5FBF] text-sm block">-7.8 dB (Confirmed Mineral)</strong>
                        <span className="text-[10px] text-emerald-700 font-sans">Biogenic films rejected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: ECONOMIC & COST IMPACT ANALYSIS LAB                        */}
          {/* ================================================================= */}
          {activeTab === "economic" && (
            <div className="space-y-6 animate-fadeIn">
              {/* 1. TOP COMMAND & FINANCIAL FORENSICS RIBBON */}
              <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B2545] to-[#1E5FBF] flex items-center justify-center text-white shadow-md">
                      <IndianRupee className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 text-[#1E5FBF] border border-sky-200 uppercase">
                          STAGE 15 &amp; 16: ECONOMIC &amp; FINANCIAL FORENSICS
                        </span>
                        <h2 className="text-sm sm:text-base font-bold text-[#0B2545] font-display">
                          Economic, Clean-Up Cost &amp; Statutory Liability Forensics
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 font-body mt-0.5">
                        Comprehensive valuation of direct marine response expenditures, coastal remediation, port/fishery disruptions, and IOPC compensation limits.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      4 SCENARIO COMPARATIVE MODEL
                    </span>
                    <button
                      onClick={() => {
                        setReportStage("economic");
                        setShowReportModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] hover:from-[#174EA6] hover:to-[#2275C6] text-white text-xs font-bold font-body flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      title="Generate certified economic impact PDF dossier"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Generate Economic Impact Report</span>
                    </button>
                  </div>
                </div>

                {/* Financial Formula Callout Box */}
                <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200 flex items-center justify-between flex-wrap gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#0B2545] font-semibold flex-wrap">
                    <span className="bg-white px-2 py-1 rounded border border-sky-200 text-[#1E5FBF]">
                      DIRECT RESPONSE (₹{economicImpactOutput.totalDirectResponseCostCr} Cr)
                    </span>
                    <span>+</span>
                    <span className="bg-white px-2 py-1 rounded border border-sky-200 text-emerald-700">
                      RESTORATION (₹{economicImpactOutput.totalRestorationCostCr} Cr)
                    </span>
                    <span>+</span>
                    <span className="bg-white px-2 py-1 rounded border border-sky-200 text-amber-700">
                      ECONOMIC LOSS (₹{economicImpactOutput.totalEconomicLossMinCr} - ₹{economicImpactOutput.totalEconomicLossMaxCr} Cr)
                    </span>
                    <span>=</span>
                    <span className="bg-[#0B2545] text-white px-2.5 py-1 rounded font-bold">
                      TOTAL IMPACT (₹{economicImpactOutput.grandTotalMinCr} - ₹{economicImpactOutput.grandTotalMaxCr} Cr)
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. TOP 4 DYNAMIC FINANCIAL KPI METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Grand Total Financial Impact */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        TOTAL ESTIMATED IMPACT
                      </span>
                      <IndianRupee className="w-4 h-4 text-[#1E5FBF]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] font-display mt-2">
                      ₹{economicImpactOutput.grandTotalMinCr} <span className="text-sm font-semibold text-slate-500">&ndash; ₹{economicImpactOutput.grandTotalMaxCr} Cr</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>All 3 cost tiers</span>
                    <span className="text-[10px] bg-sky-50 text-[#1E5FBF] px-1.5 py-0.5 rounded font-bold border border-sky-200">Confidence: 94%</span>
                  </div>
                </div>

                {/* KPI 2: Direct Response & Skimming */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        DIRECT RESPONSE &amp; SKIMMING
                      </span>
                      <Ship className="w-4 h-4 text-[#1E5FBF]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#1E5FBF] font-display mt-2">
                      ₹{economicImpactOutput.totalDirectResponseCostCr} <span className="text-base font-medium text-slate-500">Cr</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Vessels: ₹{economicImpactOutput.vesselDeploymentCostCr} Cr</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">Boom: ₹{economicImpactOutput.boomDeploymentCostCr} Cr</span>
                  </div>
                </div>

                {/* KPI 3: Remediation & Restoration */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        SHORELINE REMEDIATION
                      </span>
                      <Trees className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-display mt-2">
                      ₹{economicImpactOutput.totalRestorationCostCr} <span className="text-base font-medium text-slate-500">Cr</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Mangrove Soil: ₹{(14.5 * (whatIfScenarioOutput.projectedArea24h / 19.8)).toFixed(1)} Cr</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">5yr Monitoring</span>
                  </div>
                </div>

                {/* KPI 4: Cost Avoided by Early Response */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        COST AVOIDED (EARLY ACTION)
                      </span>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-display mt-2">
                      ₹{economicImpactOutput.costAvoidedCr} <span className="text-base font-medium text-slate-500">Cr</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>vs. 8h Delayed Dispatch</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-200">ROI: +340%</span>
                  </div>
                </div>
              </div>

              {/* 3. 2-COLUMN MAIN ECONOMIC WORKBENCH GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: 4-SCENARIO COST MODEL + CHARTS (col-span-5) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* 4-Scenario Cost Model Comparison Table */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-[#1E5FBF]" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Multi-Scenario Economic Cost Model
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Baseline vs What-If</span>
                    </div>

                    <div className="space-y-3">
                      {economicImpactOutput.costScenarios.map((sc, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2 hover:border-sky-300 transition-all shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0B2545] font-display">
                              {sc.scenario}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${sc.tagColor}`}>
                              {sc.tag}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                            <div>
                              <span className="text-slate-400 text-[10px] block font-sans">Direct Response:</span>
                              <strong className="text-slate-800">{sc.directResponseCr}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block font-sans">Remediation:</span>
                              <strong className="text-slate-800">{sc.restorationCr}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block font-sans">Economic Loss:</span>
                              <span className="text-amber-700">{sc.economicLossCr}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] block font-sans">Total Est. Cost:</span>
                              <strong className="text-[#0B2545] text-xs font-bold">{sc.totalCostCr}</strong>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs font-mono">
                            <span className="text-slate-500 font-sans">Differential vs Baseline:</span>
                            <span className={sc.diffColor}>{sc.costDifferential}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost Breakdown by Response Category Bar Chart */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-[#1E5FBF]" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Cost Breakdown by Response Category (₹ Crores)
                        </h3>
                      </div>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={economicImpactOutput.costBreakdownChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                          <XAxis dataKey="category" tick={{ fontSize: 9, fill: "#64748B" }} angle={-25} textAnchor="end" interval={0} />
                          <YAxis tick={{ fontSize: 10, fill: "#64748B" }} unit=" Cr" />
                          <RechartsTooltip formatter={(v: any) => [`₹${v} Cr`, "Estimated Cost"]} />
                          <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                            {economicImpactOutput.costBreakdownChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Exponential Cost Escalation Curve (Cost vs Delay) */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-rose-500" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Cost Escalation vs. Response Delay (₹ Cr &amp; Days)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-bold">
                        Exponential Lag Penalty
                      </span>
                    </div>

                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={economicImpactOutput.delayCurveData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="delay" tick={{ fontSize: 9, fill: "#64748B" }} />
                          <YAxis tick={{ fontSize: 10, fill: "#64748B" }} unit=" Cr" />
                          <RechartsTooltip />
                          <Line type="monotone" dataKey="cost" name="Estimated Cost (₹ Cr)" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: "#EF4444" }} />
                          <Line type="monotone" dataKey="cleanupDays" name="Clean-up Duration (Days)" stroke="#1E5FBF" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3, fill: "#1E5FBF" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: ECONOMIC ASSET MAP + ASSET TABLE + IOPC FUND (col-span-7) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Economic Asset Proximity GIS Map */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#1E5FBF]" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Vulnerable Coastal Commercial Assets &amp; Navigation Fairways
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-sky-50 text-[#1E5FBF] px-2 py-0.5 rounded font-bold border border-sky-200">
                        5 Key Maritime Infrastructure Nodes
                      </span>
                    </div>

                    {/* Embedded Mini Incident Map showing assets */}
                    <div className="rounded-2xl overflow-hidden border border-slate-200 h-80">
                      <IncidentMiniMap
                        center={[18.69, 72.38]}
                        vessels={dynamicMapVessels}
                        cgAssets={dynamicMapAssets}
                        forecastTrack={lagrangianOutput.forecastPath}
                        onSelectVessel={(v) => {
                          const match = candidates.find((c) => c.name === v.name || c.id === v.id);
                          if (match) setSelectedCandidate(match);
                        }}
                      />
                    </div>
                  </div>

                  {/* Detailed Economic Asset Exposure Table */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Maritime Infrastructure &amp; Economic Assets at Risk
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Click asset to inspect</span>
                    </div>

                    <div className="space-y-3">
                      {ECONOMIC_COASTAL_ASSETS.map((asset) => {
                        const isSelected = selectedEconomicAssetId === asset.id;
                        return (
                          <div
                            key={asset.id}
                            onClick={() => setSelectedEconomicAssetId(asset.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                              isSelected
                                ? "bg-sky-50/70 border-[#1E5FBF] ring-2 ring-sky-300/40 shadow-xs"
                                : "bg-[#F8FBFE] border-[#E1EEF9] hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-bold text-xs text-[#0B2545] font-display">
                                  {asset.name}
                                </span>
                                <span className="text-[11px] text-slate-500 font-body block">
                                  {asset.type} &bull; {asset.location}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  asset.riskLevel.includes("HIGH")
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}>
                                  {asset.riskLevel}
                                </span>
                                <span className="text-xs font-mono font-bold text-rose-600 block mt-1">
                                  Est. Loss: {asset.potentialLossCr}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-200/60">
                              <div>Distance: <strong className="text-slate-800">{asset.distanceKm} km</strong></div>
                              <div>Annual Traffic: <strong className="text-slate-800">{asset.annualTrafficValCr}</strong></div>
                              <div className="col-span-2 sm:col-span-1">Impact: <span className="text-slate-700 truncate block">{asset.assetValue}</span></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* IOPC Fund & Merchant Shipping Act Statutory Liability Allocation Matrix */}
                  <div className="p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          IOPC Compensation Funds &amp; Merchant Shipping Act Liability
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        MARPOL &amp; CLC Admissible
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-mono">
                      {/* Tier 1 */}
                      <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Tier-1: Shipowner CLC Limit
                        </span>
                        <strong className="text-base font-extrabold text-[#0B2545] block">
                          89.77M SDR
                        </strong>
                        <span className="text-[11px] text-slate-600 font-body block">
                          ~ ₹980 Cr strict liability backed by P&amp;I Club financial guarantee (1992 CLC Protocol).
                        </span>
                      </div>

                      {/* Tier 2 */}
                      <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Tier-2: 1992 IOPC Fund
                        </span>
                        <strong className="text-base font-extrabold text-[#1E5FBF] block">
                          203M SDR
                        </strong>
                        <span className="text-[11px] text-slate-600 font-body block">
                          ~ ₹2,215 Cr global oil receiver contributions if shipowner liability is exceeded.
                        </span>
                      </div>

                      {/* Tier 3 */}
                      <div className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Tier-3: Supplementary Fund
                        </span>
                        <strong className="text-base font-extrabold text-emerald-700 block">
                          750M SDR
                        </strong>
                        <span className="text-[11px] text-slate-600 font-body block">
                          ~ ₹8,190 Cr disaster umbrella for catastrophic EEZ shoreline contamination.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: MODEL CONFIDENCE & LOOK-ALIKE REJECTION LAB               */}
          {/* ================================================================= */}
          {activeTab === "confidence" && (
            <div className="space-y-6 animate-fadeIn">
              {/* TOP ROW: 4 PRIMARY METRIC CARDS (Matching Reference Screenshot) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Overall Segmentation Confidence */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      OVERALL SEGMENTATION CONFIDENCE
                    </div>
                    <div className="text-3xl font-extrabold text-[#059669] font-display mt-2">
                      {currentModelProfile.confidence.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>{currentModelProfile.subModel}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">F1: {currentModelProfile.f1Score}</span>
                  </div>
                </div>

                {/* 2. False-Positive Rejection Rate */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      FALSE-POSITIVE REJECTION RATE
                    </div>
                    <div className="text-3xl font-extrabold text-[#1E5FBF] font-display mt-2">
                      {currentModelProfile.rejectionRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>{currentModelProfile.rejectionSub}</span>
                    <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-bold">45 Passes</span>
                  </div>
                </div>

                {/* 3. SAR Image Processing Latency */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      SAR IMAGE PROCESSING LATENCY
                    </div>
                    <div className="text-3xl font-extrabold text-[#0B2545] font-display mt-2">
                      {currentModelProfile.latency}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>{currentModelProfile.latencySub}</span>
                    <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">FP16</span>
                  </div>
                </div>

                {/* 4. Validation Dataset Coverage */}
                <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      VALIDATION DATASET COVERAGE
                    </div>
                    <div className="text-3xl font-extrabold text-[#0B2545] font-display mt-2">
                      {currentModelProfile.coverage}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>{currentModelProfile.coverageSub}</span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-bold">INCOIS</span>
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW: 2-COLUMN MAIN LAB VIEW (Line Chart Trend + Rejection Artifacts) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT PANEL: Detection Accuracy Trend (Last 7 Satellite Passes) */}
                <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
                      <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-mono">
                        DETECTION ACCURACY TREND (LAST 7 SATELLITE PASSES)
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-0.5 bg-[#10B981] border-b border-dashed border-[#10B981]" />
                          Theoretical Upper Bound
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#1E5FBF]" />
                          Satellite Pass Accuracy
                        </span>
                      </div>
                    </div>

                    {/* Interactive Pass Selector Chips */}
                    <div className="flex items-center justify-between gap-1.5 py-3 overflow-x-auto">
                      <div className="flex items-center gap-1.5">
                        {SATELLITE_ACCURACY_TREND.map((p) => {
                          const isSelected = selectedSatellitePass === p.pass;
                          return (
                            <button
                              key={p.pass}
                              onClick={() => {
                                setSelectedSatellitePass(p.pass);
                                triggerToast(`Inspecting SAR telemetry for pass ${p.pass}`);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#1E5FBF] text-white shadow-xs scale-105"
                                  : "bg-[#F8FBFE] text-slate-600 hover:bg-[#E1EEF9] border border-[#E1EEF9]"
                              }`}
                            >
                              {p.pass}
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                        Click pass or curve to inspect
                      </span>
                    </div>

                    {/* Recharts Line Chart */}
                    <div className="h-64 w-full mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={SATELLITE_ACCURACY_TREND}
                          margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
                          onClick={(e) => {
                            if (e && e.activeLabel !== undefined) {
                              const passStr = String(e.activeLabel);
                              setSelectedSatellitePass(passStr);
                              triggerToast(`Inspecting SAR telemetry for pass ${passStr}`);
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                          <XAxis
                            dataKey="pass"
                            tick={{ fontSize: 11, fill: "#64748B", fontFamily: "JetBrains Mono" }}
                            axisLine={{ stroke: "#E2E8F0" }}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[85, 100]}
                            ticks={[85, 89, 93, 97, 100]}
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fontSize: 10, fill: "#64748B", fontFamily: "JetBrains Mono" }}
                            axisLine={{ stroke: "#E2E8F0" }}
                            tickLine={false}
                          />
                          <RechartsTooltip content={<CustomTrendTooltip />} />
                          {/* Theoretical Baseline / Benchmark Dotted Green Line */}
                          <Line
                            type="monotone"
                            dataKey="benchmark"
                            name="Theoretical Baseline"
                            stroke="#10B981"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={{ r: 3, fill: "#10B981", strokeWidth: 0 }}
                            isAnimationActive={true}
                          />
                          {/* Satellite Pass Actual Blue Line with Interactive Dots */}
                          <Line
                            type="monotone"
                            dataKey="actual"
                            name="Satellite Pass Accuracy"
                            stroke="#1E5FBF"
                            strokeWidth={2.5}
                            dot={{ r: 5, fill: "#1E5FBF", stroke: "#FFFFFF", strokeWidth: 2 }}
                            activeDot={{ r: 7, fill: "#0B2545", stroke: "#1E5FBF", strokeWidth: 2 }}
                            isAnimationActive={true}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Dynamic Inspected Satellite Pass Telemetry Banner */}
                  {activePassData && (
                    <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] flex items-center justify-between flex-wrap gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0B2545] font-display">
                            {activePassData.pass === "Current" ? "🔴 Live Satellite Pass" : `Pass ${activePassData.pass}`}: {activePassData.sensor}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                            {activePassData.actual}% Confirmed Accuracy
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {activePassData.date} &bull; Wind: <strong className="text-slate-700">{activePassData.windSpeed}</strong> &bull; Res: <strong className="text-slate-700">{activePassData.resolution}</strong> &bull; Pol: <strong className="text-slate-700">{activePassData.polarization}</strong>
                        </p>
                      </div>
                      <div className="text-right text-[11px] font-mono">
                        <span className="text-slate-500">Backscatter Damping: </span>
                        <strong className="text-[#1E5FBF] font-bold">{activePassData.dampingDb}</strong>
                        <div className="text-[10px] text-emerald-700 font-semibold">{activePassData.rejectionStatus}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT PANEL: Look-Alike Rejection Artifacts (Matching Screenshot) */}
                <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] flex flex-col justify-between space-y-4">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
                      <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-mono">
                        LOOK-ALIKE REJECTION ARTIFACTS
                      </h3>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        3/3 Filters Online
                      </span>
                    </div>

                    {/* 3 Rejection Artifact Items matching screenshot */}
                    <div className="space-y-3">
                      {/* Item 1: Low-Wind Calm Ocean */}
                      <div className="p-3.5 rounded-xl bg-white border border-[#E1EEF9] hover:border-emerald-300 transition-all shadow-xs space-y-1.5 group">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-800 font-display group-hover:text-[#1E5FBF] transition-colors">
                            Low-Wind Calm Ocean (Wind &lt; 2.5 m/s)
                          </span>
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            Rejected (Non-Hazard)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-body leading-relaxed">
                          Specular reflection causes dark radar patches; rejected using ERA5 10m wind threshold.
                        </p>
                      </div>

                      {/* Item 2: Biogenic Natural Slick */}
                      <div className="p-3.5 rounded-xl bg-white border border-[#E1EEF9] hover:border-emerald-300 transition-all shadow-xs space-y-1.5 group">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-800 font-display group-hover:text-[#1E5FBF] transition-colors">
                            Biogenic Natural Slick (Algal Bloom)
                          </span>
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            Rejected (Biological)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-body leading-relaxed">
                          Natural monomolecular surfactant layer; rejected via VV/VH dual-pol cross-ratio.
                        </p>
                      </div>

                      {/* Item 3: Internal Gravity Waves */}
                      <div className="p-3.5 rounded-xl bg-white border border-[#E1EEF9] hover:border-emerald-300 transition-all shadow-xs space-y-1.5 group">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-800 font-display group-hover:text-[#1E5FBF] transition-colors">
                            Internal Gravity Waves
                          </span>
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            Filtered (Wave Artifact)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-body leading-relaxed">
                          Periodic dark and bright linear bands; rejected by spatiotemporal Fourier texture filter.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Neural Backbone Footer Note (Matching Reference Screenshot) */}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-mono text-slate-500 leading-relaxed">
                      Neural Backbone: {currentModelProfile.backboneDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* DYNAMIC INTERACTION: AI ARCHITECTURE SWITCHER & REJECTION SANDBOX BAR */}
              <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#1E5FBF]" />
                    <h4 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      Neural Model Architecture &amp; Rejection Diagnostics
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {(["Adaptive U-Net v2.1", "Swin-Transformer v2", "ResNet-50 FPN Dual-Pol"] as const).map((modelName) => (
                      <button
                        key={modelName}
                        onClick={() => {
                          setSelectedModelArch(modelName);
                          triggerToast(`Switched inference pipeline to ${modelName}`);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
                          selectedModelArch === modelName
                            ? "bg-[#0B2545] text-white shadow-xs scale-105"
                            : "bg-[#F8FBFE] text-slate-600 border border-[#E1EEF9] hover:bg-[#E1EEF9]"
                        }`}
                      >
                        {modelName}
                      </button>
                    ))}

                    <button
                      onClick={() => setShowSandbox(!showSandbox)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-body flex items-center gap-1.5 transition-all cursor-pointer ${
                        showSandbox
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{showSandbox ? "Hide Sandbox" : "Live Rejection Sandbox"}</span>
                    </button>
                  </div>
                </div>

                {/* Live Rejection Sandbox Drawer */}
                {showSandbox && (
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 font-display">
                        Interactive Look-Alike Filter Simulation Sandbox
                      </span>
                      <span className="text-[10px] font-mono text-amber-800">
                        Adjust telemetry to observe automated rejection triggers
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      {/* Wind Speed Simulator */}
                      <div className="space-y-1.5 bg-white p-3 rounded-lg border border-amber-200">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-sans font-semibold">Simulate Ocean Wind:</span>
                          <strong className={simulatedRejectionWind < 2.5 ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"}>
                            {simulatedRejectionWind.toFixed(1)} m/s {simulatedRejectionWind < 2.5 ? "(REJECTED: Calm Ocean)" : "(VALID Bragg Waves)"}
                          </strong>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="12.0"
                          step="0.1"
                          value={simulatedRejectionWind}
                          onChange={(e) => setSimulatedRejectionWind(parseFloat(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-500 font-sans">
                          {simulatedRejectionWind < 2.5
                            ? "⚠️ Wind < 2.5 m/s triggers specular mirror reflection rejection filter."
                            : "✅ Sufficient wind (> 2.5 m/s) ensures reliable capillary radar backscatter contrast."}
                        </p>
                      </div>

                      {/* Polarization Cross-Ratio Simulator */}
                      <div className="space-y-1.5 bg-white p-3 rounded-lg border border-amber-200">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-sans font-semibold">Simulate VV/VH Ratio:</span>
                          <strong className={simulatedCrossPolDb > -4.0 ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>
                            {simulatedCrossPolDb.toFixed(1)} dB {simulatedCrossPolDb > -4.0 ? "(REJECTED: Biological Surfactant)" : "(VALID Mineral Hydrocarbon)"}
                          </strong>
                        </div>
                        <input
                          type="range"
                          min="-12.0"
                          max="0.0"
                          step="0.2"
                          value={simulatedCrossPolDb}
                          onChange={(e) => setSimulatedCrossPolDb(parseFloat(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-500 font-sans">
                          {simulatedCrossPolDb > -4.0
                            ? "⚠️ Dual-pol ratio indicates monomolecular biological film (algal bloom)."
                            : "✅ Low cross-polarization ratio confirms heavy petroleum damping signature."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Toggle to view 7D Evidentiary Attribution Spectrum & Component Weights */}
                <div className="border-t border-[#E1EEF9] pt-3 flex items-center justify-between flex-wrap gap-2">
                  <button
                    onClick={() => setShowAttributionDeepDive(!showAttributionDeepDive)}
                    className="text-xs font-bold text-[#1E5FBF] hover:text-[#0B2545] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>
                      {showAttributionDeepDive
                        ? "Hide 7D Evidentiary Radar Spectrum & MARPOL Proof Weights"
                        : "Expand 7D Evidentiary Radar Spectrum & MARPOL Proof Weights Table"}
                    </span>
                    {showAttributionDeepDive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <span className="text-[11px] font-mono text-slate-500">
                    F1-Score: <strong className="text-emerald-700">{currentModelProfile.f1Score}</strong> &bull; IoU: <strong className="text-emerald-700">{currentModelProfile.iouScore}</strong> &bull; Framework: <strong className="text-[#0B2545]">{currentModelProfile.framework || "TensorRT"}</strong>
                  </span>
                </div>

                {/* Expandable 7D Evidentiary Radar & Component Attribution Weights */}
                {showAttributionDeepDive && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 animate-fadeIn">
                    {/* Radar Chart */}
                    <div className="lg:col-span-6 p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <h5 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          7D Evidentiary Radar Spectrum
                        </h5>
                        <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Score: {modelConfidenceBreakdown.overallConfidence}%
                        </span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={modelConfidenceBreakdown.radarData}>
                            <PolarGrid stroke="#CBD5E1" />
                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#475569" }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                            <Radar name={selectedCandidate.name} dataKey="candidate" stroke="#E11D48" fill="#E11D48" fillOpacity={0.4} />
                            <Radar name="Baseline Benchmark" dataKey="benchmark" stroke="#1E5FBF" fill="#1E5FBF" fillOpacity={0.15} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <RechartsTooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Component Breakdown Table */}
                    <div className="lg:col-span-6 p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                        <h5 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Component Attribution Weights
                        </h5>
                        <span className="text-[10px] font-mono text-slate-500">
                          MARPOL Annex I Proof Standards
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-[#E1EEF9] bg-white">
                        <table className="w-full text-left text-xs font-body">
                          <thead className="bg-[#0B2545] text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                            <tr>
                              <th className="p-2">Evidentiary Pillar</th>
                              <th className="p-2">Weight</th>
                              <th className="p-2">Score</th>
                              <th className="p-2 text-right">Contribution</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E1EEF9] text-slate-700">
                            {modelConfidenceBreakdown.radarData.map((row, i) => {
                              const weights = [0.2, 0.15, 0.2, 0.15, 0.15, 0.15, 0.1];
                              const weight = weights[i] || 0.15;
                              const contrib = (row.candidate * weight).toFixed(1);
                              return (
                                <tr key={i} className="hover:bg-[#F8FBFE]">
                                  <td className="p-2 font-semibold text-[#0B2545]">{row.metric}</td>
                                  <td className="p-2 font-mono text-slate-500">{(weight * 100).toFixed(0)}%</td>
                                  <td className="p-2 font-mono font-bold text-slate-800">{row.candidate.toFixed(1)}%</td>
                                  <td className="p-2 font-mono font-bold text-rose-600 text-right">+{contrib}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: HISTORICAL ANALOGUE BENCHMARKING                           */}
          {/* ================================================================= */}
          {activeTab === "historical" && (
            <div className="space-y-6 animate-fadeIn">
              {/* TOP ROW: 4 HISTORICAL BENCHMARK KPI SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                      TOP HISTORICAL ANALOGUE
                    </span>
                    <span className="text-xl font-extrabold text-[#0B2545] font-display mt-1 block">
                      MSC Chitra (2010)
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Hydrodynamic Match</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">89.4% Match</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                      DISPERSION SWELL VARIANCE
                    </span>
                    <span className="text-xl font-extrabold text-[#1E5FBF] font-display mt-1 block">
                      +12.4% Drift Velocity
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Monsoon Amplification</span>
                    <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-bold">Hs = 1.8m Swell</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                      HISTORICAL CONTAINMENT MEAN
                    </span>
                    <span className="text-xl font-extrabold text-amber-600 font-display mt-1 block">
                      64.7% Average
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Target Efficiency</span>
                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold">&gt; 85% with Boom</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.06)] flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                      LEGAL SETTLEMENT PRECEDENT
                    </span>
                    <span className="text-xl font-extrabold text-rose-600 font-display mt-1 block">
                      ₹138 Cr Claims
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Ennore Spill Case</span>
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold">Admiralty Court</span>
                  </div>
                </div>
              </div>

              {/* MAIN HISTORICAL BENCHMARK WORKBENCH */}
              <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#E1EEF9]">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#1E5FBF]" />
                    <div>
                      <h2 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                        Historical Maritime Pollution Analogues &amp; Incident Case Benchmarks
                      </h2>
                      <p className="text-[11px] text-slate-500 font-body">
                        Select a historical incident record below to perform a live differential forensic comparison against Active Case IN-MH-2026.
                      </p>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: "ALL", label: `All (${HISTORICAL_INCIDENTS.length})` },
                      { id: "ARABIAN", label: "Arabian Sea (West Coast)" },
                      { id: "BAY_OF_BENGAL", label: "Bay of Bengal" },
                      { id: "INDIAN_OCEAN", label: "Indian Ocean" },
                      { id: "HIGH_SEVERITY", label: "Critical Severity" },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => {
                          setHistoricalFilter(btn.id);
                          triggerToast(`Filtered analogues by: ${btn.label}`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                          historicalFilter === btn.id
                            ? "bg-[#0B2545] text-white shadow-xs"
                            : "bg-[#F8FBFE] text-slate-600 hover:bg-[#E1EEF9] border border-[#E1EEF9]"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Comparison Table */}
                <div className="overflow-x-auto rounded-xl border border-[#E1EEF9]">
                  <table className="w-full text-left text-xs font-body">
                    <thead className="bg-[#0B2545] text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                      <tr>
                        <th className="p-3">Incident Reference</th>
                        <th className="p-3">Location &amp; Sector</th>
                        <th className="p-3">Spill Area &amp; Volume</th>
                        <th className="p-3">Vessel &amp; Type</th>
                        <th className="p-3">Attribution Mechanism</th>
                        <th className="p-3">Containment</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1EEF9] text-slate-700">
                      {/* Active Live Incident Row */}
                      <tr className="bg-rose-50/50 font-semibold border-b-2 border-rose-200">
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span>IN-MH-2026 (Active Case)</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">12 Sep 2026</span>
                        </td>
                        <td className="p-3 text-slate-800">Mumbai High Offshore (18.69°N, 72.38°E)</td>
                        <td className="p-3 font-mono font-bold text-rose-600">14.2 km² (48,000 m³)</td>
                        <td className="p-3">
                          <span className="font-bold text-[#0B2545]">{selectedCandidate.name}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">IMO {selectedCandidate.imo}</span>
                        </td>
                        <td className="p-3 text-rose-700 font-mono">7D AIS Kinematics + SAR (98.8%)</td>
                        <td className="p-3 font-mono text-emerald-700 font-bold">86.0% (Simulated)</td>
                        <td className="p-3 text-right">
                          <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold border border-rose-200">
                            Active Baseline
                          </span>
                        </td>
                      </tr>

                      {/* Filtered Historical Analogue Rows */}
                      {filteredHistoricalIncidents.map((hi: HistoricalIncident) => {
                        const isSelected = selectedHistoricalId === hi.id;
                        return (
                          <tr
                            key={hi.id}
                            onClick={() => {
                              setSelectedHistoricalId(hi.id);
                              triggerToast(`Loaded comparison for ${hi.name}`);
                            }}
                            className={`transition-all cursor-pointer ${
                              isSelected
                                ? "bg-sky-50/80 border-l-4 border-l-[#1E5FBF]"
                                : "hover:bg-[#F8FBFE]"
                            }`}
                          >
                            <td className="p-3">
                              <div className="font-semibold text-[#0B2545] flex items-center gap-1.5">
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#1E5FBF]" />}
                                <span>{hi.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">{hi.date} ({hi.year})</span>
                            </td>
                            <td className="p-3 text-slate-600">{hi.location}</td>
                            <td className="p-3 font-mono font-semibold text-slate-800">
                              {hi.spillAreaKm2} km² <span className="text-slate-500 font-normal">({hi.spillVolumeTonnes} MT)</span>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800">{hi.vesselName}</span>
                              <span className="text-[10px] text-slate-500 block">{hi.vesselType} ({hi.flag})</span>
                            </td>
                            <td className="p-3 text-slate-600 text-[11px] max-w-[200px] truncate" title={hi.primaryCause}>
                              {hi.primaryCause}
                            </td>
                            <td className="p-3 font-mono text-emerald-700 font-semibold">{hi.containmentRate}%</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedHistoricalId(hi.id);
                                  triggerToast(`Loaded comparison for ${hi.name}`);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#0B2545] text-white shadow-xs"
                                    : "bg-white border border-[#E1EEF9] text-slate-700 hover:bg-[#E1EEF9]"
                                }`}
                              >
                                {isSelected ? "Comparing" : "Compare"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* SIDE-BY-SIDE FORENSIC DIFFERENTIAL COMPARISON CARD */}
                {selectedHistoricalIncident && (
                  <div className="p-5 rounded-2xl bg-[#F8FBFE] border border-sky-200 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2 border-b border-sky-200 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <GitCompare className="w-4 h-4 text-[#1E5FBF]" />
                        <h3 className="text-xs font-bold text-[#0B2545] uppercase tracking-wider font-display">
                          Side-by-Side Forensic Differential: Active Case IN-MH-2026 vs. {selectedHistoricalIncident.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold border border-sky-300">
                        Historical Severity Score: {selectedHistoricalIncident.severityScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-body">
                      {/* Left: Active Case Parameters */}
                      <div className="p-4 rounded-xl bg-white border border-[#E1EEF9] space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="font-bold text-rose-700 uppercase font-display flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Active Case IN-MH-2026 (Live)
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">Arabian Sea Sector</span>
                        </div>
                        <div className="space-y-1.5 font-mono text-[11px]">
                          <div className="flex justify-between"><span className="text-slate-500 font-sans">Spill Area:</span><strong className="text-slate-800">14.2 km² (48,000 m³)</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-sans">Response Time:</span><strong className="text-emerald-700">2.0 Hours (Automated AI Trigger)</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-sans">Containment Efficiency:</span><strong className="text-emerald-700">86.0% (With Rapid Boom Deployment)</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-sans">Suspect Vessel:</span><strong className="text-[#0B2545]">{selectedCandidate.name} (IMO {selectedCandidate.imo})</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-sans">Attribution Certainty:</span><strong className="text-rose-600">98.8% (7D Kinematic + SAR Verification)</strong></div>
                        </div>
                      </div>

                      {/* Right: Selected Historical Analogue */}
                      <div className="p-4 rounded-xl bg-white border border-[#E1EEF9] space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="font-bold text-[#0B2545] uppercase font-display flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-amber-500" />
                            {selectedHistoricalIncident.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{selectedHistoricalIncident.region}</span>
                        </div>
                        <div className="space-y-1.5 font-mono text-[11px]">
                          <div className="flex justify-between"><span className="text-slate-500 font-sans">Spill Area / Volume:</span><strong className="text-slate-800">{selectedHistoricalIncident.spillAreaKm2} km² ({selectedHistoricalIncident.spillVolumeTonnes} MT)</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-sans">Response Time:</span><strong className="text-amber-700">{selectedHistoricalIncident.responseTimeHours} Hours</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-sans">Containment Efficiency:</span><strong className="text-slate-700">{selectedHistoricalIncident.containmentRate}%</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-sans">Vessel &amp; Flag:</span><strong className="text-[#0B2545]">{selectedHistoricalIncident.vesselName} ({selectedHistoricalIncident.flag})</strong></div>
                          <div className="flex justify-between"><span className="text-slate-500 font-sans">Attribution Certainty:</span><strong className="text-emerald-700">{selectedHistoricalIncident.attributionCertainty}%</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Historical Mitigation Takeaway & Lessons Learned */}
                    <div className="p-3.5 rounded-xl bg-white border border-sky-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold text-[#0B2545] font-display">
                          Historical Precedent Lessons &amp; Operational Directives
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-body leading-relaxed">
                        <strong className="text-slate-800 font-semibold">Key Lesson:</strong> {selectedHistoricalIncident.keyLesson}
                      </p>
                      <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <span>Legal Outcome: <strong className="text-emerald-700 font-semibold">{selectedHistoricalIncident.legalOutcome}</strong></span>
                        <span className="text-slate-400">Environmental Impact: {selectedHistoricalIncident.environmentalImpact}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: EVIDENCE TRACEABILITY & CHAIN OF CUSTODY                   */}
          {/* ================================================================= */}
          {activeTab === "traceability" && (
            <div className="space-y-6 animate-fadeIn">
              {/* TOP MERKLE ROOT & DIGITAL CHAIN OF CUSTODY BANNER */}
              <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_4px_20px_rgba(30,95,191,0.08)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9] flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B2545] to-[#1E5FBF] flex items-center justify-center text-white shadow-md">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-[#0B2545] font-display">
                          Evidence Traceability &amp; Digital Chain-of-Custody Log
                        </h2>
                        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                          6 SHA-256 Records Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-body mt-0.5">
                        Every telemetry packet, satellite pass, and hydrodynamic simulation is cryptographically hashed and anchored under IMO MARPOL Annex I evidentiary standards.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] hover:from-[#174EA6] hover:to-[#2275C6] text-white text-xs font-bold font-body flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Generate Analysis Report</span>
                    </button>
                    <button
                      onClick={() => {
                        triggerToast("Exported SHA-256 cryptographic audit manifest (JSON-LD).");
                      }}
                      className="px-3 py-1.5 rounded-xl border border-[#E1EEF9] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export Audit Dossier</span>
                    </button>
                  </div>
                </div>

                {/* Audit Standards Telemetry Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                    <span className="text-slate-400 text-[10px] block">Merkle Root Digest</span>
                    <strong className="text-[#0B2545] text-xs font-mono block truncate" title="0x7e29a8f4c189b207df83c9201948ba02384f981029348bca1209384fac903c">
                      0x7e29a8f4c189b207...ac903c
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                    <span className="text-slate-400 text-[10px] block">Certifying Authority</span>
                    <strong className="text-[#1E5FBF] text-xs block">INCOIS &amp; C-DAC Timestamp Server</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                    <span className="text-slate-400 text-[10px] block">Statutory Compliance</span>
                    <strong className="text-emerald-700 text-xs block">MARPOL 73/78 • MSA 1958 §356</strong>
                  </div>
                </div>

                {/* 6 Tamper-Proof Cryptographic Evidence Cards */}
                <div className="space-y-3">
                  {EVIDENCE_CHAIN_RECORDS.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] hover:border-sky-300 transition-all shadow-xs flex items-center justify-between flex-wrap gap-3 group"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-[#1E5FBF] text-xs bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {ev.id}
                          </span>
                          <span className="font-bold text-xs text-[#0B2545] font-display">
                            {ev.sensor}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">({ev.sensorType})</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            {ev.status} ({ev.confidence}%)
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-body">
                          <strong className="font-semibold text-[#0B2545]">Observation:</strong> {ev.observation}
                        </p>
                        <p className="text-[11px] text-slate-500 font-body">
                          <span className="font-semibold text-slate-700">Model:</span> {ev.processingModel} &bull; <span className="font-semibold text-slate-700">Result:</span> {ev.result}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <div className="text-right text-[10px] font-mono text-slate-500">
                          <div>Acquired: <strong className="text-slate-700">{ev.time}</strong></div>
                          <div className="text-emerald-700 font-bold">SHA-256: {ev.hash}</div>
                        </div>
                        <button
                          onClick={() => setInspectedEvidence(ev)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#E1EEF9] border border-[#E1EEF9] text-xs font-semibold text-[#1E5FBF] flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Raw Payload</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===================================================================== */}
      {/* 2.5 RAW TELEMETRY PAYLOAD INSPECTOR MODAL                             */}
      {/* ===================================================================== */}
      {inspectedEvidence && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E1EEF9] shadow-2xl max-w-2xl w-full overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#1E5FBF]">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B2545] font-display">
                    Raw Telemetry Payload &mdash; {inspectedEvidence.id}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {inspectedEvidence.sensor} &bull; {inspectedEvidence.time}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedEvidence(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Cryptographic Digest (SHA-256):</span>
                <span className="text-emerald-700 font-bold truncate max-w-md" title={inspectedEvidence.fullHash}>
                  {inspectedEvidence.fullHash}
                </span>
              </div>

              {/* Raw JSON Code Canvas */}
              <div className="relative rounded-2xl bg-[#0B1E36] p-4 text-sky-200 border border-slate-700 overflow-x-auto max-h-72">
                <pre className="text-[11px] font-mono leading-relaxed">
                  {JSON.stringify(
                    {
                      evidence_id: inspectedEvidence.id,
                      sensor_source: inspectedEvidence.sensor,
                      sensor_type: inspectedEvidence.sensorType,
                      timestamp_utc: inspectedEvidence.time,
                      observation_metric: inspectedEvidence.observation,
                      processing_kernel: inspectedEvidence.processingModel,
                      analytical_result: inspectedEvidence.result,
                      sha256_digest: inspectedEvidence.fullHash,
                      verification_status: inspectedEvidence.status,
                      confidence_index: inspectedEvidence.confidence,
                      raw_telemetry_payload: inspectedEvidence.rawPayload,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-[11px] font-mono text-slate-400">
                Verified under ISO/IEC 27037 Digital Evidence Standards
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(JSON.stringify(inspectedEvidence, null, 2));
                    triggerToast(`Copied payload for ${inspectedEvidence.id} to clipboard`);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[#E1EEF9] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Copy JSON
                </button>
                <button
                  onClick={() => setInspectedEvidence(null)}
                  className="px-4 py-1.5 rounded-xl bg-[#0B2545] hover:bg-[#143966] text-white text-xs font-bold font-body transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. REPORT GENERATION MODAL (STAGE: ANALYSIS)                          */}
      {/* ===================================================================== */}
      <ReportGenerationModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        stage={reportStage}
        incidentIdOrCode="IN-MH-2026"
        incidentTitle={
          reportStage === "environmental"
            ? "Mumbai High Offshore Marine Habitat & Ecological Impact Assessment"
            : reportStage === "economic"
            ? "Mumbai High Offshore Economic Loss & Clean-Up Cost Assessment"
            : "Mumbai High Offshore Forensic Spill Analysis"
        }
        currentData={{
          incidentId: "IN-MH-2026",
          incidentTitle: "Mumbai High Offshore Forensic Spill Analysis",
          overview: {
            summary: `Automated SAR backscatter and reverse Lagrangian analysis established a total confirmed slick area of 14.2 km² with primary attribution index of ${lagrangianOutput.computedAttribution.toFixed(1)}% assigned to suspect vessel ${selectedCandidate.name}.`,
            slickAreaKm2: 14.2,
            estimatedVolumeM3: 48000,
            confidenceScore: Number(modelConfidenceBreakdown.overallConfidence),
            coordinates: [18.69, 72.38],
          },
          environmental: {
            windSpeedMs: 5.1,
            windDirectionDeg: 289,
            currentSpeedMs: 0.67,
          },
          simulation: {
            simWindSpeed: whatIfWindSpeed,
            simWindDir: whatIfWindDir,
            simCurrentSpeed: whatIfCurrentSpeed,
            netDriftKts: whatIfScenarioOutput.netSpeedKts,
            netHeadingDeg: whatIfScenarioOutput.netHeadingDeg,
            projectedArea24h: whatIfScenarioOutput.projectedArea24h,
            landfallEtaHours: whatIfScenarioOutput.landfallEtaHours,
            targetSector: whatIfScenarioOutput.targetSector,
          },
          vessels: candidates.map((c, i) => ({
            rank: i + 1,
            name: c.name,
            mmsi: (c as any).mmsi || "636019842",
            imo: c.imo || "9314567",
            flag: c.flag,
            type: c.type,
            cpaKm: c.id === selectedCandidate.id ? lagrangianOutput.calculatedCpaKm : c.cpa,
            minSogKts: c.minSog,
            darkGapMin: c.aisGap,
            liabilityScore: c.id === selectedCandidate.id ? lagrangianOutput.computedAttribution : c.score,
          })),
        }}
      />
      {/* ===================================================================== */}
      {/* 4. SPILL DNA — GEOMETRY & FINGERPRINT MODAL (Matching Screenshot 3)   */}
      {/* ===================================================================== */}
      {spillDNAModalOpen && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E1EEF9] shadow-2xl max-w-2xl w-full overflow-hidden p-6 space-y-5 animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#0B2545] font-display uppercase tracking-wider">
                  SPILL DNA &mdash; GEOMETRY &amp; FINGERPRINT
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-xs font-semibold text-[#1E5FBF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Details &rarr;</span>
                </button>
                <button
                  onClick={() => setSpillDNAModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Top 6 Metric Boxes (Matching Screenshot 3) */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <span className="text-[11px] text-slate-400 font-sans block">Area</span>
                <span className="text-base font-extrabold text-[#0B2545] font-display">276.04 km²</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <span className="text-[11px] text-slate-400 font-sans block">Perimeter</span>
                <span className="text-base font-extrabold text-[#0B2545] font-display">312.5 km</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <span className="text-[11px] text-slate-400 font-sans block">Length (major)</span>
                <span className="text-base font-extrabold text-[#0B2545] font-display">31.2 km</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <span className="text-[11px] text-slate-400 font-sans block">Width (minor)</span>
                <span className="text-base font-extrabold text-[#0B2545] font-display">12.8 km</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <span className="text-[11px] text-slate-400 font-sans block">Orientation</span>
                <span className="text-base font-extrabold text-[#0B2545] font-display">24.6° (NE-SW)</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#F8FBFE] border border-[#E1EEF9]">
                <span className="text-[11px] text-slate-400 font-sans block">Shape Index</span>
                <span className="text-base font-extrabold text-[#0B2545] font-display">0.73 (elongated)</span>
              </div>
            </div>

            {/* Dark Marine Canvas Visualization (Matching Screenshot 3) */}
            <div className="relative h-48 w-full rounded-2xl bg-[#09182A] border border-slate-800 overflow-hidden flex items-center justify-center">
              {/* Radial Multi-Tier Gradient Slick Simulation */}
              <div className="relative flex items-center justify-center">
                {/* Sheen Outer Ring */}
                <div
                  className="w-72 h-28 rounded-full blur-[6px] opacity-40 transition-all duration-500"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(239,68,68,0.9) 0%, rgba(245,158,11,0.6) 45%, rgba(56,189,248,0.2) 75%, transparent 100%)",
                    transform: "rotate(-24.6deg)",
                  }}
                />
                {/* Core Dense Oil Layer */}
                <div
                  className="absolute w-56 h-20 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-500"
                  style={{
                    background: "linear-gradient(135deg, #EF4444 0%, #F97316 50%, #FBBF24 100%)",
                    transform: "rotate(-24.6deg)",
                  }}
                />
                {/* 3D Highlighting overlay */}
                {spillDNAViewMode === "3D" && (
                  <div
                    className="absolute w-52 h-16 rounded-full border border-white/30 blur-[1px]"
                    style={{ transform: "rotate(-24.6deg)" }}
                  />
                )}
                {spillDNAViewMode === "Cross-section" && (
                  <div className="absolute inset-x-0 h-0.5 bg-sky-400/80 border-b border-dashed border-white shadow-md" />
                )}
                {spillDNAViewMode === "Thickness" && (
                  <div className="absolute text-[10px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded">
                    Core: 240 µm &bull; Sheen: 0.15 µm
                  </div>
                )}
                {spillDNAViewMode === "Spectral" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-sky-500/20 to-emerald-500/20 mix-blend-overlay" />
                )}
              </div>
            </div>

            {/* 4 Bottom View Mode Tabs (Matching Screenshot 3) */}
            <div className="grid grid-cols-4 gap-2 text-xs font-mono font-bold">
              {(["3D", "Cross-section", "Thickness", "Spectral"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSpillDNAViewMode(mode)}
                  className={`py-2 rounded-xl border transition-all cursor-pointer ${
                    spillDNAViewMode === mode
                      ? "bg-[#0B2545] text-white border-[#0B2545] shadow-xs"
                      : "bg-[#F8FBFE] text-slate-600 hover:bg-[#E1EEF9] border-[#E1EEF9]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
