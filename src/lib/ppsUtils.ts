export function getOilTypeLabel(item: { gummyOilType?: string; productType?: string }): "BIOMAX" | "ROSIN" | null {
  if (item.gummyOilType) return item.gummyOilType === "biomax" ? "BIOMAX" : "ROSIN";
  const pt = item.productType?.toLowerCase() ?? "";
  if (pt.includes("rosin")) return "ROSIN";
  if (pt.includes("biomax")) return "BIOMAX";
  return null;
}
