import type {
  GummySize,
  GummyOilType,
  GummyEffect,
  GummyFlavorMode,
  CannabinoidName,
} from "@/types/privateLabel/gummyBuilder";

export type OptionBtn<T> = { value: T; label: string; sub?: string };

export type QueuedGummy = {
  id: string;
  flavorName: string;
  size: GummySize;
  oilType: GummyOilType;
  effect: GummyEffect;
  flavorMode: GummyFlavorMode;
  cannabinoids: { name: CannabinoidName; mg: number }[];
  unitsOrdered: number;
  grandTotal: number;
  gummyHue: number;
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

export const SIZES: OptionBtn<GummySize>[] = [
  { value: "standard", label: "Standard" },
  { value: "xl", label: "XL", sub: "+$0.05/unit" },
];

export const OIL_TYPES: OptionBtn<GummyOilType>[] = [
  { value: "biomax", label: "BioMax", sub: "$1.75/unit" },
  { value: "rosin", label: "Rosin", sub: "$2.50/unit" },
];

export const EFFECTS: OptionBtn<GummyEffect>[] = [
  { value: "hybrid", label: "Hybrid" },
  { value: "indica", label: "Indica", sub: "+$0.05" },
  { value: "sativa", label: "Sativa", sub: "+$0.05" },
];

export const FLAVOR_MODES: OptionBtn<GummyFlavorMode>[] = [
  { value: "single", label: "Single Flavor" },
  { value: "mix", label: "Mix Flavors" },
];

// 70-unit increments starting at 140 up to 4200
export const UNIT_OPTIONS: number[] = Array.from(
  { length: Math.floor((4200 - 140) / 70) + 1 },
  (_, i) => 140 + i * 70,
);

