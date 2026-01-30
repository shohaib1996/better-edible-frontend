// ─────────────────────────────
// PRODUCT PRICING (FIXED)
// ─────────────────────────────

export const PRODUCT_PRICES: Record<string, number> = {
  "BIOMAX Gummies": 1.75,
  "Rosin Gummies": 2.5,
};

// ─────────────────────────────
// PRODUCTION QUANTITIES
// ─────────────────────────────

export const PRODUCTION_QUANTITIES = {
  HALF_BATCH: 624,
  FULL_BATCH: 1248,
};

// ─────────────────────────────
// LABEL STAGES (7-STAGE PIPELINE)
// ─────────────────────────────

export const LABEL_STAGES = [
  "design_in_progress",
  "awaiting_store_approval",
  "store_approved",
  "submitted_to_olcc",
  "olcc_approved",
  "print_order_submitted",
  "ready_for_production",
] as const;

export type LabelStage = (typeof LABEL_STAGES)[number];

export const STAGE_LABELS: Record<LabelStage, string> = {
  design_in_progress: "Design in Progress",
  awaiting_store_approval: "Awaiting Store Approval",
  store_approved: "Store Approved",
  submitted_to_olcc: "Submitted to OLCC",
  olcc_approved: "OLCC Approved",
  print_order_submitted: "Print Order Submitted",
  ready_for_production: "Ready for Production",
};

export const STAGE_COLORS: Record<LabelStage, string> = {
  design_in_progress: "bg-yellow-500",
  awaiting_store_approval: "bg-yellow-600",
  store_approved: "bg-orange-500",
  submitted_to_olcc: "bg-orange-600",
  olcc_approved: "bg-blue-500",
  print_order_submitted: "bg-purple-500",
  ready_for_production: "bg-green-600",
};

// Tailwind text colors for stages
export const STAGE_TEXT_COLORS: Record<LabelStage, string> = {
  design_in_progress: "text-yellow-500",
  awaiting_store_approval: "text-yellow-600",
  store_approved: "text-orange-500",
  submitted_to_olcc: "text-orange-600",
  olcc_approved: "text-blue-500",
  print_order_submitted: "text-purple-500",
  ready_for_production: "text-green-600",
};

// ─────────────────────────────
// CLIENT ORDER STATUSES
// ─────────────────────────────

export const ORDER_STATUSES = [
  "waiting",
  "stage_1",
  "stage_2",
  "stage_3",
  "stage_4",
  "ready_to_ship",
  "shipped",
] as const;

export type ClientOrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<ClientOrderStatus, string> = {
  waiting: "Waiting",
  stage_1: "Stage 1",
  stage_2: "Stage 2",
  stage_3: "Stage 3",
  stage_4: "Stage 4",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
};

export const ORDER_STATUS_COLORS: Record<ClientOrderStatus, string> = {
  waiting: "bg-gray-500",
  stage_1: "bg-yellow-500",
  stage_2: "bg-yellow-600",
  stage_3: "bg-orange-500",
  stage_4: "bg-orange-600",
  ready_to_ship: "bg-blue-500",
  shipped: "bg-green-600",
};

export const ORDER_STATUS_TEXT_COLORS: Record<ClientOrderStatus, string> = {
  waiting: "text-gray-500",
  stage_1: "text-yellow-500",
  stage_2: "text-yellow-600",
  stage_3: "text-orange-500",
  stage_4: "text-orange-600",
  ready_to_ship: "text-blue-500",
  shipped: "text-green-600",
};

// ─────────────────────────────
// RECURRING SCHEDULE
// ─────────────────────────────

export const SCHEDULE_INTERVALS = ["monthly", "bimonthly", "quarterly"] as const;

export type ScheduleInterval = (typeof SCHEDULE_INTERVALS)[number];

export const SCHEDULE_INTERVAL_LABELS: Record<ScheduleInterval, string> = {
  monthly: "Once per month",
  bimonthly: "Every 2 months",
  quarterly: "Every 3 months",
};

// ─────────────────────────────
// CLIENT STATUSES
// ─────────────────────────────

export const CLIENT_STATUSES = ["onboarding", "active"] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  onboarding: "Onboarding",
  active: "Active",
};

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  onboarding: "bg-yellow-500",
  active: "bg-green-600",
};

// ─────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────

/**
 * Get unit price by product type
 */
export const getUnitPrice = (productType: string): number => {
  return PRODUCT_PRICES[productType] || 0;
};

/**
 * Calculate line total for an item
 */
export const calculateLineTotal = (
  productType: string,
  quantity: number
): number => {
  const unitPrice = getUnitPrice(productType);
  return Number((quantity * unitPrice).toFixed(2));
};

/**
 * Calculate order subtotal from items
 */
export const calculateSubtotal = (
  items: Array<{ productType: string; quantity: number }>
): number => {
  return Number(
    items
      .reduce((sum, item) => sum + calculateLineTotal(item.productType, item.quantity), 0)
      .toFixed(2)
  );
};

/**
 * Calculate discount amount
 */
export const calculateDiscountAmount = (
  subtotal: number,
  discount: number,
  discountType: "flat" | "percentage"
): number => {
  if (discountType === "percentage") {
    return Number(((subtotal * discount) / 100).toFixed(2));
  }
  return discount;
};

/**
 * Calculate final total after discount
 */
export const calculateTotal = (
  subtotal: number,
  discountAmount: number
): number => {
  return Number(Math.max(0, subtotal - discountAmount).toFixed(2));
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

/**
 * Calculate production start date (14 days before delivery)
 */
export const calculateProductionStartDate = (deliveryDate: Date): Date => {
  const productionStart = new Date(deliveryDate);
  productionStart.setDate(productionStart.getDate() - 14);
  return productionStart;
};

/**
 * Check if an order can be edited (only in "waiting" status)
 */
export const canEditOrder = (status: ClientOrderStatus): boolean => {
  return status === "waiting";
};

/**
 * Check if an order is in production
 */
export const isOrderInProduction = (status: ClientOrderStatus): boolean => {
  return ["stage_1", "stage_2", "stage_3", "stage_4"].includes(status);
};

/**
 * Get next stage in label pipeline
 */
export const getNextLabelStage = (currentStage: LabelStage): LabelStage | null => {
  const currentIndex = LABEL_STAGES.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === LABEL_STAGES.length - 1) {
    return null;
  }
  return LABEL_STAGES[currentIndex + 1];
};

/**
 * Get previous stage in label pipeline
 */
export const getPreviousLabelStage = (currentStage: LabelStage): LabelStage | null => {
  const currentIndex = LABEL_STAGES.indexOf(currentStage);
  if (currentIndex <= 0) {
    return null;
  }
  return LABEL_STAGES[currentIndex - 1];
};
