"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useGetAllProductsQuery } from "@/src/redux/api/Products/productsApi";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { Loader2 } from "lucide-react";

interface OrderFormProps {
  initialItems?: any[];
  initialDiscountType?: "flat" | "percent";
  initialDiscountValue?: number;
  onChange: (
    items: any[],
    totals: {
      totalCases: number;
      totalPrice: number;
      discount: number;
      finalTotal: number;
      discountType: "flat" | "percent";
      discountValue: number;
    }
  ) => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialItems = [],
  initialDiscountType = "flat",
  initialDiscountValue = 0,
  onChange,
}) => {
  const { data, isLoading } = useGetAllProductsQuery({});
  const products = data?.products || [];

  const [quantities, setQuantities] = useState<Record<string, any>>({});
  const [discountType, setDiscountType] = useState(initialDiscountType);
  const [discountValue, setDiscountValue] = useState(initialDiscountValue);

  useEffect(() => {
    setDiscountType(initialDiscountType);
    setDiscountValue(initialDiscountValue);
  }, [initialDiscountType, initialDiscountValue]);

  // ─────────────────────────────
  // Initialize from edit mode
  // ─────────────────────────────
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      const newQuantities = initialItems.reduce((acc, item) => {
        const productId = item.product;
        // Use unitLabel for variants, or a default 'qty' key for non-variants
        const key = item.unitLabel || "qty";
        
        if (!acc[productId]) {
          acc[productId] = {};
        }
        acc[productId][key] = item.qty;
        
        return acc;
      }, {} as Record<string, any>);
      setQuantities(newQuantities);
    } else {
      // Clear quantities when starting a new order
      setQuantities({});
    }
  }, [initialItems]);

  // ─────────────────────────────
  // Group products by productLine
  // ─────────────────────────────
  const groupedProducts = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const p of products) {
      if (!map[p.productLine]) map[p.productLine] = [];
      map[p.productLine].push(p);
    }
    return map;
  }, [products]);

  // ─────────────────────────────
  // Handle Input Change
  // ─────────────────────────────
  const handleQtyChange = (productId: string, key: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [key]: value },
    }));
  };

  // ─────────────────────────────
  // Calculate Totals + Discount
  // ─────────────────────────────
  const [totals, setTotals] = useState({
    totalCases: 0,
    totalPrice: 0,
    discountAmount: 0,
    finalTotal: 0,
  });

  useEffect(() => {
    if (isLoading) return; // Wait for products to load

    let totalCases = 0;
    let totalPrice = 0;
    const items: any[] = [];

    for (const [productId, val] of Object.entries(quantities)) {
      const product = products.find((p: any) => p._id === productId);
      if (!product) continue;

      let itemPrice = 0;

      if (product.variants?.length) {
        for (const variant of product.variants) {
          const qty = val[variant.label] || 0;
          if (qty > 0) {
            const price = variant.discountPrice || variant.price || 0;
            items.push({ product: productId, qty, unitLabel: variant.label });
            totalCases += qty;
            itemPrice += qty * price;
          }
        }
      } else if (product.hybridBreakdown) {
        for (const type of ["hybrid", "indica", "sativa"]) {
          const qty = val[type] || 0;
          if (qty > 0) {
            const price =
              product.prices?.[type]?.discountPrice ||
              product.prices?.[type]?.price ||
              0;
            items.push({ product: productId, qty, unitLabel: type });
            totalCases += qty;
            itemPrice += qty * price;
          }
        }
      } else {
        const qty = val.qty || 0;
        if (qty > 0) {
          const price = product.discountPrice || product.price || 0;
          items.push({ product: productId, qty });
          totalCases += qty;
          itemPrice = qty * price;
        }
      }
      totalPrice += itemPrice;
    }

    // Apply discount
    let discountAmount = 0;
    if (discountType === "flat") {
      discountAmount = discountValue;
    } else {
      discountAmount = (totalPrice * discountValue) / 100;
    }

    const finalTotal = Math.max(totalPrice - discountAmount, 0);

    const newTotalsForParent = {
      totalCases,
      totalPrice,
      discount: discountAmount,
      finalTotal,
      discountType,
      discountValue,
    };

    const newTotalsForRender = {
      totalCases,
      totalPrice,
      discountAmount,
      finalTotal,
    };

    onChange(items, newTotalsForParent);
    setTotals(newTotalsForRender);
  }, [isLoading, quantities, discountType, discountValue, onChange]); // Intentionally omitting `products` to prevent infinite loop

  // ─────────────────────────────
  // Helper: Render Price Display
  // ─────────────────────────────
  const renderPrice = (regular?: number, discount?: number) => {
    if (regular) {
      return (
        <div className="text-xs text-gray-600">${regular.toFixed(2)}</div>
      );
    }
    return null;
  };

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

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
                {/* Product name */}
                <div className="col-span-3 font-medium text-sm">
                  {product.subProductLine || product.itemName}
                </div>

                {/* Dynamic variants */}
                {product.variants?.length ? (
                  <>
                    {product.variants.map((variant: any) => (
                      <div key={variant.label} className="col-span-3 flex flex-col">
                        <Label className="text-xs text-gray-500 mb-1">{variant.label}</Label>
                        {renderPrice(variant.price, variant.discountPrice)}
                        <Input
                          type="number"
                          min="0"
                          className="h-8 border-emerald-500"
                          value={quantities[product._id]?.[variant.label] || ""}
                          onChange={(e) =>
                            handleQtyChange(
                              product._id,
                              variant.label,
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    ))}
                  </>
                ) : product.hybridBreakdown ? (
                  <>
                    {["hybrid", "indica", "sativa"].map((type) => {
                      const regular = product.prices?.[type]?.price;
                      const discount = product.prices?.[type]?.discountPrice;
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
                            value={quantities[product._id]?.[type] || ""}
                            onChange={(e) =>
                              handleQtyChange(
                                product._id,
                                type,
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="col-span-3 flex flex-col">
                    <Label className="text-xs text-gray-500 mb-1">
                      Quantity
                    </Label>
                    {renderPrice(product.price, product.discountPrice)}
                    <Input
                      type="number"
                      min="0"
                      className="h-8 border-emerald-500"
                      value={quantities[product._id]?.qty || ""}
                      onChange={(e) =>
                        handleQtyChange(
                          product._id,
                          "qty",
                          parseInt(e.target.value) || 0
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

      {/* Discount and Summary */}
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

          {/* Discount */}
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
              value={discountValue || ""}
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
        </div>
      </Card>
    </div>
  );
};
