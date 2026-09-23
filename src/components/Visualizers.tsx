import React, { useRef, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { AudioStats, PitchInfo } from '@/audio/types';
import { Activity, BarChart3, Mic2, AlertTriangle, Music } from 'lucide-react';

interface VisualizersProps {
  isActive: boolean;
  timeDomain: Float32Array;
  frequency: Uint8Array;
  stats: AudioStats;
  pitch: PitchInfo | null;
}

export const Visualizers: React.FC<VisualizersProps> = ({
  isActive,
  timeDomain,
  frequency,
  stats,
  pitch,
}) => {
  const [activeTab, setActiveTab] = useState<'waveform' | 'spectrum'>('waveform');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peakHoldRef = useRef<number>(-100);
  const peakHoldTimerRef = useRef<number>(0);

  // Peak hold logic
  useEffect(() => {
    if (stats.peakDb > peakHoldRef.current) {
      peakHoldRef.current = stats.peakDb;
      peakHoldTimerRef.current = Date.now();
    } else if (Date.now() - peakHoldTimerRef.current > 1200) {
      peakHoldRef.current = Math.max(-100, peakHoldRef.current - 1.5);
    }
  }, [stats.peakDb]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background grid lines
      ctx.strokeStyle = document.documentElement.classList.contains('dark')
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;

      // Draw center line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (!isActive) {
        // Draw flat line when inactive
        ctx.strokeStyle = document.documentElement.classList.contains('dark')
          ? 'rgba(255, 255, 255, 0.2)'
          : 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      if (activeTab === 'waveform') {
        // --- DRAW OSCILLOSCOPE WAVEFORM ---
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(0.5, '#06b6d4');
        gradient.addColorStop(1, '#10b981');

        ctx.lineWidth = 2;
        ctx.strokeStyle = gradient;
        ctx.beginPath();

        const sliceWidth = width / (timeDomain.length - 1);
        let x = 0;

        for (let i = 0; i < timeDomain.length; i++) {
          const v = timeDomain[i];
          const y = (0.5 - v * 0.45) * height;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();

        // Glow effect
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.stroke();
      } else {
        // --- DRAW FFT FREQUENCY SPECTRUM ---
        const barCount = 64;
        const barWidth = width / barCount;
        const step = Math.floor(frequency.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = frequency[i * step] / 255.0;
          const barHeight = val * height * 0.95;

          const barGrad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          barGrad.addColorStop(0, '#10b981');
          barGrad.addColorStop(0.7, '#06b6d4');
          barGrad.addColorStop(1, '#3b82f6');

          ctx.fillStyle = barGrad;
          ctx.fillRect(
            i * barWidth + 1,
            height - barHeight,
            Math.max(1, barWidth - 2),
            barHeight
          );
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, activeTab, timeDomain, frequency]);

  // Convert dB to percentage (range: -60 dB to 0 dB)
  const dbToPercent = (db: number) => {
    if (db <= -60) return 0;
    if (db >= 0) return 100;
    return Math.round(((db + 60) / 60) * 100);
  };

  const peakPercent = dbToPercent(stats.peakDb);
  const rmsPercent = dbToPercent(stats.rmsDb);
  const peakHoldPercent = dbToPercent(peakHoldRef.current);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Waveform / Spectrum Analyzer Card */}
      <Card className="lg:col-span-2 border-neutral-200/80 dark:border-neutral-800/80">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-base font-semibold">Live Visualizer</CardTitle>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'waveform' | 'spectrum')}
              className="w-full sm:w-auto"
            >
              <TabsList className="h-8 w-full sm:w-auto grid grid-cols-2 sm:flex">
                <TabsTrigger value="waveform" className="text-xs px-2.5">
                  <Activity className="h-3 w-3 mr-1 shrink-0" />
                  Oscilloscope
                </TabsTrigger>
                <TabsTrigger value="spectrum" className="text-xs px-2.5">
                  <BarChart3 className="h-3 w-3 mr-1 shrink-0" />
                  FFT Spectrum
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          <div className="relative w-full h-44 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={700}
              height={176}
              className="w-full h-full block"
            />

            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800/90 text-neutral-300 text-xs font-medium border border-neutral-700">
                  <Mic2 className="h-3.5 w-3.5 text-neutral-400" />
                  Microphone is on standby. Click "Start Mic" to visualize.
                </div>
              </div>
            )}
          </div>

          {/* Spectrum Axis labels */}
          {activeTab === 'spectrum' && (
            <div className="flex justify-between px-2 pt-1 text-[10px] text-neutral-400 font-mono">
              <span>60 Hz</span>
              <span>250 Hz</span>
              <span>1 kHz</span>
              <span>4 kHz</span>
              <span>16 kHz</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Level Meter & Vocal Pitch Card */}
      <Card className="border-neutral-200/80 dark:border-neutral-800/80 flex flex-col justify-between">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-base font-semibold">Levels & Pitch</CardTitle>
            </div>
            {stats.isClipping && (
              <Badge variant="destructive" className="animate-bounce text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" />
                CLIPPING
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col justify-around">
          {/* VU Level Meter */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1 text-neutral-500 dark:text-neutral-400">
              <span>Peak: {stats.peakDb > -90 ? `${stats.peakDb} dB` : '-∞ dB'}</span>
              <span>RMS: {stats.rmsDb > -90 ? `${stats.rmsDb} dB` : '-∞ dB'}</span>
            </div>

            {/* Level Bar Container */}
            <div className="relative h-6 rounded-lg bg-neutral-200 dark:bg-neutral-800 overflow-hidden p-0.5 border border-neutral-300 dark:border-neutral-700">
              {/* RMS Fill (solid) */}
              <div
                className="h-full rounded-md transition-all duration-75 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500"
                style={{ width: `${rmsPercent}%` }}
              />

              {/* Peak Bar (translucent overlay) */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-emerald-400/30 transition-all duration-75 pointer-events-none"
                style={{ width: `${peakPercent}%` }}
              />

              {/* Peak Hold Tick Line */}
              {peakHoldPercent > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-xs z-10 transition-all duration-100"
                  style={{ left: `calc(${peakHoldPercent}% - 2px)` }}
                />
              )}
            </div>

            {/* dB scale markers */}
            <div className="flex justify-between px-0.5 pt-1 text-[9px] font-mono text-neutral-400">
              <span>-60</span>
              <span>-40</span>
              <span>-20</span>
              <span>-12</span>
              <span>-6</span>
              <span>0 dB</span>
            </div>
          </div>

          {/* Real-time Pitch Detection Box */}
          <div className="p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-900/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 text-emerald-500" />
                Vocal Fundamental (F₀)
              </span>
              {pitch && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {pitch.cents > 0 ? `+${pitch.cents}` : pitch.cents} cents
                </span>
              )}
            </div>

            {pitch ? (
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100 font-mono tracking-tight">
                    {pitch.note}
                    <span className="text-sm font-normal text-neutral-500">{pitch.octave}</span>
                  </span>
                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    {pitch.frequency} Hz
                  </span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {pitch.frequency < 165
                    ? 'Chest / Baritone'
                    : pitch.frequency < 260
                    ? 'Mid / Tenor'
                    : 'High / Treble'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-400 italic py-1">
                {isActive ? 'Speak or hum into mic to detect pitch' : 'Microphone inactive'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
