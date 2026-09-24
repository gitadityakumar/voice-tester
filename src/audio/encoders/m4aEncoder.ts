import * as Mp4Muxer from 'mp4-muxer';
import { audioBufferToWav } from './wavEncoder';
import { recordBufferWithMediaRecorder } from './mediaRecorderHelper';

/**
 * 100% offline, on-device M4A (AAC) encoder.
 * Utilizes WebCodecs AudioEncoder + mp4-muxer for high quality AAC in an M4A container.
 */
export async function audioBufferToM4a(audioBuffer: AudioBuffer, bitrate = 192000): Promise<Blob> {
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;

  // Check WebCodecs AudioEncoder availability
  if (typeof window !== 'undefined' && 'AudioEncoder' in window && 'AudioData' in window) {
    try {
      const isSupported = await AudioEncoder.isConfigSupported({
        codec: 'mp4a.40.2',
        sampleRate,
        numberOfChannels,
        bitrate,
      });

      if (isSupported.supported) {
        const muxer = new Mp4Muxer.Muxer({
          target: new Mp4Muxer.ArrayBufferTarget(),
          audio: {
            codec: 'aac',
            sampleRate,
            numberOfChannels,
          },
          fastStart: 'in-memory',
        });

        let encoderError: Error | null = null;
        const encoder = new AudioEncoder({
          output: (chunk, meta) => {
            muxer.addAudioChunk(chunk, meta);
          },
          error: (e) => {
            encoderError = e;
          },
        });

        encoder.configure({
          codec: 'mp4a.40.2',
          sampleRate,
          numberOfChannels,
          bitrate,
        });

        // Feed AudioData in chunks (e.g. 1024 or 2048 frames per block)
        const frameChunkSize = 2048;
        let currentOffset = 0;

        // Planar float32: channel 0 data, followed by channel 1 data
        const planarData = new Float32Array(length * numberOfChannels);
        for (let c = 0; c < numberOfChannels; c++) {
          planarData.set(audioBuffer.getChannelData(c), c * length);
        }

        while (currentOffset < length) {
          if (encoderError) throw encoderError;

          const framesInChunk = Math.min(frameChunkSize, length - currentOffset);
          const chunkPlanar = new Float32Array(framesInChunk * numberOfChannels);

          for (let c = 0; c < numberOfChannels; c++) {
            const channelSource = audioBuffer.getChannelData(c);
            chunkPlanar.set(
              channelSource.subarray(currentOffset, currentOffset + framesInChunk),
              c * framesInChunk,
            );
          }

          const timestamp = Math.round((currentOffset / sampleRate) * 1_000_000); // microseconds

          const audioData = new AudioData({
            format: 'f32-planar',
            sampleRate,
            numberOfFrames: framesInChunk,
            numberOfChannels,
            timestamp,
            data: chunkPlanar,
          });

          encoder.encode(audioData);
          audioData.close();

          currentOffset += framesInChunk;
        }

        await encoder.flush();
        encoder.close();
        muxer.finalize();

        const buffer = muxer.target.buffer;
        return new Blob([buffer], { type: 'audio/mp4' });
      }
    } catch (err) {
      console.warn('WebCodecs AAC encoding failed, falling back:', err);
    }
  }

  // Fallback: If WebCodecs AAC is unsupported on current browser platform,
  // we fallback to MediaRecorder if audio/mp4 is supported, or synthesize audio
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')) {
    try {
      const blob = await recordBufferWithMediaRecorder(audioBuffer, 'audio/mp4');
      if (blob && blob.size > 0) {
        return blob;
      }
    } catch (err) {
      console.warn('MediaRecorder audio/mp4 encoding failed, falling back to WAV:', err);
    }
  }

  // If neither WebCodecs nor MP4 MediaRecorder is available (e.g. Firefox desktop without AAC recorder),
  // fallback to WAV format with m4a naming or inform user
  return audioBufferToWav(audioBuffer);
}
