/**
 * Utility functions for ordering CannaCrispy products and items
 * to match SKU sequence across the application
 */

export const CANNACRISPY_ORDER = [
  "Original",
  "Fruity",
  "Chocolate",
  "Cookies & Cream",
  "Peanut Butter & Chocolate",
  "Strawberry",
];

/**
 * Sort CannaCrispy products by their subProductLine field
 * Products not in the defined order will be placed at the end
 */
export const sortCannaCrispyProducts = <T extends { subProductLine?: string }>(
  products: T[],
): T[] => {
  return [...products].sort((a, b) => {
    const indexA = CANNACRISPY_ORDER.indexOf(a.subProductLine || "");
    const indexB = CANNACRISPY_ORDER.indexOf(b.subProductLine || "");
    const valA = indexA === -1 ? 999 : indexA;
    const valB = indexB === -1 ? 999 : indexB;
    return valA - valB;
  });
};

/**
 * Sort CannaCrispy order items by extracting flavor name from item data
 * Supports both flavorName field and extracting from item name
 */
export const sortCannaCrispyItems = <
  T extends { flavorName?: string; name?: string },
>(
  items: T[],
): T[] => {
  const getFlavorName = (item: T): string => {
    if (item.flavorName) return item.flavorName;
    if (item.name) {
      // Try to match flavor name from item name
      for (const flavor of CANNACRISPY_ORDER) {
        if (item.name.toLowerCase().includes(flavor.toLowerCase())) {
          return flavor;
        }
      }
    }
    return "";
  };

  return [...items].sort((a, b) => {
    const flavorA = getFlavorName(a);
    const flavorB = getFlavorName(b);
    const indexA = CANNACRISPY_ORDER.indexOf(flavorA);
    const indexB = CANNACRISPY_ORDER.indexOf(flavorB);
    const valA = indexA === -1 ? 999 : indexA;
    const valB = indexB === -1 ? 999 : indexB;
    return valA - valB;
  });
};

/**
 * Check if a product line name is CannaCrispy (case-insensitive)
 */
export const isCannaCrispy = (productLineName?: string): boolean => {
  if (!productLineName) return false;
  return productLineName.toLowerCase() === "cannacrispy";
};
