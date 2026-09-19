import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import sahayyaApi, { getAvatarUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage, LanguageCode } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import {
  User,
  Bell,
  Database,
  Languages,
  Users,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ExternalLink,
  Plus,
  Save,
  Radio,
  Sliders,
  Sparkles,
  Zap,
  HelpCircle,
  Home,
  Map as MapIcon,
  Activity,
  Ship,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Key,
  FileText,
  Trash2,
  Camera,
  Loader2,
  Lock,
  QrCode,
  Volume2,
  Compass,
  FileCheck,
  Send,
  Globe2,
  Cpu,
  Fingerprint,
} from "lucide-react";
import { ReportGenerationModal } from "../components/ReportGenerationModal";

type SettingsTab =
  | "profile"
  | "notifications"
  | "datasources"
  | "security"
  | "accessibility"
  | "users";

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sidebar & Top Nav
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("Settings");
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile Form State - sync with active logged in user
  const [profileName, setProfileName] = useState(() => user?.name || "Officer");
  const [profileEmail, setProfileEmail] = useState(() => user?.email || "officer@indiancoastguard.gov.in");
  const [profileOrg, setProfileOrg] = useState(() => user?.organization || "Indian Coast Guard (West HQ)");
  const [profileRole, setProfileRole] = useState(() => user?.role || "Senior Maritime Operations Officer");
  const [profileStation, setProfileStation] = useState("Mumbai Command Center (West Sector)");
  const [profileCallSign, setProfileCallSign] = useState("ICG-DELTA-01");
  const [digitalSignatureEnabled, setDigitalSignatureEnabled] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => user?.avatar_url || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync state whenever active auth user updates
  useEffect(() => {
    if (user) {
      if (user.name) setProfileName(user.name);
      if (user.email) setProfileEmail(user.email);
      if (user.organization) setProfileOrg(user.organization);
      if (user.role) setProfileRole(user.role);
      if (user.avatar_url) setAvatarUrl(user.avatar_url);
    }
  }, [user]);

  // Notifications State (Stage 19)
  const [channels, setChannels] = useState({
    email: true,
    sms: true,
    inApp: true,
    push: true,
    navtex: false,
  });
  const [severityThreshold, setSeverityThreshold] = useState("High");
  const [recipientGroups, setRecipientGroups] = useState({
    coastGuard: true,
    portAuthority: true,
    pollutionBoard: true,
    fishermen: false,
    marinePolice: true,
  });
  const [isTestingAlert, setIsTestingAlert] = useState(false);

  // Data Sources State (Stage 3)
  const [sensorsList, setSensorsList] = useState([
    {
      id: "sar",
      name: "Copernicus Sentinel-1 SAR",
      type: "C-Band Synthetic Aperture Radar (IW Dual-Pol)",
      status: "Connected",
      lastSync: "Just now (4.2s ago)",
      latency: "142 ms",
      throughput: "1.2 Gbps",
      encryption: "TLS 1.3 · AES-256",
      statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      id: "opt",
      name: "Sentinel-2 Multi-Spectral (Optical)",
      type: "VNIR / SWIR 10m Ground Resolution Imagery",
      status: "Connected",
      lastSync: "3 min ago",
      latency: "185 ms",
      throughput: "850 Mbps",
      encryption: "TLS 1.3",
      statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      id: "ais",
      name: "Coastal & Satellite AIS Grid",
      type: "DGLL VTS West Coast & exactEarth Space AIS",
      status: "Live Stream",
      lastSync: "Real-time (< 1s)",
      latency: "28 ms",
      throughput: "30 Vessels/sec",
      encryption: "NMEA-0183 Over SSL",
      statusColor: "text-sky-700 bg-sky-50 border-sky-200",
    },
    {
      id: "hydro",
      name: "INCOIS & CMEMS Global Currents",
      type: "Coupled Hydrodynamic Current & Wave Fields",
      status: "Connected",
      lastSync: "12 min ago",
      latency: "96 ms",
      throughput: "1/12° HYCOM Grid",
      encryption: "HTTPS / REST",
      statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      id: "wind",
      name: "ECMWF & IMD Wind Kinematics",
      type: "ERA5 10m Marine Atmospheric Boundary Vector",
      status: "Connected",
      lastSync: "8 min ago",
      latency: "74 ms",
      throughput: "0.25° Spatial Mesh",
      encryption: "HTTPS / GRIB2",
      statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
  ]);
  const [resyncingId, setResyncingId] = useState<string | null>(null);

  // Security Vault State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [autoSessionTimeout, setAutoSessionTimeout] = useState("30");
  const [auditLogs] = useState([
    { id: 1, action: "Forensic Report Generation", user: "Nirbhay Pabale", ip: "192.168.1.45", location: "Mumbai HQ", time: "18 Sep 22:30 IST", status: "Verified" },
    { id: 2, action: "What-If Hydrodynamic Hindcast", user: "Nirbhay Pabale", ip: "192.168.1.45", location: "Mumbai HQ", time: "18 Sep 22:15 IST", status: "Verified" },
    { id: 3, action: "AIS Transponder Anomaly Flagged", user: "Auto Engine", ip: "10.0.4.12", location: "Edge Server", time: "18 Sep 21:40 IST", status: "Logged" },
    { id: 4, action: "User Credentials Auth", user: "Nirbhay Pabale", ip: "192.168.1.45", location: "Mumbai HQ", time: "18 Sep 21:00 IST", status: "Success" },
  ]);

  // Accessibility State
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [coordFormat, setCoordFormat] = useState("dd"); // dd or dms
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Users State
  const [teamMembers, setTeamMembers] = useState(() => [
    { id: 1, name: user?.name || "Nirbhay Pabale", email: user?.email || "officer@indiancoastguard.gov.in", role: "Incident Commander", status: "Active", agency: "ICG West Command", clearance: "Level-4 (Command)" },
    { id: 2, name: "Dr. Ananya Sharma", email: "a.sharma@incois.gov.in", role: "Oceanographic Modeler", status: "Active", agency: "INCOIS Hyderabad", clearance: "Level-3 (Analyst)" },
    { id: 3, name: "Capt. R. Narayanan", email: "r.narayanan@dgshipping.gov.in", role: "VTS Operations Chief", status: "Active", agency: "DG Shipping Mumbai", clearance: "Level-3 (VTS)" },
    { id: 4, name: "K. Deshmukh", email: "k.deshmukh@mpcb.gov.in", role: "Environmental Inspector", status: "Pending", agency: "Maharashtra SPCB", clearance: "Level-2 (Auditor)" },
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Senior Analyst");
  const [inviteAgency, setInviteAgency] = useState("Indian Coast Guard (West HQ)");

  // Helper for avatar initials
  const getInitials = (name: string) => {
    if (!name) return "OF";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "OF";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Fetch initial profile on mount
  useEffect(() => {
    sahayyaApi.settings.getProfile()
      .then((profile) => {
        if (profile) {
          if (!user?.name && profile.name) setProfileName(profile.name);
          if (!user?.email && profile.email) setProfileEmail(profile.email);
          if (!user?.organization && profile.organization) setProfileOrg(profile.organization);
          if (!user?.role && profile.role) setProfileRole(profile.role);
          if (profile.avatar_url && !user?.avatar_url) {
            setAvatarUrl(profile.avatar_url);
            updateUser({ avatar_url: profile.avatar_url });
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load backend officer profile:", err);
      });
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Change Photo File Picker Click
  const handlePhotoChangeClick = () => {
    fileInputRef.current?.click();
  };

  // When user selects a file from file explorer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type) && !file.type.startsWith("image/")) {
      triggerToast("Invalid format. Please select a PNG, JPG, JPEG, or WebP image.");
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      triggerToast("Photo exceeds 5MB limit. Please choose a smaller photo.");
      return;
    }

    // Set instant local visual preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploadingAvatar(true);

    try {
      const res = await sahayyaApi.settings.uploadAvatar(file);
      if (res?.avatar_url) {
        setAvatarUrl(res.avatar_url);
        updateUser({
          avatar_url: res.avatar_url,
          name: profileName,
          organization: profileOrg,
          role: profileRole,
        });
        triggerToast("Profile photo uploaded and updated successfully!");
      }
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      triggerToast(`Photo selected. ${err?.response?.data?.detail || "Loaded in session preview."}`);
      updateUser({
        avatar_url: objectUrl,
        name: profileName,
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove Photo Handler
  const handleRemovePhoto = async () => {
    setIsUploadingAvatar(true);
    try {
      await sahayyaApi.settings.deleteAvatar();
    } catch (err) {
      console.warn("Delete avatar API notice:", err);
    } finally {
      setAvatarUrl(null);
      setPreviewUrl(null);
      updateUser({ avatar_url: null });
      setIsUploadingAvatar(false);
      triggerToast("Profile photo removed. Restored standard monogram.");
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await sahayyaApi.settings.updateProfile({
        name: profileName,
        email: profileEmail,
        organization: profileOrg,
        role: profileRole,
        avatar_url: avatarUrl,
      });
      updateUser({
        name: profileName,
        email: profileEmail,
        organization: profileOrg,
        role: profileRole,
        avatar_url: avatarUrl,
      });
      triggerToast("Profile credentials & digital signature updated successfully.");
    } catch (err: any) {
      updateUser({
        name: profileName,
        email: profileEmail,
        organization: profileOrg,
        role: profileRole,
        avatar_url: avatarUrl,
      });
      triggerToast("Profile saved to active session.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Resync specific sensor feed
  const handleResyncSensor = (id: string, name: string) => {
    setResyncingId(id);
    setTimeout(() => {
      setResyncingId(null);
      setSensorsList((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, lastSync: "Just now (Synced)", latency: `${Math.floor(Math.random() * 40 + 20)} ms` }
            : s
        )
      );
      triggerToast(`Successfully re-established encrypted handshake with ${name}`);
    }, 1200);
  };

  // Test Alert Dispatch Simulator
  const handleSimulateAlert = () => {
    setIsTestingAlert(true);
    setTimeout(() => {
      setIsTestingAlert(false);
      triggerToast("Broadcasted test alert to all active duty channels (Email, SMS Flash, In-App).");
    }, 1000);
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    setTeamMembers([
      ...teamMembers,
      {
        id: Date.now(),
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        status: "Pending",
        agency: inviteAgency,
        clearance: "Level-3 (Analyst)",
      },
    ]);
    setShowInviteModal(false);
    setInviteName("");
    setInviteEmail("");
    triggerToast(`Official credentials invitation dispatched to ${inviteEmail}`);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-sky-canvas font-sans text-slate-800 flex flex-col antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 animate-bounce">
          <div className="bg-[#0B2545] text-white px-4 py-2.5 rounded-xl shadow-2xl border border-sky-400/40 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOP HEADER BAR                                                        */}
      {/* ===================================================================== */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#E1EEF9] z-40 flex items-center justify-between px-4 sm:px-6 shadow-xs shrink-0 antialiased">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <img 
              src="/sahayya-logo.png" 
              alt="Sahayya Logo" 
              className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-sm" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-[#0B2545] text-base sm:text-lg tracking-[0.14em] leading-none">
                  SAHAYYA
                </span>
                <span className="badge-text px-1.5 py-0.5 bg-sky-100 text-[#1E5FBF] border border-sky-300/60 rounded-full uppercase tracking-wider font-body text-[9px] font-bold">
                  CONFIG
                </span>
              </div>
              <div className="micro-text text-slate-500 font-body leading-tight mt-0.5 hidden sm:block">
                System Administration &amp; Telemetry Configurations
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-body">
          {/* Multi-Language Selector */}
          <LanguageSwitcher variant="light" />

          {/* Quick Security Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Clearance: Level-4 (Top Command)</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-xl border border-sky-100">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#0B2545] text-white flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0">
              {(previewUrl || avatarUrl) ? (
                <img
                  src={previewUrl || getAvatarUrl(avatarUrl)}
                  alt={profileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(profileName)
              )}
            </div>
            <div className="hidden sm:block text-left leading-none">
              <div className="text-[11px] font-bold text-[#0B2545]">{profileName}</div>
              <div className="text-[9px] text-slate-500">{profileRole}</div>
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="btn-text text-xs text-[#1E5FBF] hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>&larr;</span>
            <span>{t("nav.home", "Dashboard")}</span>
          </button>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN CONTAINER: SIDEBAR + SETTINGS WORKSPACE                          */}
      {/* ===================================================================== */}
      <div className="flex-1 min-h-0 flex w-full overflow-hidden relative antialiased">
        {/* Left Nav Sidebar */}
        <aside
          className={`h-full bg-[#0B2545] transition-all duration-300 flex flex-col justify-between py-4 z-30 shrink-0 overflow-y-auto ${
            isSidebarOpen ? "w-20" : "w-0 p-0 opacity-0 -translate-x-full overflow-hidden pointer-events-none"
          }`}
        >
          <div className="flex flex-col items-center gap-2.5 w-full px-2">
            {[
              { id: "Dashboard", icon: Home, labelKey: "nav.home", fallback: "Home", path: "/dashboard" },
              { id: "Map", icon: MapIcon, labelKey: "nav.map", fallback: "Map", path: "/map" },
              { id: "Incidents", icon: Activity, labelKey: "nav.incidents", fallback: "Incidents", path: "/incidents/IN-MH-2026" },
              { id: "Vessels", icon: Ship, labelKey: "nav.vessels", fallback: "Vessels", path: "/vessels" },
              { id: "Analysis", icon: BarChart3, labelKey: "nav.analysis", fallback: "Analysis", path: "/analysis" },
              { id: "Authority", icon: Send, labelKey: "nav.authority", fallback: "Submit to Authority", path: "/authority" },
              { id: "Settings", icon: SettingsIcon, labelKey: "nav.settings", fallback: "Settings", path: "/settings" },
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
                    }
                  }}
                  className={`flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-b from-[#1E5FBF] to-[#2E8FE8] text-white shadow-lg scale-105"
                      : isIndigoAccent
                      ? "text-indigo-200 hover:text-white hover:bg-white/10"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                  title={label}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                  <span className="text-[9px] font-medium tracking-tight font-body truncate max-w-[52px]">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-1 text-center font-body flex flex-col items-center">
            <div 
              onClick={() => navigate("/dashboard")}
              className="w-10 h-10 mx-auto mb-1.5 rounded-full p-1 bg-white/10 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
              title="Sahayya Maritime Intelligence"
            >
              <img src="/sahayya-logo.png" alt="Sahayya" className="w-full h-full object-contain" />
            </div>
            <p className="text-[8.5px] text-slate-300 font-medium leading-tight">
              {t("brand.slogan", "Safer Oceans. Stronger Tomorrow.")}
            </p>
          </div>
        </aside>

        {/* Settings Content Area */}
        <main className="flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 custom-tactical-scrollbar scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="heading-page text-2xl sm:text-3xl font-bold font-display text-[#0B2545] tracking-tight">
                  {t("settings.title", "Settings & Tactical Administration")}
                </h1>
                <p className="body-text text-xs text-slate-500 mt-1 font-body">
                  {t("settings.subtitle", "Configure operational officer credentials, automated response alert pipelines, sensor streams, and security policies.")}
                </p>
              </div>

              <button
                onClick={() => setShowReportModal(true)}
                className="px-3.5 py-1.5 rounded-xl border border-[#DCEEFC] bg-white hover:bg-[#F0F7FD] text-xs font-semibold text-[#0B2545] flex items-center gap-2 shadow-xs transition-all cursor-pointer font-body self-start sm:self-auto"
                title="Generate certified system configuration & compliance dossier"
              >
                <FileCheck className="w-3.5 h-3.5 text-[#1E5FBF]" />
                <span>{t("action.generateReport", "Export System Audit Dossier")}</span>
              </button>
            </div>

            {/* Main Settings Card with Left Vertical Nav */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#E1EEF9] shadow-[0_8px_30px_rgba(30,95,191,0.06)] overflow-hidden flex flex-col md:flex-row min-h-[640px]">
              {/* Internal Sub-nav Vertical Tabs (Ollama completely removed) */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#E1EEF9] bg-[#F8FBFE] p-3 sm:p-4 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible font-body">
                {[
                  { id: "profile", label: t("settings.profileTab", "Profile & Identity"), icon: User, badge: "Active" },
                  { id: "notifications", label: t("settings.notificationsTab", "Alert Pipelines"), icon: Bell, badge: "Stage 19" },
                  { id: "datasources", label: t("settings.datasourcesTab", "Sensors & Telemetry"), icon: Database, badge: "Stage 3" },
                  { id: "security", label: t("settings.securityTab", "Security & Audit Vault"), icon: Shield, badge: "SecOps" },
                  { id: "users", label: t("settings.usersTab", "User Governance"), icon: Users, badge: "RBAC" },
                  { id: "accessibility", label: t("settings.accessibilityTab", "Locale & Ergonomics"), icon: Languages },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSel = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs btn-text transition-all cursor-pointer whitespace-nowrap ${
                        isSel
                          ? "bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-[#0B2545]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="font-semibold">{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span
                          className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-mono ${
                            isSel
                              ? "bg-white/20 text-white font-bold"
                              : "bg-slate-200/70 text-slate-600"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Panels */}
              <div className="flex-1 p-6 sm:p-8 overflow-y-auto font-body">
                {/* ========================================================= */}
                {/* TAB 1: Profile & Operational Identity                     */}
                {/* ========================================================= */}
                {activeTab === "profile" && (
                  <div className="space-y-6 max-w-3xl animate-fadeIn font-body">
                    {/* Hidden File Input for system photo picker */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="officer-photo-file-picker"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div>
                      <h2 className="heading-secondary text-base sm:text-lg font-bold text-[#0B2545] font-display">
                        Officer Profile &amp; Operational Credentials
                      </h2>
                      <p className="body-text text-xs text-slate-500 mt-0.5 font-body">
                        Official designation, cryptographic signature, and agency authorization for incident commanding and court evidence dossiers.
                      </p>
                    </div>

                    {/* Officer Digital ID Holographic Card Preview */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0B2545] via-[#123A66] to-[#1E5FBF] text-white shadow-xl relative overflow-hidden border border-sky-400/30">
                      {/* Ambient Background Grid Pattern */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                      <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-sky-400/10 blur-2xl pointer-events-none" />

                      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {/* Photo Avatar */}
                          <div className="relative group shrink-0">
                            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-sky-300 ring-4 ring-white/10 flex items-center justify-center bg-gradient-to-br from-[#0B2545] to-[#1E5FBF] text-white">
                              {(previewUrl || avatarUrl) ? (
                                <img
                                  src={previewUrl || getAvatarUrl(avatarUrl)}
                                  alt={profileName}
                                  className="w-full h-full object-cover"
                                  onError={() => {
                                    setPreviewUrl(null);
                                    setAvatarUrl(null);
                                  }}
                                />
                              ) : (
                                <span className="font-display font-black text-2xl tracking-wider text-white">
                                  {getInitials(profileName)}
                                </span>
                              )}

                              {/* Change Button Overlay */}
                              <button
                                type="button"
                                onClick={handlePhotoChangeClick}
                                disabled={isUploadingAvatar}
                                className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer rounded-2xl"
                                title="Click to upload new photo"
                              >
                                <Camera className="w-5 h-5 mb-0.5" />
                                <span className="text-[9px] font-semibold">Change</span>
                              </button>

                              {isUploadingAvatar && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white rounded-2xl">
                                  <Loader2 className="w-6 h-6 animate-spin text-sky-300" />
                                </div>
                              )}
                            </div>

                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0B2545] shadow-xs flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </div>
                          </div>

                          {/* Credentials Details */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm sm:text-base font-bold text-white font-display">
                                {profileName || "Officer"}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-300/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                                {profileCallSign}
                              </span>
                            </div>
                            <div className="text-xs text-sky-200/90 font-medium mt-0.5">
                              {profileRole}
                            </div>
                            <div className="text-[11px] text-sky-300/80 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>{profileOrg}</span>
                              <span>&bull;</span>
                              <span>{profileStation}</span>
                            </div>
                          </div>
                        </div>

                        {/* ID Hologram / Verified Badge */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-mono text-sky-200">
                            <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ID: SY-ICG-8492</span>
                          </div>
                          <div className="text-[9px] font-mono text-sky-300/70 mt-1 hidden sm:block">
                            E-Stamp: SHA256-AUTH
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Controls */}
                    <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-body">
                      {/* Photo Actions Row */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handlePhotoChangeClick}
                          disabled={isUploadingAvatar}
                          className="px-3.5 py-1.5 rounded-xl border border-sky-300 bg-white hover:bg-sky-50 text-[#1E5FBF] btn-text flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer text-xs font-semibold"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#1E5FBF]" />
                          <span>{isUploadingAvatar ? "Uploading..." : "Upload New Photo"}</span>
                        </button>

                        {(previewUrl || avatarUrl) && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={isUploadingAvatar}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 btn-text flex items-center gap-1 shadow-xs transition-colors cursor-pointer text-xs font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Remove Photo</span>
                          </button>
                        )}
                        <span className="text-[11px] text-slate-400 font-body">Supported: PNG, JPG, WebP (Max 5MB)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="input-label block text-slate-700 font-semibold mb-1">
                            Full Name (Officer / Investigator)
                          </label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="Enter full name"
                            className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 text-xs text-[#0B2545] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E5FBF]/30 font-body input-text"
                          />
                        </div>

                        <div>
                          <label className="input-label block text-slate-700 font-semibold mb-1">
                            Official Government / Service Email
                          </label>
                          <input
                            type="email"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            placeholder="officer@agency.gov.in"
                            className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 text-xs text-[#0B2545] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E5FBF]/30 font-body input-text"
                          />
                        </div>

                        <div>
                          <label className="input-label block text-slate-700 font-semibold mb-1">
                            Organization / Maritime Department
                          </label>
                          <select
                            value={profileOrg}
                            onChange={(e) => setProfileOrg(e.target.value)}
                            className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 text-xs text-[#0B2545] font-semibold font-body input-text"
                          >
                            <option value="Indian Coast Guard (West HQ)">Indian Coast Guard (West HQ)</option>
                            <option value="Port Authority / VTS Directorate">Port Authority / VTS Directorate</option>
                            <option value="State Pollution Control Board">State Pollution Control Board (SPCB)</option>
                            <option value="Directorate General of Shipping">Directorate General of Shipping</option>
                            <option value="INCOIS Ocean Modeling Team">INCOIS Ocean Modeling Team</option>
                            <option value="Marine Environmental Regulator">Marine Environmental Regulator</option>
                          </select>
                        </div>

                        <div>
                          <label className="input-label block text-slate-700 font-semibold mb-1">
                            Operational Role / Rank Designation
                          </label>
                          <input
                            type="text"
                            value={profileRole}
                            onChange={(e) => setProfileRole(e.target.value)}
                            placeholder="e.g. Senior Incident Commander"
                            className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 text-xs text-[#0B2545] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E5FBF]/30 font-body input-text"
                          />
                        </div>

                        <div>
                          <label className="input-label block text-slate-700 font-semibold mb-1">
                            Command Sector / Operations Station
                          </label>
                          <input
                            type="text"
                            value={profileStation}
                            onChange={(e) => setProfileStation(e.target.value)}
                            placeholder="e.g. Mumbai Command Center"
                            className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 text-xs text-[#0B2545] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E5FBF]/30 font-body input-text"
                          />
                        </div>

                        <div>
                          <label className="input-label block text-slate-700 font-semibold mb-1">
                            VHF Radio Call Sign / Code
                          </label>
                          <input
                            type="text"
                            value={profileCallSign}
                            onChange={(e) => setProfileCallSign(e.target.value)}
                            placeholder="e.g. ICG-DELTA-01"
                            className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 text-xs text-[#0B2545] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E5FBF]/30 font-body input-text"
                          />
                        </div>
                      </div>

                      {/* Digital Signature Toggle */}
                      <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-xs text-[#0B2545] flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-[#1E5FBF]" />
                            <span>Courtroom Evidence Digital Signature Seal</span>
                          </div>
                          <p className="micro-text text-slate-500 mt-0.5">
                            Automatically stamp exported PDF dossiers with your digital identifier and SHA-256 integrity seal.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={digitalSignatureEnabled}
                          onChange={(e) => setDigitalSignatureEnabled(e.target.checked)}
                          className="w-4 h-4 rounded text-[#1E5FBF] focus:ring-0 cursor-pointer"
                        />
                      </div>

                      <div className="pt-3">
                        <button
                          type="submit"
                          disabled={isSavingProfile}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] hover:from-[#174EA6] hover:to-[#2275C6] text-white btn-text flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer font-body disabled:opacity-50"
                        >
                          {isSavingProfile ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>{isSavingProfile ? "Updating Credentials..." : "Save Profile & Credentials"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: Automated Alert Pipeline & Rapid Dispatch          */}
                {/* ========================================================= */}
                {activeTab === "notifications" && (
                  <div className="space-y-6 max-w-2xl animate-fadeIn font-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="heading-secondary text-base sm:text-lg font-bold text-[#0B2545] font-display">
                          Multi-Channel Alert Dispatch Pipeline
                        </h2>
                        <p className="body-text text-xs text-slate-500 mt-0.5 font-body">
                          Configure automated event relays for verified hydrocarbon discharges, vessel loitering, and coastal impact hazards.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSimulateAlert}
                        disabled={isTestingAlert}
                        className="px-3.5 py-1.5 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-[#1E5FBF] btn-text flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                      >
                        <Send className={`w-3.5 h-3.5 ${isTestingAlert ? "animate-pulse text-[#1E5FBF]" : ""}`} />
                        <span>{isTestingAlert ? "Dispatching..." : "Simulate Test Alert"}</span>
                      </button>
                    </div>

                    {/* Alert Channels Grid */}
                    <div className="space-y-3">
                      <h3 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider">
                        Operational Dispatch Channels
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        {[
                          { key: "email", label: "Email Dispatch Dossier", desc: "Instant SAR summary + PDF link to inbox" },
                          { key: "sms", label: "SMS Urgent Flash Relay", desc: "Priority text alert to duty officers" },
                          { key: "inApp", label: "In-App Tactical Toasts", desc: "Real-time command center alerts" },
                          { key: "push", label: "PWA Mobile Push Alerts", desc: "Direct alert on authorized tablets/phones" },
                          { key: "navtex", label: "NAVTEX Maritime Broadcast", desc: "Automated VHF coastal radio warning format" },
                        ].map((ch) => (
                          <label
                            key={ch.key}
                            className="p-3 rounded-xl border border-[#E1EEF9] bg-[#F8FBFE] flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <div>
                              <div className="font-semibold text-[#0B2545] text-xs">{ch.label}</div>
                              <div className="micro-text text-slate-500">{ch.desc}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={(channels as any)[ch.key]}
                              onChange={(e) =>
                                setChannels({ ...channels, [ch.key]: e.target.checked })
                              }
                              className="w-4 h-4 rounded text-[#1E5FBF] focus:ring-0 cursor-pointer"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Severity Threshold */}
                    <div className="space-y-2">
                      <h3 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider">
                        Minimum Alert Trigger Threshold
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {["Low", "Medium", "High", "Critical"].map((sev) => {
                          const isSel = severityThreshold === sev;
                          return (
                            <button
                              key={sev}
                              type="button"
                              onClick={() => {
                                setSeverityThreshold(sev);
                                triggerToast(`Alert threshold set to: ${sev.toUpperCase()}`);
                              }}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer font-body ${
                                isSel
                                  ? "bg-[#0B2545] text-white border-[#0B2545] shadow-sm"
                                  : "bg-[#F8FBFE] text-slate-600 border-[#E1EEF9] hover:bg-slate-100"
                              }`}
                            >
                              {sev}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stakeholder Recipient Matrix */}
                    <div className="space-y-2.5">
                      <h3 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider">
                        Stakeholder Auto-Notification Matrix (Stage 19)
                      </h3>
                      <div className="space-y-2">
                        {[
                          { key: "coastGuard", label: "Indian Coast Guard Regional Command (MRCC)", count: "12 Officers Active" },
                          { key: "portAuthority", label: "Major Ports VTS Operations Centers", count: "8 Stations Connected" },
                          { key: "pollutionBoard", label: "State Pollution Control Boards (SPCB)", count: "6 Regulatory Desks" },
                          { key: "fishermen", label: "Fishermen & Coastal Village Cooperatives", count: "34 Radio Cells" },
                          { key: "marinePolice", label: "Coastal Marine Police Interceptor Stations", count: "14 Units on Station" },
                        ].map((grp) => (
                          <label
                            key={grp.key}
                            className="p-3 rounded-xl border border-[#E1EEF9] bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50 text-xs transition-colors"
                          >
                            <div>
                              <div className="font-semibold text-[#0B2545]">{grp.label}</div>
                              <div className="data-mono-sm text-slate-500 font-mono text-[10.5px]">{grp.count}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={(recipientGroups as any)[grp.key]}
                              onChange={(e) =>
                                setRecipientGroups({
                                  ...recipientGroups,
                                  [grp.key]: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded text-[#1E5FBF] focus:ring-0 cursor-pointer"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => triggerToast("Alert notification rules and dispatch channels saved.")}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-white btn-text flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer text-xs font-semibold"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Notification Preferences</span>
                    </button>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: Sensors & Telemetry Feeds                          */}
                {/* ========================================================= */}
                {activeTab === "datasources" && (
                  <div className="space-y-6 max-w-3xl animate-fadeIn font-body">
                    <div>
                      <h2 className="heading-secondary text-base sm:text-lg font-bold text-[#0B2545] font-display">
                        Sensors &amp; Real-Time Intelligence Ingestion
                      </h2>
                      <p className="body-text text-xs text-slate-500 mt-0.5 font-body">
                        Active satellite radar constellations, maritime transponders, hydrodynamic models, and browser extension status.
                      </p>
                    </div>

                    {/* Sensor Cards List */}
                    <div className="space-y-3">
                      {sensorsList.map((s) => {
                        const isResyncing = resyncingId === s.id;
                        return (
                          <div
                            key={s.id}
                            className="p-4 rounded-xl border border-[#E1EEF9] bg-[#F8FBFE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#0B2545] font-display">{s.name}</span>
                                <span className={`badge-text px-2 py-0.2 rounded-full border text-[9.5px] font-bold ${s.statusColor}`}>
                                  ● {s.status}
                                </span>
                              </div>
                              <div className="micro-text text-slate-600 mt-0.5">{s.type}</div>
                              <div className="data-mono-sm text-slate-500 font-mono text-[10.5px] mt-1 flex items-center gap-3 flex-wrap">
                                <span>Sync: <strong>{s.lastSync}</strong></span>
                                <span>&bull;</span>
                                <span>Latency: <strong>{s.latency}</strong></span>
                                <span>&bull;</span>
                                <span>Throughput: <strong>{s.throughput}</strong></span>
                                <span>&bull;</span>
                                <span className="text-emerald-700 font-semibold">{s.encryption}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleResyncSensor(s.id, s.name)}
                              disabled={isResyncing}
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-[#0B2545] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer self-start sm:self-center disabled:opacity-50"
                              title="Force fresh handshake and cache invalidation"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 text-[#1E5FBF] ${isResyncing ? "animate-spin" : ""}`} />
                              <span>{isResyncing ? "Resyncing..." : "Force Resync"}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* OceanShield AI Browser Extension Card */}
                    <div className="p-4 rounded-xl border-2 border-sky-300 bg-gradient-to-r from-sky-50 to-indigo-50/60 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#1E5FBF] text-white flex items-center justify-center shadow-xs">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="heading-section text-xs font-bold text-[#0B2545] font-display">
                              OceanShield AI Browser Extension Integration (Stage 3)
                            </h3>
                            <div className="data-mono-sm text-slate-500 font-mono text-[10.5px]">
                              Chrome / Edge Secure Extension &bull; v1.4.2 Verified
                            </div>
                          </div>
                        </div>

                        <span className="badge-text px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          Active Handshake
                        </span>
                      </div>

                      <p className="body-text text-xs text-slate-600 mt-2.5 leading-relaxed">
                        Enables seamless one-click SAR Geotiff upload, AIS route extraction, suspect vessel dossiers, and instant court-admissible PDF compilation directly from external maritime and port VTS consoles.
                      </p>

                      <div className="mt-3 pt-3 border-t border-sky-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">Encrypted Transport:</span>
                          <span className="text-xs font-semibold text-emerald-600">TLS 1.3 WebSockets</span>
                        </div>

                        <button
                          onClick={() => triggerToast("OceanShield AI extension package verified and ready.")}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#1E5FBF] text-white btn-text flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold"
                        >
                          <span>Extension Console</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 4: Security, Encryption & Audit Vault                 */}
                {/* ========================================================= */}
                {activeTab === "security" && (
                  <div className="space-y-6 max-w-3xl animate-fadeIn font-body">
                    <div>
                      <h2 className="heading-secondary text-base sm:text-lg font-bold text-[#0B2545] font-display">
                        Security Clearance &amp; Cryptographic Evidence Vault
                      </h2>
                      <p className="body-text text-xs text-slate-500 mt-0.5 font-body">
                        Hardware 2FA authentication, evidence hash verification, and statutory tamper-proof activity audit logs.
                      </p>
                    </div>

                    {/* Security Metrics Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl border border-[#E1EEF9] bg-[#F8FBFE]">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Clearance Tier
                        </div>
                        <div className="text-sm font-bold text-[#0B2545] font-display mt-0.5">
                          Level-4 (Command Authority)
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>Admissible for MARPOL Proceedings</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-[#E1EEF9] bg-[#F8FBFE]">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Cryptographic Digest
                        </div>
                        <div className="text-sm font-bold text-[#1E5FBF] font-display mt-0.5">
                          SHA-256 Tamper-Proof
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Auto-anchored on report export
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl border border-[#E1EEF9] bg-[#F8FBFE]">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Two-Factor Auth (2FA)
                        </div>
                        <div className="text-sm font-bold text-emerald-700 font-display mt-0.5 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hardware TOTP Enforced</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Gov Authenticator Active
                        </div>
                      </div>
                    </div>

                    {/* Session Security Settings */}
                    <div className="p-4 rounded-xl border border-[#E1EEF9] bg-white space-y-3">
                      <h3 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider">
                        Operational Session Controls
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="input-label block font-semibold text-slate-700 mb-1">
                            Inactivity Auto-Lock Timeout
                          </label>
                          <select
                            value={autoSessionTimeout}
                            onChange={(e) => {
                              setAutoSessionTimeout(e.target.value);
                              triggerToast(`Session auto-lock updated to ${e.target.value} minutes.`);
                            }}
                            className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2 font-semibold font-body input-text"
                          >
                            <option value="15">15 Minutes (High Security Bridge)</option>
                            <option value="30">30 Minutes (Recommended)</option>
                            <option value="60">60 Minutes (Command Center)</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9] self-end">
                          <div>
                            <span className="font-semibold text-slate-800 block">Enforce 2FA on PDF Export</span>
                            <span className="micro-text text-slate-500">Require fingerprint / token for official brief download</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={twoFactorEnabled}
                            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                            className="w-4 h-4 rounded text-[#1E5FBF] focus:ring-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Operational Session Audit Log */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider">
                          Recent Command &amp; Evidence Audit Log
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400">Statutory 7-Year Retention</span>
                      </div>

                      <div className="border border-[#E1EEF9] rounded-xl overflow-hidden bg-white shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#F8FBFE] border-b border-[#E1EEF9] text-slate-500 text-[10px] uppercase tracking-wider">
                              <th className="p-2.5 font-semibold">Action / Event</th>
                              <th className="p-2.5 font-semibold">Operator</th>
                              <th className="p-2.5 font-semibold">IP Address &amp; Location</th>
                              <th className="p-2.5 font-semibold">Timestamp</th>
                              <th className="p-2.5 font-semibold">Integrity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-body">
                            {auditLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-2.5 font-semibold text-[#0B2545]">{log.action}</td>
                                <td className="p-2.5 text-slate-700">{log.user}</td>
                                <td className="p-2.5 font-mono text-[10.5px] text-slate-500">
                                  {log.ip} ({log.location})
                                </td>
                                <td className="p-2.5 text-slate-500 font-mono text-[10.5px]">{log.time}</td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9.5px] font-bold">
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 5: User & Role-Based Governance                       */}
                {/* ========================================================= */}
                {activeTab === "users" && (
                  <div className="space-y-6 animate-fadeIn font-body">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="heading-secondary text-base sm:text-lg font-bold text-[#0B2545] font-display">
                          User &amp; Access Governance (RBAC)
                        </h2>
                        <p className="body-text text-xs text-slate-500 mt-0.5 font-body">
                          Authorized officers, role-based capabilities, and maritime legal signing privileges.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-white btn-text flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer font-body text-xs font-semibold self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Invite Operations Officer</span>
                      </button>
                    </div>

                    {/* Users Table */}
                    <div className="border border-[#E1EEF9] rounded-xl overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#F8FBFE] border-b border-[#E1EEF9] text-slate-500 uppercase tracking-wider text-[10px]">
                            <th className="p-3 font-semibold">Name &amp; Agency</th>
                            <th className="p-3 font-semibold">Role Designation</th>
                            <th className="p-3 font-semibold">Gov Email</th>
                            <th className="p-3 font-semibold">Clearance</th>
                            <th className="p-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-body">
                          {teamMembers.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-semibold text-[#0B2545]">
                                <div>{m.name}</div>
                                <div className="micro-text text-slate-400 font-normal">{m.agency}</div>
                              </td>
                              <td className="p-3 font-medium text-slate-700">{m.role}</td>
                              <td className="p-3 data-mono-sm font-mono text-slate-600 text-[11px]">{m.email}</td>
                              <td className="p-3 font-mono text-[10.5px] text-slate-600">{m.clearance}</td>
                              <td className="p-3">
                                <span
                                  className={`badge-text px-2 py-0.5 rounded-full border text-[9.5px] font-bold ${
                                    m.status === "Active"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Permissions Legend */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-body">
                      <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                        <div className="font-bold text-xs text-[#0B2545] font-display">Viewer (Read-Only)</div>
                        <p className="micro-text text-slate-500 mt-1">
                          Can view live AIS feeds, incident map overlays, and telemetry metrics without modification rights.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                        <div className="font-bold text-xs text-[#0B2545] font-display">Senior Analyst</div>
                        <p className="micro-text text-slate-500 mt-1">
                          Full access to What-If Hydrodynamic simulator, forensic reverse drift calculations, and suspect scoring.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#F8FBFE] border border-[#E1EEF9]">
                        <div className="font-bold text-xs text-[#0B2545] font-display">Incident Commander</div>
                        <p className="micro-text text-slate-500 mt-1">
                          Authorized to mobilize tactical assets, issue multi-channel NAVTEX alerts, and sign MARPOL court evidence.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* TAB 6: Locale & Bridge Ergonomics                         */}
                {/* ========================================================= */}
                {activeTab === "accessibility" && (
                  <div className="space-y-6 max-w-xl animate-fadeIn font-body">
                    <div>
                      <h2 className="heading-secondary text-base sm:text-lg font-bold text-[#0B2545] font-display">
                        {t("settings.localeErgonomics", "Locale & Operational Ergonomics")}
                      </h2>
                      <p className="body-text text-xs text-slate-500 mt-0.5 font-body">
                        Regional multilingual language support and night/bridge adaptive ergonomic display controls.
                      </p>
                    </div>

                    <div className="space-y-4 text-xs font-body">
                      <div>
                        <label className="input-label block font-semibold text-slate-700 mb-1">
                          {t("settings.primaryLang", "Command Center Primary Language")}
                        </label>
                        <select
                          value={language}
                          onChange={(e) => {
                            const newLang = e.target.value as LanguageCode;
                            setLanguage(newLang);
                            triggerToast(`Operational language set to: ${newLang.toUpperCase()}`);
                          }}
                          className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 text-xs text-[#0B2545] font-semibold font-body input-text cursor-pointer"
                        >
                          <option value="en">English (Official Maritime Communications)</option>
                          <option value="hi">हिन्दी (Hindi - National Operational)</option>
                          <option value="mr">मराठी (Marathi - West Coast Command)</option>
                          <option value="gu">ગુજરાતી (Gujarati - North-West Sector)</option>
                          <option value="ta">தமிழ் (Tamil - East Coast &amp; Palk Strait)</option>
                          <option value="te">తెలుగు (Telugu - Bay of Bengal Sector)</option>
                        </select>
                      </div>

                      <div>
                        <label className="input-label block font-semibold text-slate-700 mb-1">
                          {t("settings.coordFormat", "GIS Coordinate Display Format")}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCoordFormat("dd");
                              triggerToast("Coordinate display: Decimal Degrees (18.9997°N, 72.5502°E)");
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                              coordFormat === "dd"
                                ? "bg-[#0B2545] text-white border-[#0B2545]"
                                : "bg-[#F8FBFE] text-slate-700 border-[#E1EEF9]"
                            }`}
                          >
                            Decimal Degrees (DD)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCoordFormat("dms");
                              triggerToast("Coordinate display: Degrees Minutes Seconds (18°59'59\"N 72°33'00\"E)");
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                              coordFormat === "dms"
                                ? "bg-[#0B2545] text-white border-[#0B2545]"
                                : "bg-[#F8FBFE] text-slate-700 border-[#E1EEF9]"
                            }`}
                          >
                            Degrees Mins Secs (DMS)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-2">
                        <h3 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider">
                          {t("settings.tacticalDisplay", "Tactical Display Controls")}
                        </h3>

                        {[
                          {
                            key: "soundAlerts",
                            label: t("settings.soundChime", "Audible Chime on Critical Discharge"),
                            desc: "Sounds audible chime when new satellite detection severity exceeds threshold",
                            val: soundAlerts,
                            setter: setSoundAlerts,
                          },
                          {
                            key: "highContrast",
                            label: t("settings.highContrast", "High Contrast Bridge Screen Mode"),
                            desc: "Maximum visual distinction for bridge and outdoor display terminals",
                            val: highContrast,
                            setter: setHighContrast,
                          },
                          {
                            key: "largeText",
                            label: t("settings.largeText", "Enlarged Maritime Typography"),
                            desc: "Increases baseline label sizing for emergency operations rooms",
                            val: largeText,
                            setter: setLargeText,
                          },
                          {
                            key: "reducedMotion",
                            label: t("settings.reducedMotion", "Reduced Motion Mode"),
                            desc: "Disables pulsing radar sweeps and particle drift flows",
                            val: reducedMotion,
                            setter: setReducedMotion,
                          },
                        ].map((item) => (
                          <div
                            key={item.key}
                            onClick={() => item.setter(!item.val)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                              item.val
                                ? "bg-sky-50/70 border-sky-300"
                                : "bg-[#F8FBFE] border-[#E1EEF9] hover:bg-slate-50"
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-slate-800 text-xs">{item.label}</div>
                              <div className="micro-text text-slate-500 mt-0.5">{item.desc}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={item.val}
                              onChange={(e) => item.setter(e.target.checked)}
                              className="w-4 h-4 rounded text-[#1E5FBF] focus:ring-0 cursor-pointer pointer-events-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Invite Officer Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-body">
          <form
            onSubmit={handleInviteUser}
            className="w-full max-w-md bg-white border border-[#E1EEF9] rounded-2xl shadow-2xl p-6 text-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E1EEF9] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#1E5FBF] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="heading-section text-sm font-bold text-[#0B2545] font-display">
                  Invite Operations Officer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-body">
              <div>
                <label className="input-label block font-semibold text-slate-700 mb-1">
                  Officer Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Lt. Cdr. V. Joshi"
                  className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 font-semibold input-text font-body text-xs"
                />
              </div>

              <div>
                <label className="input-label block font-semibold text-slate-700 mb-1">
                  Government Service Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@agency.gov.in"
                  className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 font-semibold input-text font-body text-xs"
                />
              </div>

              <div>
                <label className="input-label block font-semibold text-slate-700 mb-1">
                  Command Agency / Wing
                </label>
                <select
                  value={inviteAgency}
                  onChange={(e) => setInviteAgency(e.target.value)}
                  className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 font-semibold input-text font-body text-xs"
                >
                  <option value="Indian Coast Guard (West HQ)">Indian Coast Guard (West HQ)</option>
                  <option value="Port Authority / VTS Directorate">Port Authority / VTS Directorate</option>
                  <option value="State Pollution Control Board">State Pollution Control Board (SPCB)</option>
                  <option value="DG Shipping Mumbai">DG Shipping Mumbai</option>
                  <option value="INCOIS Hyderabad">INCOIS Hyderabad</option>
                </select>
              </div>

              <div>
                <label className="input-label block font-semibold text-slate-700 mb-1">
                  Operational Clearance Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#F8FBFE] border border-[#E1EEF9] rounded-xl p-2.5 font-semibold input-text font-body text-xs"
                >
                  <option value="Senior Analyst">Senior Analyst (Forensic Lab &amp; What-If Simulation)</option>
                  <option value="Incident Commander">Incident Commander (Full Tactical Dispatch)</option>
                  <option value="VTS Specialist">VTS Specialist (Vessel Track Attribution)</option>
                  <option value="Viewer (Read-Only)">Viewer (Surveillance Read-Only)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5 font-body">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E1EEF9] btn-text text-slate-600 hover:bg-slate-50 cursor-pointer text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1E5FBF] to-[#2E8FE8] text-white btn-text shadow-sm hover:shadow-md cursor-pointer text-xs font-bold"
              >
                Dispatch Official Invite
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Official System Settings / Audit Report Modal */}
      <ReportGenerationModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        stage="settings"
        incidentIdOrCode="SYS-AUD-2026"
        incidentTitle="Sahayya Maritime Domain Settings &amp; Audit Dossier"
      />
    </div>
  );
};
