import type { LabelStage } from "@/types/privateLabel/label";

export const STAGE_META: Record<LabelStage, { short: string; full: string; color: string }> = {
  design_in_progress:      { short: "Design",    full: "Design in Progress",      color: "bg-blue-500" },
  awaiting_store_approval: { short: "Review",    full: "Awaiting Store Approval",  color: "bg-amber-500" },
  store_approved:          { short: "Approved",  full: "Store Approved",           color: "bg-green-500" },
  submitted_to_olcc:       { short: "OLCC Sub.", full: "Submitted to OLCC",        color: "bg-purple-500" },
  olcc_approved:           { short: "OLCC ✓",   full: "OLCC Approved",            color: "bg-green-600" },
  print_order_submitted:   { short: "Print",     full: "Print Order Submitted",    color: "bg-indigo-500" },
  ready_for_production:    { short: "Ready",     full: "Ready for Production",     color: "bg-emerald-600" },
};
