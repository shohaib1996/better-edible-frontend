import type { IProductLine } from "@/redux/api/ProductLines/productLinesApi";
import { sortCannaCrispyProducts } from "@/utils/productOrdering";

/**
 * Groups products by product line and applies sorting:
 * - If any item in the group has been manually ordered (displayOrder > 0), sort by displayOrder asc.
 * - For Cannacrispy with no manual ordering, fall back to the hardcoded SKU order.
 * - Otherwise keep the backend-returned order (createdAt desc).
 */
export const groupProductsByLine = (
  products: any[],
  productLines: IProductLine[],
): Record<string, any[]> => {
  const groups: Record<string, any[]> = {};

  products.forEach((p: any) => {
    const productLineName = p.productLine?.name || p.productLine;
    if (!groups[productLineName]) groups[productLineName] = [];
    groups[productLineName].push(p);
  });

  // Sort items within each group
  Object.keys(groups).forEach((lineName) => {
    const items = groups[lineName];
    const hasManualOrder = items.some((p: any) => p.displayOrder && p.displayOrder > 0);

    if (hasManualOrder) {
      groups[lineName] = [...items].sort(
        (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      );
    } else if (lineName === "Cannacrispy") {
      groups[lineName] = sortCannaCrispyProducts(items);
    }
    // else: keep backend order as-is
  });

  // Return groups ordered by productLines displayOrder.
  // Show ALL active product lines, even if they have no products.
  const orderedGroups: Record<string, any[]> = {};
  [...productLines]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .forEach((pl) => {
      orderedGroups[pl.name] = groups[pl.name] || [];
    });

  return orderedGroups;
};
