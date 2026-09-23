import React from 'react';
import { Mic, Award, Moon, Sun, ChevronRight, Home, ShieldCheck, X } from 'lucide-react';

interface MobileNavProps {
  currentRoute: 'tester' | 'benchmark';
  onNavigate: (route: 'tester' | 'benchmark') => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenPrivacyModal?: () => void;
  isActive?: boolean;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentRoute,
  onNavigate,
  isDark,
  onToggleTheme,
  onOpenPrivacyModal,
  isActive = false,
  drawerOpen,
  onCloseDrawer,
}) => {
  return (
    <>
      {/* 1. Mobile Breadcrumb Trail (Visible below header on mobile) */}
      <div className="sm:hidden w-full border-b border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md px-4 py-2 flex items-center justify-between text-xs select-none">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-medium text-neutral-500 dark:text-neutral-400">
          <button
            type="button"
            onClick={() => onNavigate('tester')}
            className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            <Home className="h-3 w-3 text-neutral-400" />
            <span>VoiceTester</span>
          </button>
          <ChevronRight className="h-3 w-3 text-neutral-400 shrink-0" />
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            {currentRoute === 'tester' ? (
              <>
                <Mic className="h-3 w-3" />
                Mic Tester
              </>
            ) : (
              <>
                <Award className="h-3 w-3" />
                Benchmark
              </>
            )}
          </span>
        </nav>

        {/* Live Audio / PWA Status Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{isActive ? 'Mic Active' : 'Offline Ready'}</span>
        </div>
      </div>

      {/* 2. Slide-Down Mobile Drawer / Sheet (Triggered by the Breadcrumb/Menu Icon in Header) */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="sm:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={onCloseDrawer}
          />

          {/* Drawer Content */}
          <div className="sm:hidden fixed top-[53px] left-0 right-0 z-50 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 shadow-2xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Header of Drawer: Breadcrumb & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-800/60 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Navigation</span>
                <span>•</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {currentRoute === 'tester' ? 'Mic Tester' : 'Benchmark'}
                </span>
              </div>
              <button
                type="button"
                onClick={onCloseDrawer}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav Route Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onNavigate('tester');
                  onCloseDrawer();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  currentRoute === 'tester'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Microphone Tester</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                      Waveform, FFT spectrum, pitch & lossless recording
                    </div>
                  </div>
                </div>
                {currentRoute === 'tester' && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('benchmark');
                  onCloseDrawer();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  currentRoute === 'benchmark'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Acoustic Benchmark</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-normal">
                      5-second guided SNR, room noise & distortion test
                    </div>
                  </div>
                </div>
                {currentRoute === 'benchmark' && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {/* Quick Actions (Theme & Privacy) */}
            <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
              >
                {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-neutral-600" />}
                <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
              </button>

              {onOpenPrivacyModal && (
                <button
                  type="button"
                  onClick={() => {
                    onCloseDrawer();
                    onOpenPrivacyModal();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Privacy Proof</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* 3. Dedicated Fixed Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl px-4 py-1.5 flex items-center justify-around shadow-lg"
      >
        {/* Mic Tester Tab */}
        <button
          type="button"
          onClick={() => onNavigate('tester')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            currentRoute === 'tester'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-transform ${currentRoute === 'tester' ? 'bg-emerald-500/15 scale-110' : ''}`}>
            <Mic className="h-4 w-4" />
          </div>
          <span className="text-[10px]">Mic Tester</span>
        </button>

        {/* Benchmark Tab */}
        <button
          type="button"
          onClick={() => onNavigate('benchmark')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            currentRoute === 'benchmark'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-transform ${currentRoute === 'benchmark' ? 'bg-emerald-500/15 scale-110' : ''}`}>
            <Award className="h-4 w-4" />
          </div>
          <span className="text-[10px]">Benchmark</span>
        </button>

        {/* Theme Toggle Tab */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium cursor-pointer"
        >
          <div className="p-1 rounded-lg">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </div>
          <span className="text-[10px]">{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </nav>
    </>
  );
};

export default MobileNav;
