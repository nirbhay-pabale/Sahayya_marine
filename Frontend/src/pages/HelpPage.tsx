import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { getAvatarUrl } from "../services/api";
import {
  HelpCircle,
  Search,
  Compass,
  BookOpen,
  Layers,
  ShieldCheck,
  Activity,
  Ship,
  Radio,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Info,
  Terminal,
  Cpu,
  Database,
  Wifi,
  Globe,
  MapPin,
  Wind,
  Waves,
  Download,
  LifeBuoy,
  Sliders,
  Play,
  PhoneCall,
  Mail,
  AlertOctagon,
  ArrowRight,
  Sparkles,
  Home,
  Settings,
  BarChart3,
  Map as MapIcon,
  X,
  Copy,
  Check,
  ShieldAlert,
  Flame,
  CheckSquare,
  FileCode,
  Zap,
  Send,
} from "lucide-react";

// Types
type HelpCategory =
  | "all"
  | "quickstart"
  | "workflow"
  | "modules"
  | "glossary"
  | "map"
  | "reports"
  | "status"
  | "troubleshooting"
  | "support";

interface GlossaryItem {
  term: string;
  fullName: string;
  category: "AIS" | "Radar" | "Hydrodynamics" | "Forensics";
  shortDesc: string;
  detail: string;
  formulaOrExample?: string;
}

interface WorkflowStep {
  step: number;
  id: string;
  title: string;
  subtitle: string;
  role: string;
  whatToDo: string[];
  keyMetrics: string[];
  output: string;
  icon: any;
}

interface TroubleshootingItem {
  id: string;
  issue: string;
  category: string;
  symptom: string;
  causes: string[];
  solutions: string[];
}

export const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<HelpCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({
    "quick-what-is": true,
    "step-1": true,
    "mod-incidents": true,
    "gloss-ais": true,
    "trouble-data-load": true,
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleAccordion = (id: string) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // -------------------------------------------------------------------------
  // 1. DATA: WORKFLOW STAGES (DETECT -> ANALYZE -> IDENTIFY -> ASSESS -> PLAN -> REPORT)
  // -------------------------------------------------------------------------
  const workflowSteps: WorkflowStep[] = [
    {
      step: 1,
      id: "step-1",
      title: "1. DETECT (Satellite SAR Acquisition)",
      subtitle: "Autonomous Synthetic Aperture Radar anomaly detection & segmentation",
      role: "Copernicus Sentinel-1 / RadarSat Dual-Pol",
      whatToDo: [
        "Review new SAR satellite passes on the Incidents or Analysis tab.",
        "Verify backscatter damping threshold (typically Δσ⁰ < -6.5 dB for mineral oil).",
        "Inspect primary centroid coordinates and ensure radar acquisition is in VV or VV+VH polarization.",
      ],
      keyMetrics: ["Centroid Coordinates (Lat/Lon)", "Slick Surface Area (km²)", "Backscatter Drop (dB)", "Confidence Score (%)"],
      output: "Validated oil slick footprint polygon and initial alert priority tier.",
      icon: Radio,
    },
    {
      step: 2,
      id: "step-2",
      title: "2. ANALYZE (Spill Morphology & Chemical DNA)",
      subtitle: "Hydrocarbon characterization, thickness estimation & weathering timeline",
      role: "Chemical Fingerprinting & Bonn Agreement Classifier",
      whatToDo: [
        "Open the Spill Evolution / DNA panel in the Incident Details page.",
        "Check estimated oil volume (m³) and Bonn Code thickness classification.",
        "Inspect kinematic viscosity (cSt) and emulsification rate to anticipate mousse formation.",
      ],
      keyMetrics: ["Estimated Discharge Volume (m³)", "Slick Thickness (µm)", "Viscosity (cSt)", "Weathering Half-Life (Hours)"],
      output: "Physicochemical hydrocarbon profile for containment selection.",
      icon: Flame,
    },
    {
      step: 3,
      id: "step-3",
      title: "3. IDENTIFY VESSEL (Backward Hindcast & 7D AIS Attribution)",
      subtitle: "Reverse Lagrangian particle tracking to reconstruct discharge origin",
      role: "OpenDrift Lagrangian Engine & Spatio-Temporal AIS Correlator",
      whatToDo: [
        "Execute backward hindcast simulation (-24h to -12h) to pinpoint release ellipse.",
        "Cross-correlate candidate vessel AIS tracks traversing the probable origin bounding box.",
        "Detect kinematic anomalies: sudden speed reduction (SOG < 4 kts) or transponder blackouts (AIS dark gaps).",
        "Inspect attribution confidence scores (0–100%) in the Vessel Attribution Matrix.",
      ],
      keyMetrics: ["CPA to Origin (km)", "Minimum SOG (kts)", "AIS Dark Duration (min)", "Attribution Index (%)"],
      output: "Ranked suspect vessel dossier with primary liability determination.",
      icon: Ship,
    },
    {
      step: 4,
      id: "step-4",
      title: "4. ASSESS IMPACT (Forward Hydrodynamic Drift Forecast)",
      subtitle: "Ocean current advection + wind drag modeling toward coastline",
      role: "HYCOM / INCOIS Current Coupling & Open-Meteo Wind Fields",
      whatToDo: [
        "Inspect forward 24h & 48h particle dispersion trajectories on the interactive map.",
        "Identify vulnerable coastal zones (mangroves, nuclear power plant intakes, fishing grounds).",
        "Evaluate projected Landfall ETA (Hours to Shore) based on ambient sea state.",
      ],
      keyMetrics: ["Net Drift Speed (kts)", "Dispersion Heading (°)", "Landfall ETA (Hours)", "Vulnerability Tier"],
      output: "Coastal impact trajectory and Environmental Sensitivity Index (ESI) priority ranking.",
      icon: Waves,
    },
    {
      step: 5,
      id: "step-5",
      title: "5. PLAN RESPONSE (NOS-DCP Tactical Asset Mobilization)",
      subtitle: "Strategic containment boom deployment, skimmer vectoring & interception",
      role: "Incident Command / Indian Coast Guard MRCC",
      whatToDo: [
        "Select critical priority zones (e.g. Alibaug Mangrove Sanctuary) on the Response Optimizer.",
        "Assign operational Coast Guard assets (ICGS Samudra Prahari, Dornier reconnaissance aircraft).",
        "Execute response checklist items (booming, skimmer mobilization, notification of port authorities).",
      ],
      keyMetrics: ["Boom Length Required (m)", "Skimming Capacity (m³/h)", "Asset Transit Time (Hours)", "Containment Efficiency (%)"],
      output: "Mobilized National Oil Spill Disaster Contingency Plan (NOS-DCP) tactical grid.",
      icon: ShieldAlert,
    },
    {
      step: 6,
      id: "step-6",
      title: "6. GENERATE REPORT (Certified Evidence & PDF Dossier)",
      subtitle: "Automated stage-specific intelligence document compilation with SHA-256 seal",
      role: "Sahayya Defence Reporting Engine",
      whatToDo: [
        "Click 'Generate Report' on the current stage to open the live interactive report preview.",
        "Inspect all stage data (Executive Summary, Telemetry, Suspect Attribution, Action Directives).",
        "Click 'Download PDF' to generate an official, cryptographically certified document (MARPOL Annex I admissible).",
      ],
      keyMetrics: ["Unique Report ID", "SHA-256 Digest", "Incident ID", "Authorizing Officer Signature"],
      output: "Court-admissible PDF intelligence brief with complete chain-of-custody.",
      icon: FileText,
    },
  ];

  // -------------------------------------------------------------------------
  // 2. DATA: MARITIME DATA GUIDE & GLOSSARY
  // -------------------------------------------------------------------------
  const glossaryTerms: GlossaryItem[] = [
    {
      term: "AIS",
      fullName: "Automatic Identification System",
      category: "AIS",
      shortDesc: "VHF automated radio transponder broadcast by maritime vessels.",
      detail: "Mandated by IMO SOLAS for all commercial vessels ≥300 gross tonnage. Broadcasts dynamic telemetry (GPS position, SOG, COG, heading) every 2–10 seconds and static data (MMSI, IMO, vessel name, destination) every 6 minutes.",
      formulaOrExample: "Broadcast Frequency: 161.975 MHz (Ch 87B) & 162.025 MHz (Ch 88B)",
    },
    {
      term: "IMO / MMSI",
      fullName: "International Maritime Organization / Maritime Mobile Service Identity",
      category: "AIS",
      shortDesc: "Permanent vessel hull identifier vs. 9-digit radio communication ID.",
      detail: "An IMO number (7 digits) remains with the hull for its entire lifetime regardless of owner or flag change. An MMSI number (9 digits) identifies the ship station and encodes the country flag (MID digits 1–3, e.g. 419 for India, 636 for Liberia).",
      formulaOrExample: "Example: IMO 9314567 · MMSI 636019842 (Liberia)",
    },
    {
      term: "CPA",
      fullName: "Closest Point of Approach",
      category: "Forensics",
      shortDesc: "The shortest physical distance between a vessel track and the spill origin centroid.",
      detail: "Calculated using high-precision geodesic Haversine / Great Circle distance algorithms. A CPA under 2.0 km during the estimated release window is a primary indicator for pollution liability investigation.",
      formulaOrExample: "d = 2R · arcsin(√(sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)))",
    },
    {
      term: "SOG",
      fullName: "Speed Over Ground",
      category: "AIS",
      shortDesc: "Actual speed of the vessel relative to the ocean seabed in knots.",
      detail: "Derived from onboard GPS/GNSS receivers. During illegal slop tank or bilge discharge operations, vessels frequently decelerate below 4 knots to optimize discharge pump efficiency, creating a recognizable speed drop anomaly.",
      formulaOrExample: "1 Knot = 1.852 km/h = 0.514 m/s",
    },
    {
      term: "COG",
      fullName: "Course Over Ground",
      category: "AIS",
      shortDesc: "Actual directional trajectory of the vessel relative to True North.",
      detail: "Measured in degrees azimuth (000°–359°). Discrepancies between Heading (where the bow points) and COG reveal strong local ocean surface currents and wind drift acting on the vessel.",
      formulaOrExample: "Azimuth: 000° (North), 090° (East), 180° (South), 270° (West)",
    },
    {
      term: "AIS Gap / Dark Vessel",
      fullName: "Transponder Inactivity / Blackout Period",
      category: "AIS",
      shortDesc: "Unexplained cessation of AIS transponder signals inside surveillance zones.",
      detail: "Occurs when a vessel intentionally powers down its Class-A AIS transmitter (or suffers total power failure). In Sahayya, transponder gaps >30 minutes within proximity to a detected spill origin trigger an immediate high-priority anomaly flag.",
      formulaOrExample: "Dark Gap Duration = Timestamp(Next Message) - Timestamp(Last Message)",
    },
    {
      term: "SAR",
      fullName: "Synthetic Aperture Radar",
      category: "Radar",
      shortDesc: "Active spaceborne microwave radar that penetrates clouds, darkness, and rain.",
      detail: "Oil slicks dampen short gravity-capillary ocean waves, resulting in specular reflection away from the satellite antenna and producing distinct low-backscatter dark patches on SAR imagery.",
      formulaOrExample: "Damping Contrast: Δσ⁰ = σ⁰_slick - σ⁰_clean_sea (typically -6 to -12 dB)",
    },
    {
      term: "Spill Footprint",
      fullName: "Surface Spatial Boundary Polygon",
      category: "Radar",
      shortDesc: "Segmented 2D spatial polygon geometry enclosing detected hydrocarbon sheen.",
      detail: "Extracted via U-Net deep learning and adaptive Otsu/Sigma0 thresholding from Sentinel-1 SAR tiles. Enclosing area (km²), perimeter (km), major/minor axis lengths, and orientation angle are calculated automatically.",
      formulaOrExample: "Spatial Polygon: Array of [latitude, longitude] boundary vertices",
    },
    {
      term: "Probable Origin",
      fullName: "Hindcast Discharge Spatio-Temporal Bounding Box",
      category: "Hydrodynamics",
      shortDesc: "Estimated geographic zone and time window where discharge occurred.",
      detail: "Calculated by running reverse-time (hindcast) Lagrangian trajectory simulations using recorded HYCOM currents and ECMWF winds, tracing the observed slick back 12–36 hours prior to satellite acquisition.",
      formulaOrExample: "Origin BBox: [min_lat, min_lon, max_lat, max_lon] @ T-Release Window",
    },
    {
      term: "Lagrangian Model",
      fullName: "Lagrangian Particle Dispersion Physics Engine",
      category: "Hydrodynamics",
      shortDesc: "Computational method simulating thousands of discrete oil fluid particles in motion.",
      detail: "Implemented via OpenDrift v1.9. Accounts for 3D advection, windage drag (0.035 wind velocity factor), horizontal turbulent diffusion, evaporation, natural dispersion, and oil emulsification.",
      formulaOrExample: "V_drift = V_current + 0.035 · V_wind + V_turbulent_diffusion",
    },
    {
      term: "Attribution Confidence",
      fullName: "Multi-Dimensional Forensic Attribution Index",
      category: "Forensics",
      shortDesc: "Weighted percentage score (0–100%) establishing vessel liability.",
      detail: "Synthesizes 4 evidentiary pillars: (1) Spatio-temporal trajectory intersection (35%), (2) AIS dark blackout duration (25%), (3) Speed drop kinematic signature (25%), and (4) Tanker capacity & discharge physics match (15%).",
      formulaOrExample: "Score = Σ (Weight_i · Score_i) · MARPOL Confidence Multiplier",
    },
    {
      term: "Bonn Code",
      fullName: "Bonn Agreement Oil Appearance Code",
      category: "Forensics",
      shortDesc: "International optical benchmark for estimating oil slick layer thickness and volume.",
      detail: "Classifies slicks into 5 visual categories: Code 1 (Sheen: 0.04–0.30 µm), Code 2 (Rainbow: 0.30–5.0 µm), Code 3 (Metallic: 5.0–50 µm), Code 4 (Discontinuous True Color: 50–200 µm), Code 5 (Continuous True Color: >200 µm).",
      formulaOrExample: "Volume (m³) = Area (m²) · Mean Thickness (m)",
    },
  ];

  // -------------------------------------------------------------------------
  // 3. DATA: MODULE-SPECIFIC HELP
  // -------------------------------------------------------------------------
  const modulesHelp = [
    {
      id: "mod-dashboard",
      title: "Dashboard Module",
      path: "/dashboard",
      badge: "EXECUTIVE MDA OVERVIEW",
      desc: "Central command dashboard for Indian EEZ surveillance, showing active incidents, alert levels, and overall fleet readiness.",
      actions: [
        "Click 'View Full Analysis' on the hero banner to dive into the primary live incident.",
        "Inspect high-level KPI cards (Active Slicks, Monitored Vessels, Alert Level, Sensor Health).",
        "Review the Real-Time Activity Log for live transponder blackouts and Coast Guard dispatches.",
      ],
      metrics: ["Active Incidents Count", "Indian EEZ Fleet Count", "Sensor Latency (ms)", "Readiness Index"],
      tips: "Use the Quick Search in the top navigation bar to quickly jump to any incident code or vessel MMSI.",
    },
    {
      id: "mod-incidents",
      title: "Incident Details Workstation",
      path: "/incidents/IN-MH-2026",
      badge: "PRIMARY INVESTIGATION WORKSPACE",
      desc: "Deep-dive multi-panel investigation suite covering Spill DNA, SAR Radar observation, Ranked Suspect Candidates, and Digital Twin Simulation.",
      actions: [
        "Switch between workspace tabs: 'Tactical Overview', 'Response & Recovery', and 'Marine Digital Twin'.",
        "Use 'Export Telemetry' to download an instant PDF telemetry intelligence brief.",
        "Click 'Inspect Evidence' on any vessel candidate card to view the 7D Kinematic Radar Graph.",
        "Adjust Wind Velocity, Wind Direction, and Current Speed sliders in Digital Twin to see live slick morphing.",
      ],
      metrics: ["Slick Area (km²)", "Volume (m³)", "Primary Candidate Score (%)", "Landfall ETA (Hours)"],
      tips: "Click 'Generate PDF Dossier' to preview and compile the full 9-page official Coast Guard report.",
    },
    {
      id: "mod-map",
      title: "Map & Maritime Situational Canvas",
      path: "/map",
      badge: "FULL GIS SPATIAL PICTURE",
      desc: "Interactive multi-layer GIS mapping interface displaying real-time vessel vectors, satellite radar overlays, bathymetry, and shipping corridors.",
      actions: [
        "Toggle map layers: Satellite Tile Imagery, Oil Spill Polygons, AIS Vessel Markers, Weather Wind Vectors.",
        "Click on any vessel marker to open its operational popup and inspection card.",
        "Use the layer drawer on the right to filter vessels by flag state, risk level, or vessel class.",
      ],
      metrics: ["Vessel Coordinates", "True Heading & COG", "Distance to Shore (NM)", "Bathymetric Depth (m)"],
      tips: "Double-click the map canvas or use the 'Center Incident' button to quickly re-center on the active spill centroid.",
    },
    {
      id: "mod-vessels",
      title: "Vessels & Fleet Intelligence",
      path: "/vessels",
      badge: "7D AIS REGISTRY & ANOMALY TRACKER",
      desc: "Comprehensive registry of all commercial and defense vessels operating inside the Indian EEZ with automated anomaly detection.",
      actions: [
        "Search vessels by Name, IMO, MMSI, or Flag State.",
        "Filter by High-Risk / Dark Ship anomaly flags to isolate suspect polluters.",
        "Click 'View Forensic Evidence' to view the complete kinematic track and speed profile history.",
      ],
      metrics: ["Attribution Rank", "CPA to Spill (km)", "Minimum SOG (kts)", "Transponder Dark Duration (min)"],
      tips: "Sort the table by 'Liability Score' to immediately highlight candidates with the highest statistical correlation.",
    },
    {
      id: "mod-analysis",
      title: "Forensic Spill Analysis",
      path: "/analysis",
      badge: "SAR RADAR & CHEMICAL FORENSICS",
      desc: "Scientific radar segmentation and chemical fingerprinting interface for spaceborne SAR imagery interpretation.",
      actions: [
        "Inspect the SAR Dual-Pol VV/VH backscatter histogram and decibel contrast curve.",
        "Review hydrocarbon physicochemical parameters (Viscosity, Pour Point, API Gravity, Sulfur Content).",
        "Examine the Bonn Code thickness cross-section to verify crude oil type and weathering rate.",
      ],
      metrics: ["Backscatter Contrast (Δσ⁰ dB)", "Slick Perimeter (km)", "Emulsification Index", "API Gravity"],
      tips: "Use the 'Compare Satellite Passes' tool to evaluate how the slick has expanded between successive satellite orbits.",
    },
    {
      id: "mod-settings",
      title: "Settings & System Health",
      path: "/settings",
      badge: "RBAC & SENSOR FEED CONFIGURATION",
      desc: "Administrative configuration portal for managing user credentials, operational roles, API endpoints, and sensor feeds.",
      actions: [
        "Update profile details (Full Name, Designation, Command Agency).",
        "Upload a new profile avatar with real-time preview and backend persistence.",
        "Verify data source health (Copernicus Satellite, DG Shipping AIS, INCOIS Buoys).",
      ],
      metrics: ["System Uptime (%)", "API Latency (ms)", "Active Operator Sessions", "Storage Quota Used"],
      tips: "The Full Name entered in the profile settings is automatically linked across top navigation banners and report signatures.",
    },
  ];

  // -------------------------------------------------------------------------
  // 4. DATA: TROUBLESHOOTING PLAYBOOKS
  // -------------------------------------------------------------------------
  const troubleshootingData: TroubleshootingItem[] = [
    {
      id: "trouble-data-load",
      issue: "Telemetry or Incidents Data Not Loading",
      category: "API & Backend",
      symptom: "Dashboard cards show 'Syncing...' or spinner does not resolve.",
      causes: [
        "Backend FastAPI server (port 8000) is starting up or temporarily unreachable.",
        "CORS policy or token authentication expiry in localStorage.",
        "Network disconnect from local development environment.",
      ],
      solutions: [
        "Check that the FastAPI backend server is running (`python -m uvicorn app.main:app --port 8000`).",
        "Open browser developer tools (F12) → Console to inspect any 401 or 500 network errors.",
        "Click the 'Sync / Refresh' button in the top navigation bar to trigger a fresh REST query.",
        "If token expired, click your profile avatar and log in again with valid credentials.",
      ],
    },
    {
      id: "trouble-map-gray",
      issue: "Map Canvas Displays Gray Tiles or Offset Center",
      category: "GIS & Map Rendering",
      symptom: "Leaflet map container loads partially or shows gray background tiles.",
      causes: [
        "Map container resized while hidden in an inactive tab or during modal animation.",
        "External OpenStreetMap / CartoDB tile server throttling.",
      ],
      solutions: [
        "Switch back to the Map tab; the automated Leaflet `invalidateSize()` handler will recalculate viewport geometry.",
        "Use the zoom controls (+ / -) once to force tile redraw.",
        "Switch Map Layer from 'Satellite' to 'OpenStreetMap' using the layer control button.",
      ],
    },
    {
      id: "trouble-pdf-gen",
      issue: "Report Generation Fails or PDF Does Not Download",
      category: "Reporting Engine",
      symptom: "Clicking 'Download PDF' does not save a file or shows compilation alert.",
      causes: [
        "Browser pop-up blocker or download restriction on blob URLs.",
        "Memory constraint during large multi-page canvas vector rendering.",
      ],
      solutions: [
        "Check your browser's address bar for blocked pop-ups or download permissions.",
        "Use the 'View / Print PDF' button instead to open the document in a new tab for native printing.",
        "Ensure active stage data is fully loaded before clicking 'Generate Report'.",
      ],
    },
    {
      id: "trouble-vessel-missing",
      issue: "Vessel Track or Information Unavailable",
      category: "AIS Registry",
      symptom: "Candidate vessel shows 'Data Unavailable' or missing MMSI telemetry.",
      causes: [
        "Vessel operating outside terrestrial AIS receiver range (>40 NM offshore).",
        "Vessel intentional Class-A transponder blackout (Dark Ship event).",
      ],
      solutions: [
        "Check the 'AIS Blackout Event' log in the candidate's forensic file for recorded gap duration.",
        "When real-time AIS feed is down, Sahayya automatically displays calibrated synthetic benchmark telemetry labeled `[DEMO / SIMULATED]`.",
      ],
    },
  ];

  // -------------------------------------------------------------------------
  // 5. LIVE API & SENSOR STATUS
  // -------------------------------------------------------------------------
  const sensorFeeds = [
    { name: "FastAPI Core Intelligence Engine", status: "Operational", latency: "18 ms", source: "http://localhost:8000/api", type: "REST + WebSockets" },
    { name: "Copernicus Sentinel-1 SAR Radar", status: "Operational", latency: "142 ms", source: "ESA Copernicus Open Access Hub", type: "SAR IW Dual-Pol" },
    { name: "Indian Coastal AIS Radar Feeds", status: "Operational", latency: "34 ms", source: "DG Shipping / Coast Guard Coastal AIS", type: "VHF NMEA 0183" },
    { name: "INCOIS Oceanic & Wave Buoys", status: "Operational", latency: "65 ms", source: "INCOIS Hydrodynamic Grid 1/12°", type: "Wave / Current / SST" },
    { name: "Open-Meteo High-Resolution Wind", status: "Operational", latency: "88 ms", source: "ECMWF Global 0.1° Weather Model", type: "10m Wind Fields" },
    { name: "OpenDrift Lagrangian Particle Engine", status: "Ready", latency: "Active", source: "OpenDrift v1.9 Kinematic Engine", type: "Simulation Kernel" },
  ];

  // Filtered Items based on search and activeCategory
  const filteredGlossary = useMemo(() => {
    return glossaryTerms.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.detail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [searchQuery]);

  const filteredModules = useMemo(() => {
    return modulesHelp.filter((mod) => {
      const matchesSearch =
        searchQuery === "" ||
        mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.actions.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
        mod.metrics.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [searchQuery]);

  const filteredTroubleshooting = useMemo(() => {
    return troubleshootingData.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.symptom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.solutions.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [searchQuery]);

  return (
    <div className="flex h-screen bg-[#F0F7FD] font-body text-slate-800 antialiased overflow-hidden selection:bg-[#1E5FBF]/20 selection:text-[#0B2545]">
      {/* ===================================================================== */}
      {/* 1. LEFT SIDEBAR NAVIGATION                                            */}
      {/* ===================================================================== */}
      <aside
        id="help-sidebar"
        className={`h-full bg-gradient-to-b from-[#0B2545] to-[#123A66] flex flex-col justify-between items-center z-30 shrink-0 shadow-xl transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "w-16 sm:w-20 py-4 opacity-100 translate-x-0 overflow-y-auto"
            : "w-0 p-0 opacity-0 -translate-x-full overflow-hidden pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {/* Sahayya Official Logo / Brand Icon */}
          <div
            onClick={() => navigate("/dashboard")}
            className="w-11 h-11 rounded-2xl p-1 bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center transition-transform hover:scale-105 cursor-pointer mb-2"
            title="Return to Dashboard"
          >
            <img src="/sahayya-logo.png" alt="Sahayya" className="w-full h-full object-contain" />
          </div>

          {[
            { id: "Home", icon: Home, labelKey: "nav.home", fallback: "Home", path: "/dashboard" },
            { id: "Map", icon: MapIcon, labelKey: "nav.map", fallback: "Map", path: "/map" },
            { id: "Incidents", icon: Activity, labelKey: "nav.incidents", fallback: "Incidents", path: "/incidents/IN-MH-2026" },
            { id: "Vessels", icon: Ship, labelKey: "nav.vessels", fallback: "Vessels", path: "/vessels" },
            { id: "Analysis", icon: BarChart3, labelKey: "nav.analysis", fallback: "Analysis", path: "/analysis" },
            { id: "Authority", icon: Send, labelKey: "nav.authority", fallback: "Submit to Authority", path: "/authority" },
            { id: "Settings", icon: Settings, labelKey: "nav.settings", fallback: "Settings", path: "/settings" },
            { id: "Help", icon: HelpCircle, labelKey: "nav.help", fallback: "Help", path: "/help" },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "Help";
            const label = t(item.labelKey, item.fallback);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
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

        {/* User Avatar Mini */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1E5FBF] to-[#0B2545] border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
            title="User Profile & Settings"
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
          </button>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN CONTENT AREA                                                  */}
      {/* ===================================================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP APP BAR */}
        <header className="h-16 bg-white border-b border-[#E1EEF9] px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0B2545] hover:bg-[#F8FBFE] border border-[#E1EEF9] transition-colors cursor-pointer"
              title="Toggle Navigation Sidebar"
            >
              <Layers className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-[#0B2545] font-display tracking-tight flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1E5FBF]" />
                  <span>{t("help.title", "Sahayya Help & Operations Center")}</span>
                </h1>
                <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-sky-100 text-[#1E5FBF] border border-sky-200">
                  SOP v2.4 Spec
                </span>
              </div>
              <p className="text-xs text-slate-500 font-body">
                {t("help.subtitle", "Official Maritime Intelligence, Hydrodynamic Simulation & Forensics Manual")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Multi-Language Selector */}
            <LanguageSwitcher variant="light" />

            <button
              onClick={() => navigate("/dashboard")}
              className="px-3 py-1.5 rounded-xl border border-[#E1EEF9] bg-white hover:bg-[#F8FBFE] text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("nav.backToDashboard", "Back to Dashboard")}</span>
            </button>
          </div>
        </header>

        {/* HERO SEARCH BANNER */}
        <div className="bg-gradient-to-r from-[#0B2545] via-[#123A66] to-[#1E5FBF] px-6 py-6 text-white shrink-0 shadow-md">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[11px] uppercase font-bold font-mono tracking-wider text-sky-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15 inline-block mb-1">
                  Operational Knowledge Base
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
                  How can we assist your maritime intelligence operations?
                </h2>
              </div>
              <div className="text-right text-xs font-mono text-sky-200/90 hidden sm:block">
                <span>IN-EEZ Operational SOP &bull; 24/7 Command Ready</span>
              </div>
            </div>

            {/* Live Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search help, module, metric, term, workflow or troubleshooting topic..."
                className="w-full pl-12 pr-10 py-3 bg-white text-slate-800 rounded-xl shadow-lg border border-white/20 text-sm font-body placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 font-body text-xs scrollbar-none">
              {[
                { id: "all", label: "All Topics" },
                { id: "quickstart", label: "Quick Start" },
                { id: "workflow", label: "Investigation Workflow" },
                { id: "modules", label: "Module Guide" },
                { id: "glossary", label: "Maritime Glossary" },
                { id: "reports", label: "Report Generation" },
                { id: "status", label: "Live Data Feeds" },
                { id: "troubleshooting", label: "Troubleshooting" },
                { id: "support", label: "Support & Feedback" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id as any);
                    if (searchQuery) setSearchQuery("");
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat.id && !searchQuery
                      ? "bg-white text-[#0B2545] shadow-xs"
                      : "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SCROLLABLE HELP BODY */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F0F7FD] space-y-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* ================================================================= */}
            {/* SECTION 1: QUICK START OVERVIEW                                   */}
            {/* ================================================================= */}
            {(activeCategory === "all" || activeCategory === "quickstart") && !searchQuery && (
              <section className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#E1EEF9] pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#1E5FBF]" />
                    <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      1. Quick Start Guide
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-slate-400">
                    6 Essential Operational Actions
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {[
                    {
                      id: "quick-what-is",
                      title: "What is Sahayya?",
                      icon: Compass,
                      summary: "India's premier AI-powered maritime domain awareness & oil spill intelligence platform.",
                      detail: "Sahayya fuses spaceborne Synthetic Aperture Radar (SAR) imagery, Eulerian-Lagrangian hydrodynamic physics, and 7D AIS transponder kinematics to automatically detect marine pollution, backtrack discharge origins, attribute suspect vessels, and mobilize response.",
                    },
                    {
                      id: "quick-monitor",
                      title: "How to Monitor an Incident",
                      icon: Activity,
                      summary: "Track live slicks, expansion area, and real-time Coast Guard response status.",
                      detail: "Navigate to the Incidents module (/incidents/IN-MH-2026). Inspect the live stat cards, slick perimeter evolution, and 48-hour forward drift projections updated with active wind and wave data.",
                    },
                    {
                      id: "quick-spill",
                      title: "How to Investigate a Spill",
                      icon: Flame,
                      summary: "Evaluate Bonn Code thickness, chemical DNA, and satellite radar backscatter.",
                      detail: "Open the Analysis module (/analysis) to inspect dual-pol SAR decibel damping (Δσ⁰), estimate discharge volume (m³), and calculate weathering half-life to determine if mechanical or chemical containment is required.",
                    },
                    {
                      id: "quick-vessels",
                      title: "How to Track Vessels",
                      icon: Ship,
                      summary: "Isolate suspect polluters via CPA, speed reduction, and AIS dark gap detection.",
                      detail: "Open the Vessels tab (/vessels) to inspect the ranked candidate roster. Vessels with speed drops (<4 kts) and transponder blackouts during the discharge release window receive high liability scores (>80%).",
                    },
                    {
                      id: "quick-map",
                      title: "How to Use the Map",
                      icon: MapIcon,
                      summary: "Layer satellite rasters, vessel tracks, EEZ boundaries, and hydrodynamic vectors.",
                      detail: "Open the Map (/map) to interact with full GIS layers. Click on any vessel marker to view its live trajectory, speed, and CPA to the active pollution polygon.",
                    },
                    {
                      id: "quick-reports",
                      title: "How to Generate Reports",
                      icon: FileText,
                      summary: "Compile stage-specific intelligence briefs with cryptographic SHA-256 seals.",
                      detail: "Click 'Generate Report' on any page to open a live report preview tailored to the current stage, then click 'Download PDF' to obtain an official court-admissible document.",
                    },
                  ].map((card) => {
                    const CardIcon = card.icon;
                    const isExpanded = expandedAccordions[card.id];
                    return (
                      <div
                        key={card.id}
                        className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_2px_10px_rgba(30,95,191,0.06)] hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#1E5FBF] flex items-center justify-center border border-sky-100">
                              <CardIcon className="w-4 h-4" />
                            </div>
                            <h4 className="font-display font-bold text-xs text-[#0B2545]">
                              {card.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 font-body leading-relaxed mb-2">
                            {card.summary}
                          </p>
                          {isExpanded && (
                            <div className="p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] text-[11px] text-slate-700 leading-relaxed font-body mt-2 animate-fadeIn">
                              {card.detail}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleAccordion(card.id)}
                          className="text-[11px] font-semibold text-[#1E5FBF] hover:text-[#0B2545] flex items-center gap-1 mt-3 pt-2 border-t border-slate-100 cursor-pointer"
                        >
                          <span>{isExpanded ? "Show Less" : "Read Detailed Guide"}</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ================================================================= */}
            {/* SECTION 2: INCIDENT INVESTIGATION WORKFLOW                        */}
            {/* ================================================================= */}
            {(activeCategory === "all" || activeCategory === "workflow") && !searchQuery && (
              <section className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#E1EEF9] pb-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      2. Complete Incident Investigation Workflow
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    6-Stage Operational SOP
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-body">
                  Follow this standardized 6-step maritime procedure when an anomaly alert is received in the Indian Exclusive Economic Zone (EEZ):
                </p>

                <div className="space-y-3">
                  {workflowSteps.map((ws) => {
                    const StepIcon = ws.icon;
                    const isExpanded = expandedAccordions[ws.id];
                    return (
                      <div
                        key={ws.id}
                        className="rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_2px_8px_rgba(30,95,191,0.05)] overflow-hidden transition-all"
                      >
                        <div
                          onClick={() => toggleAccordion(ws.id)}
                          className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F8FBFE] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B2545] to-[#1E5FBF] text-white flex items-center justify-center font-bold text-xs font-mono shadow-xs">
                              {ws.step}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-display font-bold text-xs text-[#0B2545]">
                                  {ws.title}
                                </h4>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline">
                                  {ws.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-body mt-0.5">
                                {ws.subtitle}
                              </p>
                            </div>
                          </div>

                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 text-xs font-body animate-fadeIn">
                            <div>
                              <span className="font-bold text-[#0B2545] text-[11px] uppercase tracking-wider block mb-1 font-display">
                                Operator Action Items:
                              </span>
                              <ul className="space-y-1 text-slate-700">
                                {ws.whatToDo.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <div className="p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                                <span className="font-bold text-[#1E5FBF] text-[10px] uppercase block font-mono mb-1">
                                  Critical Metrics to Inspect:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {ws.keyMetrics.map((km, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-mono bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                                    >
                                      {km}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                                <span className="font-bold text-emerald-800 text-[10px] uppercase block font-mono mb-1">
                                  Required Stage Output:
                                </span>
                                <p className="text-[11px] text-emerald-950 font-medium">
                                  {ws.output}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ================================================================= */}
            {/* SECTION 3: MODULE HELP                                            */}
            {/* ================================================================= */}
            {(activeCategory === "all" || activeCategory === "modules") && (
              <section className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#E1EEF9] pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#1E5FBF]" />
                    <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      3. Dedicated Module Help &amp; SOP
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {filteredModules.length} Modules Detailed
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredModules.map((mod) => {
                    const isExpanded = expandedAccordions[mod.id];
                    return (
                      <div
                        key={mod.id}
                        className="rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_2px_8px_rgba(30,95,191,0.05)] overflow-hidden"
                      >
                        <div
                          onClick={() => toggleAccordion(mod.id)}
                          className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F8FBFE] transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-bold text-xs text-[#0B2545]">
                                {mod.title}
                              </h4>
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E5FBF] border border-blue-200">
                                {mod.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 font-body">
                              {mod.desc}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(mod.path);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>Open Module</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 text-xs font-body animate-fadeIn">
                            <div>
                              <span className="font-bold text-[#0B2545] text-[11px] uppercase tracking-wider block mb-1 font-display">
                                Available User Actions:
                              </span>
                              <ul className="space-y-1 text-slate-700">
                                {mod.actions.map((act, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <ArrowRight className="w-3 h-3 text-[#1E5FBF] shrink-0 mt-0.5" />
                                    <span>{act}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] flex flex-wrap items-center justify-between gap-2">
                              <div className="space-y-1">
                                <span className="font-bold text-[#0B2545] text-[10px] uppercase font-mono block">
                                  Key Monitored Metrics:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {mod.metrics.map((met, i) => (
                                    <span
                                      key={i}
                                      className="text-[10px] font-mono bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                                    >
                                      {met}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-[11px] text-slate-500 italic max-w-xs">
                                💡 Tip: {mod.tips}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ================================================================= */}
            {/* SECTION 4: MARITIME DATA GUIDE & GLOSSARY                         */}
            {/* ================================================================= */}
            {(activeCategory === "all" || activeCategory === "glossary") && (
              <section className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#E1EEF9] pb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#1E5FBF]" />
                    <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      4. Maritime Telemetry &amp; Intelligence Glossary
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {filteredGlossary.length} Standard Terms
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredGlossary.map((g) => {
                    const isExpanded = expandedAccordions[`gloss-${g.term}`];
                    return (
                      <div
                        key={g.term}
                        className="p-3.5 rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_2px_8px_rgba(30,95,191,0.05)] hover:border-[#1E5FBF]/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#0B2545] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                {g.term}
                              </span>
                              <span className="font-bold text-xs text-slate-800 font-display truncate max-w-[180px]">
                                {g.fullName}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold">
                              {g.category}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 font-body leading-relaxed mt-1">
                            {g.shortDesc}
                          </p>

                          {isExpanded && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1.5 text-[11px] text-slate-700 animate-fadeIn">
                              <p className="leading-relaxed font-body">{g.detail}</p>
                              {g.formulaOrExample && (
                                <div className="p-1.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-[#1E5FBF] select-all">
                                  {g.formulaOrExample}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => toggleAccordion(`gloss-${g.term}`)}
                          className="text-[10px] font-semibold text-[#1E5FBF] hover:text-[#0B2545] flex items-center gap-1 mt-2.5 pt-1.5 border-t border-slate-100 cursor-pointer"
                        >
                          <span>{isExpanded ? "Collapse" : "Read In-Depth Definition"}</span>
                          <ChevronRight
                            className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ================================================================= */}
            {/* SECTION 5: REPORT GENERATION HELP                                 */}
            {/* ================================================================= */}
            {(activeCategory === "all" || activeCategory === "reports") && !searchQuery && (
              <section className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#E1EEF9] pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1E5FBF]" />
                    <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      5. Report Generation &amp; PDF Export SOP
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    MARPOL Annex I Admissible
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E1EEF9] shadow-xs space-y-3 text-xs font-body">
                  <p className="text-slate-700 leading-relaxed">
                    When you click <strong>“Generate Report”</strong> on any active page, Sahayya automatically compiles a stage-specific dossier using the actual live data:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1.5">
                      <span className="font-bold text-[#0B2545] block font-display">
                        📑 Stage-Specific Intelligence
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        The report adapts dynamically: Incident Investigation on Incidents, Maritime Situational on Map, 7D AIS Attribution on Vessels, and Chemical DNA on Analysis.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1.5">
                      <span className="font-bold text-[#0B2545] block font-display">
                        🔒 SHA-256 Cryptographic Seal
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Every document includes a unique Document Reference ID, UTC/IST timestamps, and a 64-character tamper-proof SHA-256 digest ensuring legal admissibility.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>No Dashboard Screenshots:</strong> Sahayya uses pure vector layout with <code>jsPDF</code> and <code>jspdf-autotable</code>, producing paginated, crisp PDF documents with formatted tables, metric callouts, and clean typography.
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ================================================================= */}
            {/* SECTION 6: DATA & SENSOR FEED STATUS                              */}
            {/* ================================================================= */}
            {(activeCategory === "all" || activeCategory === "status") && !searchQuery && (
              <section className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#E1EEF9] pb-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      6. Real-Time Data &amp; Sensor Feed Health Monitor
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    All Systems Operational
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[#E1EEF9] bg-white shadow-xs">
                  <table className="w-full text-left text-xs font-body">
                    <thead className="bg-[#0B2545] text-white text-[10px] font-bold uppercase tracking-wider font-mono">
                      <tr>
                        <th className="p-3">Feed Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Latency</th>
                        <th className="p-3">Data Provider</th>
                        <th className="p-3">Interface Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E1EEF9] text-slate-700">
                      {sensorFeeds.map((feed, idx) => (
                        <tr key={idx} className="hover:bg-[#F8FBFE]">
                          <td className="p-3 font-semibold text-[#0B2545]">
                            {feed.name}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-mono text-[11px] font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {feed.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-[#1E5FBF]">
                            {feed.latency}
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {feed.source}
                          </td>
                          <td className="p-3 font-mono text-slate-500 text-[11px]">
                            {feed.type}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1E5FBF] shrink-0 mt-0.5" />
                  <div>
                    <strong>Data Fallback Policy:</strong> When live satellite SAR passes or coastal AIS antennas experience temporary atmospheric fading, Sahayya automatically transitions to calibrated synthetic benchmark telemetry clearly tagged <code>[DEMO / SIMULATED]</code> to maintain uninterrupted operational readiness.
                  </div>
                </div>
              </section>
            )}

            {/* ================================================================= */}
            {/* SECTION 7: TROUBLESHOOTING PLAYBOOKS                              */}
            {/* ================================================================= */}
            {(activeCategory === "all" || activeCategory === "troubleshooting") && (
              <section className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#E1EEF9] pb-2">
                  <div className="flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      7. Operational Troubleshooting &amp; Rapid Fixes
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {filteredTroubleshooting.length} Solutions Available
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredTroubleshooting.map((t) => {
                    const isExpanded = expandedAccordions[t.id];
                    return (
                      <div
                        key={t.id}
                        className="rounded-2xl bg-white border border-[#E1EEF9] shadow-[0_2px_8px_rgba(30,95,191,0.05)] overflow-hidden"
                      >
                        <div
                          onClick={() => toggleAccordion(t.id)}
                          className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#F8FBFE] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-display font-bold text-xs text-[#0B2545]">
                                {t.issue}
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5 font-body">
                                Symptom: {t.symptom}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded hidden sm:inline">
                            {t.category}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 text-xs font-body animate-fadeIn">
                            <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1">
                              <span className="font-bold text-[#0B2545] text-[11px] uppercase font-mono block">
                                Probable Root Causes:
                              </span>
                              <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                                {t.causes.map((c, i) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                              <span className="font-bold text-emerald-900 text-[11px] uppercase font-mono block">
                                Step-by-Step Resolution:
                              </span>
                              <ol className="list-decimal list-inside text-emerald-950 space-y-1 text-xs font-medium">
                                {t.solutions.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ================================================================= */}
            {/* SECTION 8: SUPPORT & FEEDBACK                                     */}
            {/* ================================================================= */}
            {(activeCategory === "all" || activeCategory === "support") && !searchQuery && (
              <section className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#E1EEF9] pb-2">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-[#1E5FBF]" />
                    <h3 className="text-sm font-bold text-[#0B2545] uppercase tracking-wider font-display">
                      8. Command Support &amp; Technical Inquiries
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    24/7 Operations Desk
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Support Channels */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-xs space-y-3 text-xs font-body">
                    <h4 className="font-display font-bold text-xs text-[#0B2545] uppercase tracking-wider">
                      Authorizing Agencies &amp; Operational Contacts
                    </h4>
                    <div className="space-y-2.5 text-slate-700">
                      <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                        <span className="font-bold text-[#0B2545] block">Maritime Rescue Coordination Centre (MRCC)</span>
                        <span className="text-[11px] text-slate-500 font-mono block">Western Naval Command, Mumbai Harbor</span>
                        <span className="text-[10px] text-[#1E5FBF] font-mono block mt-1">Configured Duty Channel: VHF Ch 16 / DSC 2187.5 kHz</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                        <span className="font-bold text-[#0B2545] block">Sahayya Technical Operations Unit</span>
                        <span className="text-[11px] text-slate-500 font-mono block">Smart India Hackathon 2026 Internal Team</span>
                        <span className="text-[10px] text-emerald-700 font-mono block mt-1">Platform Kernel: Python FastAPI + Vite React TypeScript</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Submit Feedback / Report Anomaly */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E1EEF9] shadow-xs space-y-3 text-xs font-body">
                    <h4 className="font-display font-bold text-xs text-[#0B2545] uppercase tracking-wider">
                      Report an Anomaly or Feedback
                    </h4>
                    {feedbackSubmitted ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-fadeIn">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                        <h5 className="font-bold text-emerald-950 text-xs">
                          Operational Report Logged
                        </h5>
                        <p className="text-[11px] text-emerald-700">
                          Thank you. Your feedback has been queued in the system audit registry.
                        </p>
                        <button
                          onClick={() => {
                            setFeedbackSubmitted(false);
                            setFeedbackText("");
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Submit Another Note
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <textarea
                          rows={3}
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Describe any telemetry anomaly, UI issue, or tactical feature request..."
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-body focus:outline-none focus:ring-2 focus:ring-[#1E5FBF] resize-none"
                        />
                        <button
                          onClick={() => {
                            if (feedbackText.trim()) setFeedbackSubmitted(true);
                          }}
                          disabled={!feedbackText.trim()}
                          className="w-full py-2 rounded-xl bg-[#0B2545] hover:bg-[#123A66] text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Submit Operational Log
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HelpPage;
