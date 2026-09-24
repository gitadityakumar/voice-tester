import * as React from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import { cn } from '@/lib/utils';

export interface SliderProps {
  className?: string;
  value?: number[] | number;
  defaultValue?: number[] | number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onValueChange?: (value: number[]) => void;
  'aria-label'?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      onValueChange,
      'aria-label': ariaLabel = 'Slider',
    },
    ref,
  ) => {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
      setMounted(true);
    }, []);

    const numericValue = Array.isArray(value) ? value[0] : (value ?? 50);
    const defaultNumericValue = Array.isArray(defaultValue) ? defaultValue[0] : defaultValue;

    if (!mounted) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative flex w-full touch-none select-none items-center py-2 cursor-pointer',
            className,
          )}
        >
          <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div
              className="absolute h-full bg-emerald-500 rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, ((numericValue - min) / (max - min)) * 100))}%`,
              }}
            />
          </div>
          <div
            aria-label={ariaLabel}
            aria-valuenow={numericValue}
            aria-valuemin={min}
            aria-valuemax={max}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            className="block h-4 w-4 rounded-full border-2 border-emerald-500 bg-white shadow transition-colors cursor-grab"
          />
        </div>
      );
    }

    return (
      <BaseSlider.Root
        ref={ref}
        value={numericValue}
        defaultValue={defaultNumericValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        thumbAlignment="edge-client-only"
        onValueChange={(val) => {
          const num = typeof val === 'number' ? val : (val as readonly number[])[0];
          onValueChange?.([num]);
        }}
        className={cn('relative flex w-full touch-none select-none items-center', className)}
      >
        <BaseSlider.Control className="relative flex w-full touch-none select-none items-center py-2 cursor-pointer">
          <BaseSlider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <BaseSlider.Indicator className="absolute h-full bg-emerald-500 rounded-full" />
          </BaseSlider.Track>
          <BaseSlider.Thumb
            aria-label={ariaLabel}
            className="block h-4 w-4 rounded-full border-2 border-emerald-500 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
          />
        </BaseSlider.Control>
      </BaseSlider.Root>
    );
  },
);
Slider.displayName = 'Slider';

export { Slider };
