import type { IPromotion } from "@/types/promotions/promotions";

export const STATUS_BADGE: Record<IPromotion["status"], string> = {
  active: "bg-green-100 text-green-800 border-green-300",
  inactive: "bg-muted text-muted-foreground border-border",
};

export const emptyForm = {
  name: "", code: "", description: "",
  type: "flat" as IPromotion["type"],
  value: "", minOrderAmount: "", maxUses: "", maxUsesPerStore: "",
  startDate: "", endDate: "",
  status: "active" as IPromotion["status"],
  isPublic: false, autoApply: false,
};

export function fmtDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function discountLabel(type: IPromotion["type"], value: number) {
  return type === "flat" ? `$${value.toFixed(2)} off` : `${value}% off`;
}
