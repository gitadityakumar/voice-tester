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
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const dest = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(dest);

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(dest.stream, { mimeType });
    } catch (err) {
      ctx.close().catch(() => {});
      return reject(err);
    }

    const chunks: Blob[] = [];
    let isFinished = false;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const finish = () => {
      if (isFinished) return;
      isFinished = true;
      try {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      } catch {
        // ignore state error on stop
      }
      try {
        source.stop();
      } catch {
        // ignore state error on stop
      }
      ctx.close().catch(() => {});
    };

    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: mimeType });
      if (finalBlob.size > 0) {
        resolve(finalBlob);
      } else {
        reject(new Error('MediaRecorder produced empty audio output'));
      }
    };

    recorder.onerror = (e) => {
      finish();
      reject(e);
    };

    source.onended = () => {
      // Allow a brief buffer for final encoded frame
      setTimeout(finish, 60);
    };

    recorder.start(100); // 100ms timeslices so dataavailable fires regularly
    source.start(0);

    // Fallback safety timeout if source.onended never fires
    setTimeout(finish, buffer.duration * 1000 + 800);
  });
}
