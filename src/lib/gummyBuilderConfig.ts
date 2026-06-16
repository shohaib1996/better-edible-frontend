import type {
  GummySize,
  GummyOilType,
  GummyEffect,
  CannabinoidName,
} from "@/types/privateLabel/gummyBuilder";

export type OptionBtn<T> = { value: T; label: string; sub?: string };

export type QueuedGummy = {
  id: string;
  flavorName: string;
  selectedFlavors: string[];
  size: GummySize;
  oilType: GummyOilType;
  effect: GummyEffect;
  cannabinoids: { name: CannabinoidName; mg: number }[];
  unitsOrdered: number;
  grandTotal: number;
  gummyHue: number;
  gummyColorHex?: string;
  gummyColorName?: string;
};

export type GummyColor = { label: string; hue: number; swatch: string };

// Hue rotations are relative to the yellow source image (source hue ≈ 55°).
// Formula: rotation = (targetHue - 55 + 360) % 360
export const GUMMY_COLORS: GummyColor[] = [
  { label: "Lemon",       hue: 0,   swatch: "#FFE44D" }, // 0° — no rotation, stays yellow
  { label: "Orange",      hue: 335, swatch: "#FF9500" }, // orange ≈ 30° → 30-55 = -25 → 335°
  { label: "Strawberry",  hue: 305, swatch: "#FF4D4D" }, // red ≈ 0° → 0-55 = -55 → 305°
  { label: "Watermelon",  hue: 285, swatch: "#FF69B4" }, // hot pink ≈ 340° → 340-55 = 285°
  { label: "Grape",       hue: 215, swatch: "#9B59B6" }, // purple ≈ 270° → 270-55 = 215°
  { label: "Blueberry",   hue: 165, swatch: "#4A90E2" }, // blue ≈ 220° → 220-55 = 165°
  { label: "Green Apple", hue: 65,  swatch: "#7ED321" }, // green ≈ 120° → 120-55 = 65°
  { label: "Lime",        hue: 25,  swatch: "#C8E000" }, // lime ≈ 80° → 80-55 = 25°
];

// 9g = standard (no extra cost), 17g = XL (+$0.10/unit)
export const SIZES: OptionBtn<GummySize>[] = [
  { value: "standard", label: "9g", sub: "standard" },
  { value: "xl", label: "17g", sub: "XL · +$0.10/unit" },
];

// Oil type is the first selection — sets the base price
export const OIL_TYPES: OptionBtn<GummyOilType>[] = [
  { value: "biomax", label: "BioMax", sub: "$1.75 base" },
  { value: "rosin", label: "Rosin", sub: "$2.50 base" },
];

// BioMax effects — always available (botanical terpenes added during cook)
export const BIOMAX_EFFECTS: OptionBtn<GummyEffect>[] = [
  { value: "hybrid", label: "Hybrid" },
  { value: "indica", label: "Indica", sub: "+$0.05" },
  { value: "sativa", label: "Sativa", sub: "+$0.05" },
];

// Keep EFFECTS as alias for BioMax effects (used in legacy code)
export const EFFECTS = BIOMAX_EFFECTS;

// Rosin effects are built dynamically from active oil containers with remaining stock.
// Each active Rosin container has a strain field ("Indica" | "Sativa" | "Hybrid").
// The configurator queries active containers and builds this list at runtime.
export function buildRosinEffects(availableStrains: string[]): OptionBtn<GummyEffect>[] {
  const strainMap: Record<string, OptionBtn<GummyEffect>> = {
    Hybrid:  { value: "hybrid",  label: "Rosin Hybrid" },
    Indica:  { value: "indica",  label: "Rosin Indica",  sub: "+$0.05" },
    Sativa:  { value: "sativa",  label: "Rosin Sativa",  sub: "+$0.05" },
  };
  return availableStrains
    .filter((s) => strainMap[s])
    .map((s) => strainMap[s]);
}

// 70-unit increments starting at 140 up to 4200
export const UNIT_OPTIONS: number[] = Array.from(
  { length: Math.floor((4200 - 140) / 70) + 1 },
  (_, i) => 140 + i * 70,
);
