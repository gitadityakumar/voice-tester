import { PitchInfo } from './types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function detectPitch(buffer: Float32Array, sampleRate: number): PitchInfo | null {
  const bufferSize = buffer.length;

  // 1. Check signal level (RMS)
  let sumSq = 0;
  for (let i = 0; i < bufferSize; i++) {
    sumSq += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSq / bufferSize);
  if (rms < 0.015) {
    return null; // Signal is too quiet
  }

  // 2. Autocorrelation within human vocal range (50 Hz - 1000 Hz)
  const minPeriod = Math.floor(sampleRate / 1000);
  const maxPeriod = Math.floor(sampleRate / 50);

  const correlations = new Float32Array(maxPeriod + 1);
  let globalMax = 0;

  for (let period = minPeriod; period <= maxPeriod && period < bufferSize; period++) {
    let correlation = 0;
    for (let i = 0; i < bufferSize - period; i++) {
      correlation += buffer[i] * buffer[i + period];
    }
    const norm = correlation / (bufferSize - period);
    correlations[period] = norm;
    if (norm > globalMax) {
      globalMax = norm;
    }
  }

  if (globalMax < 0.01) {
    return null;
  }

  // 3. Find the FIRST prominent peak above threshold to prevent subharmonic octave jumps
  const threshold = globalMax * 0.85;
  let bestPeriod = -1;

  for (let period = minPeriod + 1; period < maxPeriod; period++) {
    // Check if it's a local maximum and exceeds threshold
    if (
      correlations[period] > correlations[period - 1] &&
      correlations[period] >= correlations[period + 1] &&
      correlations[period] >= threshold
    ) {
      bestPeriod = period;
      break;
    }
  }

  // Fallback to highest correlation if no prominent local peak was isolated
  if (bestPeriod === -1) {
    let highest = 0;
    for (let period = minPeriod; period <= maxPeriod; period++) {
      if (correlations[period] > highest) {
        highest = correlations[period];
        bestPeriod = period;
      }
    }
  }

  if (bestPeriod <= minPeriod || bestPeriod >= maxPeriod) {
    return null;
  }

  // 4. Parabolic interpolation for sub-sample accuracy
  let refinedPeriod = bestPeriod;
  const cPrev = correlations[bestPeriod - 1];
  const cCurr = correlations[bestPeriod];
  const cNext = correlations[bestPeriod + 1];

  const denominator = 2 * (2 * cCurr - cPrev - cNext);
  if (denominator !== 0) {
    const delta = (cNext - cPrev) / denominator;
    if (Math.abs(delta) < 1) {
      refinedPeriod += delta;
    }
  }

  const frequency = sampleRate / refinedPeriod;
  if (frequency < 50 || frequency > 1200) {
    return null;
  }

  // 5. Calculate musical note from frequency (A4 = 440Hz, MIDI 69)
  const midiNoteFloat = 12 * Math.log2(frequency / 440) + 69;
  const midiNote = Math.round(midiNoteFloat);
  const cents = Math.round((midiNoteFloat - midiNote) * 100);

  const noteIndex = ((midiNote % 12) + 12) % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  const note = NOTE_NAMES[noteIndex];

  return {
    frequency: Math.round(frequency * 10) / 10,
    note,
    octave,
    cents,
    clarity: Math.min(1, globalMax / (rms * rms || 1)),
  };
}
