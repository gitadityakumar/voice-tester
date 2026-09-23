import { AudioFormat, ExportedAudio } from '../types';
import { audioBufferToWav } from './wavEncoder';
import { audioBufferToMp3 } from './mp3Encoder';
import { audioBufferToM4a } from './m4aEncoder';
import { audioBufferToWebm } from './webmEncoder';

export async function exportAudio(
  audioBuffer: AudioBuffer,
  format: AudioFormat,
  bitrateKbps = 192
): Promise<ExportedAudio> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  let blob: Blob;
  let filename = `mic-test-${timestamp}.${format}`;
  let mimeType = 'audio/wav';

  switch (format) {
    case 'wav':
      blob = audioBufferToWav(audioBuffer);
      mimeType = 'audio/wav';
      break;
    case 'mp3':
      blob = await audioBufferToMp3(audioBuffer, bitrateKbps);
      mimeType = 'audio/mp3';
      break;
    case 'm4a':
      blob = await audioBufferToM4a(audioBuffer, bitrateKbps * 1000);
      mimeType = 'audio/mp4';
      break;
    case 'webm':
      blob = await audioBufferToWebm(audioBuffer);
      mimeType = 'audio/webm';
      break;
    default:
      blob = audioBufferToWav(audioBuffer);
      mimeType = 'audio/wav';
  }

  return {
    blob,
    format,
    mimeType,
    filename,
    sizeBytes: blob.size,
    durationSeconds: audioBuffer.duration,
  };
}
