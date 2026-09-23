import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AudioFormat, ExportedAudio } from '@/audio/types';
import { exportAudio } from '@/audio/encoders';
import { sliceAudioBuffer } from '@/audio/sliceBuffer';
import { formatTime, formatBytes } from '@/lib/utils';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Download,
  FileAudio,
  CheckCircle2,
  Loader2,
  Repeat,
  Sparkles,
  Scissors,
  Undo2,
  GripHorizontal,
} from 'lucide-react';

interface RecorderProps {
  isActive: boolean;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  audioBuffer: AudioBuffer | null;
  onClearRecording: () => void;
}

export const Recorder: React.FC<RecorderProps> = ({
  isActive,
  isRecording,
  onStartRecording,
  onStopRecording,
  audioBuffer,
  onClearRecording,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>('mp3');
  const [selectedBitrate, setSelectedBitrate] = useState<number>(192);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedAudio, setExportedAudio] = useState<ExportedAudio | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  // Trimming & window sliding state
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);
  const [currentBuffer, setCurrentBuffer] = useState<AudioBuffer | null>(null);
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [isTrimModified, setIsTrimModified] = useState<boolean>(false);

  // Dragging interaction state (left handle, right handle, or entire sliding window)
  const [draggingHandle, setDraggingHandle] = useState<'start' | 'end' | 'window' | null>(null);
  const dragStartClientXRef = useRef<number>(0);
  const dragInitialTrimStartRef = useRef<number>(0);
  const dragInitialTrimEndRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);

  // Recording duration timer
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const recordTimerRef = useRef<number | null>(null);

  // Web Audio playback node refs
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const scrubberCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronize internal buffer with prop
  useEffect(() => {
    setCurrentBuffer(audioBuffer);
    setOriginalBuffer(audioBuffer);
    if (audioBuffer) {
      setTrimStart(0);
      setTrimEnd(audioBuffer.duration);
      setPlaybackTime(0);
      pauseOffsetRef.current = 0;
      setIsTrimModified(false);
    } else {
      setTrimStart(0);
      setTrimEnd(0);
    }
  }, [audioBuffer]);

  // Manage recording duration timer
  useEffect(() => {
    if (isRecording) {
      setRecordDuration(0);
      const start = Date.now();
      recordTimerRef.current = window.setInterval(() => {
        setRecordDuration((Date.now() - start) / 1000);
      }, 50);
    } else {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  // Render static waveform in scrubber canvas
  useEffect(() => {
    if (!currentBuffer) return;
    const canvas = scrubberCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const data = currentBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#10b981' : '#059669';

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  }, [currentBuffer]);

  // Stop playback cleanly
  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Clean up playback when buffer changes
  useEffect(() => {
    stopPlayback();
    setPlaybackTime(0);
    pauseOffsetRef.current = 0;
    setExportedAudio(null);
  }, [currentBuffer, stopPlayback]);

  // Start playback bounded within trimStart and trimEnd
  const startPlayback = (offset = 0) => {
    if (!currentBuffer) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
      playbackCtxRef.current = new AudioContextClass();
    }

    const ctx = playbackCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Ensure offset starts within [trimStart, trimEnd]
    let safeOffset = offset;
    if (safeOffset < trimStart || safeOffset >= trimEnd) {
      safeOffset = trimStart;
    }

    const source = ctx.createBufferSource();
    source.buffer = currentBuffer;
    source.playbackRate.value = playbackRate;

    source.connect(ctx.destination);
    source.start(0, safeOffset);

    sourceNodeRef.current = source;
    playbackStartTimeRef.current = ctx.currentTime - safeOffset / playbackRate;
    setIsPlaying(true);

    const updateTime = () => {
      if (!ctx || !sourceNodeRef.current) return;
      const current = (ctx.currentTime - playbackStartTimeRef.current) * playbackRate;

      if (current >= trimEnd) {
        if (isLooping) {
          // Restart loop at trimStart
          stopPlayback();
          startPlayback(trimStart);
          return;
        } else {
          stopPlayback();
          setPlaybackTime(trimEnd);
          pauseOffsetRef.current = trimStart;
          return;
        }
      }

      setPlaybackTime(current);
      animFrameRef.current = requestAnimationFrame(updateTime);
    };

    animFrameRef.current = requestAnimationFrame(updateTime);

    source.onended = () => {
      if (!isLooping && isPlaying) {
        setIsPlaying(false);
      }
    };
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseOffsetRef.current = playbackTime;
      stopPlayback();
    } else {
      const offset =
        pauseOffsetRef.current >= trimEnd || pauseOffsetRef.current < trimStart
          ? trimStart
          : pauseOffsetRef.current;
      startPlayback(offset);
    }
  };

  // Timeline click / scrub handler for areas outside the draggable window
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentBuffer || draggingHandle) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * currentBuffer.duration;

    const clampedTarget = Math.max(trimStart, Math.min(trimEnd, targetTime));
    pauseOffsetRef.current = clampedTarget;
    setPlaybackTime(clampedTarget);

    if (isPlaying) {
      stopPlayback();
      startPlayback(clampedTarget);
    }
  };

  // Handle pointer down on handles or on the slidable selection window
  const handlePointerDown = (handle: 'start' | 'end' | 'window', e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingHandle(handle);
    dragStartClientXRef.current = e.clientX;
    dragInitialTrimStartRef.current = trimStart;
    dragInitialTrimEndRef.current = trimEnd;
    hasMovedRef.current = false;
  };

  // Dragging movement: slides window or resizes start/end
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingHandle || !currentBuffer || !timelineContainerRef.current) return;
    const rect = timelineContainerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartClientXRef.current;
    if (Math.abs(deltaX) > 2) {
      hasMovedRef.current = true;
    }
    const totalDuration = currentBuffer.duration;
    const deltaT = (deltaX / rect.width) * totalDuration;
    const minClipDuration = 0.2; // at least 200ms

    if (draggingHandle === 'window') {
      // Slide the entire selection window across the audio clip
      const clipDuration = dragInitialTrimEndRef.current - dragInitialTrimStartRef.current;
      let newStart = dragInitialTrimStartRef.current + deltaT;
      if (newStart < 0) newStart = 0;
      if (newStart + clipDuration > totalDuration) {
        newStart = Math.max(0, totalDuration - clipDuration);
      }
      const newEnd = Math.min(totalDuration, newStart + clipDuration);

      setTrimStart(newStart);
      setTrimEnd(newEnd);
      setIsTrimModified(true);

      // Keep playhead within sliding window
      if (playbackTime < newStart || playbackTime > newEnd) {
        setPlaybackTime(newStart);
        pauseOffsetRef.current = newStart;
      }
    } else if (draggingHandle === 'start') {
      // Resize start
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const timeAtPointer = ratio * totalDuration;
      const newStart = Math.max(0, Math.min(trimEnd - minClipDuration, timeAtPointer));
      setTrimStart(newStart);
      setIsTrimModified(true);
      if (playbackTime < newStart) {
        setPlaybackTime(newStart);
        pauseOffsetRef.current = newStart;
      }
    } else if (draggingHandle === 'end') {
      // Resize end
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const timeAtPointer = ratio * totalDuration;
      const newEnd = Math.min(totalDuration, Math.max(trimStart + minClipDuration, timeAtPointer));
      setTrimEnd(newEnd);
      setIsTrimModified(true);
      if (playbackTime > newEnd) {
        setPlaybackTime(newEnd);
        pauseOffsetRef.current = trimStart;
      }
    }
    setExportedAudio(null);
  };

  // Pointer release
  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      // If user tapped/clicked inside window without dragging, seek playhead
      if (
        draggingHandle === 'window' &&
        !hasMovedRef.current &&
        currentBuffer &&
        timelineContainerRef.current
      ) {
        const rect = timelineContainerRef.current.getBoundingClientRect();
        const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const targetTime = Math.max(
          trimStart,
          Math.min(trimEnd, clickRatio * currentBuffer.duration),
        );
        pauseOffsetRef.current = targetTime;
        setPlaybackTime(targetTime);
        if (isPlaying) {
          stopPlayback();
          startPlayback(targetTime);
        }
      }

      setDraggingHandle(null);
    }
  };

  // Apply Trim permanently to working buffer
  const handleApplyTrim = () => {
    if (!currentBuffer) return;
    stopPlayback();
    const sliced = sliceAudioBuffer(currentBuffer, trimStart, trimEnd);
    setCurrentBuffer(sliced);
    setTrimStart(0);
    setTrimEnd(sliced.duration);
    setPlaybackTime(0);
    pauseOffsetRef.current = 0;
    setIsTrimModified(true);
    setExportedAudio(null);
  };

  // Reset to original untrimmed recording
  const handleResetTrim = () => {
    if (!originalBuffer) return;
    stopPlayback();
    setCurrentBuffer(originalBuffer);
    setTrimStart(0);
    setTrimEnd(originalBuffer.duration);
    setPlaybackTime(0);
    pauseOffsetRef.current = 0;
    setIsTrimModified(false);
    setExportedAudio(null);
  };

  // Export handling (exports the selected trimmed/slid segment)
  const handleExport = async () => {
    if (!currentBuffer) return;
    setIsExporting(true);
    try {
      let bufferToExport = currentBuffer;
      if (trimStart > 0.05 || trimEnd < currentBuffer.duration - 0.05) {
        bufferToExport = sliceAudioBuffer(currentBuffer, trimStart, trimEnd);
      }
      const result = await exportAudio(bufferToExport, selectedFormat, selectedBitrate);
      setExportedAudio(result);
    } catch (err) {
      console.error('Failed to export audio:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedAudio) return;
    const url = URL.createObjectURL(exportedAudio.blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = exportedAudio.filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const totalDuration = currentBuffer?.duration || 1;
  const startPercent = (trimStart / totalDuration) * 100;
  const endPercent = (trimEnd / totalDuration) * 100;
  const playheadPercent = (playbackTime / totalDuration) * 100;
  const selectedDuration = Math.max(0, trimEnd - trimStart);

  return (
    <Card className="border-neutral-200/80 dark:border-neutral-800/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileAudio className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base font-semibold">
              Test Recording & Multi-Format Exporter
            </CardTitle>
          </div>
          {currentBuffer && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {currentBuffer.duration.toFixed(2)}s · {currentBuffer.sampleRate} Hz ·{' '}
                {currentBuffer.numberOfChannels === 1 ? 'Mono' : 'Stereo'}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Record Controls Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3.5 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40">
          {/* Subtext: Above button on mobile/tablet (order-1), Left side on desktop (lg:order-1) */}
          <div className="order-1 lg:order-1 text-xs text-neutral-600 dark:text-neutral-400 text-center lg:text-left flex-1">
            {isRecording
              ? 'Recording raw lossless PCM directly in browser memory...'
              : currentBuffer
                ? 'Audio captured! Drag handles to resize, or drag center to slide window over clip.'
                : 'Click "Record" and speak naturally to test microphone and record clips.'}
          </div>

          {/* Record Button & Timer: Center on mobile/tablet (order-2), Right side on desktop (lg:order-2) */}
          <div className="order-2 lg:order-2 flex items-center justify-center lg:justify-end gap-3 w-full lg:w-auto shrink-0">
            {isRecording ? (
              <Button
                variant="destructive"
                onClick={onStopRecording}
                className="gap-2 font-semibold shadow-md animate-pulse"
              >
                <Square className="h-4 w-4 fill-white" />
                Stop
              </Button>
            ) : (
              <Button
                variant="default"
                disabled={!isActive}
                onClick={onStartRecording}
                className="gap-2 font-semibold shadow-md"
              >
                <Mic className="h-4 w-4" />
                Record
              </Button>
            )}

            {isRecording && (
              <div className="flex items-center gap-2 text-rose-500 font-mono text-sm font-bold">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                {formatTime(recordDuration)}
              </div>
            )}
          </div>
        </div>

        {/* Editable Interactive Waveform Scrubber & Slidable Trimmer */}
        {currentBuffer && (
          <div className="space-y-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 shadow-xs">
            {/* Timeline Header Info & Trim Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-neutral-500 dark:text-neutral-400">Trim Range:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatTime(trimStart)} - {formatTime(trimEnd)}
                </span>
                <span className="text-neutral-400">({selectedDuration.toFixed(2)}s selected)</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleApplyTrim}
                  disabled={trimStart <= 0.02 && trimEnd >= currentBuffer.duration - 0.02}
                  className="h-7 text-xs gap-1 font-medium"
                  title="Cut audio buffer to the selected trim range"
                >
                  <Scissors className="h-3 w-3 text-emerald-500" />
                  Trim Clip
                </Button>

                {isTrimModified && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResetTrim}
                    className="h-7 text-xs gap-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    title="Revert back to original recording"
                  >
                    <Undo2 className="h-3 w-3" />
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Draggable Waveform Timeline Container with Slidable Window */}
            <div
              ref={timelineContainerRef}
              onClick={handleTimelineClick}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full h-24 rounded-xl bg-neutral-100 dark:bg-neutral-950 overflow-hidden border border-neutral-200 dark:border-neutral-800 select-none group touch-none"
              title="Click outside to seek, drag handles to resize, or drag center to slide selection"
            >
              {/* Background Waveform Canvas */}
              <canvas
                ref={scrubberCanvasRef}
                width={800}
                height={96}
                className="w-full h-full block opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none"
              />

              {/* Left Excluded Shade (Before trimStart) */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-black/60 dark:bg-black/75 backdrop-blur-[1px] pointer-events-none transition-all duration-75 border-r border-emerald-500"
                style={{ width: `${startPercent}%` }}
              />

              {/* Right Excluded Shade (After trimEnd) */}
              <div
                className="absolute top-0 bottom-0 right-0 bg-black/60 dark:bg-black/75 backdrop-blur-[1px] pointer-events-none transition-all duration-75 border-l border-emerald-500"
                style={{ width: `${100 - endPercent}%` }}
              />

              {/* Slidable Selection Window Box */}
              <div
                onPointerDown={(e) => handlePointerDown('window', e)}
                style={{
                  left: `${startPercent}%`,
                  width: `${Math.max(0, endPercent - startPercent)}%`,
                }}
                className={`absolute top-0 bottom-0 border-y-2 border-emerald-500 bg-emerald-500/15 backdrop-blur-[0.5px] cursor-grab active:cursor-grabbing select-none z-10 flex flex-col justify-between items-center py-1 group/window transition-colors hover:bg-emerald-500/25 ${
                  draggingHandle === 'window'
                    ? 'cursor-grabbing bg-emerald-500/30 ring-1 ring-emerald-400'
                    : ''
                }`}
                title="Grab & drag to slide this exact window anywhere across the audio clip"
              >
                {/* Top Slide Handle Pill */}
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-mono shadow-md pointer-events-none select-none ring-1 ring-white/20">
                  <GripHorizontal className="h-3 w-3" />
                  <span>Slide Window ({selectedDuration.toFixed(1)}s)</span>
                </div>

                {/* Subtitle helper on hover */}
                <div className="text-[10px] text-emerald-800 dark:text-emerald-200 font-semibold opacity-0 group-hover/window:opacity-100 transition-opacity pointer-events-none select-none tracking-tight">
                  ⟷ Drag to Move Selection
                </div>
              </div>

              {/* Progress Playhead Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-md transition-all duration-75 pointer-events-none z-20"
                style={{ left: `${playheadPercent}%` }}
              >
                <div className="absolute -top-1 -left-1.5 h-3.5 w-3.5 rounded-full bg-cyan-400 border border-white shadow" />
              </div>

              {/* Left Trim Handle (Draggable) */}
              <div
                onPointerDown={(e) => handlePointerDown('start', e)}
                style={{ left: `calc(${startPercent}% - 8px)` }}
                className="absolute top-0 bottom-0 w-4 cursor-ew-resize z-30 flex items-center justify-center group/handle transition-transform"
                title="Drag to resize start time"
              >
                <div className="h-full w-2.5 rounded-l-md bg-emerald-500 text-white flex flex-col items-center justify-center shadow-lg ring-1 ring-emerald-400 hover:scale-110 active:scale-110 transition-transform">
                  <span className="w-0.5 h-4 bg-white/80 rounded-full" />
                </div>
              </div>

              {/* Right Trim Handle (Draggable) */}
              <div
                onPointerDown={(e) => handlePointerDown('end', e)}
                style={{ left: `calc(${endPercent}% - 2px)` }}
                className="absolute top-0 bottom-0 w-4 cursor-ew-resize z-30 flex items-center justify-center group/handle transition-transform"
                title="Drag to resize end time"
              >
                <div className="h-full w-2.5 rounded-r-md bg-emerald-500 text-white flex flex-col items-center justify-center shadow-lg ring-1 ring-emerald-400 hover:scale-110 active:scale-110 transition-transform">
                  <span className="w-0.5 h-4 bg-white/80 rounded-full" />
                </div>
              </div>
            </div>

            {/* Playback Controls & Speed */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isPlaying ? 'secondary' : 'default'}
                  onClick={handlePlayPause}
                  className="font-medium"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 mr-1 fill-current" /> Play Preview
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    stopPlayback();
                    setPlaybackTime(trimStart);
                    pauseOffsetRef.current = trimStart;
                  }}
                  title="Rewind to trim start"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant={isLooping ? 'secondary' : 'ghost'}
                  onClick={() => setIsLooping(!isLooping)}
                  className={`text-xs ${isLooping ? 'text-emerald-500 font-semibold' : ''}`}
                  title="Loop playback within trimmed section"
                >
                  <Repeat className="h-3.5 w-3.5 mr-1" /> Loop
                </Button>
              </div>

              {/* Time Display */}
              <div className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                {formatTime(playbackTime)} / {formatTime(currentBuffer.duration)}
              </div>

              {/* Playback Speed Toggles */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-neutral-400 mr-1 hidden sm:inline">Speed:</span>
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (sourceNodeRef.current) {
                        sourceNodeRef.current.playbackRate.value = rate;
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md font-mono transition-colors ${
                      playbackRate === rate
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Multi-Format Export Card */}
        {currentBuffer && (
          <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                Export Audio Format (100% On-Device)
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {trimStart > 0.05 || trimEnd < currentBuffer.duration - 0.05
                  ? `Exports selected clip (${selectedDuration.toFixed(2)}s)`
                  : 'Exports full clip'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['mp3', 'm4a', 'wav', 'webm'] as AudioFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    setSelectedFormat(fmt);
                    setExportedAudio(null);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                    selectedFormat === fmt
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <span className="uppercase text-xs tracking-wider">{fmt}</span>
                  <span className="text-[10px] font-normal text-neutral-400 mt-0.5">
                    {fmt === 'mp3'
                      ? 'LAME 192k'
                      : fmt === 'm4a'
                        ? 'AAC-LC'
                        : fmt === 'wav'
                          ? '16-bit Lossless'
                          : 'Opus WebM'}
                  </span>
                </button>
              ))}
            </div>

            {/* Bitrate selection for MP3 and M4A */}
            {(selectedFormat === 'mp3' || selectedFormat === 'm4a') && (
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-neutral-500 dark:text-neutral-400">Bitrate:</span>
                <div className="flex gap-2">
                  {[128, 192, 320].map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        setSelectedBitrate(b);
                        setExportedAudio(null);
                      }}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                        selectedBitrate === b
                          ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900 font-semibold'
                          : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                      }`}
                    >
                      {b} kbps
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Export and Download Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-neutral-500">
                {exportedAudio ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Encoded successfully ({formatBytes(exportedAudio.sizeBytes)})
                  </span>
                ) : (
                  <span>Ready to compile {selectedFormat.toUpperCase()}</span>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={onClearRecording} className="text-xs">
                  Clear
                </Button>

                {exportedAudio && exportedAudio.format === selectedFormat ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download {selectedFormat.toUpperCase()} ({formatBytes(exportedAudio.sizeBytes)})
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={isExporting}
                    onClick={handleExport}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Encoding {selectedFormat.toUpperCase()}...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate & Download {selectedFormat.toUpperCase()}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
