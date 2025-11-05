"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useGetAllProductsQuery } from "@/src/redux/api/Products/productsApi";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/src/lib/utils";

interface OrderFormProps {
  initialItems?: any[];
  initialDiscountType?: "flat" | "percent";
  initialDiscountValue?: number;
  initialNote?: string;
  onChange: (
    items: any[],
    totals: {
      totalCases: number;
      totalPrice: number; // subtotal before discount
      discount: number; // numeric discount amount
      finalTotal: number; // total after discount
      discountType?: "flat" | "percent";
      discountValue?: number;
      note?: string;
    }
  ) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialItems = [],
  initialDiscountType = "flat",
  initialDiscountValue = 0,
  initialNote = "",
  onChange,
}) => {
  const { data, isLoading } = useGetAllProductsQuery({});
  const products = useMemo(() => data?.products || [], [data]);

  const [quantities, setQuantities] = useState<Record<string, any>>({});
  const [discountType, setDiscountType] = useState<"flat" | "percent">(
    initialDiscountType
  );
  const [discountValue, setDiscountValue] =
    useState<number>(initialDiscountValue);
  const [note, setNote] = useState<string>(initialNote);
  const [discountChecked, setDisountChecked] = useState(false)

  // Helper: normalize keys (labels/variants) -> lowercase no surrounding spaces
  const normKey = (s?: string | null) =>
    s ? String(s).trim().toLowerCase() : "";

  // Initialize quantities when editing an existing order
  useEffect(() => {
    if (initialItems?.length && products.length) {
      const newQuantities = initialItems.reduce((acc, item) => {
        const productId = item.product;
        const product = products.find((p: any) => p._id === productId);
        if (!product) return acc;

        let key = "qty";

        if (item.unitLabel) {
          // Use unitLabel directly (normalized) — works for BLISS and Cannacrispy
          key = normKey(item.unitLabel);
        } else if (product.productLine === "Cannacrispy") {
          // Fall back to detect type from name (legacy items)
          for (const t of ["hybrid", "indica", "sativa"]) {
            if (item.name?.toLowerCase()?.includes(t)) {
              key = t;
              break;
            }
          }
        }

        if (!acc[productId]) acc[productId] = {};
        acc[productId][key] = Number(item.qty || 0);
        return acc;
      }, {} as Record<string, any>);

      setQuantities(newQuantities);
    } else {
      setQuantities({});
    }
  }, [JSON.stringify(initialItems), products]);

  useEffect(() => {
    setDiscountType(initialDiscountType);
  }, [initialDiscountType]);

  useEffect(() => {
    setDiscountValue(initialDiscountValue);
  }, [initialDiscountValue]);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  // Group products by productLine for display
  const groupedProducts = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of products) {
      if (!map[p.productLine]) map[p.productLine] = [];
      map[p.productLine].push(p);
    }
    return map;
  }, [products]);

  const handleQtyChange = (productId: string, key: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [key]: Number(value || 0) },
    }));
  };

  const [totals, setTotals] = useState({
    totalCases: 0,
    totalPrice: 0,
    discountAmount: 0,
    finalTotal: 0,
  });

  /**
   * pickPrice — mirrors backend priority:
   * 1) variant label match (case-insensitive)
   * 2) product.prices[type] (e.g., prices.hybrid)
   * 3) product.hybridBreakdown[type]
   * 4) fallback to product-level price/discountPrice
   */
  const pickPrice = (product: any, typeOrLabel?: string | null) => {
    const norm = normKey(typeOrLabel ?? "");

    // 1) variants by label
    if (product.variants?.length) {
      const v = product.variants.find(
        (x: any) => norm && x.label && x.label.trim().toLowerCase() === norm
      );
      if (v)
        return {
          unitPrice: Number(v.price ?? 0),
          discountPrice: Number(v.discountPrice ?? 0),
        };
    }

    // 2) product.prices[type]
    if (product.prices && norm && product.prices[norm]) {
      const p = product.prices[norm];
      return {
        unitPrice: Number(p.price ?? 0),
        discountPrice: Number(p.discountPrice ?? p.price ?? 0),
      };
    }

    // 3) hybridBreakdown
    if (
      product.hybridBreakdown &&
      norm &&
      product.hybridBreakdown[norm] != null
    ) {
      return {
        unitPrice: Number(product.hybridBreakdown[norm] ?? 0),
        discountPrice: Number(product.discountPrice ?? 0),
      };
    }

    // 4) fallback product-level
    return {
      unitPrice: Number(product.price ?? 0),
      discountPrice: Number(product.discountPrice ?? product.price ?? 0),
    };
  };

  // Calculate totals + build items array for parent
  useEffect(() => {
    if (isLoading || !products) return;

    let totalCases = 0;
    let totalPrice = 0;
    const items: any[] = [];

    for (const [productId, val] of Object.entries(quantities)) {
      const product = products.find((p: any) => p._id === productId);
      if (!product) continue;

      let productTotal = 0;

      // 1) BLISS — driven by variants
      if (
        product.variants?.length &&
        product.productLine === "BLISS Cannabis Syrup"
      ) {
        for (const variant of product.variants) {
          const k = normKey(variant.label);
          const qty = Number((val as any)[k] || 0);
          if (qty > 0) {
            const { unitPrice, discountPrice } = pickPrice(
              product,
              variant.label
            );
            const effective =
              discountPrice && discountPrice > 0 ? discountPrice : unitPrice;
            items.push({
              product: productId,
              qty,
              unitLabel: variant.label,
            });
            totalCases += qty;
            productTotal += qty * effective;
          }
        }
      }
      // 2) Cannacrispy — hybrid types
      else if (product.productLine === "Cannacrispy") {
        for (const type of ["hybrid", "indica", "sativa"]) {
          const qty = Number((val as any)[type] || 0);
          if (qty > 0) {
            const { unitPrice, discountPrice } = pickPrice(product, type);
            const effective =
              discountPrice && discountPrice > 0 ? discountPrice : unitPrice;
            items.push({ product: productId, qty, unitLabel: type });
            totalCases += qty;
            productTotal += qty * effective;
          }
        }
      }
      // 3) Default products — simple qty
      else {
        const qty = Number((val as any).qty || 0);
        if (qty > 0) {
          const { unitPrice, discountPrice } = pickPrice(product, null);
          const effective =
            discountPrice && discountPrice > 0 ? discountPrice : unitPrice;
          items.push({ product: productId, qty });
          totalCases += qty;
          productTotal += qty * effective;
        }
      }

      totalPrice += productTotal;
    }

    // Discount calculation — we keep both styles:
    // - Flat: numeric amount
    // - Percent: based on subtotal
    let discountAmount = 0;
    if (discountType === "flat") discountAmount = Number(discountValue || 0);
    else discountAmount = (totalPrice * Number(discountValue || 0)) / 100;

    const roundedSubtotal = Number(totalPrice.toFixed(2));
    const roundedDiscount = Number(discountAmount.toFixed(2));
    const finalTotal = Number(
      Math.max(roundedSubtotal - roundedDiscount, 0).toFixed(2)
    );

    setTotals({
      totalCases,
      totalPrice: roundedSubtotal,
      discountAmount: roundedDiscount,
      finalTotal,
    });

    // Send to parent: numeric `discount` (amount) + type/value for context
    onChange(items, {
      totalCases,
      totalPrice: roundedSubtotal,
      discount: roundedDiscount, // backend can consume this directly
      finalTotal,
      discountType,
      discountValue,
      note,
    });
  }, [
    isLoading,
    products,
    quantities,
    discountType,
    discountValue,
    note,
    onChange,
  ]);

  const renderPrice = (regular?: number, discount?: number) => {
    if (discount && discount < (regular ?? 0)) {
      return (
        <div className="text-xs text-gray-600">
          <span className="line-through text-red-500 mr-1">
            ${Number(regular ?? 0).toFixed(2)}
          </span>
          <span className="text-emerald-600 font-medium">
            ${Number(discount).toFixed(2)}
          </span>
        </div>
      );
    }
    if (regular != null) {
      return (
        <div className="text-xs text-gray-600">
          ${Number(regular).toFixed(2)}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  const hasDiscount = (product: any): boolean => {
    // Case 1: Fifty-One Fifty → directly uses applyDiscount
    if (product.productLine === "Fifty-One Fifty") {
      return !!product.applyDiscount;
    }

    // Case 2: BLISS Cannabis Syrup → check inside variants
    if (product.productLine === "BLISS Cannabis Syrup") {
      return product.variants?.some(
        (v: any) => v.discountPrice && v.discountPrice < v.price
      );
    }

    // Case 3: Cannacrispy → check inside prices object
    if (product.productLine === "Cannacrispy") {
      const priceValues = Object.values(product.prices || {});
      return priceValues.some(
        (p: any) => p.discountPrice && p.discountPrice < p.price
      );
    }

    // Default → no discount
    return false;
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedProducts).map(([line, items]) => (
        <Card key={line} className="p-4 bg-gray-50">
          <h2 className="font-semibold text-lg mb-3">{line}</h2>
          <div className="space-y-3">
            {items.map((product: any) => (
              <div
                key={product._id}
                className="grid grid-cols-12 items-center gap-3 bg-white p-3 rounded border"
              >
                <div className="col-span-3 font-medium text-sm flex items-center gap-3">
                  <span
                    className={cn(
                      "w-24",
                      hasDiscount(product)
                        ? "text-green-600 font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {product.subProductLine || product.itemName}
                  </span>

                  {hasDiscount(product) && (
                    <span className="mt-1">
                      <Checkbox className="border border-accent cursor-pointer" onClick={() => setDisountChecked(!discountChecked)} />
                    </span>
                  )}
                </div>

                {/* BLISS Cannabis Syrup */}
                {product.variants?.length &&
                product.productLine === "BLISS Cannabis Syrup" ? (
                  <>
                    {product.variants.map((variant: any) => {
                      const key = normKey(variant.label);
                      return (
                        <div
                          key={variant.label}
                          className="col-span-3 flex flex-col"
                        >
                          <Label className="text-xs text-gray-500 mb-1">
                            {variant.label}
                          </Label>
                          {renderPrice(
                            Number(variant.price ?? 0),
                            variant.discountPrice != null
                              ? Number(variant.discountPrice)
                              : undefined
                          )}
                          <Input
                            type="number"
                            min="0"
                            className="h-8 border-emerald-500"
                            value={quantities[product._id]?.[key] ?? ""}
                            onChange={(e) =>
                              handleQtyChange(
                                product._id,
                                key,
                                parseFloat(e.target.value || "0") || 0
                              )
                            }
                          />
                        </div>
                      );
                    })}
                  </>
                ) : product.productLine === "Cannacrispy" ? (
                  // Cannacrispy — show hybrid/indica/sativa
                  <>
                    {["hybrid", "indica", "sativa"].map((type) => {
                      const { unitPrice, discountPrice } = pickPrice(
                        product,
                        type
                      );
                      const regular = unitPrice;
                      const discount =
                        discountPrice && discountPrice > 0
                          ? discountPrice
                          : undefined;
                      return (
                        <div key={type} className="col-span-3 flex flex-col">
                          <Label className="text-xs text-gray-500 mb-1 capitalize">
                            {type}
                          </Label>
                          {renderPrice(regular, discount)}
                          <Input
                            type="number"
                            min="0"
                            className="h-8 border-emerald-500"
                            value={quantities[product._id]?.[type] ?? ""}
                            onChange={(e) =>
                              handleQtyChange(
                                product._id,
                                type,
                                parseFloat(e.target.value || "0") || 0
                              )
                            }
                          />
                        </div>
                      );
                    })}
                  </>
                ) : (
                  // Default — single qty
                  <div className="col-span-3 flex flex-col">
                    <Label className="text-xs text-gray-500 mb-1">
                      Quantity
                    </Label>
                    {renderPrice(
                      Number(product.price ?? 0),
                      product.discountPrice != null
                        ? Number(product.discountPrice)
                        : undefined
                    )}
                    <Input
                      type="number"
                      min="0"
                      className="h-8 border-emerald-500"
                      value={quantities[product._id]?.qty ?? ""}
                      onChange={(e) =>
                        handleQtyChange(
                          product._id,
                          "qty",
                          parseFloat(e.target.value || "0") || 0
                        )
                      }
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Separator className="my-4" />

      {/* Summary */}
      <Card className="p-4 bg-white border">
        <h3 className="font-semibold mb-3">Order Summary</h3>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Total Cases:</span>
            <span className="font-medium">{totals.totalCases}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span className="font-medium">${totals.totalPrice.toFixed(2)}</span>
          </div>

          <div className="flex gap-3 items-center">
            <select
              value={discountType}
              onChange={(e) =>
                setDiscountType(e.target.value as "flat" | "percent")
              }
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="flat">Flat ($)</option>
              <option value="percent">Percent (%)</option>
            </select>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
              placeholder="Enter discount"
              className="w-32 border-emerald-500"
            />
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Discount:</span>
            <span>- ${totals.discountAmount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between font-semibold text-emerald-700">
            <span>Final Total:</span>
            <span>${totals.finalTotal.toFixed(2)}</span>
          </div>

          <div className="space-y-1">
            <Label htmlFor="order-note">Note</Label>
            <Textarea
              id="order-note"
              placeholder="Add any special notes or instructions for this order..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
