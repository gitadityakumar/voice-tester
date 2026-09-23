import { MicQualityReport } from './types';

export function analyzeMicQuality(samples: Float32Array, sampleRate: number): MicQualityReport {
  const length = samples.length;
  if (length === 0) {
    return {
      score: 0,
      rating: 'Poor',
      noiseFloorDb: -100,
      peakDb: -100,
      dynamicRangeDb: 0,
      clippingCount: 0,
      snrDb: 0,
      issues: ['No audio samples recorded'],
      recommendations: ['Check microphone permissions and ensure it is unmuted.'],
    };
  }

  let peakAmplitude = 0;
  let clippingCount = 0;
  const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
  const windowRmsList: number[] = [];

  for (let i = 0; i < length; i += windowSize) {
    const end = Math.min(i + windowSize, length);
    let sumSquares = 0;
    for (let j = i; j < end; j++) {
      const val = Math.abs(samples[j]);
      if (val > peakAmplitude) peakAmplitude = val;
      if (val >= 0.995) clippingCount++;
      sumSquares += val * val;
    }
    const rms = Math.sqrt(sumSquares / (end - i));
    if (rms > 0) windowRmsList.push(rms);
  }

  // Sort window RMS values to estimate noise floor (lowest 15th percentile) and speech peak
  windowRmsList.sort((a, b) => a - b);
  const p15Index = Math.floor(windowRmsList.length * 0.15);
  const noiseFloorRms = windowRmsList[p15Index] || 0.0001;

  const toDb = (val: number) => (val > 0.000001 ? Math.max(-100, 20 * Math.log10(val)) : -100);

  const noiseFloorDb = Math.round(toDb(noiseFloorRms) * 10) / 10;
  const peakDb = Math.round(toDb(peakAmplitude) * 10) / 10;
  const dynamicRangeDb = Math.max(0, Math.round((peakDb - noiseFloorDb) * 10) / 10);
  const snrDb = dynamicRangeDb;

  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // 1. Check for Clipping
  if (clippingCount > 5) {
    score -= 35;
    issues.push(`Clipping detected (${clippingCount} clipped samples)`);
    recommendations.push(
      'Lower your microphone input gain in system settings or back away slightly to avoid digital distortion.',
    );
  }

  // 2. Check for Low Volume
  if (peakDb < -22) {
    score -= 25;
    issues.push(`Signal is too quiet (Peak: ${peakDb} dBFS)`);
    recommendations.push(
      'Increase microphone input volume in OS settings or speak closer to the microphone (around 4-6 inches).',
    );
  }

  // 3. Check Noise Floor
  if (noiseFloorDb > -35) {
    score -= 30;
    issues.push(`High background noise floor (${noiseFloorDb} dBFS)`);
    recommendations.push(
      'Enable browser Noise Suppression in the settings panel or isolate yourself from room fans, AC, or PC noise.',
    );
  } else if (noiseFloorDb > -45) {
    score -= 10;
    issues.push(`Moderate ambient noise (${noiseFloorDb} dBFS)`);
    recommendations.push('Consider enabling Noise Suppression toggle if in a lively room.');
  }

  // 4. Check dynamic range
  if (dynamicRangeDb < 15 && peakDb > -30) {
    score -= 15;
    issues.push('Low dynamic range (compressed or flat signal)');
    recommendations.push(
      'Turn off automatic gain control (AGC) if you want natural vocal dynamics.',
    );
  }

  score = Math.max(0, Math.min(100, score));

  let rating: MicQualityReport['rating'] = 'Poor';
  if (score >= 85) rating = 'Excellent';
  else if (score >= 70) rating = 'Good';
  else if (score >= 50) rating = 'Fair';

  if (issues.length === 0) {
    recommendations.push('Your microphone sounds crisp, balanced, and studio-ready!');
  }

  return {
    score,
    rating,
    noiseFloorDb,
    peakDb,
    dynamicRangeDb,
    clippingCount,
    snrDb,
    issues,
    recommendations,
  };
}
