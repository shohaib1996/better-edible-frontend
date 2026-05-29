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
};

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
  { value: "mix", label: "Mix Flavors", sub: "+$0.05" },
];

export const UNIT_PRESETS = [630, 1000, 2000, 3000];
