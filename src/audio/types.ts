export type AudioFormat = 'wav' | 'mp3' | 'm4a' | 'webm';

export interface MicConstraints {
  deviceId: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  channelCount: 1 | 2;
}

export interface AudioStats {
  peakDb: number;
  rmsDb: number;
  isClipping: boolean;
  sampleRate: number;
  channels: number;
}

export interface PitchInfo {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  clarity: number;
}

export interface MicQualityReport {
  score: number; // 0 - 100
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  noiseFloorDb: number;
  peakDb: number;
  dynamicRangeDb: number;
  clippingCount: number;
  snrDb: number;
  issues: string[];
  recommendations: string[];
}

export interface ExportedAudio {
  blob: Blob;
  format: AudioFormat;
  mimeType: string;
  filename: string;
  sizeBytes: number;
  durationSeconds: number;
}
