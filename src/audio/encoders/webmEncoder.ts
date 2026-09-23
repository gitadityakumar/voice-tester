import { recordBufferWithMediaRecorder } from './mediaRecorderHelper';

/**
 * On-device WebM/Opus encoder using browser MediaRecorder.
 */
export async function audioBufferToWebm(audioBuffer: AudioBuffer): Promise<Blob> {
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';

  return recordBufferWithMediaRecorder(audioBuffer, mimeType);
}
