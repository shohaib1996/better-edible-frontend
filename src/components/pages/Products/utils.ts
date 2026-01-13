import type { IProductLine } from "@/redux/api/ProductLines/productLinesApi";

/**
 * Groups products by product line and applies custom sorting
 */
export const groupProductsByLine = (
  products: any[],
  productLines: IProductLine[]
): Record<string, any[]> => {
  const groups: Record<string, any[]> = {};

  products.forEach((p: any) => {
    const productLineName = p.productLine?.name || p.productLine;
    if (!groups[productLineName]) groups[productLineName] = [];
    groups[productLineName].push(p);
  });

  // Custom sort for Cannacrispy
  if (groups["Cannacrispy"]) {
    const cannacrispyOrder = [
      "Original",
      "Fruity",
      "Chocolate",
      "Cookies & Cream",
      "Peanut Butter & Chocolate",
      "Strawberry",
    ];
    groups["Cannacrispy"].sort((a, b) => {
      const indexA = cannacrispyOrder.indexOf(a.subProductLine);
      const indexB = cannacrispyOrder.indexOf(b.subProductLine);
      const valA = indexA === -1 ? 999 : indexA;
      const valB = indexB === -1 ? 999 : indexB;
      return valA - valB;
    });
  }

  // Return groups ordered by productLines displayOrder
  // ✅ Show ALL active product lines, even if they have no products
  const orderedGroups: Record<string, any[]> = {};
  [...productLines]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .forEach((pl) => {
      // Initialize with empty array if no products exist for this line
      orderedGroups[pl.name] = groups[pl.name] || [];
    });

  return orderedGroups;
};
