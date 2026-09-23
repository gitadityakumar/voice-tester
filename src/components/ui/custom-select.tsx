import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Mic } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface CustomSelectProps {
  id?: string;
  name?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  modalTitle?: string;
  modalSubtitle?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
  modalTitle = 'Select Device',
  modalSubtitle = 'Choose an audio input device',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close dropdown when clicking outside on desktop
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Custom Trigger matching App Theme */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-10 px-3 py-2 text-sm rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer select-none text-left ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-neutral-900 shadow-sm'
            : 'border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-700 shadow-2xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-1 truncate">
          {selectedOption?.icon || <Mic className="h-4 w-4 text-emerald-500 shrink-0" />}
          <span className="truncate font-medium text-neutral-900 dark:text-neutral-100 text-xs sm:text-sm">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 text-neutral-400 ${
            isOpen ? 'rotate-180 text-emerald-500' : ''
          }`}
        />
      </button>

      {/* --- DESKTOP FLOATING DROPDOWN MENU --- */}
      {isOpen && (
        <div className="hidden sm:block absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-3 text-xs text-neutral-400 text-center italic">No devices found</div>
          ) : (
            options.map((opt) => (
              <OptionItem
                key={opt.value}
                option={opt}
                isSelected={opt.value === value || (!value && opt === options[0])}
                onSelect={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              />
            ))
          )}
        </div>
      )}

      {/* --- MOBILE THEME-MATCHED BOTTOM SHEET MODAL --- */}
      {isOpen && (
        <div className="sm:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet Card */}
          <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-8 rounded-t-3xl bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-3 animate-in slide-in-from-bottom-4 duration-200">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-neutral-200/60 dark:border-neutral-800/60">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {modalTitle}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {modalSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Option List */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 py-1">
              {options.length === 0 ? (
                <div className="p-4 text-xs text-neutral-400 text-center italic">
                  No devices detected. Tap "Start Mic" to grant permission.
                </div>
              ) : (
                options.map((opt) => (
                  <OptionItem
                    key={opt.value}
                    isMobile
                    option={opt}
                    isSelected={opt.value === value || (!value && opt === options[0])}
                    onSelect={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface OptionItemProps {
  option: SelectOption;
  isSelected: boolean;
  onSelect: () => void;
  isMobile?: boolean;
}

const OptionItem: React.FC<OptionItemProps> = ({
  option,
  isSelected,
  onSelect,
  isMobile = false,
}) => {
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
          isSelected
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs ring-1 ring-emerald-500/30'
            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          <div
            className={`p-2 rounded-xl transition-colors ${
              isSelected
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {option.icon || <Mic className="h-4 w-4" />}
          </div>
          <div className="truncate">
            <div className="text-sm font-semibold truncate">{option.label}</div>
            {option.description && (
              <div className="text-[11px] text-neutral-400 font-normal truncate">
                {option.description}
              </div>
            )}
          </div>
        </div>

        <div
          className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
            isSelected
              ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
              : 'border-neutral-300 dark:border-neutral-700 bg-transparent'
          }`}
        >
          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-left transition-colors cursor-pointer ${
        isSelected
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80'
      }`}
    >
      <div className="flex items-center gap-2.5 truncate pr-2">
        {option.icon || <Mic className="h-4 w-4 text-emerald-500 shrink-0" />}
        <span className="truncate">{option.label}</span>
      </div>

      {isSelected && <Check className="h-4 w-4 text-emerald-500 shrink-0 stroke-[2.5]" />}
    </button>
  );
};
