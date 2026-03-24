"use client";

import { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  width?: string;
  disabled?: boolean;
}

export function FilterSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  icon,
  width = "w-[160px]",
  disabled,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={`inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)] text-xs font-medium bg-white/70 border border-white/90 hover:bg-white/90 backdrop-blur-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 ${width}`}
      >
        {icon && <span className="text-tertiary shrink-0">{icon}</span>}
        <span className="truncate flex-1 text-left">
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className="h-3 w-3 text-tertiary shrink-0" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[200px] p-1 overflow-hidden"
      >
        <div className="max-h-[240px] overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${
                  isSelected
                    ? "bg-brand-indigo/[0.08] font-medium"
                    : "hover:bg-muted/60"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-brand-indigo shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
