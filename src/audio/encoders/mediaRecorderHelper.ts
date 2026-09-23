/**
 * Shared helper for encoding AudioBuffer into audio blobs via browser MediaRecorder.
 */
export function recordBufferWithMediaRecorder(
  buffer: AudioBuffer,
  mimeType: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const dest = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
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

    setTimeout(
      () => {
        if (recorder.state === 'recording') {
          recorder.stop();
          source.stop();
        }
      },
      buffer.duration * 1000 + 150,
    );
  });
}
