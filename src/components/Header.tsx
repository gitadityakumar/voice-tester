import React, { useState } from "react";
import { Mic, Moon, Sun, WifiOff, Award } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LiveMicIcon } from "./LiveMicIcon";

interface HeaderProps {
  currentRoute: "tester" | "benchmark";
  onNavigate: (route: "tester" | "benchmark") => void;
  onOpenPrivacyModal?: () => void;
  isActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  isActive = false,
}) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/80 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/80 overflow-x-clip">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-6 py-2 sm:py-3 gap-1.5 sm:gap-3">
        {/* Brand with Animated LiveMicIcon */}
        <div
          onClick={() => onNavigate("tester")}
          className="flex items-center gap-2 cursor-pointer select-none group shrink-0 min-w-0"
        >
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-neutral-900 dark:text-white dark:bg-emerald-500/15 ring-1 ring-emerald-500/20 shadow-sm group-hover:scale-105 transition-transform overflow-visible p-0.5">
            <LiveMicIcon
              size={28}
              accentColor="#10B981"
              isLive={isActive}
              animate={true}
              showWaves={true}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-50 truncate">
                Voice
              </h1>
              <Badge
                variant="outline"
                className="hidden md:inline-flex text-[9px] tracking-wide uppercase font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                On-Device
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden lg:block">
              Zero-Server Microphone & Voice Diagnostic Suite
            </p>
          </div>
        </div>

        {/* Navigation Elements (Semantic Nav Links, Not Action Buttons) */}
        <nav className="flex items-center gap-1 sm:gap-6">
          <button
            type="button"
            onClick={() => onNavigate("tester")}
            className={`relative py-1.5 px-2 sm:px-1 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${currentRoute === "tester"
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Mic Tester</span>
            {currentRoute === "tester" && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate("benchmark")}
            className={`relative py-1.5 px-2 sm:px-1 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${currentRoute === "benchmark"
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Benchmark</span>
            {currentRoute === "benchmark" && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        </nav>

        {/* Right Section: Theme Toggle */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Offline Ready Badge (Desktop) */}
          <div
            className="hidden md:flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
            title="Works completely offline via Service Worker"
          >
            <WifiOff className="h-3.5 w-3.5" />
            <span>Offline Ready</span>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 h-8 w-8 p-0"
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
