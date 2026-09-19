import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Send,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Ship,
  MapPin,
  Waves,
  Leaf,
  Download,
  Eye,
  RefreshCw,
  Check,
  X,
  ShieldCheck,
  Radio,
  Layers,
  Home,
  Map as MapIcon,
  Activity,
  Settings,
  HelpCircle,
  Sparkles,
  Sliders,
  FileCheck,
  Lock,
  ArrowRight,
  Printer,
  ChevronRight,
} from "lucide-react";
import {
  MaritimeCaseRecord,
  AuthorityDestination,
  CaseLifecycleStatus,
  CaseSeverityTier,
  evaluateCaseReadiness,
} from "../data/caseManagementData";
import authorityService from "../services/authoritySubmissionService";
import { generateMasterCaseDossierPdf } from "../services/masterCaseDossierPdfGenerator";
import { ReportGenerationModal } from "../components/ReportGenerationModal";
import { StageReportType } from "../services/stageReportPdfGenerator";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { EVIDENCE_CHAIN_RECORDS, EvidenceRecord } from "./AnalysisPage";

export const AuthorityHandoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();

  // Navigation & Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("Authority");

  // Multi-Case Management
  const [cases, setCases] = useState<MaritimeCaseRecord[]>(() => authorityService.getAllCases());
  const initialCaseId = searchParams.get("case") || cases[0]?.caseId || "CASE-2026-MH-001";
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);

  const selectedCase = useMemo(() => {
    return cases.find((c) => c.caseId === selectedCaseId) || cases[0];
  }, [cases, selectedCaseId]);

  // Authorities
  const authorities = useMemo(() => authorityService.getAuthorities(), []);
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<string>(
    selectedCase.assignedAuthorityId || "auth-icg-mrcc-mumbai"
  );

  const selectedAuthority = useMemo(() => {
    return authorities.find((a) => a.id === selectedAuthorityId) || authorities[0];
  }, [authorities, selectedAuthorityId]);

  // Case Readiness
  const readiness = useMemo(() => {
    return evaluateCaseReadiness(selectedCase);
  }, [selectedCase]);

  // Simple High-Level Views: "submit" (Main simple flow) | "status" (Track past submissions) | "evidence" (Deep forensic inspection)
  const [mainView, setMainView] = useState<"submit" | "status" | "evidence">("submit");

  // Submission Form State
  const [officerName, setOfficerName] = useState("Cmdr. S. Rao, MDA Operations");
  const [operationalNotes, setOperationalNotes] = useState(
    "Formal statutory incident dossier submitted under Merchant Shipping Act §356. Verified SAR slick extent, reverse Lagrangian origin, and 7D AIS transponder correlation."
  );
  const [selectedPriority, setSelectedPriority] = useState<CaseSeverityTier>(selectedCase.severity);

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showStageReportModal, setShowStageReportModal] = useState(false);
  const [selectedStageReportType, setSelectedStageReportType] = useState<StageReportType>("incident");
  const [inspectedEvidence, setInspectedEvidence] = useState<EvidenceRecord | null>(null);

  // Submission Transmission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionPhase, setSubmissionPhase] = useState<"idle" | "securing" | "transmitting" | "done">("idle");
  const [lastSubmissionReceipt, setLastSubmissionReceipt] = useState<any>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4000);
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setSearchParams({ case: caseId });
    const targetCase = cases.find((c) => c.caseId === caseId);
    if (targetCase) {
      setSelectedAuthorityId(targetCase.assignedAuthorityId);
      setSelectedPriority(targetCase.severity);
    }
  };

  // Download Master PDF
  const handleDownloadMasterPdf = async () => {
    try {
      triggerToast("Generating certified Master Case Dossier PDF...");
      const doc = await generateMasterCaseDossierPdf({
        caseRecord: selectedCase,
        authority: selectedAuthority,
        authorizingOfficer: officerName,
        submittingOfficer: officerName,
      });
      doc.save(`${selectedCase.caseId}_MASTER_DOSSIER.pdf`);
      triggerToast("Master Case Dossier PDF downloaded successfully.");
    } catch (e) {
      console.error(e);
      triggerToast("Failed to compile Master Case Dossier PDF.");
    }
  };

  // Execute Submission
  const handleExecuteSubmission = async () => {
    setIsSubmitting(true);
    setSubmissionPhase("securing");

    try {
      await new Promise((r) => setTimeout(r, 600));
      setSubmissionPhase("transmitting");
      await new Promise((r) => setTimeout(r, 900));

      const result = await authorityService.submitCaseToAuthority(selectedCase.caseId, {
        authorityId: selectedAuthority.id,
        submittingOfficer: officerName,
        authorizingOfficer: officerName,
        operationalNotes,
        priority: selectedPriority,
      });

      setLastSubmissionReceipt(result.updatedCase?.submissionRecord || result);
      setCases(authorityService.getAllCases());
      setSubmissionPhase("done");
      setShowConfirmModal(false);
      setMainView("status");
      triggerToast(`Case successfully transmitted to ${selectedAuthority.shortName}!`);
    } catch (e: any) {
      triggerToast(e.message || "Submission failed.");
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
      setSubmissionPhase("idle");
    }
  };

  // Stage report open
  const handleOpenReport = (type: StageReportType) => {
    setSelectedStageReportType(type);
    setShowStageReportModal(true);
  };

  // Re-compile outdated package
  const handleRecompile = () => {
    const updated = authorityService.updateCasePackageVersion(selectedCase.caseId, officerName);
    setCases(authorityService.getAllCases());
    triggerToast(`Case package updated to ${updated.currentPackageVersion}.`);
  };

  return (
    <div className="flex h-screen bg-[#F4F8FC] font-body text-slate-800 antialiased overflow-hidden selection:bg-[#1E5FBF]/20 selection:text-[#0B2545]">
      {/* 1. LEFT NAVIGATION SIDEBAR */}
      <aside
        id="authority-sidebar"
        className={`h-full bg-gradient-to-b from-[#0B2545] to-[#123A66] flex flex-col justify-between items-center z-30 shrink-0 shadow-xl transition-all duration-300 ease-in-out ${
          isSidebarOpen
            ? "w-16 sm:w-20 py-4 opacity-100 translate-x-0 overflow-y-auto"
            : "w-0 p-0 opacity-0 -translate-x-full overflow-hidden pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center gap-3 w-full px-2">
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
            { id: "Incidents", icon: Activity, labelKey: "nav.incidents", fallback: "Incidents", path: `/incidents/${selectedCase.incidentId}` },
            { id: "Vessels", icon: Ship, labelKey: "nav.vessels", fallback: "Vessels", path: "/vessels" },
            { id: "Analysis", icon: Sliders, labelKey: "nav.analysis", fallback: "Analysis", path: "/analysis" },
            { id: "Authority", icon: Send, labelKey: "nav.authority", fallback: "Submit", path: "/authority" },
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

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* CLEAN TOP HEADER */}
        <header className="h-16 bg-white border-b border-[#E1EEF9] px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-[#0B2545] hover:bg-[#F8FBFE] border border-[#E1EEF9] transition-colors cursor-pointer"
              title="Toggle Sidebar"
            >
              <Layers className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-[#0B2545] font-display flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#1E5FBF]" />
                  <span>Submit Case to Maritime Authority</span>
                </h1>

                {/* Case selector dropdown */}
                <select
                  value={selectedCaseId}
                  onChange={(e) => handleSelectCase(e.target.value)}
                  className="bg-[#F0F7FD] border border-[#D0E5F7] text-xs font-bold text-[#0B2545] rounded-xl px-2.5 py-1 cursor-pointer focus:ring-2 focus:ring-[#1E5FBF]/20 outline-none"
                >
                  {cases.map((c) => (
                    <option key={c.caseId} value={c.caseId}>
                      {c.caseId} &bull; {c.location.substring(0, 24)}
                    </option>
                  ))}
                </select>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    selectedCase.severity === "CRITICAL"
                      ? "bg-rose-100 text-rose-800 border-rose-200"
                      : selectedCase.severity === "HIGH"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-sky-100 text-sky-800 border-sky-200"
                  }`}
                >
                  {selectedCase.severity}
                </span>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{readiness.overallScore}% Verified</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="light" />

            {/* Quick Master PDF Download */}
            <button
              onClick={handleDownloadMasterPdf}
              className="px-3.5 py-1.5 rounded-xl border border-[#D0E5F7] bg-white hover:bg-[#F0F7FD] text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Download compiled Master Case Dossier PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#1E5FBF]" />
              <span className="hidden sm:inline">Download Dossier PDF</span>
            </button>

            {/* Primary Submit Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] hover:from-[#174EA6] hover:to-[#2275C6] text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit to {selectedAuthority.shortName}</span>
            </button>
          </div>
        </header>

        {/* TOP VIEW TOGGLE: Clean 3-Tab Pill Switcher */}
        <div className="bg-white border-b border-[#E1EEF9] px-6 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 bg-[#F0F7FD] p-1 rounded-xl border border-[#D0E5F7]">
            <button
              onClick={() => setMainView("submit")}
              className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mainView === "submit"
                  ? "bg-[#0B2545] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0B2545]"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>1. Submit Case (Quick Form)</span>
            </button>

            <button
              onClick={() => setMainView("status")}
              className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mainView === "status"
                  ? "bg-[#0B2545] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0B2545]"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>2. Submission Status &amp; Acknowledgment</span>
              {selectedCase.submissionRecord && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setMainView("evidence")}
              className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mainView === "evidence"
                  ? "bg-[#0B2545] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0B2545]"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>3. Forensic Evidence Vault ({EVIDENCE_CHAIN_RECORDS.length})</span>
            </button>
          </div>

          {/* Outdated Package Alert Banner if Drifted */}
          {selectedCase.isOutdated && (
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl font-medium animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Analysis updated</span>
              <button
                onClick={handleRecompile}
                className="underline font-bold text-amber-900 cursor-pointer"
              >
                Sync Package ({selectedCase.currentPackageVersion})
              </button>
            </div>
          )}
        </div>

        {/* WORKSPACE BODY */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================================================================= */}
          {/* VIEW 1: CLEAN & PURPOSE-BUILT SUBMISSION CONSOLE (PRIMARY)         */}
          {/* ================================================================= */}
          {mainView === "submit" && (
            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
              {/* STEP 1: SELECT TARGET AUTHORITY */}
              <div className="bg-white rounded-2xl border border-[#E1EEF9] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1E5FBF] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h2 className="text-sm font-bold text-[#0B2545] font-display">
                      Select Target Maritime Authority &amp; Reporting Destination
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Auto-suggested based on incident coordinates
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {authorities.slice(0, 3).map((auth) => {
                    const isSelected = selectedAuthorityId === auth.id;
                    return (
                      <div
                        key={auth.id}
                        onClick={() => {
                          setSelectedAuthorityId(auth.id);
                          triggerToast(`Selected ${auth.shortName}`);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? "bg-sky-50/70 border-[#1E5FBF] ring-2 ring-sky-300/60 shadow-xs"
                            : "bg-[#F8FBFE] border-[#E1EEF9] hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                            <span className="bg-white text-[#1E5FBF] px-2 py-0.5 rounded border border-sky-200">
                              {auth.agencyType}
                            </span>
                            {auth.id === "auth-icg-mrcc-mumbai" && (
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                RECOMMENDED
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-xs text-[#0B2545] font-display">
                            {auth.name}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {auth.sectorName}
                          </div>
                        </div>

                        <div className="text-[10px] font-mono text-slate-600 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                          <span>{auth.reportingChannel.substring(0, 24)}</span>
                          <span className="text-emerald-700 font-bold">ONLINE</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: KEY INCIDENT FINDINGS AT A GLANCE */}
              <div className="bg-white rounded-2xl border border-[#E1EEF9] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1E5FBF] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h2 className="text-sm font-bold text-[#0B2545] font-display">
                      Verified Incident Findings (Ready for Authority Review)
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    Incident Ref: <strong className="text-[#0B2545]">{selectedCase.incidentId}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Spill Extent
                    </span>
                    <div className="text-base font-extrabold text-[#0B2545] font-display">
                      {selectedCase.spillAreaKm2} km²
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Vol: {selectedCase.estimatedVolumeM3.toLocaleString()} m³
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Suspect Vessel
                    </span>
                    <div className="text-base font-extrabold text-[#0B2545] font-display truncate">
                      {selectedCase.suspectVesselName}
                    </div>
                    <div className="text-[10px] font-mono text-rose-600 font-bold">
                      {selectedCase.attributionConfidencePct}% Match (7D AIS)
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Origin Fix
                    </span>
                    <div className="text-xs font-mono font-bold text-[#0B2545] mt-1 truncate">
                      {selectedCase.probableOriginCoords[0].toFixed(3)}°N, {selectedCase.probableOriginCoords[1].toFixed(3)}°E
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Lagrangian Hindcast
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Clean-up Cost Est.
                    </span>
                    <div className="text-base font-extrabold text-[#0B2545] font-display">
                      ₹{selectedCase.economicImpactMinCr}&ndash;{selectedCase.economicImpactMaxCr} Cr
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700">
                      IOPC Fund Tier-1
                    </div>
                  </div>
                </div>

                {/* Brief operational note */}
                <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-200 text-xs text-slate-700 leading-relaxed font-body">
                  <strong>Operational Executive Brief:</strong> On {selectedCase.detectionTimeIst}, satellite SAR radar detected a confirmed {selectedCase.spillAreaKm2} km² discharge near {selectedCase.location}. Reverse hydrodynamic modeling and 7D AIS kinematics correlated vessel <strong>{selectedCase.suspectVesselName}</strong> (IMO {selectedCase.suspectVesselImo}) with <strong>{selectedCase.attributionConfidencePct}% certainty</strong> due to a 94-min AIS gap and 13.8 &rarr; 1.4 kts speed anomaly.
                </div>
              </div>

              {/* STEP 3: ATTACHED 7 STAGE REPORTS PACKAGE */}
              <div className="bg-white rounded-2xl border border-[#E1EEF9] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1E5FBF] text-white text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h2 className="text-sm font-bold text-[#0B2545] font-display">
                      Attached Certified Forensic Reports (7 Stage Package)
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                    ✓ All 7 Reports Compiled &bull; Version {selectedCase.currentPackageVersion}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {[
                    { type: "incident", title: "1. Incident Overview", code: "REP-01" },
                    { type: "map", title: "2. Situational Map", code: "REP-02" },
                    { type: "vessels", title: "3. Vessel Attribution", code: "REP-03" },
                    { type: "analysis", title: "4. Radar Damping", code: "REP-04" },
                    { type: "environmental", title: "5. Environmental Risk", code: "REP-05" },
                    { type: "economic", title: "6. Clean-Up & Liability", code: "REP-06" },
                    { type: "response", title: "7. Response Directives", code: "REP-07" },
                  ].map((rep) => (
                    <div
                      key={rep.type}
                      className="p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] flex items-center justify-between text-xs hover:bg-white hover:border-sky-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-[#0B2545] truncate font-display">
                          {rep.title}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenReport(rep.type as StageReportType)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-sky-50 text-[10px] font-bold text-[#1E5FBF] border border-[#D0E5F7] transition-colors cursor-pointer shrink-0"
                      >
                        View PDF
                      </button>
                    </div>
                  ))}

                  {/* Complete Master Dossier Card */}
                  <div
                    onClick={handleDownloadMasterPdf}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-[#0B2545] to-[#1E5FBF] text-white flex items-center justify-between text-xs cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span className="font-bold truncate font-display">Complete 8-Page Master Dossier</span>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono font-bold">
                      PDF
                    </span>
                  </div>
                </div>
              </div>

              {/* STEP 4: OFFICIAL DISPATCH & SUBMISSION */}
              <div className="bg-white rounded-2xl border border-[#E1EEF9] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1E5FBF] text-white text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <h2 className="text-sm font-bold text-[#0B2545] font-display">
                      Authorizing Sign-off &amp; Electronic Transmission
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Channel: <strong className="text-[#0B2545]">{selectedAuthority.reportingChannel}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-display">
                      Submitting Officer Name &amp; Designation
                    </label>
                    <input
                      type="text"
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] text-xs font-body text-slate-800 focus:ring-2 focus:ring-[#1E5FBF]/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 font-display">
                      Incident Severity &amp; Response Tier
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as CaseSeverityTier[]).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setSelectedPriority(tier)}
                          className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                            selectedPriority === tier
                              ? tier === "CRITICAL"
                                ? "bg-rose-600 text-white shadow-xs"
                                : tier === "HIGH"
                                ? "bg-amber-500 text-white shadow-xs"
                                : "bg-[#0B2545] text-white shadow-xs"
                              : "bg-[#F8FBFE] text-slate-600 border border-[#E1EEF9]"
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 font-display">
                    Statutory Submission &amp; Handover Directives
                  </label>
                  <textarea
                    value={operationalNotes}
                    onChange={(e) => setOperationalNotes(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] text-xs font-body text-slate-800 focus:ring-2 focus:ring-[#1E5FBF]/20 outline-none resize-none"
                  />
                </div>

                {/* Big Primary Submit Button */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Cryptographic Merkle Root Seal &bull; MARPOL Annex I Admissible</span>
                  </div>

                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] hover:from-[#174EA6] hover:to-[#2275C6] text-white text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Transmit Case Package to {selectedAuthority.shortName}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 2: SUBMISSION STATUS & DIGITAL ACKNOWLEDGMENT RECEIPT        */}
          {/* ================================================================= */}
          {mainView === "status" && (
            <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn">
              {selectedCase.submissionRecord ? (
                <div className="bg-white rounded-3xl border border-[#E1EEF9] p-6 sm:p-8 shadow-sm space-y-6">
                  {/* Success Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#E1EEF9] flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-[#0B2545] font-display">
                          Official Case Submission Acknowledged
                        </h2>
                        <p className="text-xs text-slate-500 font-mono">
                          Transmitted to {selectedAuthority.name}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                      REF: {selectedCase.submissionRecord.authorityRefNo || "MRCC-BOM-2026-ACK-771"}
                    </span>
                  </div>

                  {/* Receipt Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F8FBFE] border border-[#E1EEF9] text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Submission ID</span>
                      <strong className="text-[#0B2545]">{selectedCase.submissionRecord.submissionId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Timestamp</span>
                      <strong className="text-slate-700">{selectedCase.submissionRecord.submittedAtIst}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Package Version</span>
                      <strong className="text-[#1E5FBF]">{selectedCase.currentPackageVersion}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Delivery Channel</span>
                      <strong className="text-emerald-700">{selectedCase.submissionRecord.channelUsed}</strong>
                    </div>
                  </div>

                  {/* Dispatched Assets & Directives */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-display">
                      Dispatched Coast Guard Responding Units
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {selectedCase.actionHandover?.respondingAssets.map((asset, i) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-[#F8FBFE] border border-[#E1EEF9] text-xs font-mono space-y-1">
                          <strong className="text-[#0B2545] font-sans block">{asset.name}</strong>
                          <span className="text-[10px] text-slate-500 block">{asset.type}</span>
                          <div className="flex justify-between pt-1 border-t border-slate-200 text-[10px]">
                            <span className="text-emerald-700 font-bold">{asset.status}</span>
                            <span className="text-slate-400">{asset.eta}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={handleDownloadMasterPdf}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#D0E5F7] text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#1E5FBF]" />
                      <span>Print / Download Official Receipt PDF</span>
                    </button>

                    <button
                      onClick={() => setMainView("submit")}
                      className="px-4 py-2 rounded-xl bg-[#0B2545] hover:bg-[#143966] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Submit Another Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-[#E1EEF9] p-8 text-center space-y-4 shadow-sm">
                  <Clock className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-[#0B2545] font-display">
                    No Submission Recorded for Case {selectedCase.caseId} Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    The incident is currently verified at {readiness.overallScore}% readiness. Switch to the Submit tab to review and send to {selectedAuthority.shortName}.
                  </p>
                  <button
                    onClick={() => setMainView("submit")}
                    className="px-5 py-2.5 rounded-xl bg-[#1E5FBF] hover:bg-[#174EA6] text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Go to Submit Case Form
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW 3: FORENSIC EVIDENCE VAULT (DETAILED INSPECTION)             */}
          {/* ================================================================= */}
          {mainView === "evidence" && (
            <div className="max-w-5xl mx-auto space-y-4 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-[#E1EEF9] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
                  <div>
                    <h2 className="text-sm font-bold text-[#0B2545] font-display">
                      Cryptographic Forensic Evidence Vault ({EVIDENCE_CHAIN_RECORDS.length} Objects)
                    </h2>
                    <p className="text-xs text-slate-500 font-body">
                      Verified under ISO/IEC 27037 digital chain-of-custody standards for court admissibility.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    6 Verified Hashes
                  </span>
                </div>

                <div className="space-y-2.5">
                  {EVIDENCE_CHAIN_RECORDS.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] flex items-center justify-between flex-wrap gap-3 hover:bg-white hover:border-sky-300 transition-all text-xs"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#1E5FBF] bg-white px-2 py-0.5 rounded border border-sky-200">
                            {ev.id}
                          </span>
                          <strong className="text-[#0B2545] font-display">{ev.sensor}</strong>
                          <span className="text-slate-400 font-mono">({ev.sensorType})</span>
                        </div>
                        <p className="text-slate-600 font-body">{ev.observation}</p>
                        <div className="font-mono text-[10px] text-slate-400">
                          SHA-256: <strong className="text-emerald-700">{ev.hash}</strong> &bull; {ev.time}
                        </div>
                      </div>

                      <button
                        onClick={() => setInspectedEvidence(ev)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-sky-50 border border-[#D0E5F7] text-xs font-bold text-[#1E5FBF] cursor-pointer"
                      >
                        Inspect Raw Telemetry
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CONFIRMATION & TRANSMISSION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E1EEF9] shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1EEF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1E5FBF] flex items-center justify-center text-white">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B2545] font-display">
                    Confirm Case Handover
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedCase.caseId} &rarr; {selectedAuthority.shortName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FBFE] border border-[#E1EEF9] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Destination:</span>
                <strong className="text-[#0B2545]">{selectedAuthority.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Suspect Vessel:</span>
                <strong className="text-rose-600">{selectedCase.suspectVesselName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attribution Match:</span>
                <strong className="text-rose-600">{selectedCase.attributionConfidencePct}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reports Attached:</span>
                <strong className="text-emerald-700">7 Stage Reports + Master Dossier</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-body leading-relaxed">
              This action will transmit the certified case dossier and notify the command desk of <strong>{selectedAuthority.shortName}</strong> via {selectedAuthority.reportingChannel}.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-[#D0E5F7] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSubmission}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] hover:from-[#174EA6] hover:to-[#2275C6] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{submissionPhase === "securing" ? "Hashing Merkle Root..." : "Transmitting..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Transmit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAW TELEMETRY INSPECTOR MODAL */}
      {inspectedEvidence && (
        <div className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E1EEF9] shadow-2xl max-w-xl w-full overflow-hidden p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1EEF9]">
              <h3 className="text-sm font-bold text-[#0B2545] font-display">
                Telemetry Object &mdash; {inspectedEvidence.id}
              </h3>
              <button
                onClick={() => setInspectedEvidence(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#0B1E36] p-4 text-sky-200 border border-slate-700 overflow-x-auto max-h-64 text-[11px] font-mono leading-relaxed">
              <pre>
                {JSON.stringify(
                  {
                    evidence_id: inspectedEvidence.id,
                    sensor: inspectedEvidence.sensor,
                    timestamp: inspectedEvidence.time,
                    sha256: inspectedEvidence.fullHash,
                    status: inspectedEvidence.status,
                    payload: inspectedEvidence.rawPayload,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setInspectedEvidence(null)}
                className="px-4 py-1.5 rounded-xl bg-[#0B2545] text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE REPORT MODAL */}
      <ReportGenerationModal
        isOpen={showStageReportModal}
        onClose={() => setShowStageReportModal(false)}
        stage={selectedStageReportType}
        incidentIdOrCode={selectedCase.incidentId}
        incidentTitle={selectedCase.title}
        currentData={{
          incidentId: selectedCase.incidentId,
          incidentTitle: selectedCase.title,
          overview: {
            summary: `Automated SAR radar analysis confirmed an active slick of ${selectedCase.spillAreaKm2} km² with suspect attribution index of ${selectedCase.attributionConfidencePct}% assigned to ${selectedCase.suspectVesselName}.`,
            slickAreaKm2: selectedCase.spillAreaKm2,
            estimatedVolumeM3: selectedCase.estimatedVolumeM3,
            coordinates: selectedCase.coordinates,
          },
        }}
      />

      {/* TOAST BANNER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#0B2545] text-white px-4 py-3 rounded-2xl shadow-2xl border border-sky-400/40 text-xs font-medium flex items-center gap-2.5 z-50 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AuthorityHandoverPage;
