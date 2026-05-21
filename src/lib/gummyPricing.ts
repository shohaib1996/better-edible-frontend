import type {
  CannabinoidName,
  IGummyPricingResult,
} from "@/types/privateLabel/gummyBuilder";

interface IGummyConfig {
  size: "standard" | "xl";
  oilType: "biomax" | "rosin";
  effect: "hybrid" | "indica" | "sativa";
  flavorMode: "single" | "mix";
  cannabinoids: { name: CannabinoidName; mg: number }[];
  unitsOrdered: number;
}

const CANNABINOID_PRICES: Record<CannabinoidName, Record<number, number>> = {
  CBD: { 100: 0.25, 200: 0.5, 300: 0.75, 400: 1.0 },
  CBG: { 100: 0.5, 200: 1.0 },
  CBN: { 50: 0.6, 100: 1.0 },
  CBC: { 25: 0.6, 50: 1.0, 75: 1.5, 100: 2.0 },
  THCv: { 25: 0.6, 50: 1.0, 75: 1.5, 100: 2.0 },
};

const TESTING_FEE = 250;
const POOL_THRESHOLD = 3000;

export function calculateGummyPrice(config: IGummyConfig): IGummyPricingResult {
  const base = config.oilType === "rosin" ? 2.5 : 1.75;
  const size = config.size === "xl" ? 0.05 : 0;
  const effect = config.effect === "hybrid" ? 0 : 0.05;
  const flavorMode = config.flavorMode === "mix" ? 0.05 : 0;

  const cannabinoidBreakdown = config.cannabinoids.map((c) => ({
    name: c.name,
    mg: c.mg,
    priceAdd: CANNABINOID_PRICES[c.name]?.[c.mg] ?? 0,
  }));

  const cannabinoidTotal = cannabinoidBreakdown.reduce((sum, c) => sum + c.priceAdd, 0);
  const unitCost = parseFloat((base + size + effect + flavorMode + cannabinoidTotal).toFixed(4));
  const totalCost = parseFloat((unitCost * config.unitsOrdered).toFixed(2));

  const isRatio = config.cannabinoids.length > 0;
  const testingFeeWaived = isRatio && config.unitsOrdered >= POOL_THRESHOLD;
  const testingFee = isRatio && !testingFeeWaived ? TESTING_FEE : 0;

  return {
    unitCost,
    totalCost,
    isRatio,
    testingFee,
    testingFeeWaived,
    breakdown: { base, size, effect, flavorMode, cannabinoids: cannabinoidBreakdown },
  };
}

export function buildCannabinoidKey(cannabinoids: { name: CannabinoidName; mg: number }[]): string {
  return cannabinoids
    .map((c) => `${c.name}-${c.mg}`)
    .sort()
    .join("_");
}

export const CANNABINOID_OPTIONS: Record<CannabinoidName, number[]> = {
  CBD: [100, 200, 300, 400],
  CBG: [100, 200],
  CBN: [50, 100],
  CBC: [25, 50, 75, 100],
  THCv: [25, 50, 75, 100],
};

export const ALL_CANNABINOIDS: CannabinoidName[] = ["CBD", "CBG", "CBN", "CBC", "THCv"];
