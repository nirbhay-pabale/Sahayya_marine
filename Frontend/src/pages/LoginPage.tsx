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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState(() => localStorage.getItem("sahayya_remember_name") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("sahayya_remember_email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = login(email, password, rememberMe, firstName);
    if (!result.success) {
      setErrorMessage(result.error || "Login failed. Please check your credentials.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 400);
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

      {/* Subtle ambient lighting & readability overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-white/5 to-[#041629]/25 pointer-events-none" />

      {/* 2. FAINT SATELLITE & GLOBE CONTOUR LINES OVERLAY */}
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
          <path d="M40 200 Q200 130 360 200" stroke="currentColor" strokeWidth="0.8" />
          <path d="M50 250 Q200 180 350 250" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 3" />
          <path d="M60 150 Q200 80 340 150" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 3" />
          <path d="M120 320 Q220 280 380 340" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
          <path d="M150 350 Q250 310 390 370" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
        </svg>

        {/* Satellite with Dotted Orbital Trail */}
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
        {/* Top-Left Logo & Wordmark */}
        <div className="flex items-center gap-3.5">
          <img
            src="/sahayya-logo.png"
            alt="Sahayya Logo"
            className="h-12 sm:h-14 w-auto object-contain drop-shadow-md"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-[0.2em] text-[#0B2545] leading-none">
              {t("brand.name", "SAHAYYA")}
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 tracking-tight mt-1 font-body">
              {t("brand.tagline", "Maritime Defense • Environmental Forensics • Intelligence")}
            </p>
          </div>
        </div>

        {/* Top-Right Nav + Multi-Language Selector */}
        <div className="flex items-center gap-3 sm:gap-4 text-white/90 text-xs sm:text-sm font-semibold tracking-wide drop-shadow-md font-body">
          {/* Multi-Language Selector */}
          <LanguageSwitcher variant="light" />

          <div className="hidden sm:flex items-center gap-2">
            <span>Detect</span>
            <span className="text-white/60 text-xs">•</span>
            <span>Analyze</span>
            <span className="text-white/60 text-xs">•</span>
            <span>Protect</span>
          </div>

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
      </header>

      {/* 4. MAIN SPLIT CONTENT */}
      <main className="relative z-10 w-full min-h-[calc(100vh-8.5rem)] px-6 sm:px-10 lg:px-14 flex flex-col lg:flex-row items-center justify-between py-6 lg:py-0 antialiased">
        {/* Left Hero Section */}
        <div className="w-full lg:w-[50%] max-w-[640px] flex flex-col justify-center py-4 lg:py-8">
          <div className="font-display font-bold text-[#0B2545] tracking-[-0.02em] text-4xl sm:text-5xl md:text-[3.5rem] lg:text-[3.75rem] xl:text-[4rem] leading-[1.02] drop-shadow-[0_2px_14px_rgba(255,255,255,0.65)]">
            <div>&ldquo;{t("auth.heroTitle1", "Cleaner Oceans")}</div>
            <div>{t("auth.heroTitle2", "for a Safer")}</div>
            <div>
              <span className="text-[#185ADB] font-bold">{t("auth.heroTitle3", "Tomorrow")}&rdquo;</span>
            </div>
          </div>

          <div className="mt-4 sm:mt-5 text-base sm:text-[17px] lg:text-lg font-medium text-[#0F2A4A] leading-relaxed font-body drop-shadow-[0_1px_8px_rgba(255,255,255,0.5)]">
            <div>{t("auth.heroSubtitle", "From Satellite to Solution — Turning Ocean Data into Action.")}</div>
          </div>

          {/* 5 Feature Icons */}
          <div className="mt-8 sm:mt-10 grid grid-cols-5 gap-2 sm:gap-4 max-w-[540px] font-body">
            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#EAF3FC] border border-[#D0E4FA] flex items-center justify-center text-[#1E5FBF] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#DEEEFC]">
                <Satellite className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0B2545] mt-2 leading-tight">
                Detect<br />Spills
              </span>
            </div>

            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#EAF3FC] border border-[#D0E4FA] flex items-center justify-center text-[#1E5FBF] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#DEEEFC]">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0B2545] mt-2 leading-tight">
                Find<br />Origins
              </span>
            </div>

            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#EAF3FC] border border-[#D0E4FA] flex items-center justify-center text-[#1E5FBF] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#DEEEFC]">
                <Anchor className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0B2545] mt-2 leading-tight">
                Identify<br />Vessels
              </span>
            </div>

            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#EAF3FC] border border-[#D0E4FA] flex items-center justify-center text-[#1E5FBF] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#DEEEFC]">
                <Waves className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0B2545] mt-2 leading-tight">
                Predict<br />Impact
              </span>
            </div>

            <div className="flex flex-col items-center text-center group cursor-default">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#EAF3FC] border border-[#D0E4FA] flex items-center justify-center text-[#1E5FBF] shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-[#DEEEFC]">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#0B2545] mt-2 leading-tight">
                Enable<br />Response
              </span>
            </div>
          </div>
        </div>

        {/* Right Floating Login Card */}
        <div className="w-full lg:w-auto flex justify-center lg:justify-end py-6 lg:py-0 font-body">
          <div className="w-full max-w-[480px] lg:max-w-[490px] xl:max-w-[505px] bg-white/96 backdrop-blur-2xl rounded-[28px] shadow-[0_24px_70px_rgba(4,22,41,0.32),0_8px_24px_rgba(0,0,0,0.08)] border border-white/90 p-8 sm:p-10 transition-all duration-300 hover:shadow-[0_28px_80px_rgba(4,22,41,0.38)]">
            <div className="mb-7 flex items-center gap-3.5">
              <img
                src="/sahayya-logo.png"
                alt="Sahayya"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-sm shrink-0"
              />
              <div>
                <h2 className="font-display text-[26px] sm:text-[30px] font-bold text-[#0B2545] tracking-tight leading-tight">
                  {t("auth.welcomeBack", "Welcome Back")}
                </h2>
                <p className="text-[14px] sm:text-[15px] text-slate-600 font-medium font-body mt-0.5">
                  {t("auth.signInDesc", "Sign in to continue to Sahayya Command")}
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn font-body">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-body">
              {/* First Name / Full Name Input */}
              <div>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={t("auth.firstName", "Enter your First Name")}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F4F7FB] border border-slate-200 text-[14.5px] text-slate-900 placeholder:text-[14px] placeholder-slate-400 focus:outline-none focus:border-[#1E5FBF] focus:bg-white focus:ring-2 focus:ring-[#1E5FBF]/20 transition-all font-body"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={t("auth.email", "Enter your email address")}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F4F7FB] border border-slate-200 text-[14.5px] text-slate-900 placeholder:text-[14px] placeholder-slate-400 focus:outline-none focus:border-[#1E5FBF] focus:bg-white focus:ring-2 focus:ring-[#1E5FBF]/20 transition-all font-body"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={t("auth.password", "Password")}
                    className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[#F4F7FB] border border-slate-200 text-[14.5px] text-slate-900 placeholder:text-[14px] placeholder-slate-400 focus:outline-none focus:border-[#1E5FBF] focus:bg-white focus:ring-2 focus:ring-[#1E5FBF]/20 transition-all font-body"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1.5 text-[14px] font-body">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#185ADB] focus:ring-[#185ADB] focus:ring-offset-0 cursor-pointer accent-[#185ADB]"
                  />
                  <span className="text-slate-700 font-medium font-body">Remember me</span>
                </label>

                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("A password reset link has been dispatched to your email address.");
                  }}
                  className="font-semibold text-[#185ADB] hover:text-[#0F3E99] hover:underline transition-colors font-body"
                >
                  Forgot password?
                </a>
              </div>

              {/* Primary Login Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#185ADB] via-[#1E6FFB] to-[#38BDF8] text-white text-[15px] font-semibold shadow-[0_8px_25px_rgba(24,90,219,0.35)] hover:shadow-[0_12px_30px_rgba(24,90,219,0.45)] hover:from-[#1448B0] hover:to-[#2563EB] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer font-body"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      <span>{t("action.signIn", "Login")}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Footer line linking to Register */}
              <div className="text-center pt-5 font-body">
                <p className="text-[14px] text-slate-600 font-medium font-body">
                  {t("auth.dontHaveAccount", "Don't have an account?")}{" "}
                  <Link
                    to="/register"
                    className="font-bold text-[#185ADB] hover:text-[#0F3E99] hover:underline transition-colors ml-1"
                  >
                    {t("action.createAccount", "Register")}
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

export default LoginPage;
