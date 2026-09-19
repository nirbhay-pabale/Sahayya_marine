import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage, LanguageCode } from "../context/LanguageContext";

interface LanguageSwitcherProps {
  variant?: "light" | "dark" | "compact";
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "light",
  className = "",
}) => {
  const { language, setLanguage, supportedLanguages, currentLanguageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const isDark = variant === "dark";
  const isCompact = variant === "compact";

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-body font-semibold transition-all cursor-pointer select-none active:scale-95 shadow-2xs ${
          isDark
            ? "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-750 text-zinc-200 hover:text-white"
            : "bg-white/90 hover:bg-[#F0F7FD] border-[#DCEEFC] text-slate-700 hover:text-[#0B2545] shadow-[0_1px_4px_rgba(30,95,191,0.06)]"
        }`}
        title={`Change Language (Current: ${currentLanguageInfo.label})`}
        aria-expanded={isOpen}
      >
        <Globe
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-45" : ""
          } ${isDark ? "text-sky-400" : "text-[#1E5FBF]"}`}
        />
        <span className="tracking-wide">
          {isCompact ? currentLanguageInfo.code.toUpperCase() : currentLanguageInfo.nativeLabel}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 opacity-60 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border py-1.5 z-50 animate-fadeIn backdrop-blur-md ${
            isDark
              ? "bg-zinc-900/95 border-zinc-700 text-zinc-200 shadow-black/60"
              : "bg-white/98 border-[#DCEEFC] text-slate-800 shadow-[0_12px_32px_rgba(11,37,69,0.12)]"
          }`}
        >
          <div
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b ${
              isDark ? "border-zinc-800 text-zinc-400" : "border-slate-100 text-slate-400"
            }`}
          >
            Select Operational Language
          </div>

          <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? isDark
                        ? "bg-sky-950/70 text-sky-300 font-semibold"
                        : "bg-sky-50 text-[#1E5FBF] font-semibold"
                      : isDark
                      ? "hover:bg-zinc-800/80 text-zinc-300"
                      : "hover:bg-[#F8FBFE] text-slate-700 hover:text-[#0B2545]"
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[13px]">{lang.nativeLabel}</span>
                      {lang.code !== "en" && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({lang.label})
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9.5px] ${
                        isDark ? "text-zinc-500" : "text-slate-400"
                      }`}
                    >
                      {lang.region}
                    </span>
                  </div>

                  {isSelected && (
                    <Check
                      className={`w-4 h-4 shrink-0 ${
                        isDark ? "text-sky-400" : "text-[#1E5FBF]"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
