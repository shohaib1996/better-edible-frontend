"use client";

import { useState } from "react";
import { Check, Pipette } from "lucide-react";
import { GUMMY_COLORS } from "@/lib/gummyBuilderConfig";

const SOURCE_HUE = 55;

function hexToHueRotation(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r)      h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else                h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return ((h - SOURCE_HUE) % 360 + 360) % 360;
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

interface Props {
  hue: number;
  onHueChange: (hue: number) => void;
}

export function GummyColorPicker({ hue, onHueChange }: Props) {
  const [customHex, setCustomHex] = useState("#FF9500");
  const isPreset = GUMMY_COLORS.some((c) => c.hue === hue);

  function handleCustomHex(hex: string) {
    setCustomHex(hex);
    onHueChange(hexToHueRotation(hex));
  }

  function handleHexInput(raw: string) {
    setCustomHex(raw);
    if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
      onHueChange(hexToHueRotation(raw));
    }
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 text-center">Color</p>

      <div className="grid grid-cols-2 gap-2 mt-1">
        {GUMMY_COLORS.map((color) => {
          const active = isPreset && hue === color.hue;
          return (
            <button
              key={color.hue}
              type="button"
              title={color.label}
              onClick={() => onHueChange(color.hue)}
              className="relative w-7 h-7 rounded-full border-2 transition-all hover:scale-110 focus:outline-none"
              style={{
                backgroundColor: color.swatch,
                borderColor: active ? "hsl(var(--foreground))" : "transparent",
                boxShadow: active
                  ? "0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--foreground))"
                  : "0 1px 3px rgba(0,0,0,0.25)",
              }}
            >
              {active && (
                <Check
                  className="absolute inset-0 m-auto w-3 h-3"
                  style={{ color: isLight(color.swatch) ? "#000" : "#fff" }}
                />
              )}
              <span className="sr-only">{color.label}</span>
            </button>
          );
        })}

        {/* Custom color — rainbow swatch opens native picker */}
        <label
          title="Custom color"
          className={`relative w-7 h-7 rounded-full border-2 transition-all hover:scale-110 cursor-pointer flex items-center justify-center overflow-hidden ${
            !isPreset
              ? "border-foreground shadow-[0_0_0_2px_hsl(var(--background)),0_0_0_4px_hsl(var(--foreground))]"
              : "border-transparent shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
          }`}
          style={{
            background: !isPreset
              ? customHex
              : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
          }}
        >
          {isPreset && <Pipette className="w-3 h-3 text-white drop-shadow" />}
          <input
            type="color"
            value={customHex}
            onChange={(e) => handleCustomHex(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>

      {/* Label / hex input */}
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs text-muted-foreground">
          {isPreset ? GUMMY_COLORS.find((c) => c.hue === hue)?.label : "Custom"}
        </span>
        {!isPreset && (
          <input
            type="text"
            value={customHex}
            onChange={(e) => handleHexInput(e.target.value)}
            maxLength={7}
            className="h-6 w-20 rounded-xs border border-border bg-background px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="#rrggbb"
          />
        )}
      </div>
    </div>
  );
}
