import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { DeviceSelector } from './components/DeviceSelector';
import { Visualizers } from './components/Visualizers';
import { FeaturesSection } from './components/FeaturesSection';
import { MobileNav } from './components/MobileNav';

const Recorder = React.lazy(() =>
  import('./components/Recorder').then((m) => ({ default: m.Recorder }))
);

const BenchmarkPage = React.lazy(() =>
  import('./components/BenchmarkPage').then((m) => ({ default: m.BenchmarkPage }))
);

const PrivacyModal = React.lazy(() =>
  import('./components/PrivacyModal').then((m) => ({ default: m.PrivacyModal }))
);
import { audioManager } from './audio/audioManager';
import { AudioStats, MicConstraints, PitchInfo } from './audio/types';
import { ShieldCheck, AlertCircle, Lock } from 'lucide-react';

export const App: React.FC = () => {
  // Routing state
  const getInitialRoute = (): 'tester' | 'benchmark' => {
    if (typeof window === 'undefined') return 'tester';
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.includes('benchmark') || hash.includes('benchmark')) {
      return 'benchmark';
    }
    return 'tester';
  };

  const [currentRoute, setCurrentRoute] = useState<'tester' | 'benchmark'>(getInitialRoute);
  const [navDirection, setNavDirection] = useState<'forward' | 'backward'>('forward');

  const navigateTo = (route: 'tester' | 'benchmark') => {
    if (route === currentRoute) return;
    const direction = route === 'benchmark' ? 'forward' : 'backward';
    setNavDirection(direction);

    const updateDOM = () => {
      setCurrentRoute(route);
      const targetUrl = route === 'benchmark' ? '/benchmark' : '/';
      try {
        window.history.pushState({}, '', targetUrl);
      } catch (_) {
        // Fallback for file:// or restricted protocols
        window.location.hash = route === 'benchmark' ? '#benchmark' : '#/';
      }
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      const doc = document as unknown as {
        startViewTransition?: (args: (() => void) | { update: () => void; types?: string[] }) => void;
      };
      try {
        doc.startViewTransition?.({
          update: updateDOM,
          types: [direction],
        });
      } catch (_) {
        doc.startViewTransition?.(updateDOM);
      }
    } else {
      updateDOM();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const nextRoute = path.includes('benchmark') || hash.includes('benchmark') ? 'benchmark' : 'tester';
      if (nextRoute === currentRoute) return;

      const direction = nextRoute === 'benchmark' ? 'forward' : 'backward';
      setNavDirection(direction);

      const updateDOM = () => {
        setCurrentRoute(nextRoute);
      };

      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        const doc = document as unknown as {
          startViewTransition?: (args: (() => void) | { update: () => void; types?: string[] }) => void;
        };
        try {
          doc.startViewTransition?.({
            update: updateDOM,
            types: [direction],
          });
        } catch (_) {
          doc.startViewTransition?.(updateDOM);
        }
      } else {
        updateDOM();
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [currentRoute]);

  // Audio & Mic state
  const [isActive, setIsActive] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isInsecureContext, setIsInsecureContext] = useState<boolean>(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      if (!window.isSecureContext && !isLocalhost) {
        setIsInsecureContext(true);
      }
    }
  }, []);

  const [constraints, setConstraints] = useState<MicConstraints>({
    deviceId: '',
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
  });

  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [monitorVolume, setMonitorVolume] = useState<number>(0.5);

  // Live visualizer data
  const [timeDomain, setTimeDomain] = useState<Float32Array>(new Float32Array(2048));
  const [frequency, setFrequency] = useState<Uint8Array>(new Uint8Array(1024));
  const [stats, setStats] = useState<AudioStats>({
    peakDb: -100,
    rmsDb: -100,
    isClipping: false,
    sampleRate: 44100,
    channels: 1,
  });
  const [pitch, setPitch] = useState<PitchInfo | null>(null);

  // Recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const animFrameRef = useRef<number | null>(null);

  // Load available devices
  const refreshDevices = useCallback(async () => {
    try {
      const devList = await audioManager.getDevices();
      setDevices(devList);
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshDevices();
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      };
    }
  }, [refreshDevices]);

  // Start microphone
  const startMic = async () => {
    setPermissionError(null);
    try {
      await audioManager.initAudio(constraints);
      setIsActive(true);
      await refreshDevices();
    } catch (err: unknown) {
      console.error('Microphone access failed:', err);
      const e = err as Error;
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setPermissionError(
          'Microphone blocked: Browsers require a Secure Context (HTTPS or localhost). On mobile Wi-Fi, open via HTTPS (https://' +
            window.location.host +
            ') or test the deployed production URL.'
        );
      } else if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setPermissionError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
      } else if (e.name === 'NotFoundError') {
        setPermissionError('No microphone hardware detected. Please plug in a microphone and retry.');
      } else {
        setPermissionError(e.message || 'Could not access microphone.');
      }
      setIsActive(false);
    }
  };

  // Stop microphone
  const stopMic = () => {
    if (isRecording) {
      audioManager.stopRecording();
      setIsRecording(false);
    }
    audioManager.cleanup();
    setIsActive(false);
    setIsMonitoring(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setStats({
      peakDb: -100,
      rmsDb: -100,
      isClipping: false,
      sampleRate: 44100,
      channels: 1,
    });
    setPitch(null);
  };

  // Change constraints & restart stream if active
  const handleConstraintsChange = async (newConstraints: MicConstraints) => {
    setConstraints(newConstraints);
    if (isActive) {
      try {
        await audioManager.initAudio(newConstraints);
      } catch (err) {
        console.error('Failed to apply updated constraints:', err);
      }
    }
  };

  // Direct Monitoring toggle
  const handleToggleMonitoring = (enabled: boolean) => {
    setIsMonitoring(enabled);
    audioManager.setMonitoring(enabled, monitorVolume);
  };

  const handleMonitorVolumeChange = (vol: number) => {
    setMonitorVolume(vol);
    if (isMonitoring) {
      audioManager.setMonitoring(true, vol);
    }
  };

  // Analysis tick loop
  useEffect(() => {
    if (!isActive) return;

    let isRunning = true;
    let frameCount = 0;

    const tick = () => {
      if (!isRunning) return;

      const analysis = audioManager.getLiveAnalysis();
      setTimeDomain(analysis.timeDomain.slice());
      setFrequency(analysis.frequency.slice());
      setStats(analysis.stats);

      if (frameCount % 3 === 0) {
        setPitch(analysis.pitch);
      }

      frameCount++;
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive]);

  // Record actions
  const handleStartRecording = () => {
    if (!isActive) return;
    audioManager.startRecording(constraints.channelCount);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    const buffer = audioManager.stopRecording();
    setIsRecording(false);
    if (buffer) {
      setAudioBuffer(buffer);
    }
  };

  // 5-second guided check
  const handleRunGuidedTest = async (): Promise<AudioBuffer | null> => {
    if (!isActive) return null;
    audioManager.startRecording(constraints.channelCount);
    setIsRecording(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        const buffer = audioManager.stopRecording();
        setIsRecording(false);
        if (buffer) {
          setAudioBuffer(buffer);
        }
        resolve(buffer);
      }, 5000);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Header
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
        isActive={isActive}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Dedicated Mobile Navigation & Breadcrumb System */}
      <MobileNav
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenPrivacyModal={() => setPrivacyModalOpen(true)}
        isActive={isActive}
        drawerOpen={mobileMenuOpen}
        onCloseDrawer={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6 sm:px-6 space-y-6 pb-24 sm:pb-6">
        {/* Insecure Context (Plain HTTP on LAN) Diagnostic Banner */}
        {isInsecureContext && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-sm space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Mobile Testing Notice: Microphone Access Requires HTTPS</span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
              Mobile browsers (Chrome, Safari, Firefox, Brave) restrict microphone access (<code className="px-1 py-0.5 rounded bg-amber-500/20 font-mono">getUserMedia</code>) strictly to <strong>Secure Contexts (HTTPS)</strong>. Plain HTTP over local network IPs is blocked for privacy.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.location.href = window.location.href.replace(/^http:/, 'https:');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                Switch to HTTPS: https://{typeof window !== 'undefined' ? window.location.host : ''}
              </button>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                (Tap "Advanced" → "Proceed to site" to allow the local dev SSL certificate)
              </span>
            </div>
          </div>
        )}

        {/* Permission Error Banner */}
        {permissionError && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm">
            <div className="flex items-start sm:items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 sm:mt-0" />
              <div className="font-medium">{permissionError}</div>
            </div>
            {typeof window !== 'undefined' && window.location.protocol === 'http:' && (
              <button
                type="button"
                onClick={() => {
                  window.location.href = window.location.href.replace(/^http:/, 'https:');
                }}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                Switch to HTTPS
              </button>
            )}
          </div>
        )}

        {/* Animated Route Container with Directional Transition */}
        <div
          key={currentRoute}
          className={
            navDirection === 'forward'
              ? 'route-enter-forward space-y-6'
              : 'route-enter-backward space-y-6'
          }
        >
          {/* Route: Dedicated Benchmark Page */}
          {currentRoute === 'benchmark' ? (
            <React.Suspense
              fallback={
                <div className="min-h-96 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-8 text-neutral-400 text-sm">
                  Loading Acoustic Benchmark Suite...
                </div>
              }
            >
              <BenchmarkPage
                isActive={isActive}
                onStartMic={startMic}
                onNavigateHome={() => navigateTo('tester')}
                onRunGuidedTest={handleRunGuidedTest}
                stats={stats}
              />
            </React.Suspense>
          ) : (
            /* Route: Main Microphone Tester & Recording Deck */
            <>
              {/* Top Hardware Setup Card */}
              <DeviceSelector
                devices={devices}
                constraints={constraints}
                onConstraintsChange={handleConstraintsChange}
                onRefreshDevices={refreshDevices}
                isMonitoring={isMonitoring}
                monitorVolume={monitorVolume}
                onToggleMonitoring={handleToggleMonitoring}
                onMonitorVolumeChange={handleMonitorVolumeChange}
                isActive={isActive}
                onStartMic={startMic}
                onStopMic={stopMic}
              />

              {/* Live Audio Visualizers */}
              <Visualizers
                isActive={isActive}
                timeDomain={timeDomain}
                frequency={frequency}
                stats={stats}
                pitch={pitch}
              />

              {/* Test Recording & Multi-Format Exporter with Editable Trimmer */}
              <React.Suspense
                fallback={
                  <div className="h-44 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/60 animate-pulse flex items-center justify-center text-xs text-neutral-400">
                    Loading recording deck...
                  </div>
                }
              >
                <Recorder
                  isActive={isActive}
                  isRecording={isRecording}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  audioBuffer={audioBuffer}
                  onClearRecording={() => setAudioBuffer(null)}
                />
              </React.Suspense>

              {/* Informational Web App Properties & Features Grid */}
              <FeaturesSection />
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-200/80 dark:border-neutral-800/80 py-6 mb-16 sm:mb-0 text-center text-xs text-neutral-500 dark:text-neutral-400">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPrivacyModalOpen(true)}
            className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Zero-Cloud Processing · All audio stays local in browser RAM</span>
          </button>
          <div>
            100% Client-Side Static Architecture
          </div>
        </div>
      </footer>

      {/* Privacy Guarantee Modal */}
      {privacyModalOpen && (
        <React.Suspense fallback={null}>
          <PrivacyModal
            open={privacyModalOpen}
            onOpenChange={setPrivacyModalOpen}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default App;
