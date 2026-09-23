import { AudioStats, MicConstraints, PitchInfo } from './types';
import { detectPitch } from './pitchDetector';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private monitorGainNode: GainNode | null = null;
  private isMonitoring = false;
  private monitorVolume = 0.5;

  // Recording state
  private isRecording = false;
  private recordedChunks: Float32Array[][] = []; // [channelIndex][chunks]
  private recordingSampleRate = 44100;
  private recordingChannels = 1;
  private processorNode: ScriptProcessorNode | null = null;

  // Reusable buffers
  private timeDomainBuffer: Float32Array = new Float32Array(2048);
  private frequencyBuffer: Uint8Array = new Uint8Array(1024);

  async initAudio(constraints: MicConstraints): Promise<MediaStream> {
    this.cleanup();

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    const mediaConstraints: MediaStreamConstraints = {
      audio: {
        deviceId: constraints.deviceId ? { exact: constraints.deviceId } : undefined,
        echoCancellation: constraints.echoCancellation,
        noiseSuppression: constraints.noiseSuppression,
        autoGainControl: constraints.autoGainControl,
        channelCount: constraints.channelCount,
      },
      video: false,
    };

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      throw new Error(
        'Microphone access is blocked by your browser because this page is not served over a Secure Context (HTTPS or localhost). Mobile browsers disable microphone access on plain HTTP over local network IPs (e.g. http://192.168.x.x). Please connect using HTTPS (https://' +
          window.location.host +
          ') or test the deployed production URL.'
      );
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      throw new Error(
        'Your browser does not support or has blocked microphone access (navigator.mediaDevices.getUserMedia is unavailable). Please make sure you are using a modern browser over HTTPS.'
      );
    }

    this.stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

    this.sourceNode = this.ctx.createMediaStreamSource(this.stream);

    // Analyser node for FFT and waveform
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;
    this.sourceNode.connect(this.analyserNode);

    // Direct monitoring (Hear Yourself) gain node -> destination
    this.monitorGainNode = this.ctx.createGain();
    this.monitorGainNode.gain.value = this.isMonitoring ? this.monitorVolume : 0;
    this.sourceNode.connect(this.monitorGainNode);
    this.monitorGainNode.connect(this.ctx.destination);

    this.timeDomainBuffer = new Float32Array(this.analyserNode.fftSize);
    this.frequencyBuffer = new Uint8Array(this.analyserNode.frequencyBinCount);

    return this.stream;
  }

  setMonitoring(enabled: boolean, volume = 0.5) {
    this.isMonitoring = enabled;
    this.monitorVolume = Math.max(0, Math.min(1, volume));
    if (this.monitorGainNode && this.ctx) {
      this.monitorGainNode.gain.setTargetAtTime(
        enabled ? this.monitorVolume : 0,
        this.ctx.currentTime,
        0.05
      );
    }
  }

  getLiveAnalysis(): {
    timeDomain: Float32Array;
    frequency: Uint8Array;
    stats: AudioStats;
    pitch: PitchInfo | null;
  } {
    if (!this.analyserNode || !this.ctx) {
      return {
        timeDomain: this.timeDomainBuffer,
        frequency: this.frequencyBuffer,
        stats: {
          peakDb: -100,
          rmsDb: -100,
          isClipping: false,
          sampleRate: 44100,
          channels: 1,
        },
        pitch: null,
      };
    }

    this.analyserNode.getFloatTimeDomainData(this.timeDomainBuffer);
    this.analyserNode.getByteFrequencyData(this.frequencyBuffer);

    let peak = 0;
    let sumSquares = 0;
    let isClipping = false;
    const len = this.timeDomainBuffer.length;

    for (let i = 0; i < len; i++) {
      const abs = Math.abs(this.timeDomainBuffer[i]);
      if (abs > peak) peak = abs;
      if (abs >= 0.99) isClipping = true;
      sumSquares += abs * abs;
    }

    const rms = Math.sqrt(sumSquares / len);
    const toDb = (v: number) => (v > 0.000001 ? Math.max(-100, 20 * Math.log10(v)) : -100);

    const stats: AudioStats = {
      peakDb: Math.round(toDb(peak) * 10) / 10,
      rmsDb: Math.round(toDb(rms) * 10) / 10,
      isClipping,
      sampleRate: this.ctx.sampleRate,
      channels: this.sourceNode?.channelCount || 1,
    };

    const pitch = detectPitch(this.timeDomainBuffer, this.ctx.sampleRate);

    return {
      timeDomain: this.timeDomainBuffer,
      frequency: this.frequencyBuffer,
      stats,
      pitch,
    };
  }

  startRecording(channels = 1): void {
    if (!this.ctx || !this.sourceNode) return;
    this.isRecording = true;
    this.recordingSampleRate = this.ctx.sampleRate;
    this.recordingChannels = channels;
    this.recordedChunks = Array.from({ length: channels }, () => []);

    // 4096 buffer size processor
    this.processorNode = this.ctx.createScriptProcessor(4096, channels, channels);
    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      for (let c = 0; c < this.recordingChannels; c++) {
        const inputData = e.inputBuffer.getChannelData(c);
        this.recordedChunks[c].push(new Float32Array(inputData));
      }
    };

    this.sourceNode.connect(this.processorNode);
    // In Web Audio, ScriptProcessorNode must be connected to destination to trigger events
    // Connect to a 0-gain node so it doesn't double-play into speakers
    const silentGain = this.ctx.createGain();
    silentGain.gain.value = 0;
    this.processorNode.connect(silentGain);
    silentGain.connect(this.ctx.destination);
  }

  stopRecording(): AudioBuffer | null {
    if (!this.isRecording || !this.ctx) return null;
    this.isRecording = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.recordedChunks.length === 0 || this.recordedChunks[0].length === 0) {
      return null;
    }

    // Calculate total frames
    let totalFrames = 0;
    for (const chunk of this.recordedChunks[0]) {
      totalFrames += chunk.length;
    }

    if (totalFrames === 0) return null;

    const audioBuffer = this.ctx.createBuffer(
      this.recordingChannels,
      totalFrames,
      this.recordingSampleRate
    );

    for (let c = 0; c < this.recordingChannels; c++) {
      const channelData = audioBuffer.getChannelData(c);
      let offset = 0;
      for (const chunk of this.recordedChunks[c]) {
        channelData.set(chunk, offset);
        offset += chunk.length;
      }
    }

    this.recordedChunks = [];
    return audioBuffer;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  async getDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'audioinput');
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioManager = new AudioManager();
