import React from 'react';

interface FeatureItem {
  title: string;
  accent: 'amber' | 'rose' | 'sky';
  description: string;
}

const features: FeatureItem[] = [
  {
    title: 'Online Voice Recorder',
    accent: 'amber',
    description:
      'Our Voice Recorder is a convenient and simple online tool that can be used right in your browser. It allows you to record your voice using a microphone and save it as an MP3, M4A, WAV, or WebM file.',
  },
  {
    title: 'Free to use',
    accent: 'rose',
    description:
      'Voice Recorder is completely free. No hidden payments, activation fees, subscriptions, or charges for extra features.',
  },
  {
    title: 'Microphone settings',
    accent: 'sky',
    description:
      'You can adjust your microphone settings using real-time DSP tools (decreasing echo, noise cancellation, auto gain leveling, and hear-yourself direct monitoring).',
  },
  {
    title: 'Privacy guaranteed',
    accent: 'amber',
    description:
      'We guarantee that our app is secure. Everything you record is accessible to you alone: 100% on-device processing and nothing is uploaded to any servers for storage.',
  },
  {
    title: 'Cut your recording',
    accent: 'rose',
    description:
      'After the recording is complete, you can crop it to the section you actually need and slide the selection window anywhere across your audio clip.',
  },
  {
    title: 'Auto silence & acoustic benchmark',
    accent: 'sky',
    description:
      'Voice Recorder automatically detects audio levels and silent fragments, complete with automated 5-second acoustic health benchmarks for SNR, noise floor, and vocal distortion.',
  },
];

const accentColors: Record<FeatureItem['accent'], string> = {
  amber: 'from-amber-400 to-amber-200 dark:from-amber-400 dark:to-amber-500/20',
  rose: 'from-rose-400 to-rose-200 dark:from-rose-400 dark:to-rose-500/20',
  sky: 'from-sky-400 to-sky-200 dark:from-sky-400 dark:to-sky-500/20',
};

export const FeaturesSection: React.FC = () => {
  return (
    <section className="pt-8 pb-10 border-t border-neutral-200/80 dark:border-neutral-800/80">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 sm:gap-y-10">
        {features.map((feature, idx) => (
          <div key={idx} className="flex flex-col">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {feature.title}
            </h3>
            <div
              className={`h-0.5 w-12 rounded-full mt-2 mb-3 bg-gradient-to-r ${accentColors[feature.accent]}`}
            />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
