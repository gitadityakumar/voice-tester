import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * 100% offline, on-device MP3 encoder.
 * Encodes an AudioBuffer to an audio/mp3 Blob in the browser.
 */
export async function audioBufferToMp3(
  audioBuffer: AudioBuffer,
  kbps = 192
): Promise<Blob> {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;

  const mp3encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];

  // Convert Float32Array [-1.0, 1.0] to Int16Array [-32768, 32767]
  function floatToInt16(source: Float32Array): Int16Array {
    const target = new Int16Array(source.length);
    for (let i = 0; i < source.length; i++) {
      const s = Math.max(-1, Math.min(1, source[i]));
      target[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return target;
  }

  const leftPcm = floatToInt16(audioBuffer.getChannelData(0));
  const rightPcm =
    channels > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : undefined;

  // LAME processes audio in chunks of 1152 samples
  const chunkSize = 1152;
  for (let i = 0; i < numSamples; i += chunkSize) {
    const leftChunk = leftPcm.subarray(i, i + chunkSize);
    let chunkResult: Uint8Array;

    if (channels === 1 || !rightPcm) {
      chunkResult = mp3encoder.encodeBuffer(leftChunk);
    } else {
      const rightChunk = rightPcm.subarray(i, i + chunkSize);
      chunkResult = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    }

    if (chunkResult.length > 0) {
      mp3Data.push(chunkResult);
    }
  }

  // Flush remaining buffer
  const finalChunk = mp3encoder.flush();
  if (finalChunk.length > 0) {
    mp3Data.push(finalChunk);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}
