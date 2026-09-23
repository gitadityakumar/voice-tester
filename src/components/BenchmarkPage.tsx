import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MicQualityReport, AudioStats } from '@/audio/types';
import { analyzeMicQuality } from '@/audio/qualityAnalyzer';
import { Gauge, CheckCircle, Sparkles, ArrowLeft, Mic, Activity } from 'lucide-react';

interface BenchmarkPageProps {
  isActive: boolean;
  onStartMic: () => void;
  onNavigateHome: () => void;
  onRunGuidedTest: () => Promise<AudioBuffer | null>;
  stats: AudioStats;
}

export const BenchmarkPage: React.FC<BenchmarkPageProps> = ({
  isActive,
  onStartMic,
  onNavigateHome,
  onRunGuidedTest,
  stats,
}) => {
  const [report, setReport] = useState<MicQualityReport | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhase, setTestPhase] = useState<'idle' | 'silence' | 'speak'>('idle');
  const [countdown, setCountdown] = useState(0);

  const handleStartGuidedCheck = async () => {
    if (!isActive) return;
    setIsTesting(true);
    setTestPhase('silence');
    setCountdown(2);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      setTestPhase('speak');
      setCountdown(3);
      const speakTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(speakTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 2000);

    try {
      const recorded = await onRunGuidedTest();
      if (recorded) {
        const data = recorded.getChannelData(0);
        const res = analyzeMicQuality(data, recorded.sampleRate);
        setReport(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTesting(false);
      setTestPhase('idle');
    }
  };

  const getScoreBadge = (rating: MicQualityReport['rating']) => {
    switch (rating) {
      case 'Excellent':
        return (
          <Badge variant="default" className="text-xs">
            Studio Grade
          </Badge>
        );
      case 'Good':
        return (
          <Badge
            variant="default"
            className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          >
            Good Quality
          </Badge>
        );
      case 'Fair':
        return (
          <Badge variant="warning" className="text-xs">
            Fair Quality
          </Badge>
        );
      case 'Poor':
        return (
          <Badge variant="destructive" className="text-xs">
            Needs Calibration
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onNavigateHome}
          className="gap-2 text-xs font-medium rounded-xl"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Mic Tester
        </Button>

        <div className="flex items-center gap-2">
          {isActive ? (
            <Badge variant="default" className="gap-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Mic Active ({stats.sampleRate} Hz)
            </Badge>
          ) : (
            <Button size="sm" variant="default" onClick={onStartMic} className="gap-1.5 text-xs">
              <Mic className="h-3.5 w-3.5" /> Start Mic to Benchmark
            </Button>
          )}
        </div>
      </div>

      {/* Main Benchmark Card */}
      <Card className="border-neutral-200/80 dark:border-neutral-800/80 shadow-md">
        <CardHeader className="pb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/20">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Microphone Health & Quality Benchmark
                </CardTitle>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Automated 5-second acoustic analysis: noise floor, vocal headroom, SNR, and
                  distortion
                </p>
              </div>
            </div>

            {report && getScoreBadge(report.rating)}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Action Trigger Box */}
          <div className="p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 dark:border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Run 5-Second Guided Diagnostic
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
                Phase 1 measures room silence (air conditioning, computer fans, ambient hum). Phase
                2 measures vocal volume and distortion.
              </p>
            </div>

            <Button
              size="lg"
              variant="default"
              disabled={!isActive || isTesting}
              onClick={handleStartGuidedCheck}
              className="text-sm font-semibold shadow-lg shadow-emerald-500/20 shrink-0 w-full md:w-auto"
            >
              {isTesting ? (
                <span className="flex items-center gap-2 font-mono">
                  {testPhase === 'silence'
                    ? `Phase 1: Silence (${countdown}s)`
                    : `Phase 2: Speak! (${countdown}s)`}
                </span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run Benchmark Now
                </>
              )}
            </Button>
          </div>

          {/* Active Testing Countdown Overlay Banner */}
          {isTesting && (
            <div className="p-6 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 text-center animate-pulse space-y-2">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                {testPhase === 'silence'
                  ? '🤫 Stay quiet! Calibrating room noise floor...'
                  : '🎙️ Speak clearly into your mic now!'}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                {testPhase === 'silence'
                  ? `Measuring ambient room noise for another ${countdown} second(s)`
                  : `Say a sentence (e.g. "The quick brown fox jumps over the lazy dog")`}
              </div>
            </div>
          )}

          {/* Live Level Meter while on Benchmark page */}
          <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-1.5">
              <span className="flex items-center gap-1.5 font-sans font-medium text-neutral-700 dark:text-neutral-300">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                Live Input Monitor
              </span>
              <span>Peak: {stats.peakDb > -90 ? `${stats.peakDb} dB` : '-∞ dB'}</span>
            </div>

            <div className="relative h-4 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500"
                style={{
                  width: `${Math.max(0, Math.min(100, ((stats.peakDb + 60) / 60) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Results Grid */}
          {report && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Score */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center shadow-xs">
                  <div className="text-xs uppercase font-bold text-neutral-400 mb-1">
                    Acoustic Score
                  </div>
                  <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100 font-mono">
                    {report.score}
                    <span className="text-sm font-normal text-neutral-400">/100</span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    {report.rating}
                  </div>
                </div>

                {/* Noise Floor */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center shadow-xs">
                  <div className="text-xs uppercase font-bold text-neutral-400 mb-1">
                    Noise Floor
                  </div>
                  <div className="text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
                    {report.noiseFloorDb} <span className="text-xs font-normal">dBFS</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {report.noiseFloorDb < -55
                      ? 'Ultra quiet (Studio)'
                      : report.noiseFloorDb < -45
                        ? 'Good room silence'
                        : 'Ambient hum detected'}
                  </div>
                </div>

                {/* Peak Speech */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center shadow-xs">
                  <div className="text-xs uppercase font-bold text-neutral-400 mb-1">
                    Peak Speech
                  </div>
                  <div className="text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
                    {report.peakDb} <span className="text-xs font-normal">dBFS</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">
                    {report.peakDb > -1
                      ? 'Clipping / Overload'
                      : report.peakDb > -16
                        ? 'Optimal broadcast level'
                        : 'Too quiet'}
                  </div>
                </div>

                {/* SNR */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center shadow-xs">
                  <div className="text-xs uppercase font-bold text-neutral-400 mb-1">
                    Signal-to-Noise
                  </div>
                  <div className="text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
                    {report.snrDb} <span className="text-xs font-normal">dB</span>
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">Dynamic range headroom</div>
                </div>
              </div>

              {/* Recommendations Box */}
              <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Diagnostic Recommendations
                </div>
                <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400 pl-5 list-disc leading-relaxed">
                  {report.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
