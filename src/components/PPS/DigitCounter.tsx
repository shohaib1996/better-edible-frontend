"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DigitCounterProps {
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

function getDigits(value: number, numDigits: number): number[] {
  const digits: number[] = [];
  const v = Math.max(0, value);
  for (let i = numDigits - 1; i >= 0; i--) {
    const place = Math.pow(10, i);
    digits.push(Math.floor(v / place) % 10);
  }
  return digits;
}

function numDigitsNeeded(value: number): number {
  if (value < 100) return 3;
  const digits = Math.floor(Math.log10(Math.max(1, value))) + 1;
  return Math.max(3, digits);
}

export default function DigitCounter({ value, onChange, compact }: DigitCounterProps) {
  const numDigits = numDigitsNeeded(value + 99); // ensure room for increment
  const digits = getDigits(value, numDigits);

  const increment = (place: number) => {
    onChange(Math.max(0, value + place));
  };

  const decrement = (place: number) => {
    onChange(Math.max(0, value - place));
  };

  const btnSize = compact ? "w-12 h-12" : "w-20 h-20";
  const iconSize = compact ? "w-6 h-6" : "w-10 h-10";
  const digitSize = compact ? "text-4xl" : "text-7xl";
  const labelSize = compact ? "text-xs" : "text-sm";
  const placeLabels = ["Thousands", "Hundreds", "Tens", "Units"];

  return (
    <div className="flex items-center justify-center gap-1">
      {digits.map((digit, i) => {
        const place = Math.pow(10, numDigits - 1 - i);
        const label = placeLabels[placeLabels.length - numDigits + i] ?? `×${place}`;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <Button
              variant="outline"
              className={`${btnSize} rounded-xs`}
              onClick={() => increment(place)}
            >
              <ChevronUp className={iconSize} />
            </Button>
            <div className={`${digitSize} font-bold tabular-nums select-none w-[1.1ch] text-center`}>
              {digit}
            </div>
            <Button
              variant="outline"
              className={`${btnSize} rounded-xs`}
              onClick={() => decrement(place)}
            >
              <ChevronDown className={iconSize} />
            </Button>
            <p className={`${labelSize} text-muted-foreground uppercase tracking-wide`}>{label}</p>
          </div>
        );
      })}
    </div>
  );
}
