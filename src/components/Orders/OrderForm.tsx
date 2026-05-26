"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useGetAllProductsQuery } from "@/redux/api/Products/productsApi";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { sortCannaCrispyProducts } from "@/utils/productOrdering";
import { ProductRow } from "./ProductRow";
import { OrderSummaryCard } from "./OrderSummaryCard";

interface OrderFormProps {
  initialItems?: any[];
  initialDiscountType?: "flat" | "percent";
  initialDiscountValue?: number;
  initialNote?: string;
  onChange: (
    items: any[],
    totals: {
      totalCases: number;
      totalPrice: number;
      discount: number;
      finalTotal: number;
      discountType?: "flat" | "percent";
      discountValue?: number;
      note?: string;
    },
  ) => void;
}

const normKey = (s?: string | null) =>
  s ? String(s).trim().toLowerCase() : "";

const getProductLineConfig = (product: any) => {
  const productLine =
    typeof product.productLine === "string" ? null : product.productLine;
  return {
    name:
      typeof product.productLine === "string"
        ? product.productLine
        : productLine?.name || "",
    pricingType: productLine?.pricingStructure?.type || "simple",
    variantLabels: productLine?.pricingStructure?.variantLabels || [],
    typeLabels: productLine?.pricingStructure?.typeLabels || [],
  };
};

const hasDiscount = (product: any): boolean => {
  const config = getProductLineConfig(product);
  if (config.pricingType === "simple") {
    return (
      !!product.applyDiscount ||
      (product.discountPrice && product.discountPrice < product.price)
    );
  }
  if (config.pricingType === "variants" && product.variants?.length) {
    return product.variants.some(
      (v: any) => v.discountPrice && v.discountPrice < v.price,
    );
  }
  if (config.pricingType === "multi-type" && product.prices) {
    return Object.values(product.prices || {}).some(
      (p: any) => p.discountPrice && p.discountPrice < p.price,
    );
  }
  return false;
};

export const OrderForm: React.FC<OrderFormProps> = ({
  initialItems = [],
  initialDiscountType,
  initialDiscountValue = 0,
  initialNote = "",
  onChange,
}) => {
  const { data, isLoading } = useGetAllProductsQuery({});
  const products = useMemo(() => data?.products || [], [data]);

  const [quantities, setQuantities] = useState<Record<string, any>>({});
  const [discountType, setDiscountType] = useState(initialDiscountType);
  const [discountValue, setDiscountValue] = useState<number>(initialDiscountValue);
  const [note, setNote] = useState<string>(initialNote);
  const [discountToggles, setDiscountToggles] = useState<Record<string, boolean>>({});
  const [totals, setTotals] = useState({
    totalCases: 0,
    totalPrice: 0,
    discountAmount: 0,
    finalTotal: 0,
  });

  const pickPrice = (product: any, typeOrLabel?: string | null) => {
    const norm = normKey(typeOrLabel ?? "");
    const pid = String(product._id);
    const discountAllowed = !!discountToggles[pid];

    if (product.variants?.length) {
      const v = product.variants.find(
        (x: any) => norm && x.label && x.label.trim().toLowerCase() === norm,
      );
      if (v) {
        return {
          unitPrice: Number(v.price ?? 0),
          discountPrice:
            discountAllowed && v.discountPrice != null
              ? Number(v.discountPrice)
              : undefined,
        };
      }
    }
    if (product.prices && norm && product.prices[norm]) {
      const p = product.prices[norm];
      return {
        unitPrice: Number(p.price ?? 0),
        discountPrice:
          discountAllowed && p.discountPrice != null
            ? Number(p.discountPrice)
            : undefined,
      };
    }
    if (product.hybridBreakdown && norm && product.hybridBreakdown[norm] != null) {
      return {
        unitPrice: Number(product.hybridBreakdown[norm] ?? 0),
        discountPrice:
          discountAllowed && product.discountPrice != null
            ? Number(product.discountPrice)
            : undefined,
      };
    }
    return {
      unitPrice: Number(product.price ?? 0),
      discountPrice:
        discountAllowed && product.discountPrice != null
          ? Number(product.discountPrice)
          : undefined,
    };
  };

  useEffect(() => {
    if (initialItems?.length && products.length) {
      const newQuantities = initialItems.reduce(
        (acc, item) => {
          const rawProd = item.product;
          const productId = String(
            (rawProd && (rawProd._id ?? rawProd)) ?? rawProd,
          );
          const product = products.find((p: any) => String(p._id) === productId);
          if (!product) return acc;

          const config = getProductLineConfig(product);
          let key = "qty";

          if (item.unitLabel) {
            key = normKey(item.unitLabel);
          } else if (
            config.pricingType === "multi-type" &&
            config.typeLabels.length > 0
          ) {
            for (const t of config.typeLabels) {
              if (item.name?.toLowerCase()?.includes(t.toLowerCase())) {
                key = normKey(t);
                break;
              }
            }
          }

          if (!acc[productId]) acc[productId] = {};
          acc[productId][key] = Number(item.qty || 0);
          return acc;
        },
        {} as Record<string, any>,
      );
      setQuantities(newQuantities);

      const newToggles: Record<string, boolean> = {};
      for (const it of initialItems) {
        const pid = String(
          (it.product && (it.product._id ?? it.product)) ?? it.product,
        );
        if (typeof it.appliedDiscount === "boolean") {
          newToggles[pid] = newToggles[pid] || Boolean(it.appliedDiscount);
          continue;
        }
        if (it.discountPrice && Number(it.discountPrice) > 0 && it.qty) {
          const inferred =
            Math.abs(
              Number(it.lineTotal || 0) -
                Number(it.qty || 0) * Number(it.discountPrice),
            ) < 0.01;
          newToggles[pid] = newToggles[pid] || inferred;
        }
      }
      setDiscountToggles(newToggles);
    } else {
      setQuantities({});
      setDiscountToggles({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialItems), products]);

  useEffect(() => { setDiscountType(initialDiscountType); }, [initialDiscountType]);
  useEffect(() => { setDiscountValue(initialDiscountValue); }, [initialDiscountValue]);
  useEffect(() => { setNote(initialNote); }, [initialNote]);

  const groupedProducts = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of products) {
      const lineName =
        typeof p.productLine === "string"
          ? p.productLine
          : p.productLine?.name || "Uncategorized";
      if (!map[lineName]) map[lineName] = [];
      map[lineName].push(p);
    }
    if (map["Cannacrispy"]) {
      map["Cannacrispy"] = sortCannaCrispyProducts(map["Cannacrispy"]);
    }
    return map;
  }, [products]);

  const handleQtyChange = (productId: string, key: string, value: number) => {
    const pid = String(productId);
    setQuantities((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], [key]: Number(value || 0) },
    }));
  };

  useEffect(() => {
    if (isLoading || !products) return;

    let totalCases = 0;
    let totalPrice = 0;
    const itemsForParent: any[] = [];

    for (const [rawProductId, val] of Object.entries(quantities)) {
      const productId = String(rawProductId);
      const product = products.find((p: any) => String(p._id) === productId);
      if (!product) continue;

      const applyDiscountFlag = !!discountToggles[productId];
      const config = getProductLineConfig(product);
      let productTotal = 0;

      if (config.pricingType === "variants" && product.variants?.length) {
        for (const variant of product.variants) {
          const k = normKey(variant.label);
          const qty = Number((val as any)[k] || 0);
          if (qty > 0) {
            const { unitPrice, discountPrice } = pickPrice(product, variant.label);
            const effective = (discountPrice ?? unitPrice) as number;
            itemsForParent.push({ product: productId, qty, unitLabel: variant.label, applyDiscount: applyDiscountFlag });
            totalCases += qty;
            productTotal += qty * effective;
          }
        }
      } else if (config.pricingType === "multi-type" && config.typeLabels.length > 0) {
        for (const type of config.typeLabels) {
          const qty = Number((val as any)[normKey(type)] || 0);
          if (qty > 0) {
            const { unitPrice, discountPrice } = pickPrice(product, type);
            const effective = (discountPrice ?? unitPrice) as number;
            itemsForParent.push({ product: productId, qty, unitLabel: type, applyDiscount: applyDiscountFlag });
            totalCases += qty;
            productTotal += qty * effective;
          }
        }
      } else {
        const qty = Number((val as any).qty || 0);
        if (qty > 0) {
          const { unitPrice, discountPrice } = pickPrice(product, null);
          const effective = (discountPrice ?? unitPrice) as number;
          itemsForParent.push({ product: productId, qty, unitLabel: null, applyDiscount: applyDiscountFlag });
          totalCases += qty;
          productTotal += qty * effective;
        }
      }

      totalPrice += productTotal;
    }

    let discountAmount = 0;
    if (discountType === "flat") discountAmount = Number(discountValue || 0);
    else discountAmount = (totalPrice * Number(discountValue || 0)) / 100;

    const roundedSubtotal = Number(totalPrice.toFixed(2));
    const roundedDiscount = Number(discountAmount.toFixed(2));
    const finalTotal = Number(Math.max(roundedSubtotal - roundedDiscount, 0).toFixed(2));

    setTotals({ totalCases, totalPrice: roundedSubtotal, discountAmount: roundedDiscount, finalTotal });
    onChange(itemsForParent, {
      totalCases,
      totalPrice: roundedSubtotal,
      discount: roundedDiscount,
      finalTotal,
      discountType,
      discountValue,
      note,
    });
  }, [isLoading, products, quantities, discountType, discountValue, note, onChange, discountToggles]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-7xl mx-auto">
      <div className="bg-linear-to-r from-primary to-secondary p-3 rounded-xs">
        <h1 className="text-lg font-bold text-primary-foreground tracking-wide">
          ORDER SHEET
        </h1>
      </div>

      <div className="space-y-2">
        {Object.entries(groupedProducts).map(([line, items]) => (
          <Card key={line} className="p-2 bg-muted/30 border-border rounded-xs shadow-sm">
            <div className="bg-card px-2 py-1 rounded-xs mb-2 border-l-4 border-primary">
              <h2 className="font-bold text-sm text-foreground">{line}</h2>
            </div>
            <div className="space-y-1.5">
              {items.map((product: any) => {
                const pid = String(product._id);
                return (
                  <ProductRow
                    key={pid}
                    product={product}
                    config={getProductLineConfig(product)}
                    pid={pid}
                    quantities={quantities}
                    isChecked={!!discountToggles[pid]}
                    hasDiscount={hasDiscount(product)}
                    onQtyChange={handleQtyChange}
                    onDiscountToggle={(id, checked) =>
                      setDiscountToggles((prev) => ({ ...prev, [id]: checked }))
                    }
                  />
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Separator className="my-3 bg-border" />

      <OrderSummaryCard
        totalCases={totals.totalCases}
        totalPrice={totals.totalPrice}
        discountAmount={totals.discountAmount}
        finalTotal={totals.finalTotal}
        discountType={discountType}
        discountValue={discountValue}
        note={note}
        onDiscountTypeChange={setDiscountType}
        onDiscountValueChange={setDiscountValue}
        onNoteChange={setNote}
      />
    </div>
  );
};
