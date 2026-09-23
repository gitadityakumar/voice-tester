# VoiceTester — 100% Offline On-Device Microphone & Voice Diagnostic Suite

A modern, minimalist, completely offline web application for testing microphones and voices. **Zero bytes of audio data are ever transmitted to any server.** All audio processing, visualization, recording, encoding, and downloads occur strictly on your device inside browser RAM.

---

## Key Features

- **100% On-Device & Zero Cloud Processing**:
  - Operates purely through the HTML5 Web Audio API in client-side RAM.
  - Zero server telemetry, zero analytics, zero external API calls.
  - Built-in live **Network Privacy Auditor** intercepting and proving `0 bytes sent`.
- **Microphone Hardware Controls**:
  - Live device selector (`navigator.mediaDevices.enumerateDevices`).
  - Toggle browser DSP filters: **Echo Cancellation**, **Noise Suppression**, **Auto Gain Control**.
  - Mono (1-channel) vs Stereo (2-channel) input selector.
  - **Direct Monitoring ("Hear Yourself")**: Ultra-low-latency real-time microphone pass-through with volume slider and acoustic feedback protection.
- **Real-Time Visualizers**:
  - **Oscilloscope**: Silky 60fps time-domain audio waveform canvas.
  - **FFT Spectrum Analyzer**: Frequency distribution bars across Sub-bass, Bass, Midrange, Presence, and Brilliance.
  - **High-Precision VU Meter**: Peak and RMS dBFS meter with peak-hold and digital clipping warning.
  - **Vocal Pitch Detector ($F_0$)**: Autocorrelation pitch detector showing frequency in Hz (e.g. 130.8 Hz) and nearest musical note (e.g. C3) with cents tuning.
- **5-Second Guided Acoustic Benchmark**:
  - Automated 2-phase diagnostic:
    - Phase 1 (2s): Ambient room noise floor test (detects fan hum, AC noise).
    - Phase 2 (3s): Vocal clarity, speech headroom, dynamic range, and digital clipping check.
  - Quality score (0 - 100) with rating and actionable calibration tips.
- **Multi-Format Recording & Instant Playback**:
  - Interactive scrubbing waveform canvas with playhead seek, loop mode, and playback speed toggles (0.75x, 1x, 1.25x, 1.5x).
  - Multi-format local export:
    - **MP3**: High quality client-side encoding via `@breezystack/lamejs` (128k, 192k, 320k).
    - **M4A / AAC**: Encoded locally with WebCodecs `AudioEncoder` + `mp4-muxer`.
    - **WAV**: 16-bit uncompressed studio PCM RIFF WAV.
    - **WebM**: Native Opus high-efficiency web audio.
  - One-click local file download via Blob URLs (no backend involved).
- **Progressive Web App (PWA) & Offline Ready**:
  - Configured Service Worker (`public/sw.js`) and Web Manifest (`public/manifest.webmanifest`). Once loaded, the app works completely without an internet connection.

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS (Minimalist Dark / Light mode following modern web guidance with `color-scheme` and system preference detection)
- **UI Components**: shadcn / Base UI style accessible primitives (`@radix-ui/react-*`, `@base-ui-components/react`, `clsx`, `tailwind-merge`, `class-variance-authority`)
- **Icons**: Lucide Icons
- **Audio Encoders**:
  - Pure TypeScript RIFF WAV 16-bit PCM Encoder
  - `@breezystack/lamejs` (Pure client-side MP3)
  - `mp4-muxer` + WebCodecs (Pure client-side M4A/AAC)
- **Package Security**:
  - All installed packages are mature, verified on the npm registry, and audited (`pnpm audit` reports 0 vulnerabilities).

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Local Development

```bash
# Install dependencies
pnpm install

# Start Vite local development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build Production Bundle

```bash
pnpm build
```

This compiles optimized, type-checked static files into the `dist/` directory.

---

## Deployment to Cloudflare Pages

This application is 100% static, making it natively compatible with Cloudflare Pages and the Cloudflare ecosystem:

### Option 1: Git Integration (Zero-Config)

1. Push this repository to GitHub or GitLab.
2. In the Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Set build configuration:
   - **Framework preset**: `Vite`
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
4. Deploy!

### Option 2: Wrangler CLI

```bash
# Build the project
pnpm build

# Deploy directly to Cloudflare Pages
npx wrangler pages deploy dist --project-name=online-voice-tester
```

### Security & Privacy Headers

The included `public/_headers` file applies security headers on Cloudflare Pages:

- `Permissions-Policy: microphone=(self), camera=(), geolocation=()` (Restricts microphone access strictly to your own origin)
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; media-src 'self' blob:; worker-src 'self' blob:; connect-src 'self'` (Prevents audio exfiltration)

---

## Privacy Architecture Summary

| Step                     | Location         | Mechanism                             |
| ------------------------ | ---------------- | ------------------------------------- |
| Microphone Capture       | Local Device     | `navigator.mediaDevices.getUserMedia` |
| Real-Time Visualization  | Local Device     | `AudioContext` & `AnalyserNode`       |
| Pitch & Level Detection  | Local Device     | Autocorrelation in Web Audio          |
| Recording Storage        | Client Memory    | In-memory `Float32Array` buffers      |
| MP3 / M4A / WAV Encoding | Client CPU       | Client-side JS / WebCodecs            |
| Download                 | Local Filesystem | Browser `URL.createObjectURL(blob)`   |
| Server Transmission      | **None**         | **0 bytes sent**                      |
