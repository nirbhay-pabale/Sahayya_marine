# SAHAYYA (सहाय्य)
### National Maritime Domain Awareness, Hydrodynamic Forensics & Vessel Attribution Platform

---

## 1. What is Sahayya?

**Sahayya** is an intelligent maritime defense and environmental forensics platform designed for Indian territorial waters and Exclusive Economic Zones (EEZ). It detects marine oil spills from Sentinel-1 Synthetic Aperture Radar (SAR) imagery, models oceanographic drift in reverse to isolate the exact point of discharge, identifies suspect vessels using 7D AIS kinematic tracking, and compiles court-admissible dossiers for rapid electronic handover to authorities such as the **Indian Coast Guard (MRCC)**.

```
Detect Spill (Satellite SAR) ──▶ Find Origin (Ocean Drift) ──▶ Identify Suspect (AIS) ──▶ Submit to Coast Guard (MRCC)
```

---

## 2. Technology Stack

### **Frontend**
* **Framework:** React 18 with TypeScript
* **Build Tool:** Vite 6 with Rollup code-splitting
* **Styling & UI:** Custom Tailored CSS Design System with Space Grotesk, Inter, and JetBrains Mono typography
* **GIS & Spatial Mapping:** Leaflet & React-Leaflet with custom canvas layers, vessel trajectories, and bathymetric grids
* **Data Visualization:** Recharts for time-series weathering models, dispersion curves, and attribution matrices
* **PDF & Document Engine:** `jspdf` and `jspdf-autotable` for compiling multi-page, certified PDF dossiers in-browser
* **Localization:** Native multi-language context supporting **6 languages** (English, Hindi, Marathi, Gujarati, Tamil, Telugu)

### **Backend**
* **Runtime & Framework:** Python 3.11+ with FastAPI (Asynchronous REST & WebSockets)
* **Data Validation:** Pydantic v2 schemas
* **Hydrodynamics & Physics Engine:** Lagrangian particle tracking and weathering algorithms ($V_{\text{drift}} = V_{\text{current}} + 0.035 \times V_{\text{wind}}$)
* **7D Vessel Attribution Engine:** Multi-factor kinematic correlation (spatial proximity, speed drops, AIS gaps, course deviation)
* **Cryptographic Vault:** SHA-256 Merkle root hashing under ISO/IEC 27037 standards for court admissibility

### **Database & Storage**
* **Database Engine:** SQLite (configured with WAL mode) with native PostgreSQL / PostGIS compatibility
* **ORM:** SQLAlchemy 2.0 (Asynchronous Scoped Sessions)
* **Core Models:**
  * `Incidents`: Spill footprint ($\text{km}^2$), volume ($\text{m}^3$), WGS-84 coordinates, and SAR radar metadata
  * `Vessels`: IMO numbers, MMSI codes, flag registries, and historical kinematic tracks
  * `Maritime Cases`: Case status, 8-stage lifecycles, readiness metrics, and assigned authorities
  * `Submission Records`: Transmission receipts, reference numbers, and latency logs
  * `Audit Logs`: Append-only, tamper-proof audit trail of analytical modifications
  * `Users`: Officer identity credentials, RBAC tiers, and digital signature seals

---

## 3. Core Platform Modules

### 1. Incident Command Dashboard (`/dashboard`)
* Live overview of active oil discharges, slick extent, volume estimates, prevailing metocean vectors, and prime suspect ships.

### 2. Interactive GIS Maritime Map (`/map`)
* Multi-layer spatial command center with active slicks, commercial ship routes, marine protected zones, and a **temporal scrubber** (from $-24\text{h}$ reverse origin to $+48\text{h}$ coastal impact forecast).

### 3. Vessel Intelligence & Dark Target Tracking (`/vessels`)
* Commercial fleet catalog featuring automatic detection of "dark targets" (vessels that deactivated AIS transponders near discharge coordinates).

### 4. Forensic Attribution & Simulator Lab (`/analysis`)
* **What-If Simulator:** Dynamically adjust wind, currents, and sea temperatures to test trajectory sensitivity.
* **Attribution Matrix:** Evaluates suspect vessels across 7 kinematic dimensions to compute a confidence percentage.
* **Environmental & Cost Model:** Evaluates vulnerability of coastal mangroves/habitats and projects IOPC Tier-1 clean-up costs in Indian Rupees (₹).

### 5. Automatic Multi-Stage PDF Reports
* Automatically generates 7 certified stage reports (*Incident*, *Map*, *Vessel Attribution*, *Radar Damping*, *Environmental Risk*, *Clean-up Costs*, *Response Plan*) and an official **8-page Master Case Dossier PDF**.

### 6. Authority Submission & Case Handover (`/authority`)
* **Streamlined 4-Step Submission Console:**
  1. *Select Authority:* Indian Coast Guard (MRCC Mumbai / Gandhinagar), DG Shipping, MPCB, INCOIS, or Navy.
  2. *Incident Snapshot:* Spill area, suspect vessel, origin coordinates, and clean-up cost.
  3. *Attached Reports:* Instant preview and download of all 7 certified investigation reports.
  4. *Authorize & Transmit:* Officer sign-off and 1-click electronic handover with digital acknowledgment receipts.

---

## 4. Key Capabilities & Compliance

* **Zero Manual Effort:** Automatically integrates satellite downlinks, hydrodynamic simulations, and AIS transponder feeds.
* **Court-Admissible Forensics:** Stamped with cryptographic SHA-256 digests adhering to **IMO MARPOL Annex I**, **UNCLOS 211**, and Indian Admiralty standards.
* **Rapid Response Handover:** Instant electronic dispatch to Coast Guard patrol vessels to contain discharges before reaching sensitive shorelines.
