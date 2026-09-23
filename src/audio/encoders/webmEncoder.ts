/**
 * On-device WebM/Opus encoder using browser MediaRecorder.
 */
export async function audioBufferToWebm(audioBuffer: AudioBuffer): Promise<Blob> {
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';

  return new Promise((resolve, reject) => {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const dest = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(dest);

    const recorder = new MediaRecorder(dest.stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      ctx.close();
      resolve(new Blob(chunks, { type: mimeType }));
    };

    recorder.onerror = (e) => {
      ctx.close();
      reject(e);
    };

    recorder.start();
    source.start(0);

    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
        source.stop();
      }
    }, audioBuffer.duration * 1000 + 150);
  });
}
