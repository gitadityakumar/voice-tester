/**
 * Slices an AudioBuffer between startSeconds and endSeconds.
 * Pure in-memory Web Audio operation, 100% on-device.
 */
export function sliceAudioBuffer(
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;

  const safeStart = Math.max(0, Math.min(startSec, buffer.duration));
  const safeEnd = Math.max(safeStart, Math.min(endSec, buffer.duration));

  const startFrame = Math.floor(safeStart * sampleRate);
  const endFrame = Math.floor(safeEnd * sampleRate);
  const frameCount = Math.max(1, endFrame - startFrame);

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const tempCtx = new AudioContextClass();
  const slicedBuffer = tempCtx.createBuffer(numChannels, frameCount, sampleRate);
  tempCtx.close().catch(() => {});

  for (let c = 0; c < numChannels; c++) {
    const srcData = buffer.getChannelData(c);
    const dstData = slicedBuffer.getChannelData(c);
    const slice = srcData.subarray(startFrame, endFrame);
    dstData.set(slice);
  }

  return slicedBuffer;
}
