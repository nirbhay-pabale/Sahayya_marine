import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Satellite,
  Brain,
  Anchor,
  Waves,
  Shield,
  ArrowRight,
  AlertCircle,
  Building,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, socialLogin } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organization, setOrganization] = useState("Coast Guard");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = register({
      fullName,
      email,
      password,
      confirmPassword,
      organization,
      agreeTerms,
    });

    if (!result.success) {
      setErrorMessage(result.error || "Registration failed. Please check all fields.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 400);
  };

  const handleSocial = (provider: "google" | "facebook") => {
    setIsLoading(true);
    setTimeout(() => {
      socialLogin(provider);
      setIsLoading(false);
      navigate("/dashboard");
    }, 500);
  };

  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden overflow-y-auto lg:overflow-hidden select-none bg-[#031525] font-sans flex flex-col justify-between">
      {/* 1. FULL-BLEED OCEAN PHOTO BACKGROUND */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('/ocean-bg.jpg')`,
        }}
      />

      {/* Lighting overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-[#041629]/20 pointer-events-none" />

      {/* 2. FAINT TOP-RIGHT SATELLITE & GLOBE CONTOUR LINES OVERLAY */}
      <div className="absolute top-0 right-0 w-[480px] h-[380px] pointer-events-none overflow-hidden opacity-70 hidden md:block">
        <svg
          className="absolute -top-16 -right-16 w-[440px] h-[440px] text-white/20"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 4" />
          <ellipse cx="200" cy="200" rx="180" ry="85" stroke="currentColor" strokeWidth="0.6" strokeDasharray="4 4" />
          <ellipse cx="200" cy="200" rx="85" ry="180" stroke="currentColor" strokeWidth="0.6" strokeDasharray="4 4" />
          <ellipse cx="200" cy="200" rx="140" ry="180" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" />
        </svg>

        <svg
          className="absolute top-8 right-16 w-32 h-32"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-40 140 Q 60 40, 120 18"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.2"
            strokeDasharray="3 4"
          />
          <g transform="translate(100, 10) rotate(-35) scale(0.9)">
            <rect x="-24" y="-7" width="16" height="14" rx="1.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
            <line x1="-16" y1="-7" x2="-16" y2="7" stroke="#0369A1" strokeWidth="0.8" />
            <line x1="-24" y1="0" x2="-8" y2="0" stroke="#0369A1" strokeWidth="0.8" />
            <line x1="-8" y1="0" x2="-4" y2="0" stroke="#FFFFFF" strokeWidth="1.5" />
            <rect x="-4" y="-8" width="12" height="16" rx="2" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="2" cy="0" r="2.5" fill="#0284C7" />
            <line x1="8" y1="0" x2="12" y2="0" stroke="#FFFFFF" strokeWidth="1.5" />
            <rect x="12" y="-7" width="16" height="14" rx="1.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
            <line x1="20" y1="-7" x2="20" y2="7" stroke="#0369A1" strokeWidth="0.8" />
            <line x1="12" y1="0" x2="28" y2="0" stroke="#0369A1" strokeWidth="0.8" />
            <path d="M 2 8 L 2 12" stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M -3 13 A 5 5 0 0 0 7 13 Z" fill="#CBD5E1" stroke="#64748B" strokeWidth="0.8" />
          </g>
        </svg>
      </div>

      {/* 3. HEADER & TOP NAV */}
      <header className="relative z-20 w-full px-6 sm:px-10 lg:px-14 pt-6 pb-2 flex items-center justify-between antialiased">
        <div className="flex items-center gap-3.5">
          <img
            src="/sahayya-logo.png"
            alt="Sahayya Logo"
            className="h-12 sm:h-14 w-auto object-contain drop-shadow-md"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-[0.2em] text-[#0B2545] leading-none">
              {t("brand.title")}
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 tracking-tight mt-1 font-body">
              {t("brand.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:flex items-center gap-3 text-white/90 text-xs sm:text-sm font-semibold tracking-wide drop-shadow-md font-body">
            <span>{t("nav.detect", "Detect")}</span>
            <span className="text-white/60 text-xs">•</span>
            <span>{t("nav.analyze", "Analyze")}</span>
            <span className="text-white/60 text-xs">•</span>
            <span>{t("nav.protect", "Protect")}</span>

            <div className="ml-1 text-white/90">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7-0.5" />
                <path d="M2 17c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7-0.5" opacity="0.6" />
              </svg>
            </div>
          </div>

          <LanguageSwitcher variant="light" />
        </div>
      </header>

      {/* 4. MAIN SPLIT CONTENT */}
      <main className="relative z-10 w-full min-h-[calc(100vh-8.5rem)] px-6 sm:px-10 lg:px-14 flex flex-col lg:flex-row items-center justify-between py-6 lg:py-2 antialiased">
        {/* Left Hero */}
        <div className="w-full lg:w-[50%] max-w-[620px] flex flex-col justify-center py-4 lg:py-6">
          <div className="font-display font-bold text-[#0B2545] tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.06]">
            <div>&ldquo;{t("auth.heroTitle1")}</div>
            <div>{t("auth.heroTitle2")}</div>
            <div>
              <span className="text-[#1877F2]">{t("auth.heroTitle3")}&rdquo;</span>
            </div>
          </div>

          <div className="mt-4 text-base sm:text-lg font-medium text-[#0F2A4A] leading-relaxed font-body">
            <div>{t("auth.heroSubtitle")}</div>
          </div>

          {/* 5 Feature Icons */}
          <div className="mt-8 sm:mt-10 grid grid-cols-5 gap-2 sm:gap-4 max-w-[540px] font-body">
            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#EAF3FC] border border-[#D0E4FA] flex items-center justify-center text-[#1E5FBF] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#DEEEFC]">
                <Satellite className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0B2545] mt-2 leading-tight">
                {t("auth.feature1", "Detect Spills")}
              </span>
            </div>

            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#EAF3FC] border border-[#D0E4FA] flex items-center justify-center text-[#1E5FBF] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#DEEEFC]">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0B2545] mt-2 leading-tight">
                {t("auth.feature2", "Find Origins")}
              </span>
            </div>

            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#EAF3FC] border border-[#D0E4FA] flex items-center justify-center text-[#1E5FBF] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#DEEEFC]">
                <Anchor className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0B2545] mt-2 leading-tight">
                {t("auth.feature3", "Identify Vessels")}
              </span>
            </div>

            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#EAF3FC] border border-[#D0E4FA] flex items-center justify-center text-[#1E5FBF] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#DEEEFC]">
                <Waves className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0B2545] mt-2 leading-tight">
                {t("auth.feature4", "Predict Impact")}
              </span>
            </div>

            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#EAF3FC] border border-[#D0E4FA] flex items-center justify-center text-[#1E5FBF] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#DEEEFC]">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0B2545] mt-2 leading-tight">
                {t("auth.feature5", "Enable Response")}
              </span>
            </div>
          </div>
        </div>

        {/* Right Registration Card */}
        <div className="w-full lg:w-auto flex justify-center lg:justify-end py-4 lg:py-0 font-body">
          <div className="w-full max-w-[480px] lg:max-w-[490px] xl:max-w-[505px] bg-white/96 backdrop-blur-2xl rounded-[28px] shadow-[0_24px_70px_rgba(4,22,41,0.32),0_8px_24px_rgba(0,0,0,0.08)] border border-white/90 p-7 sm:p-9 transition-all duration-300">
            <div className="mb-5 flex items-center gap-3.5">
              <img
                src="/sahayya-logo.png"
                alt="Sahayya"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-sm shrink-0"
              />
              <div>
                <h2 className="font-display text-[26px] sm:text-[28px] font-bold text-[#0B2545] tracking-tight leading-tight">
                  {t("auth.createAccount", "Create Your Account")}
                </h2>
                <p className="text-[13.5px] text-slate-600 font-medium font-body mt-0.5">
                  {t("auth.registerDesc", "Register to access Sahayya Maritime Intelligence")}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 animate-fadeIn font-body">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 font-body">
              {/* Full Name */}
              <div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("auth.fullName", "Enter your full name")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F0F4F9]/90 border border-slate-200/90 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E5FBF] focus:bg-white focus:ring-2 focus:ring-[#1E5FBF]/15 transition-all input-text font-body"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.email", "Enter your email address")}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F0F4F9]/90 border border-slate-200/90 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E5FBF] focus:bg-white focus:ring-2 focus:ring-[#1E5FBF]/15 transition-all input-text font-body"
                  />
                </div>
              </div>

              {/* Password & Confirm Password (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.password", "Password")}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#F0F4F9]/90 border border-slate-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E5FBF] focus:bg-white focus:ring-2 focus:ring-[#1E5FBF]/15 transition-all input-text font-body"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("auth.confirmPassword", "Confirm")}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[#F0F4F9]/90 border border-slate-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E5FBF] focus:bg-white focus:ring-2 focus:ring-[#1E5FBF]/15 transition-all input-text font-body"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Organization / Role Dropdown */}
              <div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Building className="w-4 h-4" />
                  </span>
                  <select
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#F0F4F9]/90 border border-slate-200/90 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E5FBF] focus:bg-white focus:ring-2 focus:ring-[#1E5FBF]/15 appearance-none cursor-pointer input-text font-body"
                  >
                    <option value="Coast Guard">{t("auth.orgCoastGuard", "Coast Guard")}</option>
                    <option value="Port Authority">{t("auth.orgPortAuthority", "Port Authority")}</option>
                    <option value="Environmental Regulator">{t("auth.orgEnvironmentalRegulator", "Environmental Regulator")}</option>
                    <option value="Researcher">{t("auth.orgResearcher", "Researcher")}</option>
                    <option value="NGO">{t("auth.orgNGO", "NGO / Marine Conservation")}</option>
                    <option value="Other">{t("auth.orgOther", "Other Authority")}</option>
                  </select>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none micro-text text-slate-600 font-body">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#1E5FBF] focus:ring-[#1E5FBF] accent-[#1E5FBF] cursor-pointer"
                  />
                  <span>
                    {t("auth.agreeTermsPrefix", "I agree to the")}{" "}
                    <a
                      href="#terms"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Terms of Use: This platform is restricted to authorized maritime safety personnel.");
                      }}
                      className="text-[#1E5FBF] hover:underline"
                    >
                      {t("auth.termsOfUse", "Terms of Use")}
                    </a>{" "}
                    {t("auth.agreeTermsAnd", "and")}{" "}
                    <a
                      href="#privacy"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Privacy Policy: All data is processed according to authorized maritime data security regulations.");
                      }}
                      className="text-[#1E5FBF] hover:underline"
                    >
                      {t("auth.privacyPolicy", "Privacy Policy")}
                    </a>
                  </span>
                </label>
              </div>

              {/* Primary Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#185ADB] via-[#1E6FFB] to-[#38BDF8] text-white btn-text shadow-[0_8px_20px_rgba(24,90,219,0.32)] hover:shadow-[0_10px_25px_rgba(24,90,219,0.42)] hover:from-[#1448B0] hover:to-[#2563EB] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-body"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>{t("action.createAccount", "Create Account")}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center py-1 font-body">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative px-3 bg-white/90 micro-text font-medium text-slate-400 uppercase tracking-wider font-body">
                  {t("auth.orContinueWith", "Or continue with")}
                </span>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3 font-body">
                <button
                  type="button"
                  onClick={() => handleSocial("google")}
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer font-body btn-text"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocial("facebook")}
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold text-slate-700 shadow-sm transition-all cursor-pointer font-body btn-text"
                >
                  <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>

              {/* Footer line */}
              <div className="text-center pt-2 font-body">
                <p className="body-text text-xs text-slate-500 font-normal font-body">
                  {t("auth.haveAccount", "Already have an account?")}{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-[#1E5FBF] hover:text-[#185ADB] hover:underline transition-colors"
                  >
                    {t("action.signIn", "Login")}
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* 5. FOOTER */}
      <footer className="relative z-20 w-full px-6 sm:px-10 lg:px-14 pb-5 pt-2 antialiased">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-white/80 micro-text font-body">
          <div className="flex items-center gap-2 drop-shadow-md">
            <Shield className="w-4 h-4 text-sky-300 shrink-0" />
            <span>Healthy Oceans &nbsp;|&nbsp; Safe Communities &nbsp;|&nbsp; Sustainable Future</span>
          </div>

          <div className="hidden lg:block flex-1 mx-8 border-t border-white/20" />

          <div className="flex items-center gap-2 drop-shadow-md">
            <Waves className="w-4 h-4 text-sky-300 shrink-0" />
            <span>Powered by AI &nbsp;|&nbsp; Built for a Cleaner Planet</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage;
