import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ShieldCheck, HardDrive, WifiOff, FileCheck, Lock, Activity } from 'lucide-react';
import { networkMonitor } from '@/audio/networkMonitor';

interface PrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ open, onOpenChange }) => {
  const [stats, setStats] = useState(networkMonitor.getStats());

  useEffect(() => {
    if (open) {
      setStats(networkMonitor.getStats());
      const unsub = networkMonitor.subscribe(() => {
        setStats({ ...networkMonitor.getStats() });
      });
      return () => unsub();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-xs uppercase font-bold tracking-wider">
              Privacy & Security Guarantee
            </span>
          </div>
          <DialogTitle className="text-xl font-bold">
            100% On-Device & Offline Architecture
          </DialogTitle>
          <DialogDescription>
            This application is architected to guarantee complete privacy. No audio recordings,
            microphone streams, or voice data ever leave your machine.
          </DialogDescription>
        </DialogHeader>

        {/* Live Traffic Inspector */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              Live Network Audit (Interception Engine)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {stats.bytesSent} bytes transmitted
            </span>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            Active outbound HTTP/XHR/fetch requests intercepted during this session:{' '}
            <strong className="text-neutral-800 dark:text-neutral-200">{stats.requestCount}</strong>
          </div>
          {stats.logs.length === 0 ? (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center text-xs text-emerald-700 dark:text-emerald-300">
              Verified: Zero network requests made since opening the application.
            </div>
          ) : (
            <div className="max-h-24 overflow-y-auto font-mono text-[11px] space-y-1 bg-white dark:bg-neutral-950 p-2 rounded border border-neutral-200 dark:border-neutral-800">
              {stats.logs.map((log, i) => (
                <div
                  key={i}
                  className="flex justify-between text-neutral-600 dark:text-neutral-400"
                >
                  <span>
                    {log.method} {log.url}
                  </span>
                  <span>{log.payloadSize} B</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/50 dark:bg-neutral-950/40">
            <div className="flex items-center gap-2 font-medium text-sm text-neutral-900 dark:text-neutral-100 mb-1">
              <HardDrive className="h-4 w-4 text-emerald-500" />
              RAM-Only Processing
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Your microphone audio is piped strictly into local Web Audio API buffers in browser
              memory. No backend server exists.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/50 dark:bg-neutral-950/40">
            <div className="flex items-center gap-2 font-medium text-sm text-neutral-900 dark:text-neutral-100 mb-1">
              <FileCheck className="h-4 w-4 text-emerald-500" />
              Client-Side Encoders
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              WAV, MP3, M4A, and WebM files are synthesized on your device's CPU using WebCodecs and
              pure in-browser encoders.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/50 dark:bg-neutral-950/40">
            <div className="flex items-center gap-2 font-medium text-sm text-neutral-900 dark:text-neutral-100 mb-1">
              <WifiOff className="h-4 w-4 text-emerald-500" />
              100% Offline PWA
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Once cached via the Service Worker, you can turn off Wi-Fi or unplug your internet
              cable and the entire app continues to work.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/50 dark:bg-neutral-950/40">
            <div className="flex items-center gap-2 font-medium text-sm text-neutral-900 dark:text-neutral-100 mb-1">
              <Lock className="h-4 w-4 text-emerald-500" />
              No Telemetry or Cookies
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Zero Google Analytics, zero advertising trackers, zero cookies, zero external API
              keys. Pure static code.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
