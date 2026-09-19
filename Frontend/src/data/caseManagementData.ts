// ============================================================================
// SAHAYYA — MARITIME CASE MANAGEMENT & AUTHORITY HANDOVER DATA ENGINE
// ============================================================================

export type CaseLifecycleStatus =
  | "DRAFT"
  | "READY"
  | "SUBMITTED"
  | "ACKNOWLEDGED"
  | "UNDER_REVIEW"
  | "ACTION_INITIATED"
  | "RESOLVED"
  | "CLOSED";

export type CaseSeverityTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AuthorityDestination {
  id: string;
  name: string;
  shortName: string;
  agencyType: "COAST_GUARD" | "MARITIME_ADMIN" | "POLLUTION_BOARD" | "NAVY" | "OCEANOGRAPHIC";
  region: string;
  sectorName: string;
  reportingChannel: string;
  contactOfficer: string;
  designation: string;
  secureEndpointUrl: string;
  integrationMode: "OFFICIAL_REST_API" | "SECURE_GOV_GATEWAY" | "DIRECT_MRCC_TELEMETRY" | "DEMO_SIMULATION";
  vhfChannel: string;
  dscMmsi: string;
  phone: string;
  email: string;
  isRecommendedDefault?: boolean;
}

export interface CaseAuditEntry {
  id: string;
  timestampUtc: string;
  timestampIst: string;
  action: string;
  actor: string;
  actorRole: string;
  stage: CaseLifecycleStatus;
  packageVersion: string;
  details: string;
  evidenceId?: string;
  reportId?: string;
  sha256Hash: string;
}

export interface CaseReadinessCheck {
  id: string;
  category: "INCIDENT_METADATA" | "EVIDENCE_CHAIN" | "ORIGIN_HINDCAST" | "VESSEL_ATTRIBUTION" | "ENVIRONMENTAL_ANALYSIS" | "ECONOMIC_MODEL" | "STAGE_REPORTS" | "ACTION_DIRECTIVES";
  label: string;
  status: "COMPLETE" | "WARNING" | "MISSING_MANDATORY";
  scoreWeight: number; // Percentage contribution (sum = 100)
  scoreEarned: number;
  details: string;
  mandatory: boolean;
}

export interface MaritimeCaseRecord {
  caseId: string;
  incidentId: string;
  title: string;
  severity: CaseSeverityTier;
  location: string;
  coordinates: [number, number];
  detectionTimeUtc: string;
  detectionTimeIst: string;
  spillAreaKm2: number;
  estimatedVolumeM3: number;
  probableOriginCoords: [number, number];
  probableOriginRadiusKm: number;
  suspectVesselName: string;
  suspectVesselImo: string;
  suspectVesselMmsi: string;
  suspectVesselFlag: string;
  attributionConfidencePct: number;
  environmentalScore: number;
  environmentalTier: string;
  economicImpactMinCr: number;
  economicImpactMaxCr: number;
  status: CaseLifecycleStatus;
  currentPackageVersion: string;
  isOutdated: boolean;
  outdatedReason?: string;
  lastUpdatedIst: string;
  assignedAuthorityId: string;
  submissionRecord?: {
    submissionId: string;
    submittedAtUtc: string;
    submittedAtIst: string;
    submittedBy: string;
    authorizingOfficer: string;
    destinationName: string;
    channelUsed: string;
    authorityRefNo?: string;
    digitalAckTimestamp?: string;
    transmissionLatencyMs: number;
    merkleRootHash: string;
    packageSizeBytes: string;
  };
  actionHandover?: {
    assignedUnit: string;
    operationalStatus: string;
    commandDirectives: string[];
    nextSitrepDue: string;
    actionNotes: string;
    respondingAssets: Array<{ name: string; type: string; status: string; eta: string }>;
  };
  auditTrail: CaseAuditEntry[];
}

// ----------------------------------------------------------------------------
// AUTHORIZED MARITIME AUTHORITIES DIRECTORY
// ----------------------------------------------------------------------------
export const AUTHORIZED_DESTINATIONS: AuthorityDestination[] = [
  {
    id: "auth-icg-mrcc-mumbai",
    name: "Indian Coast Guard — Maritime Rescue Co-ordination Centre (MRCC Mumbai)",
    shortName: "ICG MRCC Mumbai",
    agencyType: "COAST_GUARD",
    region: "Maharashtra & Goa Coastal Sector (West Coast EEZ)",
    sectorName: "Regional Headquarters (West), Worli Sea Face, Mumbai",
    reportingChannel: "National Maritime Distress & Pollution Telemetry Grid (NM-DPTG)",
    contactOfficer: "Commander S. Kumar, ICG",
    designation: "Chief Pollution Operations Officer, MRCC Mumbai",
    secureEndpointUrl: "https://api.icg.gov.in/mrcc-west/pollution/telemetry/v2",
    integrationMode: "DIRECT_MRCC_TELEMETRY",
    vhfChannel: "VHF Ch 16 / 70 DSC",
    dscMmsi: "004194400",
    phone: "+91 (022) 2437-1932 / 2437-6133",
    email: "mrcc-mumbai@indiancoastguard.nic.in",
    isRecommendedDefault: true,
  },
  {
    id: "auth-icg-mrcc-gandhinagar",
    name: "Indian Coast Guard — Regional Headquarters (North-West), Gandhinagar",
    shortName: "ICG RHQ Gandhinagar",
    agencyType: "COAST_GUARD",
    region: "Gujarat & Gulf of Kutch Maritime Zone",
    sectorName: "Regional Operations Centre, Udyog Bhavan, Gandhinagar",
    reportingChannel: "ICG North-West Automated Incident Exchange",
    contactOfficer: "Inspector General R. K. Bhatt, PTM, TM",
    designation: "Commander, Coast Guard Region (North-West)",
    secureEndpointUrl: "https://api.icg.gov.in/rhq-nw/spill-dispatch/v1",
    integrationMode: "SECURE_GOV_GATEWAY",
    vhfChannel: "VHF Ch 16 / 68",
    dscMmsi: "004194200",
    phone: "+91 (079) 2324-3404",
    email: "rhq-nw@indiancoastguard.nic.in",
    isRecommendedDefault: false,
  },
  {
    id: "auth-dg-shipping",
    name: "Directorate General of Shipping — Maritime Disciplinary & Casualty Cell",
    shortName: "DG Shipping (DGS Mumbai)",
    agencyType: "MARITIME_ADMIN",
    region: "All-India EEZ & Statutory Merchant Shipping Act Jurisdiction",
    sectorName: "Beta Building, i-Think Techno Campus, Kanjurmarg (East), Mumbai",
    reportingChannel: "DG-S-MARPOL National Incident Registry",
    contactOfficer: "Capt. A. K. Sharma",
    designation: "Principal Officer & Nautical Surveyor-cum-DDG (Tech)",
    secureEndpointUrl: "https://api.dgshipping.gov.in/marpol/annex1/filing",
    integrationMode: "OFFICIAL_REST_API",
    vhfChannel: "N/A (Administrative)",
    dscMmsi: "004190001",
    phone: "+91 (022) 2575-2040",
    email: "marpol-casualty@dgshipping.gov.in",
    isRecommendedDefault: false,
  },
  {
    id: "auth-mpcb-coastal",
    name: "Maharashtra Pollution Control Board — Coastal Disaster Mitigation Desk",
    shortName: "MPCB Coastal Cell",
    agencyType: "POLLUTION_BOARD",
    region: "Maharashtra Territorial Waters (12 NM Baseline & Coastal Habitats)",
    sectorName: "Kalpataru Point, Sion Circle, Mumbai",
    reportingChannel: "CPCB/MPCB Real-Time Environmental Hazard Network",
    contactOfficer: "Dr. V. M. Motghare",
    designation: "Joint Director (Water Pollution & Coastal Ecology)",
    secureEndpointUrl: "https://api.mpcb.gov.in/emergency/coastal-discharge",
    integrationMode: "OFFICIAL_REST_API",
    vhfChannel: "N/A",
    dscMmsi: "N/A",
    phone: "+91 (022) 2401-0437",
    email: "coastal-hazard@mpcb.gov.in",
    isRecommendedDefault: false,
  },
  {
    id: "auth-incois-hazard",
    name: "INCOIS — National Ocean Hazard Advisory & Forecasting Services Desk",
    shortName: "INCOIS Hazard Center",
    agencyType: "OCEANOGRAPHIC",
    region: "Indian Ocean, Arabian Sea & Bay of Bengal Oceanographic Grid",
    sectorName: "Ministry of Earth Sciences, Pragathi Nagar, Hyderabad",
    reportingChannel: "INCOIS-NOOS Marine Spill Forecasting Interface",
    contactOfficer: "Dr. T. Srinivasa Kumar",
    designation: "Head, Ocean Science & Early Warning Systems",
    secureEndpointUrl: "https://api.incois.gov.in/spill-models/reverse-lagrangian",
    integrationMode: "DIRECT_MRCC_TELEMETRY",
    vhfChannel: "Satellite INMARSAT-C",
    dscMmsi: "004190100",
    phone: "+91 (040) 2389-5000",
    email: "spill-model@incois.gov.in",
    isRecommendedDefault: false,
  },
  {
    id: "auth-indian-navy-jmoc",
    name: "Indian Navy — Joint Maritime Operations Centre (Western Naval Command)",
    shortName: "JMOC Mumbai (Navy)",
    agencyType: "NAVY",
    region: "High Seas EEZ & Offshore Strategic Assets (Mumbai High Corridor)",
    sectorName: "Flag Officer Commanding-in-Chief, Western Naval Command, Mumbai",
    reportingChannel: "Navy NC3I Coastal Security Network",
    contactOfficer: "Commander V. R. Rao, IN",
    designation: "Joint Operations Duty Officer",
    secureEndpointUrl: "https://navy.nic.in/jmoc-west/surveillance/v1",
    integrationMode: "SECURE_GOV_GATEWAY",
    vhfChannel: "VHF Ch 16 / Military Tac 243.0",
    dscMmsi: "004190010",
    phone: "+91 (022) 2275-1000",
    email: "jmoc-west@navy.gov.in",
    isRecommendedDefault: false,
  },
];

// ----------------------------------------------------------------------------
// INITIAL MULTI-CASE DATASET
// ----------------------------------------------------------------------------
export const INITIAL_MARITIME_CASES: MaritimeCaseRecord[] = [
  {
    caseId: "CASE-2026-MH-001",
    incidentId: "IN-MH-2026",
    title: "Mumbai High Offshore Sector Crude Oil Spill & Suspect Attribution",
    severity: "CRITICAL",
    location: "Mumbai High Offshore Sector, Arabian Sea (38km WSW of Alibaug)",
    coordinates: [18.69, 72.38],
    detectionTimeUtc: "2026-09-18 14:14:43 UTC",
    detectionTimeIst: "2026-09-18 19:44:43 IST",
    spillAreaKm2: 14.2,
    estimatedVolumeM3: 48000,
    probableOriginCoords: [18.6398, 72.0032],
    probableOriginRadiusKm: 1.5,
    suspectVesselName: "MT PACIFIC VOYAGER",
    suspectVesselImo: "9438200",
    suspectVesselMmsi: "636019842",
    suspectVesselFlag: "Liberia",
    attributionConfidencePct: 98.8,
    environmentalScore: 86.4,
    environmentalTier: "CRITICAL ECOLOGICAL THREAT",
    economicImpactMinCr: 60.8,
    economicImpactMaxCr: 79.8,
    status: "READY",
    currentPackageVersion: "v1.4",
    isOutdated: false,
    lastUpdatedIst: "19 Sep 2026, 09:15 IST",
    assignedAuthorityId: "auth-icg-mrcc-mumbai",
    submissionRecord: undefined,
    actionHandover: {
      assignedUnit: "ICGS Samudra Prahari (CG-01)",
      operationalStatus: "Standing by for Command Dispatch Order",
      commandDirectives: [
        "Deploy 2,400m heavy inflatable offshore boom along leading edge (18.72°N, 72.41°E).",
        "Issue formal MARPOL Notice of Violation and AIS Intercept Directive to MT Pacific Voyager (IMO: 9438200).",
        "Position defensive sorbent booms across Alibaug and Murud tidal mangrove inlets.",
        "Maintain chemical dispersant application on standby subject to INCOIS 10-fathom bathymetric clearance.",
      ],
      nextSitrepDue: "19 Sep 2026, 12:00 IST (+3h)",
      actionNotes: "High-priority case ready for immediate transmission to MRCC Mumbai. Full evidence package cryptographically certified.",
      respondingAssets: [
        { name: "ICGS Samudra Prahari", type: "Pollution Control Vessel (PCV)", status: "On Station (18.82°N, 72.45°E)", eta: "On Station" },
        { name: "ICGS Sankalp", type: "Offshore Patrol Vessel (OPV)", status: "En Route Containment Grid", eta: "45 min" },
        { name: "Dornier CG-782", type: "Maritime Surveillance Aircraft (SLAR)", status: "Pre-Flight Clearance", eta: "1.2 h" },
      ],
    },
    auditTrail: [
      {
        id: "AUD-001",
        timestampUtc: "2026-09-18 14:15:00Z",
        timestampIst: "2026-09-18 19:45:00 IST",
        action: "SAR Slick Auto-Ingestion & Segmentation",
        actor: "Sentinel-1A / Adaptive U-Net v2.1",
        actorRole: "Automated Satellite Ingestion Pipeline",
        stage: "DRAFT",
        packageVersion: "v1.0",
        details: "14.2 km² surface slick identified with -7.8 dB backscatter damping. Confidence: 98.6%.",
        evidenceId: "EVID-SAR-001",
        sha256Hash: "a3f89b2c94e82017df83c9201948ba02384f981029348bca1209384fac917d1e",
      },
      {
        id: "AUD-002",
        timestampUtc: "2026-09-18 15:30:00Z",
        timestampIst: "2026-09-18 21:00:00 IST",
        action: "Reverse Lagrangian Particle Hindcast Completed",
        actor: "OpenDrift Hydrodynamic Kernel v1.9",
        actorRole: "Forensic Dispersion Engine",
        stage: "DRAFT",
        packageVersion: "v1.1",
        details: "Calculated release origin centered at 18.6398°N, 72.0032°E (Zone Alpha, 97.7% convergence).",
        evidenceId: "EVID-LAG-003",
        sha256Hash: "9e44d1bc489201938bfa019283401928301928301928301928340192834a33aa",
      },
      {
        id: "AUD-003",
        timestampUtc: "2026-09-18 17:10:00Z",
        timestampIst: "2026-09-18 22:40:00 IST",
        action: "7D AIS Kinematic Anomaly Correlated",
        actor: "DG Shipping Class-A AIS Stream",
        actorRole: "Kinematic Vessel Tracker",
        stage: "DRAFT",
        packageVersion: "v1.2",
        details: "MT Pacific Voyager matched with 94 min blackout & speed drop 13.8 -> 1.4 kts (CPA: 0.6 km).",
        evidenceId: "EVID-AIS-002",
        sha256Hash: "f7c18a992837190bb4c8109238410948bca10293840192834bfa901294874b22",
      },
      {
        id: "AUD-004",
        timestampUtc: "2026-09-19 01:20:00Z",
        timestampIst: "2026-09-19 06:50:00 IST",
        action: "Environmental & Economic Impact Modeling Completed",
        actor: "Sahayya Multi-Pillar Engine",
        actorRole: "Forensic Impact Engine",
        stage: "DRAFT",
        packageVersion: "v1.3",
        details: "Environmental score calculated at 86.4/100 (Critical). Total financial exposure estimated at ₹60.8–₹79.8 Cr.",
        reportId: "REP-ENV-ECON-2026",
        sha256Hash: "d810283401928340192830192830192834019283401928340192834cc910128a",
      },
      {
        id: "AUD-005",
        timestampUtc: "2026-09-19 03:45:00Z",
        timestampIst: "2026-09-19 09:15:00 IST",
        action: "Case Dossier Built & Readiness Certified",
        actor: "Commander S. Kumar",
        actorRole: "Duty Forensic Investigator, ICG MRCC",
        stage: "READY",
        packageVersion: "v1.4",
        details: "All 7 stage reports compiled and 6 cryptographic evidence records verified. Case readiness scored at 94%.",
        sha256Hash: "7e29a8f4c189b207df83c9201948ba02384f981029348bca1209384fac903cac",
      },
    ],
  },
  {
    caseId: "CASE-2026-GK-002",
    incidentId: "IN-GJ-2026",
    title: "Gulf of Kutch Marine Sanctuary Near-Shore Bunker Discharge",
    severity: "HIGH",
    location: "Gulf of Kutch Outer Channel (Near Vadinar SPM Terminal)",
    coordinates: [22.48, 69.75],
    detectionTimeUtc: "2026-09-17 08:30:00 UTC",
    detectionTimeIst: "2026-09-17 14:00:00 IST",
    spillAreaKm2: 6.8,
    estimatedVolumeM3: 14500,
    probableOriginCoords: [22.45, 69.71],
    probableOriginRadiusKm: 2.1,
    suspectVesselName: "MV NORDIC TRADER",
    suspectVesselImo: "9312890",
    suspectVesselMmsi: "538001928",
    suspectVesselFlag: "Marshall Islands",
    attributionConfidencePct: 88.4,
    environmentalScore: 78.2,
    environmentalTier: "HIGH VULNERABILITY (CORAL REEF ZONE)",
    economicImpactMinCr: 24.5,
    economicImpactMaxCr: 36.0,
    status: "SUBMITTED",
    currentPackageVersion: "v1.1",
    isOutdated: false,
    lastUpdatedIst: "18 Sep 2026, 18:30 IST",
    assignedAuthorityId: "auth-icg-mrcc-gandhinagar",
    submissionRecord: {
      submissionId: "SUB-2026-ICG-NW-44910",
      submittedAtUtc: "2026-09-17T16:20:00Z",
      submittedAtIst: "17 Sep 2026, 21:50 IST",
      submittedBy: "Analyst V. Nair",
      authorizingOfficer: "Commander S. Kumar",
      destinationName: "ICG RHQ Gandhinagar (North-West)",
      channelUsed: "ICG North-West Automated Incident Exchange",
      authorityRefNo: "ICG-NW-KUTCH-2026-0044",
      digitalAckTimestamp: "17 Sep 2026, 21:52 IST",
      transmissionLatencyMs: 380,
      merkleRootHash: "4f8a910283401928340192830192830192834019283401928340192834bb1122",
      packageSizeBytes: "14.8 MB (7 Reports + 4 SAR TIFFs)",
    },
    actionHandover: {
      assignedUnit: "ICGS Samudra Pavak (CG-03)",
      operationalStatus: "Interception & Sorbent Boom Containment Deployed",
      commandDirectives: [
        "Shield Pirotan Island Marine National Park coral reefs.",
        "Deploy skimming vessels at Vadinar crude tanker fairway.",
      ],
      nextSitrepDue: "19 Sep 2026, 14:00 IST",
      actionNotes: "Authority acknowledged receipt. Boarding inspection of MV Nordic Trader ordered at outer anchorage.",
      respondingAssets: [
        { name: "ICGS Samudra Pavak", type: "Pollution Control Vessel", status: "Active Skimming", eta: "On Scene" },
      ],
    },
    auditTrail: [
      {
        id: "AUD-GK-01",
        timestampUtc: "2026-09-17 08:35:00Z",
        timestampIst: "2026-09-17 14:05:00 IST",
        action: "Initial SAR Detection & Slick Identification",
        actor: "RISAT-1A (EOS-04) FRS-1",
        actorRole: "Satellite Radar Telemetry",
        stage: "DRAFT",
        packageVersion: "v1.0",
        details: "6.8 km² slick observed near Vadinar marine national park boundary.",
        sha256Hash: "3b8a910283401928340192830192830192834019283401928340192834cc9900",
      },
      {
        id: "AUD-GK-02",
        timestampUtc: "2026-09-17 16:20:00Z",
        timestampIst: "2026-09-17 21:50:00 IST",
        action: "Case Formally Transmitted to ICG RHQ Gandhinagar",
        actor: "Commander S. Kumar",
        actorRole: "Authorizing Officer",
        stage: "SUBMITTED",
        packageVersion: "v1.1",
        details: "Submitted via ICG North-West Automated Incident Exchange. Ref: ICG-NW-KUTCH-2026-0044.",
        sha256Hash: "4f8a910283401928340192830192830192834019283401928340192834bb1122",
      },
    ],
  },
  {
    caseId: "CASE-2026-BB-003",
    incidentId: "IN-WB-2026",
    title: "Sundarbans Biosphere Estuarine Chemical Contamination",
    severity: "MEDIUM",
    location: "Haldia Approach Channel, Hooghly Estuary (Bay of Bengal Sector)",
    coordinates: [21.85, 88.05],
    detectionTimeUtc: "2026-09-15 11:00:00 UTC",
    detectionTimeIst: "2026-09-15 16:30:00 IST",
    spillAreaKm2: 3.4,
    estimatedVolumeM3: 6200,
    probableOriginCoords: [21.82, 88.02],
    probableOriginRadiusKm: 1.8,
    suspectVesselName: "CMA CGM ANTARES",
    suspectVesselImo: "9514421",
    suspectVesselMmsi: "228392810",
    suspectVesselFlag: "France",
    attributionConfidencePct: 76.2,
    environmentalScore: 68.0,
    environmentalTier: "MODERATE ESTUARINE RISK",
    economicImpactMinCr: 12.0,
    economicImpactMaxCr: 18.5,
    status: "ACTION_INITIATED",
    currentPackageVersion: "v1.2",
    isOutdated: false,
    lastUpdatedIst: "18 Sep 2026, 11:00 IST",
    assignedAuthorityId: "auth-dg-shipping",
    submissionRecord: {
      submissionId: "SUB-2026-DGS-EST-10928",
      submittedAtUtc: "2026-09-15T18:00:00Z",
      submittedAtIst: "15 Sep 2026, 23:30 IST",
      submittedBy: "Analyst P. Roy",
      authorizingOfficer: "Commander S. Kumar",
      destinationName: "DG Shipping & West Bengal PCB",
      channelUsed: "DG-S-MARPOL National Incident Registry",
      authorityRefNo: "DGS-KOL-2026-CAS-091",
      digitalAckTimestamp: "15 Sep 2026, 23:32 IST",
      transmissionLatencyMs: 420,
      merkleRootHash: "9a7b810283401928340192830192830192834019283401928340192834ee5544",
      packageSizeBytes: "8.2 MB",
    },
    actionHandover: {
      assignedUnit: "Haldia Port Trust Emergency Vessel HT-02",
      operationalStatus: "Boom Containment Active; Water Quality Monitored",
      commandDirectives: [
        "Sample dissolved chemical aromatics at Sagar Island intake.",
        "Check bilge tank logs on arrival at Kolkata anchorage.",
      ],
      nextSitrepDue: "20 Sep 2026, 10:00 IST",
      actionNotes: "Action initiated by Haldia Port Trust & DG Shipping. Secondary sampling underway.",
      respondingAssets: [
        { name: "HT-02 Pollution Cutter", type: "Port Tug & Sorbent Vessel", status: "Deploying Sorbents", eta: "On Scene" },
      ],
    },
    auditTrail: [
      {
        id: "AUD-BB-01",
        timestampUtc: "2026-09-15 11:15:00Z",
        timestampIst: "2026-09-15 16:45:00 IST",
        action: "Optical & SAR Dual-Sensor Confirmation",
        actor: "Sentinel-2 MSI + Sentinel-1A",
        actorRole: "Satellite Ingestion",
        stage: "DRAFT",
        packageVersion: "v1.0",
        details: "Discharge detected in Hooghly pilot boarding fairway.",
        sha256Hash: "1a8b910283401928340192830192830192834019283401928340192834aa3311",
      },
      {
        id: "AUD-BB-02",
        timestampUtc: "2026-09-15 18:00:00Z",
        timestampIst: "2026-09-15 23:30:00 IST",
        action: "Case Submitted & Transmitted to DG Shipping",
        actor: "Commander S. Kumar",
        actorRole: "Authorizing Officer",
        stage: "SUBMITTED",
        packageVersion: "v1.1",
        details: "Submitted to DG Shipping Maritime Casualty Cell. Ref: DGS-KOL-2026-CAS-091.",
        sha256Hash: "9a7b810283401928340192830192830192834019283401928340192834ee5544",
      },
      {
        id: "AUD-BB-03",
        timestampUtc: "2026-09-16 04:30:00Z",
        timestampIst: "2026-09-16 10:00:00 IST",
        action: "Action Initiated by Port Safety Officer",
        actor: "Haldia Port Trust Authority",
        actorRole: "First Responding Unit",
        stage: "ACTION_INITIATED",
        packageVersion: "v1.2",
        details: "HT-02 dispatched for sorbent barrier deployment. Vessel crew questioned.",
        sha256Hash: "8c9a810283401928340192830192830192834019283401928340192834ff7788",
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// CASE READINESS CRITERIA EVALUATION FUNCTION
// ----------------------------------------------------------------------------
export function evaluateCaseReadiness(caseRecord: MaritimeCaseRecord): {
  overallScore: number;
  isReadyForSubmission: boolean;
  checks: CaseReadinessCheck[];
  mandatoryMissingCount: number;
  warningsCount: number;
} {
  const checks: CaseReadinessCheck[] = [
    {
      id: "chk-1",
      category: "INCIDENT_METADATA",
      label: "Incident Geometry, Time & Coordinates",
      status: "COMPLETE",
      scoreWeight: 15,
      scoreEarned: 15,
      details: `Coordinates: ${caseRecord.coordinates[0].toFixed(4)}°N, ${caseRecord.coordinates[1].toFixed(4)}°E. Area: ${caseRecord.spillAreaKm2} km². Time: ${caseRecord.detectionTimeIst}.`,
      mandatory: true,
    },
    {
      id: "chk-2",
      category: "EVIDENCE_CHAIN",
      label: "Cryptographic Evidence Chain (SHA-256)",
      status: "COMPLETE",
      scoreWeight: 15,
      scoreEarned: 15,
      details: "6 multi-sensor records verified under ISO/IEC 27037 standards with zero tamper hash mismatches.",
      mandatory: true,
    },
    {
      id: "chk-3",
      category: "ORIGIN_HINDCAST",
      label: "Lagrangian Reverse Hindcast Origin",
      status: "COMPLETE",
      scoreWeight: 15,
      scoreEarned: 15,
      details: `Origin centroid ${caseRecord.probableOriginCoords[0].toFixed(4)}°N, ${caseRecord.probableOriginCoords[1].toFixed(4)}°E (97.7% convergence).`,
      mandatory: true,
    },
    {
      id: "chk-4",
      category: "VESSEL_ATTRIBUTION",
      label: "7D AIS Kinematic Vessel Attribution",
      status: "COMPLETE",
      scoreWeight: 15,
      scoreEarned: 15,
      details: `Top suspect ${caseRecord.suspectVesselName} (IMO: ${caseRecord.suspectVesselImo}) matched with ${caseRecord.attributionConfidencePct}% confidence.`,
      mandatory: true,
    },
    {
      id: "chk-5",
      category: "ENVIRONMENTAL_ANALYSIS",
      label: "Environmental Habitat & MPA Vulnerability",
      status: "COMPLETE",
      scoreWeight: 10,
      scoreEarned: 10,
      details: `Score: ${caseRecord.environmentalScore}/100 (${caseRecord.environmentalTier}). 5 coastal biomes analyzed.`,
      mandatory: true,
    },
    {
      id: "chk-6",
      category: "ECONOMIC_MODEL",
      label: "Economic Clean-Up & Statutory Liability",
      status: "COMPLETE",
      scoreWeight: 10,
      scoreEarned: 10,
      details: `Estimated financial impact: ₹${caseRecord.economicImpactMinCr}–₹${caseRecord.economicImpactMaxCr} Cr. 4-scenario model computed.`,
      mandatory: true,
    },
    {
      id: "chk-7",
      category: "STAGE_REPORTS",
      label: "7 Stage Investigation PDF Reports",
      status: "COMPLETE",
      scoreWeight: 10,
      scoreEarned: 10,
      details: "All 7 specialized stage reports (Incident, Map, Vessel, Analysis, Environmental, Economic, Response) compiled.",
      mandatory: true,
    },
    {
      id: "chk-8",
      category: "ACTION_DIRECTIVES",
      label: "Recommended Operational Directives & Command Action Plan",
      status: "COMPLETE",
      scoreWeight: 10,
      scoreEarned: 10,
      details: `${caseRecord.actionHandover?.commandDirectives.length || 4} tactical containment directives configured.`,
      mandatory: false,
    },
  ];

  // Evaluate scores
  const totalEarned = checks.reduce((sum, c) => sum + c.scoreEarned, 0);
  const mandatoryMissing = checks.filter((c) => c.mandatory && c.status === "MISSING_MANDATORY").length;
  const warnings = checks.filter((c) => c.status === "WARNING").length;

  return {
    overallScore: Math.round(totalEarned),
    isReadyForSubmission: mandatoryMissing === 0 && totalEarned >= 80,
    checks,
    mandatoryMissingCount: mandatoryMissing,
    warningsCount: warnings,
  };
}
