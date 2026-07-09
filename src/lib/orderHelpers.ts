import type { ProductLine, ProductCard, RawProduct } from "@/types/storePortal/orders";

export const LINE_COLORS: Record<string, { accent: string; bg: string }> = {
  "fifty-one fifty": { accent: "#c45a1a", bg: "#fdf3ec" },
  bliss: { accent: "#2a7a4e", bg: "#f0f7f2" },
  cannacrispy: { accent: "#b5860e", bg: "#fdf8ec" },
  default: { accent: "#6b6045", bg: "#f5f2e8" },
};

export function lineColor(name: string) {
  const lc = name.toLowerCase();
  for (const [key, val] of Object.entries(LINE_COLORS)) {
    if (key !== "default" && lc.includes(key)) return val;
  }
  return LINE_COLORS.default;
}

function plName(p: RawProduct): string {
  if (!p.productLine || typeof p.productLine === "string") return "";
  return (p.productLine as ProductLine).name || "";
}

function plDisplayOrder(p: RawProduct): number {
  if (!p.productLine || typeof p.productLine === "string") return 999;
  return (p.productLine as ProductLine).displayOrder ?? 999;
}

function pricingType(p: RawProduct) {
  if (!p.productLine || typeof p.productLine === "string") return "simple" as const;
  return (p.productLine as ProductLine).pricingStructure?.type || ("simple" as const);
}

function typeLabels(p: RawProduct): string[] {
  if (!p.productLine || typeof p.productLine === "string") return [];
  return (p.productLine as ProductLine).pricingStructure?.typeLabels || [];
}

export function buildCards(products: RawProduct[]): ProductCard[] {
  const cardMap = new Map<string, ProductCard>();

  for (const p of products) {
    if (p.active === false) continue;
    const pl = plName(p);
    const pt = pricingType(p);
    const plOrder = plDisplayOrder(p);
    const pOrder = p.displayOrder ?? 999;

    if (pt === "multi-type" && (p.prices || p.hybridBreakdown)) {
      const priceSource = p.prices || {};
      const breakdownSource = p.hybridBreakdown || {};
      const definedLabels = typeLabels(p);
      const fallbackKeys =
        Object.keys(priceSource).length > 0
          ? Object.keys(priceSource)
          : Object.keys(breakdownSource);
      const labels = definedLabels.length > 0 ? definedLabels : fallbackKeys;

      const cardKey = `mt::${pl}::${p.subProductLine || p._id}`;
      if (!cardMap.has(cardKey)) {
        cardMap.set(cardKey, {
          cardKey,
          productLineName: pl,
          productLineDisplayOrder: plOrder,
          cardDisplayOrder: pOrder,
          pricingType: "multi-type",
          name: p.subProductLine || pl,
          description: p.description,
          imageUrl: p.imageUrl,
          images: p.images,
          rows: [],
        });
      }
      const card = cardMap.get(cardKey)!;
      for (const tl of labels) {
        const entry = priceSource[tl];
        const fallbackPrice = breakdownSource[tl];
        const price = entry?.price ?? fallbackPrice ?? 0;
        if (!price) continue;
        const dp =
          entry?.discountPrice && entry.discountPrice > 0 ? entry.discountPrice : undefined;
        card.rows.push({
          rowKey: `${p._id}::${tl}`,
          label: tl,
          price,
          discountPrice: dp,
          onSale: !!dp,
          productId: p._id,
        });
      }
      continue;
    }

    if (pt === "variants" && p.variants && p.variants.length > 0) {
      const cardKey = `v::${pl}::${p.subProductLine || p._id}`;
      if (!cardMap.has(cardKey)) {
        cardMap.set(cardKey, {
          cardKey,
          productLineName: pl,
          productLineDisplayOrder: plOrder,
          cardDisplayOrder: pOrder,
          pricingType: "variants",
          name: p.subProductLine || pl,
          description: p.description,
          imageUrl: p.imageUrl,
          images: p.images,
          rows: [],
        });
      }
      const card = cardMap.get(cardKey)!;
      for (const v of p.variants) {
        const dp = v.discountPrice && v.discountPrice > 0 ? v.discountPrice : undefined;
        card.rows.push({
          rowKey: `${p._id}::${v.label}`,
          label: v.label,
          price: v.price,
          discountPrice: dp,
          onSale: !!dp,
          productId: p._id,
        });
      }
      continue;
    }

    // simple
    const displayName = p.itemName || p.subProductLine || "Product";
    const dp = p.applyDiscount && p.discountPrice ? p.discountPrice : undefined;
    const cardKey = `s::${p._id}`;
    cardMap.set(cardKey, {
      cardKey,
      productLineName: pl,
      productLineDisplayOrder: plOrder,
      cardDisplayOrder: pOrder,
      pricingType: "simple",
      name: displayName,
      description: p.description,
      imageUrl: p.imageUrl,
      images: p.images,
      rows: [
        {
          rowKey: p._id,
          label: "",
          price: p.price || 0,
          discountPrice: dp,
          onSale: !!dp,
          productId: p._id,
        },
      ],
    });
  }

  return Array.from(cardMap.values()).sort((a, b) => {
    if (a.productLineDisplayOrder !== b.productLineDisplayOrder)
      return a.productLineDisplayOrder - b.productLineDisplayOrder;
    return a.cardDisplayOrder - b.cardDisplayOrder;
  });
}

export function ep(price: number, discountPrice?: number, onSale?: boolean) {
  return onSale && discountPrice ? discountPrice : price;
}
