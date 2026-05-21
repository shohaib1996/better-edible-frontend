// ─────────────────────────────
// CANNABINOID
// ─────────────────────────────

export type CannabinoidName = "CBD" | "CBG" | "CBN" | "CBC" | "THCv";

export interface ICannabinoidEntry {
  name: CannabinoidName;
  mg: number;
  priceAdd: number;
}

// ─────────────────────────────
// GUMMY BUILDER CONFIG
// ─────────────────────────────

export type GummySize = "standard" | "xl";
export type GummyOilType = "biomax" | "rosin";
export type GummyEffect = "hybrid" | "indica" | "sativa";
export type GummyFlavorMode = "single" | "mix";
export type GummyProductionMode = "custom" | "pool";
export type GummyLabelStatus = "draft" | "submitted";

// ─────────────────────────────
// PRICING RESULT
// ─────────────────────────────

export interface IGummyPricingBreakdown {
  base: number;
  size: number;
  effect: number;
  flavorMode: number;
  cannabinoids: ICannabinoidEntry[];
}

export interface IGummyPricingResult {
  unitCost: number;
  totalCost: number;
  isRatio: boolean;
  testingFee: number;
  testingFeeWaived: boolean;
  breakdown: IGummyPricingBreakdown;
}

// ─────────────────────────────
// STORE DRAFT LABEL (from backend Label model with gummy fields)
// ─────────────────────────────

export interface IStoreDraftLabel {
  _id: string;
  flavorName: string;
  size: GummySize;
  oilType: GummyOilType;
  effect: GummyEffect;
  flavorMode: GummyFlavorMode;
  cannabinoids: ICannabinoidEntry[];
  unitsOrdered: number;
  unitCost: number;
  totalCost: number;
  isRatio: boolean;
  testingFee: number;
  testingFeeWaived: boolean;
  productionMode: GummyProductionMode;
  labelStatus: GummyLabelStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────
// CREATE / UPDATE PAYLOADS
// ─────────────────────────────

export interface ICreateDraftLabelPayload {
  storeId: string;
  flavorName: string;
  size: GummySize;
  oilType: GummyOilType;
  effect: GummyEffect;
  flavorMode: GummyFlavorMode;
  cannabinoids: { name: CannabinoidName; mg: number }[];
  unitsOrdered: number;
}

export interface IUpdateDraftLabelPayload {
  id: string;
  storeId: string;
  flavorName?: string;
  size?: GummySize;
  oilType?: GummyOilType;
  effect?: GummyEffect;
  flavorMode?: GummyFlavorMode;
  cannabinoids?: { name: CannabinoidName; mg: number }[];
  unitsOrdered?: number;
}

export interface ISubmitLinePayload {
  storeId: string;
  logoStatus: "uploaded" | "pending_email" | "use_existing";
  logoUrl?: string;
}

// ─────────────────────────────
// POOL
// ─────────────────────────────

export interface IGummyPoolEntry {
  clientId: string;
  storeId: string;
  storeName: string;
  labelId: string;
  units: number;
  joinedAt: string;
}

export interface IGummyPool {
  _id: string;
  cannabinoidKey: string;
  entries: IGummyPoolEntry[];
  totalUnits: number;
  requiredUnits: number;
  status: "open" | "triggered";
  triggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────
// STORE ORDER
// ─────────────────────────────

export interface IStoreOrderItem {
  label: IStoreDraftLabel;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface IStoreOrder {
  _id: string;
  store: string;
  client: string;
  items: IStoreOrderItem[];
  totalCost: number;
  status: "pending" | "in_production" | "shipped" | "delivered";
  productionStartDate?: string;
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}
