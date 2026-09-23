import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CustomSelect, SelectOption } from './ui/custom-select';
import { MicConstraints } from '@/audio/types';
import { Mic, Sliders, Volume2, VolumeX, RefreshCw, Headphones, AlertCircle } from 'lucide-react';

interface DeviceSelectorProps {
  devices: MediaDeviceInfo[];
  constraints: MicConstraints;
  onConstraintsChange: (constraints: MicConstraints) => void;
  onRefreshDevices: () => void;
  isMonitoring: boolean;
  monitorVolume: number;
  onToggleMonitoring: (enabled: boolean) => void;
  onMonitorVolumeChange: (volume: number) => void;
  isActive: boolean;
  onStartMic: () => void;
  onStopMic: () => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  constraints,
  onConstraintsChange,
  onRefreshDevices,
  isMonitoring,
  monitorVolume,
  onToggleMonitoring,
  onMonitorVolumeChange,
  isActive,
  onStartMic,
  onStopMic,
}) => {
  const [showHeadphoneTip, setShowHeadphoneTip] = useState(false);

  const handleDeviceSelect = (deviceId: string) => {
    onConstraintsChange({ ...constraints, deviceId });
  };

  const handleToggleConstraint = (key: keyof Omit<MicConstraints, 'deviceId' | 'channelCount'>) => {
    onConstraintsChange({ ...constraints, [key]: !constraints[key] });
  };

  const handleChannelToggle = (channels: 1 | 2) => {
    onConstraintsChange({ ...constraints, channelCount: channels });
  };

  const handleMonitoringClick = (checked: boolean) => {
    if (checked) {
      setShowHeadphoneTip(true);
    }
    onToggleMonitoring(checked);
  };

  const getDeviceIcon = (label: string) => {
    const l = label.toLowerCase();
    if (
      l.includes('headset') ||
      l.includes('earpiece') ||
      l.includes('airpods') ||
      l.includes('buds') ||
      l.includes('bluetooth')
    ) {
      return <Headphones className="h-4 w-4 text-emerald-500 shrink-0" />;
    }
    if (l.includes('speaker') || l.includes('speakerphone')) {
      return <Volume2 className="h-4 w-4 text-cyan-500 shrink-0" />;
    }
    return <Mic className="h-4 w-4 text-emerald-500 shrink-0" />;
  };

  const deviceOptions: SelectOption[] =
    devices.length === 0
      ? [
          {
            value: '',
            label: 'Default Microphone (Click "Start Mic" to grant access)',
            icon: <Mic className="h-4 w-4 text-emerald-500 shrink-0" />,
            description: 'System default audio input',
          },
        ]
      : devices.map((device, idx) => ({
          value: device.deviceId,
          label: device.label || `Microphone ${idx + 1}`,
          icon: getDeviceIcon(device.label || ''),
          description: device.deviceId ? `Audio input channel ${idx + 1}` : 'Default input',
        }));

  return (
    <Card className="border-neutral-200/80 dark:border-neutral-800/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base font-semibold">Microphone & Audio Hardware</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isActive ? (
              <Badge variant="default" className="gap-1 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live Input Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                Standby
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Device Selection & Activation */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <CustomSelect
              id="microphone-select"
              name="microphone"
              options={deviceOptions}
              value={constraints.deviceId}
              onChange={handleDeviceSelect}
              placeholder="Select Microphone Device"
              modalTitle="Audio Input Device"
              modalSubtitle="Choose your microphone or headset"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onRefreshDevices}
              title="Refresh microphone device list"
              aria-label="Refresh microphone device list"
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {isActive ? (
              <Button
                variant="destructive"
                onClick={onStopMic}
                className="shrink-0 text-sm font-semibold"
              >
                Stop Mic
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={onStartMic}
                className="shrink-0 text-sm font-semibold"
              >
                <Mic className="h-4 w-4 mr-1" />
                Start Mic
              </Button>
            )}
          </div>
        </div>

        {/* Real-time DSP Constraints */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Echo Cancellation */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/50 dark:bg-neutral-900/40">
            <div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Echo Cancel
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Acoustic echo filter
              </div>
            </div>
            <Switch
              aria-label="Toggle acoustic echo cancellation"
              checked={constraints.echoCancellation}
              onCheckedChange={() => handleToggleConstraint('echoCancellation')}
            />
          </div>

          {/* Noise Suppression */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/50 dark:bg-neutral-900/40">
            <div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Noise Suppress
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Reduce room hum
              </div>
            </div>
            <Switch
              aria-label="Toggle background noise suppression"
              checked={constraints.noiseSuppression}
              onCheckedChange={() => handleToggleConstraint('noiseSuppression')}
            />
          </div>

          {/* Auto Gain Control */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/50 dark:bg-neutral-900/40">
            <div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Auto Gain
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Dynamic leveling
              </div>
            </div>
            <Switch
              aria-label="Toggle dynamic auto gain control"
              checked={constraints.autoGainControl}
              onCheckedChange={() => handleToggleConstraint('autoGainControl')}
            />
          </div>

          {/* Channels (Mono / Stereo) */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/50 dark:bg-neutral-900/40">
            <div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Channels
              </div>
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {constraints.channelCount === 1 ? '1ch Mono' : '2ch Stereo'}
              </div>
            </div>
            <div
              className="flex rounded-lg bg-neutral-200 dark:bg-neutral-800 p-0.5 text-xs font-medium"
              role="group"
              aria-label="Audio Channels"
            >
              <button
                type="button"
                aria-label="1 Channel Mono"
                onClick={() => handleChannelToggle(1)}
                className={`h-7 min-w-[28px] px-2.5 py-1 rounded-md transition-all text-xs font-semibold flex items-center justify-center ${
                  constraints.channelCount === 1
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                1
              </button>
              <button
                type="button"
                aria-label="2 Channel Stereo"
                onClick={() => handleChannelToggle(2)}
                className={`h-7 min-w-[28px] px-2.5 py-1 rounded-md transition-all text-xs font-semibold flex items-center justify-center ${
                  constraints.channelCount === 2
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                2
              </button>
            </div>
          </div>
        </div>

        {/* Direct Monitoring ("Hear Yourself") Section */}
        <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-emerald-500" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Hear Yourself (Direct Monitoring)
                </span>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Listen to your live microphone input with ultra-low latency
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 flex-1 sm:w-44">
                {monitorVolume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                )}
                <Slider
                  aria-label="Direct monitoring volume"
                  disabled={!isMonitoring}
                  value={[monitorVolume * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => onMonitorVolumeChange(val[0] / 100)}
                  className="w-full"
                />
                <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300 w-8 text-right font-medium">
                  {Math.round(monitorVolume * 100)}%
                </span>
              </div>

              <Switch
                aria-label="Toggle direct audio monitoring"
                checked={isMonitoring}
                onCheckedChange={handleMonitoringClick}
                disabled={!isActive}
              />
            </div>
          </div>

          {showHeadphoneTip && isMonitoring && (
            <div className="mt-2.5 flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Headphone Warning:</strong> Please wear headphones while Direct Monitoring
                is active to prevent high-pitched acoustic feedback loops through your speakers.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
