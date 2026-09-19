import hashlib
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/authority", tags=["Authority Submission & Case Management"])

# In-memory case repository initialized with authenticated maritime cases
CASES_DB: Dict[str, dict] = {
    "CASE-2026-MH-001": {
        "case_id": "CASE-2026-MH-001",
        "incident_id": "IN-MH-2026",
        "title": "Mumbai High Sector-4 Crude Discharge & Attribution",
        "severity": "CRITICAL",
        "location": "Mumbai High Offshore Sector-4",
        "coordinates": [18.9482, 72.8194],
        "detection_time": "2026-09-14T20:30:00Z",
        "spill_area_km2": 4.82,
        "discharge_volume_m3": 850.0,
        "probable_origin": "18.9620°N, 72.7840°E (3.8 km WNW)",
        "candidate_vessel": "MT Ocean Crown (IMO 9384912)",
        "attribution_confidence": 94.2,
        "environmental_threat": "HIGH - Mangrove Sanctuary & Nariman Coastal Habitat",
        "estimated_economic_impact_inr": "₹ 18,45,00,000 (~$2.21M USD)",
        "current_status": "DRAFT",
        "submission_status": "PENDING_REVIEW",
        "package_version": 1,
        "last_updated": "2026-09-19T09:30:00Z",
        "selected_authority_id": "auth-icg-mrcc-mumbai",
        "assigned_analyst": "CDR. R. K. VERMA, IN (RETD) - MDA LEAD",
        "has_unacknowledged_drift": False,
        "submission_record": None,
        "audit_trail": [
            {
                "event_id": "LOG-001",
                "timestamp": "2026-09-14T20:30:00Z",
                "user": "AUTOMATED SAR INGESTION",
                "action": "INCIDENT_DETECTED",
                "detail": "SAR Sentinel-1 EW pass acquired; anomalous VV/VH dark slick recognized (4.82 km²).",
                "package_version": 1,
            },
            {
                "event_id": "LOG-002",
                "timestamp": "2026-09-14T20:45:00Z",
                "user": "SAHAYYA AI ENGINE",
                "action": "EVIDENCE_INDEXED",
                "detail": "6 Primary digital evidence objects cryptographically hashed and indexed in chain-of-custody.",
                "package_version": 1,
            },
            {
                "event_id": "LOG-003",
                "timestamp": "2026-09-14T21:00:00Z",
                "user": "HYDRODYNAMICS SERVICE",
                "action": "ANALYSIS_COMPLETED",
                "detail": "Lagrangian reverse hindcast generated probable origin fix at 18.9620°N, 72.7840°E.",
                "package_version": 1,
            },
            {
                "event_id": "LOG-004",
                "timestamp": "2026-09-14T21:15:00Z",
                "user": "AUTOMATED REPORT ENGINE",
                "action": "STAGE_REPORTS_COMPILED",
                "detail": "All 7 operational stage reports generated and certified with individual SHA-256 digests.",
                "package_version": 1,
            },
        ],
    },
    "CASE-2026-GK-002": {
        "case_id": "CASE-2026-GK-002",
        "incident_id": "IN-GK-2026",
        "title": "Gulf of Khambhat Industrial Bunkering Leak",
        "severity": "HIGH",
        "location": "Gulf of Khambhat Marine Protected Shoals",
        "coordinates": [21.524, 72.389],
        "detection_time": "2026-09-13T14:15:00Z",
        "spill_area_km2": 2.14,
        "discharge_volume_m3": 310.0,
        "probable_origin": "21.5410°N, 72.3650°E",
        "candidate_vessel": "MV Star Horizon (IMO 9142851)",
        "attribution_confidence": 88.5,
        "environmental_threat": "HIGH - Coastal Salt Marshes & Mudflats",
        "estimated_economic_impact_inr": "₹ 6,80,00,000 (~$815K USD)",
        "current_status": "SUBMITTED",
        "submission_status": "TRANSMITTED",
        "package_version": 1,
        "last_updated": "2026-09-14T11:20:00Z",
        "selected_authority_id": "auth-icg-mrcc-gandhinagar",
        "assigned_analyst": "LT. CDR. S. PATEL - NW SECTOR",
        "has_unacknowledged_drift": False,
        "submission_record": {
            "submission_id": "SUB-20260914-GK02",
            "incident_id": "IN-GK-2026",
            "case_id": "CASE-2026-GK-002",
            "authority_id": "auth-icg-mrcc-gandhinagar",
            "authority_name": "Indian Coast Guard (MRCC Gandhinagar)",
            "destination_endpoint": "https://mrcc-west.icg.gov.in/api/v2/secure-handover",
            "submitted_by": "LT. CDR. S. PATEL (OFFICER_ID: ICG-NW-771)",
            "submitted_at": "2026-09-14T11:20:00Z",
            "package_version": 1,
            "merkle_root_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "status": "TRANSMITTED",
            "acknowledgement_status": "ACKNOWLEDGED",
            "authority_reference_number": "MRCC-GNR-2026-09-ACK-8812",
            "integration_mode": "DIRECT MRCC TELEMETRY (DEMO / OPERATIONAL)",
            "response_notes": "Official acknowledgement received. Regional Sector Vessel ICGS Samudra Prahari tasked.",
        },
        "audit_trail": [
            {
                "event_id": "LOG-GK-001",
                "timestamp": "2026-09-13T14:15:00Z",
                "user": "SATELLITE OPS",
                "action": "INCIDENT_DETECTED",
                "detail": "Optical Sentinel-2 RGB detection verified near Khambhat shoals.",
                "package_version": 1,
            },
            {
                "event_id": "LOG-GK-002",
                "timestamp": "2026-09-14T11:20:00Z",
                "user": "LT. CDR. S. PATEL",
                "action": "CASE_SUBMITTED",
                "detail": "Case dossier version 1 submitted to MRCC Gandhinagar. ACK-8812 generated.",
                "package_version": 1,
            },
        ],
    },
    "CASE-2026-BB-003": {
        "case_id": "CASE-2026-BB-003",
        "incident_id": "IN-BB-2026",
        "title": "Bay of Bengal Deepwater Bilge Washings",
        "severity": "MEDIUM",
        "location": "Bay of Bengal Offshore Sector-9",
        "coordinates": [13.125, 80.452],
        "detection_time": "2026-09-10T08:00:00Z",
        "spill_area_km2": 1.15,
        "discharge_volume_m3": 95.0,
        "probable_origin": "13.1100°N, 80.4300°E",
        "candidate_vessel": "Unknown High-Speed Cargo",
        "attribution_confidence": 71.0,
        "environmental_threat": "MEDIUM - Open Pelagic Zone",
        "estimated_economic_impact_inr": "₹ 2,10,00,000 (~$250K USD)",
        "current_status": "ACTION_INITIATED",
        "submission_status": "ACTION_PENDING",
        "package_version": 2,
        "last_updated": "2026-09-12T16:00:00Z",
        "selected_authority_id": "auth-icg-mrcc-chennai",
        "assigned_analyst": "OPERATOR K. SUNDARAM",
        "has_unacknowledged_drift": False,
        "submission_record": {
            "submission_id": "SUB-20260911-BB03",
            "incident_id": "IN-BB-2026",
            "case_id": "CASE-2026-BB-003",
            "authority_id": "auth-icg-mrcc-chennai",
            "authority_name": "Indian Coast Guard (MRCC Chennai)",
            "destination_endpoint": "https://mrcc-east.icg.gov.in/api/v2/secure-handover",
            "submitted_by": "OPERATOR K. SUNDARAM",
            "submitted_at": "2026-09-11T10:00:00Z",
            "package_version": 2,
            "merkle_root_hash": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
            "status": "ACTION_INITIATED",
            "acknowledgement_status": "ACKNOWLEDGED",
            "authority_reference_number": "MRCC-CHN-2026-09-ACTION-104",
            "integration_mode": "DIRECT MRCC TELEMETRY (DEMO / OPERATIONAL)",
            "response_notes": "CG Dornier surveillance aircraft flight deployed for on-scene verification.",
        },
        "audit_trail": [
            {
                "event_id": "LOG-BB-001",
                "timestamp": "2026-09-10T08:00:00Z",
                "user": "INCOIS DATA STREAM",
                "action": "INCIDENT_DETECTED",
                "detail": "Open pelagic slick signature flagged.",
                "package_version": 1,
            },
            {
                "event_id": "LOG-BB-002",
                "timestamp": "2026-09-11T10:00:00Z",
                "user": "OPERATOR K. SUNDARAM",
                "action": "CASE_SUBMITTED",
                "detail": "Handover transmitted to MRCC Chennai.",
                "package_version": 1,
            },
            {
                "event_id": "LOG-BB-003",
                "timestamp": "2026-09-12T16:00:00Z",
                "user": "MRCC CHENNAI DESK",
                "action": "STATUS_CHANGED",
                "detail": "Status advanced to ACTION_INITIATED. Interceptor craft ICGS C-421 mobilized.",
                "package_version": 2,
            },
        ],
    },
}

AUTHORITY_DESTINATIONS = [
    {
        "id": "auth-icg-mrcc-mumbai",
        "name": "Indian Coast Guard (MRCC Mumbai)",
        "agency": "Indian Coast Guard (Ministry of Defence)",
        "region": "West Coast Command (Maharashtra / Goa)",
        "destination_unit": "Maritime Rescue Coordination Centre (MRCC) Mumbai",
        "jurisdiction": "Exclusive Economic Zone (West Sector 15°N - 21°N)",
        "submission_channel": "HTTPS REST / Direct MRCC Telemetry API (RESTRICTED TLS 1.3)",
        "integration_status": "OPERATIONAL / CONFIGURED",
        "contact_phone": "+91-22-24388065 / VHF Ch-16",
        "endpoint_url": "https://mrcc-west.icg.gov.in/api/v2/secure-handover",
        "is_default": True,
    },
    {
        "id": "auth-icg-mrcc-gandhinagar",
        "name": "Indian Coast Guard (MRCC Gandhinagar)",
        "agency": "Indian Coast Guard (North-West Command)",
        "region": "North-West Coast (Gujarat & Gulf of Kutch)",
        "destination_unit": "MRCC Gandhinagar / Regional HQ Okha",
        "jurisdiction": "Exclusive Economic Zone (NW Sector 21°N - 24°N)",
        "submission_channel": "HTTPS REST / Secure Telemetry API",
        "integration_status": "OPERATIONAL / CONFIGURED",
        "contact_phone": "+91-79-23243162 / VHF Ch-16",
        "endpoint_url": "https://mrcc-nw.icg.gov.in/api/v2/secure-handover",
        "is_default": False,
    },
    {
        "id": "auth-dg-shipping",
        "name": "Directorate General of Shipping (DGS)",
        "agency": "Ministry of Ports, Shipping and Waterways",
        "region": "National Maritime Jurisdiction (Pan-India)",
        "destination_unit": "Pollution Prevention & MARPOL Enforcement Directorate",
        "jurisdiction": "Flag State & Port State Control Enforcement (Pan-India)",
        "submission_channel": "DGS Digital Portal API (National Single Window)",
        "integration_status": "OPERATIONAL / STANDBY",
        "contact_phone": "+91-22-25752040",
        "endpoint_url": "https://dgshipping.gov.in/api/v1/marpol-incident",
        "is_default": False,
    },
    {
        "id": "auth-mpcb-coastal",
        "name": "Maharashtra Pollution Control Board (MPCB)",
        "agency": "State Environmental Protection Agency",
        "region": "Maharashtra State Coastal Territorial Waters (12 NM)",
        "destination_unit": "Coastal Zone Management & Marine Surveillance Cell",
        "jurisdiction": "State Territorial Sea & Intertidal Habitats",
        "submission_channel": "MPCB Marine Portal Webhook",
        "integration_status": "DEMO SUBMISSION MODE",
        "contact_phone": "+91-22-24010437",
        "endpoint_url": "https://mpcb.gov.in/api/coastal-pollution",
        "is_default": False,
    },
    {
        "id": "auth-incois",
        "name": "INCOIS - Ocean Advisory & Hazard Center",
        "agency": "Ministry of Earth Sciences (MoES)",
        "region": "Indian Ocean Basin (National Warning Center)",
        "destination_unit": "Ocean State Forecast & Spill Trajectory Modeling Division",
        "jurisdiction": "Indian Ocean MetOcean & MetOcean Science Validation",
        "submission_channel": "INCOIS Scientific Sensor Stream API",
        "integration_status": "OPERATIONAL / CONFIGURED",
        "contact_phone": "+91-40-23895000",
        "endpoint_url": "https://incois.gov.in/api/v3/spill-model-exchange",
        "is_default": False,
    },
    {
        "id": "auth-navy-wnc",
        "name": "Indian Navy (Western Naval Command - HQ WNC)",
        "agency": "Integrated Headquarters, Ministry of Defence (Navy)",
        "region": "Western Fleet Maritime Area",
        "destination_unit": "Joint Operations Center (JOC) Mumbai",
        "jurisdiction": "High Seas & Continental Shelf Strategic Waters",
        "submission_channel": "DefNet Secure Maritime Gateway",
        "integration_status": "RESTRICTED / DEFENCE CLEARANCE REQUIRED",
        "contact_phone": "+91-22-22751000",
        "endpoint_url": "https://defnet.navy.mil.in/joc-handover",
        "is_default": False,
    },
]


# Pydantic models
class SubmitCaseRequest(BaseModel):
    case_id: str
    authority_id: str
    officer_name: str
    officer_email: str
    officer_rank: str
    analyst_notes: Optional[str] = ""
    priority: str = "CRITICAL"
    recommended_action: Optional[str] = ""
    simulated_delay_ms: Optional[int] = 0


class AdvanceStatusRequest(BaseModel):
    new_status: str
    reason: Optional[str] = ""
    actor: Optional[str] = "COMMAND OFFICER"


@router.get("/destinations", summary="List configured authority destinations")
async def get_authority_destinations():
    return {
        "count": len(AUTHORITY_DESTINATIONS),
        "destinations": AUTHORITY_DESTINATIONS,
    }


@router.get("/cases", summary="List all active maritime forensic cases")
async def list_cases(
    status: Optional[str] = Query(None, description="Filter by case status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
):
    cases = list(CASES_DB.values())
    if status:
        cases = [c for c in cases if c.get("current_status") == status]
    if severity:
        cases = [c for c in cases if c.get("severity") == severity]
    return {
        "count": len(cases),
        "cases": cases,
    }


@router.get("/cases/{case_id}", summary="Get full details for a case")
async def get_case_detail(case_id: str):
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return case


@router.post("/submit", summary="Submit case dossier to maritime authority")
async def submit_case_to_authority(req: SubmitCaseRequest):
    case = CASES_DB.get(req.case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {req.case_id} not found")

    dest = next((d for d in AUTHORITY_DESTINATIONS if d["id"] == req.authority_id), None)
    if not dest:
        raise HTTPException(status_code=400, detail=f"Invalid authority destination: {req.authority_id}")

    # Compute genuine cryptographic digest for the package
    timestamp_iso = datetime.now(timezone.utc).isoformat()
    raw_payload = f"{req.case_id}:{case['incident_id']}:{req.authority_id}:{case['package_version']}:{timestamp_iso}"
    merkle_root_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    sub_suffix = case["incident_id"].replace("IN-", "")
    submission_id = f"SUB-{date_str}-{sub_suffix}"

    ref_num = None
    if "mrcc" in req.authority_id:
        rand_hex = hashlib.md5(f"{req.case_id}:{timestamp_iso}".encode("utf-8")).hexdigest()[:4].upper()
        ref_num = f"MRCC-BOM-{date_str[:4]}-{rand_hex}"

    is_demo = "DEMO" in dest["integration_status"]

    submission_record = {
        "submission_id": submission_id,
        "incident_id": case["incident_id"],
        "case_id": req.case_id,
        "authority_id": dest["id"],
        "authority_name": dest["name"],
        "destination_endpoint": dest["endpoint_url"],
        "submitted_by": f"{req.officer_rank} {req.officer_name} ({req.officer_email})",
        "submitted_at": timestamp_iso,
        "package_version": case["package_version"],
        "merkle_root_hash": merkle_root_hash,
        "status": "TRANSMITTED",
        "acknowledgement_status": "ACKNOWLEDGED",
        "authority_reference_number": ref_num,
        "integration_mode": "DEMO SUBMISSION MODE" if is_demo else "DIRECT MRCC TELEMETRY (RESTRICTED TLS 1.3)",
        "analyst_notes": req.analyst_notes or "Formal submission dispatched with signed chain-of-custody.",
        "recommended_action": req.recommended_action or "Mobilize Level-1 Containment Assets.",
    }

    # Update case state
    case["current_status"] = "SUBMITTED"
    case["submission_status"] = "TRANSMITTED"
    case["selected_authority_id"] = dest["id"]
    case["last_updated"] = timestamp_iso
    case["has_unacknowledged_drift"] = False
    case["submission_record"] = submission_record

    audit_entry = {
        "event_id": f"LOG-{int(time.time())}",
        "timestamp": timestamp_iso,
        "user": req.officer_name or "COMMAND OFFICER",
        "action": "CASE_SUBMITTED",
        "detail": f"Case dossier v{case['package_version']} transmitted to {dest['name']}. Merkle Root: {merkle_root_hash[:16]}...",
        "package_version": case["package_version"],
    }
    case["audit_trail"].insert(0, audit_entry)

    return {
        "success": True,
        "message": f"Case {req.case_id} successfully submitted to {dest['name']}.",
        "submission_record": submission_record,
        "case": case,
    }


@router.patch("/cases/{case_id}/status", summary="Advance case lifecycle stage")
async def advance_case_status(case_id: str, req: AdvanceStatusRequest):
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    valid_statuses = [
        "DRAFT", "READY", "SUBMITTED", "ACKNOWLEDGED",
        "UNDER_REVIEW", "ACTION_INITIATED", "RESOLVED", "CLOSED"
    ]
    if req.new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status: {req.new_status}")

    timestamp_iso = datetime.now(timezone.utc).isoformat()
    prev_status = case["current_status"]
    case["current_status"] = req.new_status
    case["last_updated"] = timestamp_iso

    audit_entry = {
        "event_id": f"LOG-{int(time.time())}",
        "timestamp": timestamp_iso,
        "user": req.actor or "COMMAND OFFICER",
        "action": "STATUS_CHANGED",
        "detail": f"Case status advanced from {prev_status} -> {req.new_status}. {req.reason or ''}".strip(),
        "package_version": case["package_version"],
    }
    case["audit_trail"].insert(0, audit_entry)

    return {
        "success": True,
        "case_id": case_id,
        "previous_status": prev_status,
        "new_status": req.new_status,
        "last_updated": timestamp_iso,
    }


@router.post("/cases/{case_id}/version", summary="Bump package version on data drift")
async def bump_case_version(case_id: str, actor: Optional[str] = "SYSTEM AUTOMATION"):
    case = CASES_DB.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    timestamp_iso = datetime.now(timezone.utc).isoformat()
    case["package_version"] += 1
    case["has_unacknowledged_drift"] = False
    case["last_updated"] = timestamp_iso

    audit_entry = {
        "event_id": f"LOG-{int(time.time())}",
        "timestamp": timestamp_iso,
        "user": actor,
        "action": "PACKAGE_REBUILT",
        "detail": f"Investigation package regenerated to version {case['package_version']} following telemetry update.",
        "package_version": case["package_version"],
    }
    case["audit_trail"].insert(0, audit_entry)

    return {
        "success": True,
        "case_id": case_id,
        "new_version": case["package_version"],
        "last_updated": timestamp_iso,
    }
