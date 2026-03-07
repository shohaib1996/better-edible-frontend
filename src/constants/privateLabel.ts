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
  design_in_progress:
    "bg-secondary/10 border-secondary/20 text-secondary-foreground",
  awaiting_store_approval:
    "bg-secondary/20 border-secondary/30 text-secondary-foreground",
  store_approved: "bg-primary/10 border-primary/20 text-primary",
  submitted_to_olcc: "bg-primary/20 border-primary/30 text-primary",
  olcc_approved:
    "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
  print_order_submitted:
    "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
  ready_for_production:
    "bg-green-600/15 border-green-600/20 text-green-700 dark:text-green-400",
};

export const STAGE_TEXT_COLORS: Record<LabelStage, string> = {
  design_in_progress: "text-secondary-foreground",
  awaiting_store_approval: "text-secondary-foreground",
  store_approved: "text-primary",
  submitted_to_olcc: "text-primary",
  olcc_approved: "text-blue-600 dark:text-blue-400",
  print_order_submitted: "text-purple-600 dark:text-purple-400",
  ready_for_production: "text-green-700 dark:text-green-400",
};

export const STAGE_DOT_COLORS: Record<LabelStage, string> = {
  design_in_progress: "bg-secondary",
  awaiting_store_approval: "bg-secondary",
  store_approved: "bg-primary",
  submitted_to_olcc: "bg-primary",
  olcc_approved: "bg-blue-500",
  print_order_submitted: "bg-purple-500",
  ready_for_production: "bg-green-600",
};

// ─────────────────────────────
// CLIENT ORDER STATUSES
// ─────────────────────────────

export const ORDER_STATUSES = [
  "waiting",
  "cooking_molding",
  "dehydrating",
  "demolding",
  "packaging_casing",
  "ready_to_ship",
  "shipped",
  "cancelled",
] as const;

export type ClientOrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<ClientOrderStatus, string> = {
  waiting: "Waiting",
  cooking_molding: "Cooking & Molding",
  dehydrating: "Dehydrating",
  demolding: "Demolding",
  packaging_casing: "Packaging & Casing",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<ClientOrderStatus, string> = {
  waiting: "bg-muted text-muted-foreground border-muted-foreground/20",
  cooking_molding: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  dehydrating: "bg-secondary/30 text-secondary-foreground border-secondary/40",
  demolding: "bg-primary/10 text-primary border-primary/20",
  packaging_casing: "bg-primary/30 text-primary-foreground border-primary/40",
  ready_to_ship:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  shipped:
    "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  cancelled:
    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export const ORDER_STATUS_TEXT_COLORS: Record<ClientOrderStatus, string> = {
  waiting: "text-muted-foreground",
  cooking_molding: "text-secondary-foreground",
  dehydrating: "text-secondary-foreground",
  demolding: "text-primary",
  packaging_casing: "text-primary-foreground",
  ready_to_ship: "text-blue-600 dark:text-blue-400",
  shipped: "text-green-600 dark:text-green-400",
  cancelled: "text-red-600 dark:text-red-400",
};

// ─────────────────────────────
// RECURRING SCHEDULE
// ─────────────────────────────

export const SCHEDULE_INTERVALS = [
  "monthly",
  "bimonthly",
  "quarterly",
] as const;

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
  onboarding: "bg-secondary/10 border-secondary/20 text-secondary-foreground",
  active:
    "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400",
};

// ─────────────────────────────
// UI HELPER FUNCTIONS
// ─────────────────────────────

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
 * Check if an order can be edited (only in "waiting" status)
 */
export const canEditOrder = (status: ClientOrderStatus): boolean => {
  return status === "waiting";
};

/**
 * Check if an order is in production
 */
export const isOrderInProduction = (status: ClientOrderStatus): boolean => {
  return ["cooking_molding", "dehydrating", "demolding", "packaging_casing"].includes(status);
};

/**
 * Get next stage in label pipeline
 */
export const getNextLabelStage = (
  currentStage: LabelStage,
): LabelStage | null => {
  const currentIndex = LABEL_STAGES.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === LABEL_STAGES.length - 1) {
    return null;
  }
  return LABEL_STAGES[currentIndex + 1];
};

/**
 * Get previous stage in label pipeline
 */
export const getPreviousLabelStage = (
  currentStage: LabelStage,
): LabelStage | null => {
  const currentIndex = LABEL_STAGES.indexOf(currentStage);
  if (currentIndex <= 0) {
    return null;
  }
  return LABEL_STAGES[currentIndex - 1];
};

// ─────────────────────────────
// PRODUCTION QUANTITIES
// ─────────────────────────────
// Standard batch sizes for production orders

export const PRODUCTION_QUANTITIES = {
  HALF_BATCH: 624,
  FULL_BATCH: 1248,
} as const;

// ─────────────────────────────
// PPS COOK ITEM STATUSES
// ─────────────────────────────

export const COOK_ITEM_STATUSES = [
  "pending",
  "in-progress",
  "cooking_molding_complete",
  "dehydrating_complete",
  "demolding_complete",
  "packaging_casing_complete",
] as const;

export type CookItemStatusConst = (typeof COOK_ITEM_STATUSES)[number];

export const COOK_ITEM_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  "in-progress": "In Progress",
  cooking_molding_complete: "Molded",
  dehydrating_complete: "Dehydrating",
  demolding_complete: "Packed",
  packaging_casing_complete: "Complete",
};

export const COOK_ITEM_STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground border-muted-foreground/20",
  "in-progress": "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  cooking_molding_complete: "bg-primary/10 text-primary border-primary/20",
  dehydrating_complete: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  demolding_complete: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  packaging_casing_complete:
    "bg-green-500/10 text-green-600 border-green-500/20",
};

export const PPS_STAGE_LABELS = {
  stage_1: "Stage 1: Cooking & Molding",
  stage_2: "Stage 2: Demolding & Dehydrator",
  stage_3: "Stage 3: Container & Label",
  stage_4: "Stage 4: Packaging & Cases",
} as const;

export const UNITS_PER_CASE = 100;
