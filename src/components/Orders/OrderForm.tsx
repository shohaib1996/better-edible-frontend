"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useGetAllProductsQuery } from "@/redux/api/Products/productsApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  sortCannaCrispyProducts,
  isCannaCrispy,
} from "@/utils/productOrdering";

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

export const OrderForm: React.FC<OrderFormProps> = ({
  initialItems = [],
  initialDiscountType,
  initialDiscountValue = 0,
  initialNote = "",
  onChange,
}) => {
  const { data, isLoading } = useGetAllProductsQuery({});
  const products = useMemo(() => data?.products || [], [data]);
  console.log(initialDiscountType);

  const [quantities, setQuantities] = useState<Record<string, any>>({});
  const [discountType, setDiscountType] = useState(initialDiscountType);
  const [discountValue, setDiscountValue] =
    useState<number>(initialDiscountValue);
  const [note, setNote] = useState<string>(initialNote);

  // per-product toggles keyed by productId string
  const [discountToggles, setDiscountToggles] = useState<
    Record<string, boolean>
  >({});

  const normKey = (s?: string | null) =>
    s ? String(s).trim().toLowerCase() : "";

  // Helper to get product line configuration
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

  // Initialize quantities and discount toggles when editing an existing order
  useEffect(() => {
    if (initialItems?.length && products.length) {
      // Quantities map
      const newQuantities = initialItems.reduce(
        (acc, item) => {
          const rawProd = item.product;
          const productId = String(
            (rawProd && (rawProd._id ?? rawProd)) ?? rawProd,
          );
          const product = products.find(
            (p: any) => String(p._id) === productId,
          );
          if (!product) return acc;

          const config = getProductLineConfig(product);
          let key = "qty";

          if (item.unitLabel) {
            key = normKey(item.unitLabel);
          } else if (
            config.pricingType === "multi-type" &&
            config.typeLabels.length > 0
          ) {
            // For multi-type products, try to infer the type from the item name
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

      // Build toggles: prefer explicit `appliedDiscount` saved on order items
      const newToggles: Record<string, boolean> = {};
      for (const it of initialItems) {
        const pid = String(
          (it.product && (it.product._id ?? it.product)) ?? it.product,
        );
        // If the backend saved appliedDiscount for that item, honor it.
        if (typeof it.appliedDiscount === "boolean") {
          // If any item entry for that product has appliedDiscount true, mark product toggled.
          newToggles[pid] = newToggles[pid] || Boolean(it.appliedDiscount);
          continue;
        }
        // Fallback inference: if discountPrice exists and lineTotal matches qty * discountPrice, infer applied
        if (it.discountPrice && Number(it.discountPrice) > 0 && it.qty) {
          const inferred =
            Math.abs(
              Number(it.lineTotal || 0) -
                Number(it.qty || 0) * Number(it.discountPrice),
            ) < 0.01;
          newToggles[pid] = newToggles[pid] || inferred;
        }
      }

      // Replace toggles with init values (don't merge with stale toggles) so modal shows saved state.
      setDiscountToggles(newToggles);
    } else {
      setQuantities({});
      setDiscountToggles({});
    }
    // intentionally depend on serialized initialItems and products so it runs after products load
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const groupedProducts = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of products) {
      // Handle both populated productLine object and string
      const lineName =
        typeof p.productLine === "string"
          ? p.productLine
          : p.productLine?.name || "Uncategorized";
      if (!map[lineName]) map[lineName] = [];
      map[lineName].push(p);
    }

    // Apply CannaCrispy ordering
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

  const [totals, setTotals] = useState({
    totalCases: 0,
    totalPrice: 0,
    discountAmount: 0,
    finalTotal: 0,
  });

  /**
   * pickPrice — priority:
   * 1) variant label
   * 2) product.prices[type]
   * 3) hybridBreakdown
   * 4) product-level
   *
   * IMPORTANT: returns `discountPrice` only when the product's discount toggle is ON.
   * If discount is not allowed (toggle off) returns `discountPrice: undefined`.
   */
  const pickPrice = (product: any, typeOrLabel?: string | null) => {
    const norm = normKey(typeOrLabel ?? "");
    const pid = String(product._id);
    const discountAllowed = !!discountToggles[pid];

    // variant
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

    // prices[type]
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

    // hybridBreakdown
    if (
      product.hybridBreakdown &&
      norm &&
      product.hybridBreakdown[norm] != null
    ) {
      return {
        unitPrice: Number(product.hybridBreakdown[norm] ?? 0),
        discountPrice:
          discountAllowed && product.discountPrice != null
            ? Number(product.discountPrice)
            : undefined,
      };
    }

    // fallback product-level
    return {
      unitPrice: Number(product.price ?? 0),
      discountPrice:
        discountAllowed && product.discountPrice != null
          ? Number(product.discountPrice)
          : undefined,
    };
  };

  // Build items (with applyDiscount flag) and calculate totals
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

      // Variants pricing (e.g., BLISS Cannabis Syrup)
      if (config.pricingType === "variants" && product.variants?.length) {
        for (const variant of product.variants) {
          const k = normKey(variant.label);
          const qty = Number((val as any)[k] || 0);
          if (qty > 0) {
            const { unitPrice, discountPrice } = pickPrice(
              product,
              variant.label,
            );
            const effective = (discountPrice ?? unitPrice) as number;
            itemsForParent.push({
              product: productId,
              qty,
              unitLabel: variant.label,
              applyDiscount: applyDiscountFlag,
            });
            totalCases += qty;
            productTotal += qty * effective;
          }
        }
      }
      // Multi-type pricing (e.g., Cannacrispy with hybrid/indica/sativa)
      else if (
        config.pricingType === "multi-type" &&
        config.typeLabels.length > 0
      ) {
        for (const type of config.typeLabels) {
          const qty = Number((val as any)[normKey(type)] || 0);
          if (qty > 0) {
            const { unitPrice, discountPrice } = pickPrice(product, type);
            const effective = (discountPrice ?? unitPrice) as number;
            itemsForParent.push({
              product: productId,
              qty,
              unitLabel: type,
              applyDiscount: applyDiscountFlag,
            });
            totalCases += qty;
            productTotal += qty * effective;
          }
        }
      }
      // Simple pricing (default single-qty products)
      else {
        const qty = Number((val as any).qty || 0);
        if (qty > 0) {
          const { unitPrice, discountPrice } = pickPrice(product, null);
          const effective = (discountPrice ?? unitPrice) as number;
          itemsForParent.push({
            product: productId,
            qty,
            unitLabel: null,
            applyDiscount: applyDiscountFlag,
          });
          totalCases += qty;
          productTotal += qty * effective;
        }
      }

      totalPrice += productTotal;
    }

    // Top-level discount (flat or percent)
    let discountAmount = 0;
    if (discountType === "flat") discountAmount = Number(discountValue || 0);
    else discountAmount = (totalPrice * Number(discountValue || 0)) / 100;

    const roundedSubtotal = Number(totalPrice.toFixed(2));
    const roundedDiscount = Number(discountAmount.toFixed(2));
    const finalTotal = Number(
      Math.max(roundedSubtotal - roundedDiscount, 0).toFixed(2),
    );

    setTotals({
      totalCases,
      totalPrice: roundedSubtotal,
      discountAmount: roundedDiscount,
      finalTotal,
    });

    // send build items + totals to parent (items include applyDiscount flag)
    onChange(itemsForParent, {
      totalCases,
      totalPrice: roundedSubtotal,
      discount: roundedDiscount,
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
    discountToggles,
  ]);

  const renderPrice = (regular?: number, discount?: number) => {
    if (discount != null && discount < (regular ?? 0)) {
      return (
        <div className="text-xs text-muted-foreground">
          <span className="line-through text-accent mr-1">
            ${Number(regular ?? 0).toFixed(2)}
          </span>
          <span className="text-primary font-semibold">
            ${Number(discount).toFixed(2)}
          </span>
        </div>
      );
    }
    if (regular != null) {
      return (
        <div className="text-xs text-muted-foreground">
          ${Number(regular).toFixed(2)}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasDiscount = (product: any): boolean => {
    const config = getProductLineConfig(product);

    // Simple pricing - check product-level discount
    if (config.pricingType === "simple") {
      return (
        !!product.applyDiscount ||
        (product.discountPrice && product.discountPrice < product.price)
      );
    }

    // Variants pricing - check if any variant has discount
    if (config.pricingType === "variants" && product.variants?.length) {
      return product.variants.some(
        (v: any) => v.discountPrice && v.discountPrice < v.price,
      );
    }

    // Multi-type pricing - check if any type has discount
    if (config.pricingType === "multi-type" && product.prices) {
      const priceValues = Object.values(product.prices || {});
      return priceValues.some(
        (p: any) => p.discountPrice && p.discountPrice < p.price,
      );
    }

    return false;
  };

  return (
    <div className="space-y-3 max-w-7xl mx-auto">
      {/* Order Sheet Header */}
      <div className="bg-linear-to-r from-primary to-secondary p-3 rounded-xs">
        <h1 className="text-lg font-bold text-primary-foreground tracking-wide">
          ORDER SHEET
        </h1>
      </div>

      {/* Products Table */}
      <div className="space-y-2">
        {Object.entries(groupedProducts).map(([line, items]) => (
          <Card
            key={line}
            className="p-2 bg-muted/30 border-border rounded-xs shadow-sm"
          >
            <div className="bg-card px-2 py-1 rounded-xs mb-2 border-l-4 border-primary">
              <h2 className="font-bold text-sm text-foreground">{line}</h2>
            </div>
            <div className="space-y-1.5">
              {items.map((product: any) => {
                const pid = String(product._id);
                const isChecked = !!discountToggles[pid];
                const config = getProductLineConfig(product);

                return (
                  <div
                    key={pid}
                    className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 bg-card p-2 rounded-xs border border-border hover:border-primary/50 transition-colors"
                  >
                    {/* Product Name + Discount Toggle */}
                    <div className="sm:col-span-3 font-medium text-sm flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              "flex-1 truncate text-xs sm:text-sm cursor-help",
                              hasDiscount(product)
                                ? "text-primary font-bold"
                                : "text-muted-foreground",
                            )}
                          >
                            {product.subProductLine || product.itemName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-card text-foreground border border-border rounded-xs shadow-lg max-w-xs"
                        >
                          <div className="space-y-1">
                            <p className="font-bold text-xs">
                              {product.subProductLine || product.itemName}
                            </p>
                            {product.itemName && product.subProductLine && (
                              <p className="text-[10px] text-muted-foreground">
                                {product.itemName}
                              </p>
                            )}
                            {config.name && (
                              <p className="text-[10px] text-muted-foreground">
                                Product Line: {config.name}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      {hasDiscount(product) && (
                        <Checkbox
                          className="border-2 border-primary cursor-pointer rounded-xs h-4 w-4 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            setDiscountToggles((prev) => ({
                              ...prev,
                              [pid]: !!checked,
                            }))
                          }
                        />
                      )}
                    </div>

                    {/* Variants pricing */}
                    {config.pricingType === "variants" &&
                    product.variants?.length ? (
                      <div className="sm:col-span-9 grid grid-cols-3 gap-2">
                        {product.variants.map((variant: any) => {
                          const key = normKey(variant.label);
                          const regular = Number(variant.price ?? 0);
                          const discount =
                            variant.discountPrice != null
                              ? Number(variant.discountPrice)
                              : undefined;
                          return (
                            <div
                              key={variant.label}
                              className="flex flex-col gap-0.5"
                            >
                              <Label className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                                {variant.label}
                              </Label>
                              {renderPrice(
                                regular,
                                isChecked ? discount : undefined,
                              )}
                              <Input
                                type="number"
                                min="0"
                                className="h-7 text-xs border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xs px-2"
                                value={quantities[pid]?.[key] ?? ""}
                                onChange={(e) =>
                                  handleQtyChange(
                                    pid,
                                    key,
                                    parseFloat(e.target.value || "0") || 0,
                                  )
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : config.pricingType === "multi-type" &&
                      config.typeLabels.length > 0 ? (
                      <div className="sm:col-span-9 grid grid-cols-3 gap-2">
                        {config.typeLabels.map((type: string) => {
                          const { unitPrice, discountPrice } = pickPrice(
                            product,
                            type,
                          );
                          const regular = unitPrice;
                          const discount =
                            discountPrice && discountPrice > 0
                              ? discountPrice
                              : undefined;
                          return (
                            <div key={type} className="flex flex-col gap-0.5">
                              <Label className="text-[10px] sm:text-xs text-muted-foreground font-medium capitalize">
                                {type}
                              </Label>
                              {renderPrice(
                                regular,
                                isChecked ? discount : undefined,
                              )}
                              <Input
                                type="number"
                                min="0"
                                className="h-7 text-xs border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xs px-2"
                                value={quantities[pid]?.[normKey(type)] ?? ""}
                                onChange={(e) =>
                                  handleQtyChange(
                                    pid,
                                    normKey(type),
                                    parseFloat(e.target.value || "0") || 0,
                                  )
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="sm:col-span-9 flex flex-col gap-0.5">
                        <Label className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                          Quantity
                        </Label>
                        {renderPrice(
                          Number(product.price ?? 0),
                          isChecked && product.discountPrice != null
                            ? Number(product.discountPrice)
                            : undefined,
                        )}
                        <Input
                          type="number"
                          min="0"
                          className="h-7 text-xs border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xs px-2 max-w-xs"
                          value={quantities[pid]?.qty ?? ""}
                          onChange={(e) =>
                            handleQtyChange(
                              pid,
                              "qty",
                              parseFloat(e.target.value || "0") || 0,
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Separator className="my-3 bg-border" />

      {/* Order Summary */}
      <Card className="p-3 bg-card border-border rounded-xs shadow-md">
        <div className="bg-linear-to-r from-primary/10 to-secondary/10 px-2 py-1.5 rounded-xs mb-3 border-l-4 border-primary">
          <h3 className="font-bold text-sm text-foreground">ORDER SUMMARY</h3>
        </div>
        <div className="space-y-2">
          {/* Total Cases */}
          <div className="flex justify-between items-center text-xs sm:text-sm px-2 py-1 bg-muted/20 rounded-xs">
            <span className="text-muted-foreground font-medium">
              Total Cases:
            </span>
            <span className="font-bold text-foreground">
              {totals.totalCases}
            </span>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between items-center text-xs sm:text-sm px-2 py-1 bg-muted/20 rounded-xs">
            <span className="text-muted-foreground font-medium">Subtotal:</span>
            <span className="font-bold text-foreground">
              ${totals.totalPrice.toFixed(2)}
            </span>
          </div>

          {/* Discount Section */}
          <div className="bg-muted/30 p-2 rounded-xs border border-border">
            <Label className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1 block">
              Apply Discount
            </Label>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as "flat" | "percent")
                }
                className="bg-input border border-border rounded-xs px-2 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
              >
                <option value="flat">Flat ($)</option>
                <option value="percent">Percent (%)</option>
              </select>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="flex-1 sm:flex-initial h-8 text-xs border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xs px-2"
              />
            </div>
          </div>

          {/* Discount Amount */}
          <div className="flex justify-between items-center text-xs sm:text-sm px-2 py-1 bg-accent/10 rounded-xs border border-accent/30">
            <span className="text-muted-foreground font-medium">Discount:</span>
            <span className="font-bold text-accent">
              - ${totals.discountAmount.toFixed(2)}
            </span>
          </div>

          {/* Final Total */}
          <div className="flex justify-between items-center text-sm sm:text-base px-3 py-2 bg-linear-to-r from-primary/20 to-secondary/20 rounded-xs border-2 border-primary">
            <span className="font-bold text-foreground">FINAL TOTAL:</span>
            <span className="font-bold text-xl text-primary">
              ${totals.finalTotal.toFixed(2)}
            </span>
          </div>

          {/* Notes Section */}
          <div className="pt-2">
            <Label
              htmlFor="order-note"
              className="text-xs text-muted-foreground font-medium mb-1 block"
            >
              Order Notes
            </Label>
            <Textarea
              id="order-note"
              placeholder="Add special notes or instructions..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="text-xs border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xs resize-none bg-input"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
