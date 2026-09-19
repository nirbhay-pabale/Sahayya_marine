# SAHAYYA (सहाय्य)
### National Maritime Domain Awareness, Hydrodynamic Forensics & Vessel Attribution Platform

---

## 1. Project Overview & Operational Mission

**SAHAYYA** is an intelligence-driven maritime defense, hydrodynamic forensics, and environmental enforcement platform engineered for Indian territorial waters and Exclusive Economic Zones (EEZ). 

The platform solves the critical operational challenge of detecting illicit offshore marine discharges (such as oily ballast water washing and illegal bunkering leaks), identifying the responsible commercial vessel using multi-dimensional kinematic transponder correlation, and automatically generating court-admissible forensic case packages for immediate electronic handover to maritime enforcement bodies such as the **Indian Coast Guard (MRCC)** and the **Directorate General of Shipping (DGS)**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 END-TO-END OPERATIONAL WORKFLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

  [1. DETECT]        Sentinel-1 SAR Radar satellite acquisition & dual-polarization damping analysis.
       │
       ▼
  [2. ANALYZE]       Lagrangian particle dispersion modeling & backward-in-time origin hindcasting.
       │
       ▼
  [3. ATTRIBUTE]     7D AIS kinematic correlation (speed anomalies, track intersections, AIS blackouts).
       │
       ▼
  [4. MODEL IMPACT]  Coastal mangrove/coral vulnerability (ESI) & 4-scenario IOPC economic loss model.
       │
       ▼
  [5. COMPILE]       Automatic assembly of 7 certified stage reports & 8-page Master Case Dossier PDF.
       │
       ▼
  [6. HANDOVER]      Cryptographic Merkle root signing & direct electronic dispatch to MRCC Command.
       │
       ▼
  [7. TRACK]         Real-time response tracking, fleet coordination, and immutable audit log closure.
```

---

## 2. Complete System Architecture

The Sahayya architecture is organized into seven interconnected functional layers:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SAHAYYA SYSTEM ARCHITECTURE                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                     1. MULTI-SOURCE SENSOR INGESTION LAYER                                │
 │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌────────────────────────┐  ┌────────────────┐ │
 │  │ Sentinel-1 SAR Satellite │  │ Coastal & Satellite AIS │  │ Open-Meteo Marine Grid │  │ INCOIS MetOcean│ │
 │  │ (VV/VH Radar GeoTIFFs)  │  │ (High-Freq Trajectories)│  │ (Surface Wind & Current)│  │ (Waves & Temp) │ │
 │  └────────────┬────────────┘  └────────────┬────────────┘  └───────────┬────────────┘  └───────┬────────┘ │
 └───────────────┼────────────────────────────┼───────────────────────────┼───────────────────────┼──────────┘
                 │                            │                           │                       │
                 ▼                            ▼                           ▼                       ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   2. ANALYTICAL FORENSICS & SIMULATION ENGINE                             │
 │  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐   ┌──────────────────────────┐ │
 │  │ SAR Radar Damping Filter        │   │ Lagrangian Reverse Hindcasting  │   │ 7D AIS Kinematic Matcher │ │
 │  │ • Capillary Wave Damping Tensor │   │ • Backward Drift Particle Model │   │ • Spatial & Temporal Gap │ │
 │  │ • Look-Alike False Positive Sieve│   │ • Metocean Vector Advection     │   │ • Speed Drop & Blackouts │ │
 │  └────────────────┬────────────────┘   └────────────────┬────────────────┘   └────────────┬─────────────┘ │
 │                   │                                     │                                 │               │
 │                   ▼                                     ▼                                 ▼               │
 │  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
 │  │ ADIOS-2 Weathering & Impact Modeling                                                                 │ │
 │  │ • Evaporation, Emulsification & Natural Dispersion Curves                                            │ │
 │  │ • GIS Coastal Mangrove & Habitat Vulnerability (ESI)                                                 │ │
 │  │ • 4-Scenario IOPC Tier-1 Economic Clean-Up & Commercial Damage Calculator                            │ │
 │  └──────────────────────────────────────────────────┬───────────────────────────────────────────────────┘ │
 └─────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┘
                                                       │
                                                       ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                  3. BACKEND API & CRYPTOGRAPHIC SERVICES LAYER                            │
 │  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
 │  │ Python FastAPI Asynchronous Application Engine                                                       │ │
 │  │ • RESTful Telemetry Endpoints & Dynamic Case Routers (/api/incidents, /api/vessels, /api/authority) │ │
 │  │ • WebSocket Real-Time Event Dispatcher (Live Spill Telemetry & Asset Tracking)                       │ │
 │  │ • Cryptographic SHA-256 Merkle Root Sealing & Immutable Audit Trail Generator                        │ │
 │  │ • Asynchronous Database Engine (SQLAlchemy 2.0 with Scoped Async Sessions)                           │ │
 │  └──────────────────────────────────────────────────┬───────────────────────────────────────────────────┘ │
 └─────────────────────────────────────────────────────┼─────────────────────────────────────────────────────┘
                                                       │
                         ┌─────────────────────────────┴─────────────────────────────┐
                         ▼                                                           ▼
 ┌──────────────────────────────────────────────┐            ┌──────────────────────────────────────────────┐
 │          4. DATABASE & STORAGE LAYER         │            │          5. CLIENT WORKSTATION LAYER         │
 │  ┌────────────────────────────────────────┐  │            │  ┌────────────────────────────────────────┐  │
 │  │ SQLite (WAL Mode) / PostgreSQL+PostGIS │  │            │  │ React 18 + TypeScript + Vite Single    │  │
 │  │ • Incidents, Vessels & Route Histories │  │            │  │ Page Application (SPA)                 │  │
 │  │ • Maritime Cases & Lifecycle Stages    │  │            │  │ • Space Grotesk / Inter Tactical Design│  │
 │  │ • Cryptographic Evidence & Audit Logs  │  │            │  │ • Interactive Leaflet Vector GIS Grid  │  │
 │  │ • User Accounts & RBAC Governance      │  │            │  │ • Dynamic Recharts Analytics Visualizer│  │
 │  └────────────────────────────────────────┘  │            │  │ • In-Browser jsPDF Dossier Compiler    │  │
 │  ┌────────────────────────────────────────┐  │            │  │ • 6-Language Localization Engine       │  │
 │  │ Certified Static Dossier Storage       │  │            │  └───────────────────┬────────────────────┘  │
 │  └────────────────────────────────────────┘  │            └──────────────────────┼───────────────────────┘
 └──────────────────────────────────────────────┘                                   │
                                                                                    ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                     6. AUTHORITY SECURE HANDOVER GATEWAY                                  │
 │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌────────────────────────┐  ┌────────────────┐ │
 │  │ Indian Coast Guard      │  │ Directorate General     │  │ Maharashtra Pollution  │  │ INCOIS & Navy  │ │
 │  │ (MRCC Mumbai / Gujarat) │  │ of Shipping (DGS Portal)│  │ Control Board (MPCB)   │  │ Ops Centers    │ │
 │  └─────────────────────────┘  └─────────────────────────┘  └────────────────────────┘  └────────────────┘ │
 └───────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack Breakdown

### A. Frontend Technology Stack
* **Core Framework:** React 18 with TypeScript for type-safe component development.
* **Build Tool & Bundler:** Vite 6 with Rollup-driven chunk optimization, dynamic module imports, and fast compilation.
* **Styling & Design System:** Custom tailored utility CSS design system built on curated HSL tokens, Space Grotesk (command headers), Inter (operational UI), and JetBrains Mono (GIS coordinates, IMO numbers, cryptographic digests).
* **GIS & Spatial Mapping:**
  * Leaflet and React-Leaflet for canvas/SVG tile rendering.
  * Custom layer handlers for dual-polarization radar slicks, Lagrangian dispersion particle swarms, historical vessel vectors, and coastal sensitivity boundaries.
  * Integration with OpenStreetMap, CartoDB Dark/Voyager, and bathymetric depth contours.
* **Analytics & Charting:** Recharts for dynamic time-series rendering of hydrocarbon weathering curves, AIS kinematic speed-drop profiles, and multi-factor attribution matrices.
* **Document & PDF Compilation Engine:**
  * jsPDF with `jspdf-autotable` for compiling complete 8-page court-admissible PDF dossiers in-browser.
  * HTML2Canvas and DOMPurify for vector snapshotting and XSS sanitization.
* **State & Localization Contexts:**
  * `AuthContext`: Manages officer authentication, session tokens, and Role-Based Access Control (RBAC).
  * `LanguageContext`: Native localization supporting 6 operational languages (English, Hindi, Marathi, Gujarati, Tamil, Telugu).
* **Real-time Telemetry:** Native WebSocket client for live event notifications and spatial coordinate streaming.

---

### B. Backend Technology Stack
* **Runtime & Framework:** Python 3.11+ with FastAPI (Asynchronous REST API and WebSocket dispatcher).
* **Data Validation & Schemas:** Pydantic v2 schemas enforcing strict typing on GIS coordinates, vessel telemetry, and case dossiers.
* **Asynchronous Concurrency:** AsyncIO event loop managing simultaneous satellite tensor parsing, hydrodynamic calculations, and telemetry broadcasting.
* **Data Ingestion Connectors:**
  * Open-Meteo Marine & Wind API integrations for live surface currents and 10m atmospheric wind vectors.
  * INCOIS MetOcean data models for sea-surface temperature and significant wave height.
  * Sentinel-1 SAR orbital ephemeris and radar backscatter metadata processors.
* **Cryptographic Vault:** Python `hashlib` and `hmac` for automated SHA-256 Merkle root generation and immutable audit log hashing.

---

### C. Database & Persistence Layer
* **ORM & Database Abstraction:** SQLAlchemy 2.0 (Async Engine & Declarative Base).
* **Primary Database Engine:** SQLite (configured with Write-Ahead Logging `WAL` mode for high-throughput local deployment) with full native compatibility for PostgreSQL / PostGIS in high-availability enterprise environments.
* **Session Management:** Asynchronous Scoped Session Manager (`AsyncSessionLocal`) ensuring thread-safe database pooling.
* **Schema Governance:** Automatic migration and schema seeding engine ensuring baseline integrity on server boot.

---

## 4. Database Schema & Data Models

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                               DATABASE ENTITY GRAPH                              │
└──────────────────────────────────────────────────────────────────────────────────┘

   ┌───────────────────┐        1:N        ┌─────────────────────────┐
   │     Incidents     │ ────────────────> │    VesselCandidates     │
   │───────────────────│                   │─────────────────────────│
   │ id (PK)           │                   │ id (PK)                 │
   │ name, title       │                   │ incident_id (FK)        │
   │ lat, lon, area    │                   │ imo_number, vessel_name │
   │ volume_m3         │                   │ flag, vessel_type       │
   │ detection_time    │                   │ attribution_confidence  │
   │ status, severity  │                   │ speed_drop_knots        │
   └───────────────────┘                   │ ais_gap_duration_mins   │
             │                             └─────────────────────────┘
             │ 1:N
             ▼
   ┌───────────────────┐        1:1        ┌─────────────────────────┐
   │  MaritimeCases    │ ────────────────> │    SubmissionRecords    │
   │───────────────────│                   │─────────────────────────│
   │ case_id (PK)      │                   │ submission_id (PK)      │
   │ incident_id (FK)  │                   │ case_id (FK)            │
   │ assigned_auth_id  │                   │ authority_id, channel   │
   │ current_status    │                   │ merkle_root_hash        │
   │ package_version   │                   │ ack_reference_number    │
   │ readiness_score   │                   │ submitted_at, latency   │
   └───────────────────┘                   └─────────────────────────┘
             │
             │ 1:N
             ▼
   ┌───────────────────┐
   │    AuditTrails    │
   │───────────────────│
   │ event_id (PK)     │
   │ case_id (FK)      │
   │ actor, action     │
   │ sha256_hash       │
   │ timestamp_utc     │
   └───────────────────┘
```

### Table Specifications:
1. **`incidents`**: Stores primary spill detections, bounding polygons, centroid WGS-84 coordinates, surface slick area in $\text{km}^2$, estimated discharge volume in $\text{m}^3$, SAR sensor polarization, and lifecycle states.
2. **`vessels` & `vessel_candidates`**: Tracks commercial fleet entities, IMO numbers, MMSI codes, callsigns, flag states, deadweight tonnages, navigational status, historical trajectory logs, and probabilistic attribution scores.
3. **`maritime_cases`**: Connects raw incident telemetry to legal case dossiers, tracking 8-stage lifecycle status (`DRAFT` to `CLOSED`), readiness percentages, assigned authorities, and package versioning.
4. **`authorities`**: Configuration catalog of coastal command centers (MRCC Mumbai, MRCC Gandhinagar, DG Shipping, MPCB, INCOIS, Navy) with verified endpoint URLs and VHF channels.
5. **`submission_records`**: Immutable digital receipts recording official transmission timestamps, Merkle root digests, acknowledgment numbers, and dispatched Coast Guard assets.
6. **`case_audit_logs`**: Append-only audit vault storing every analytical modification, report compilation, and status transition with actor identities and SHA-256 signatures.
7. **`users`**: Stores officer credentials, clearance tiers (Tier 1 National Command to Tier 4 Forensic Analyst), hashed passwords, digital signature certificates, and operational stations.

---

## 5. Scientific Models & Forensic Formulations

### 1. Dual-Polarization SAR Radar Damping Index
Synthetic Aperture Radar (SAR) detects marine discharges because hydrocarbon films suppress capillary and short gravity ocean waves, reducing radar backscatter. Sahayya calculates the damping ratio ($\text{DR}$):
$$\text{Damping Ratio } (\text{DR}) = \frac{\sigma^\circ_{\text{clean water}}}{\sigma^\circ_{\text{slick}}}$$
A dual-polarization look-alike filter cross-examines wind shadow zones, biogenic algae films, and low-wind areas to eliminate false positives with high precision.

---

### 2. Lagrangian Reverse Hydrodynamic Hindcasting
To isolate the exact release origin, Sahayya executes a backward-in-time Lagrangian particle tracking simulation:
$$\vec{V}_{\text{drift}} = \vec{V}_{\text{current}} + 0.035 \times \vec{V}_{\text{wind}} + \vec{V}_{\text{stokes}}$$
* $\vec{V}_{\text{current}}$: Depth-averaged Eulerian ocean surface current vector.
* $\vec{V}_{\text{wind}}$: 10m atmospheric surface wind vector.
* $0.035$: Standard empirical wind drift factor ($3.5\%$).
* $\vec{V}_{\text{stokes}}$: Wave-induced Stokes drift derived from significant wave height and wave period.

Virtual particles are traced backwards ($T_0 \to T_{-24\text{h}}$) to isolate an origin probability density ellipse.

---

### 3. ADIOS-2 Weathering & Mass Balance Model
Calculates physical and chemical oil changes over time:
* **Evaporative Exposure:** Determines light-end hydrocarbon loss based on sea temperature and wind speed:
  $$F_v = \frac{\ln(1 + B \cdot \theta \cdot T_{\text{exp}})}{B}$$
* **Emulsification:** Evaluates water uptake and mousse formation as wave action increases slick viscosity.
* **Natural Dispersion:** Evaluates vertical droplet entrainment into the water column.

---

### 4. 7D AIS Kinematic Attribution Engine
Correlates the reverse origin fix against commercial vessel tracks across seven dimensions:
1. **Spatial Proximity:** Distance from the ship’s path to the origin centroid.
2. **Temporal Synchronization:** Time delta between the ship’s transit and the release window.
3. **Speed Drop Anomaly:** Unexplained velocity drops (e.g., $13.8\text{ kts} \to 1.4\text{ kts}$) typical during tank washings.
4. **Course Deviation:** Abnormal rate-of-turn maneuvers away from designated shipping lanes.
5. **Transponder Blackout:** Gaps in AIS transmissions indicating intentional transponder deactivation.
6. **Vessel Classification:** Tanker, bulk carrier, or container ship classification with cargo manifold details.
7. **Flag State & PSC Record:** Historical inspection violation history.

A composite Bayesian attribution certainty percentage is calculated:
$$P(\text{Attribution} \mid \text{Evidence}) = \frac{\prod_{i=1}^7 P(E_i \mid \text{Suspect}) \cdot P(\text{Suspect})}{\sum_{j} P(E \mid V_j) \cdot P(V_j)}$$

---

### 5. Environmental & Economic Impact Modeling
* **Environmental Sensitivity Index (ESI):** Cross-references predicted drift trajectories against coastal GIS layers to score threats to coastal mangroves, coral reefs, and turtle nesting beaches.
* **IOPC Tier-1 Economic Model:** Evaluates clean-up expenditures and commercial compensation liability across 4 operational scenarios:
  $$\text{Total Exposure} = C_{\text{containment}} + C_{\text{shoreline remediation}} + C_{\text{fisheries compensation}} + C_{\text{port disruption}}$$

---

## 6. Comprehensive Platform Modules

```
┌───────────────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ MODULE                            │ OPERATIONAL FUNCTIONALITY                                              │
├───────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 1. Incident Command Dashboard     │ Real-time KPIs, active slick extent, volume, and suspect profiles.     │
│ 2. Interactive GIS Maritime Map   │ Multi-layer map with temporal scrubber (-24h origin to +48h impact).   │
│ 3. Fleet & Vessel Intelligence    │ Commercial fleet catalog with automatic "dark target" AIS gap alerts.  │
│ 4. Forensic Attribution Lab       │ What-if hydrodynamic simulations, counterfactuals, & confidence matrix.│
│ 5. Certified Multi-Stage Reports  │ Automatic generation of 7 stage-specific PDFs and Master Case Dossier. │
│ 6. Authority Submission Console   │ Streamlined 4-step handover to Indian Coast Guard (MRCC) & authorities.│
│ 7. Security & Officer Vault       │ RBAC governance, 2FA, officer digital signature seals, and audit logs. │
│ 8. Maritime Forensics Manual      │ Standard Operating Procedures (SOPs) and maritime glossary.            │
└───────────────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

### Detailed Module Descriptions:

#### 1. Incident Command Dashboard (`/dashboard`)
* **Real-time Telemetry Banner:** Slick area, estimated volume, prevailing weather, prime suspect, and confidence score.
* **SAR Acquisition Profile:** Sentinel-1 radar pass details including orbit track, polarization, and spatial resolution.
* **Recent Operational Audit Trail:** Chronological log of detection events, analysis updates, and officer actions.
* **Candidate Vessel Priority Dossier:** Interactive cards highlighting prime suspect vessels with attribution confidence badges.

#### 2. Interactive GIS Maritime Map (`/map`)
* **Multi-Layer GIS Engine:** Toggle layers for Active Slicks, Reverse Origin Density Ellipses, AIS Traffic, Coastal Mangroves, Marine Protected Areas, and Port Boundaries.
* **Temporal Drift Scrubber:** Slide from $T_{-24\text{h}}$ (reverse hindcast origin) to $T_0$ (detection fix) and $T_{+48\text{h}}$ (forward shoreline impact forecast).
* **Vessel Kinematic Replay:** Interactive track inspection showing course vectors, speed changes, and AIS blackout segments.
* **Forensic Measurement Tools:** Spatial measurement tools to calculate distance to coastline and nautical mile buffers.

#### 3. Fleet & Vessel Intelligence System (`/vessels`)
* **Fleet Catalog & Filtering:** Search by IMO, MMSI, Vessel Name, Flag, and Risk Classification (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
* **Dark Target Detector:** Automatically flags vessels that disabled AIS transponders within $50\text{ NM}$ of detected discharges.
* **Vessel Profile Inspector:** Detailed specifications including gross tonnage, vessel type, callsign, owner/operator, destination, and current draft.
* **On-Scene Coast Guard Assets:** View nearby interceptor boats, Offshore Patrol Vessels (OPVs), and Dornier surveillance aircraft.

#### 4. Forensic Attribution & Scenario Lab (`/analysis`)
* **Counterfactual Analysis:** Test alternate hypotheses (e.g., natural seeps, pipeline leaks, or other commercial vessels) against simulated drift physics.
* **What-If Hydrodynamic Simulator:** Adjust wind speeds, current headings, and water temperatures to evaluate drift sensitivity.
* **Attribution Confidence Matrix:** Detailed breakdown of the 7 kinematic dimensions comparing suspect vessels side-by-side.
* **Historical Analogue Benchmarking:** Match current discharge signatures against historical baseline incidents.

#### 5. Certified Multi-Stage PDF Compilation Engine
Automatically generates court-admissible forensic documents with cryptographic seals:
1. **SAR Satellite Ingestion Report (`REP-01`):** Radar damping tensors and bounding coordinates.
2. **Spill Morphology & DNA Report (`REP-02`):** Hydrocarbon thickness, volume, and chemical properties.
3. **Lagrangian Reverse Hindcast Report (`REP-03`):** Wind/current vectors and particle origin density.
4. **Vessel Intelligence & 7D AIS Report (`REP-04`):** Kinematic anomaly graphs and blackout timelines.
5. **Environmental & Habitat Risk Report (`REP-05`):** Mangrove biomes, turtle beaches, and ESI rankings.
6. **Economic Clean-Up & Liability Report (`REP-06`):** 4-scenario financial damage calculations.
7. **Operational Tactical Response Report (`REP-07`):** NOS-DCP boom configurations and skimmer tasks.
8. **Master Case Dossier:** Comprehensive 8-page unified document combining all stages with official officer digital signature seals and Merkle root hashes.

#### 6. Authority Submission, Case Handover & Action Tracking (`/authority`)
* **Streamlined 4-Step Submission Console:**
  1. *Target Authority Selection:* Pick from verified agencies (MRCC Mumbai, MRCC Gandhinagar, DG Shipping, MPCB, INCOIS, Western Naval Command).
  2. *Incident Findings Snapshot:* Essential KPI cards summarizing spill area, suspect vessel, origin coordinates, and clean-up costs.
  3. *Certified Reports Package:* One-click preview and download of all 7 stage reports.
  4. *Authorizing Sign-off & Dispatch:* Officer credentials, severity assignment, operational directives, and instant electronic transmission.
* **Submission Status & Digital Receipt:** Displays official acknowledgment reference numbers, transmission latency, and dispatched response fleet.
* **Forensic Evidence Vault:** Inspect SHA-256 digests and raw telemetry JSON payloads under ISO/IEC 27037 standards.
* **Investigation Drift Detection:** Automatically alerts analysts when live hydrodynamic models update and offers 1-click package resynchronization.

#### 7. Tactical Administration & Security Vault (`/settings`)
* **Officer Identity & Credentials:** Manage ranks, VHF callsigns, and cryptographic digital signature seals.
* **Alert Pipelines & Thresholds:** Configure minimum severity alert triggers and automated dispatch channels.
* **Sensor Stream Configuration:** Connect satellite SAR downlinks, AIS receiver base stations, and HF radar feeds.
* **Role-Based Access Control (RBAC):** Manage clearance levels, multi-factor authentication (2FA), and session auto-lock policies.
* **Locale & Tactical Ergonomics:** Switch primary interface languages, coordinate formats (DMS vs Decimal Degrees), and high-contrast bridge screen modes.

#### 8. Maritime Operations & Forensics Manual (`/help`)
* **Standard Operating Procedures (SOP):** Step-by-step guidance for SAR image ingestion, hindcast configuration, and statutory filings.
* **Maritime Data Glossary:** Definitions of hydrodynamics, radar backscatter, MARPOL conventions, and AIS telemetry fields.
* **Troubleshooting Guide:** Diagnostic routines for sensor feeds, coordinate projection errors, and report compilation.

---

## 7. Legal & Statutory Admissibility Standards

1. **Digital Chain of Custody (ISO/IEC 27037):** Every raw evidence object, satellite GeoTIFF, AIS trajectory slice, and generated PDF dossier is stamped with an immutable SHA-256 cryptographic digest.
2. **Statutory Admissibility (MARPOL Annex I / UNCLOS 211):** Formatted specifically to satisfy Indian Admiralty Court and international Port State Control evidentiary requirements for prosecuting illegal oily ballast washing and deliberate bunker discharges.
3. **Role-Based Governance (RBAC):** Strict operational segregation between Forensic Investigators, Authorizing Command Officers, and External Authority Viewers.
4. **Data Privacy & Zero Secret Exposure:** Backend proxy architecture ensuring sensitive government endpoints and authentication tokens are never exposed to client-side code.
