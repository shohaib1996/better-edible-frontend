export const GUMMY_SIZES = [
  { label: "9g", sublabel: "standard", value: "9g", unitPrice: 0.0 },
  { label: "17g", sublabel: "XL · +$0.10", value: "17g", unitPrice: 0.1 },
] as const;

export const OIL_TYPES = [
  { label: "BioMax", sublabel: "$1.75 base", value: "biomax", adder: 1.75 },
  { label: "Rosin", sublabel: "+$2.50", value: "rosin", adder: 2.5 },
] as const;

export const EFFECTS_BY_OIL: Record<
  string,
  { label: string; sublabel: string; value: string; adder: number }[]
> = {
  biomax: [
    { label: "Hybrid", sublabel: "base", value: "hybrid", adder: 0 },
    { label: "Indica", sublabel: "+$0.05", value: "indica", adder: 0.05 },
    { label: "Sativa", sublabel: "+$0.05", value: "sativa", adder: 0.05 },
  ],
  rosin: [
    { label: "Indica", sublabel: "in stock", value: "indica", adder: 0 },
    { label: "Sativa", sublabel: "in stock", value: "sativa", adder: 0 },
  ],
};

export const CANNABINOID_OPTIONS: {
  name: string;
  mgOptions: { mg: number; adder: number }[];
}[] = [
  {
    name: "CBD",
    mgOptions: [
      { mg: 100, adder: 0.25 },
      { mg: 200, adder: 0.5 },
      { mg: 300, adder: 0.75 },
      { mg: 400, adder: 1.0 },
    ],
  },
  {
    name: "CBG",
    mgOptions: [
      { mg: 100, adder: 0.5 },
      { mg: 200, adder: 1.0 },
    ],
  },
  {
    name: "CBN",
    mgOptions: [
      { mg: 50, adder: 0.6 },
      { mg: 100, adder: 1.0 },
    ],
  },
  {
    name: "CBC",
    mgOptions: [
      { mg: 25, adder: 0.6 },
      { mg: 50, adder: 1.0 },
      { mg: 75, adder: 1.5 },
      { mg: 100, adder: 2.0 },
    ],
  },
  {
    name: "THCv",
    mgOptions: [
      { mg: 25, adder: 0.6 },
      { mg: 50, adder: 1.0 },
      { mg: 75, adder: 1.5 },
      { mg: 100, adder: 2.0 },
    ],
  },
];

export const UNIT_OPTIONS: number[] = Array.from(
  { length: Math.floor((4200 - 140) / 70) + 1 },
  (_, i) => 140 + i * 70,
);

export const MIN_UNITS_PER_FLAVOR = 140;
export const ORDER_MINIMUM = 1000;
export const TESTING_FEE = 250;
export const POOL_THRESHOLD = 3000;

export const LABEL_STAGES_ORDER = [
  "design_in_progress",
  "awaiting_store_approval",
  "store_approved",
  "submitted_to_olcc",
  "olcc_approved",
  "print_order_submitted",
  "ready_for_production",
];

export const LABEL_STAGE_LABELS: Record<string, string> = {
  design_in_progress: "Design in Progress",
  awaiting_store_approval: "Awaiting Your Approval",
  store_approved: "You Approved",
  submitted_to_olcc: "Submitted to OLCC",
  olcc_approved: "OLCC Approved",
  print_order_submitted: "Print Order Submitted",
  ready_for_production: "Ready for Production",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pooling: "Waiting on Pool",
  waiting: "Waiting",
  pending: "Pending",
  in_production: "In Production",
  cooking_molding: "Cooking & Molding",
  dehydrating: "Dehydrating",
  demolding: "Demolding",
  packaging_casing: "Packaging",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pooling: { bg: "#eef2fb", text: "#3a5fa8" },
  waiting: { bg: "#f5f2e8", text: "#6b6045" },
  pending: { bg: "#f5f2e8", text: "#6b6045" },
  in_production: { bg: "#fdf8ec", text: "#b5860e" },
  cooking_molding: { bg: "#fdf8ec", text: "#b5860e" },
  dehydrating: { bg: "#fdf8ec", text: "#b5860e" },
  demolding: { bg: "#fdf8ec", text: "#b5860e" },
  packaging_casing: { bg: "#fdf3ec", text: "#c45a1a" },
  ready_to_ship: { bg: "#f0f7f2", text: "#2a7a4e" },
  shipped: { bg: "#f0f7f2", text: "#2a7a4e" },
  delivered: { bg: "#f0f7f2", text: "#2a7a4e" },
  cancelled: { bg: "#fdf0ec", text: "#c45a1a" },
};

type CannabinoidLike = { name?: string; mg?: number };

export function normCannabinoids(cans?: CannabinoidLike[]): { name: string; mg: number }[] {
  return (cans || [])
    .map((c) => ({ name: (c.name || "").trim(), mg: Number(c.mg) || 0 }))
    .filter((c) => c.name && c.mg > 0);
}

export function buildCannabinoidKey(cans?: CannabinoidLike[]): string {
  const norm = normCannabinoids(cans);
  if (norm.length === 0) return "";
  return norm
    .map((c) => `${c.name}-${c.mg}`)
    .sort()
    .join("_");
}

export function isExemptCannabinoids(cans?: CannabinoidLike[]): boolean {
  const norm = normCannabinoids(cans);
  if (norm.length === 0) return true;
  if (norm.length === 1 && norm[0].name === "CBD" && norm[0].mg === 100) return true;
  return false;
}

export function isPoolEligible(cans?: CannabinoidLike[]): boolean {
  return normCannabinoids(cans).length > 0 && !isExemptCannabinoids(cans);
}

export function calcUnitPrice(
  sizeVal: string,
  oilVal: string,
  effectVal: string,
  cannabinoids: { adder: number }[],
  sourAdder = 0,
): number {
  const size = GUMMY_SIZES.find((s) => s.value === sizeVal) ?? GUMMY_SIZES[0];
  const oil = OIL_TYPES.find((o) => o.value === oilVal) ?? OIL_TYPES[0];
  const allEffects = EFFECTS_BY_OIL[oilVal] ?? EFFECTS_BY_OIL.biomax;
  const eff = allEffects.find((e) => e.value === effectVal) ?? allEffects[0];
  const cbAdder = cannabinoids.reduce((sum, c) => sum + c.adder, 0);
  return parseFloat((size.unitPrice + oil.adder + eff.adder + cbAdder + sourAdder).toFixed(4));
}

export function isColorDark(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

export function fmtDate(d?: string): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtCurrency(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
