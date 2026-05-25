"use client";

import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCTION_QUANTITIES } from "@/constants/privateLabel";
import type { OrderItem } from "./CreateOrderModal";

interface Props {
  items: OrderItem[];
  onQuantityChange: (labelId: string, quantity: number) => void;
  onQuickQuantity: (labelId: string, type: "half" | "full") => void;
}

export function OrderQuantityList({ items, onQuantityChange, onQuickQuantity }: Props) {
  if (items.length === 0) return null;

  return (
    <div>
      <Label>Quantities</Label>
      <div className="mt-2 space-y-3">
        {items.map((item) => (
          <div
            key={item.labelId}
            className="p-3 border border-border dark:border-white/20 rounded-xs bg-card"
          >
            {/* Top row: image + info + line total */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 shrink-0 overflow-hidden rounded-xs bg-muted border border-border">
                {item.labelImageUrl ? (
                  <img
                    src={item.labelImageUrl}
                    alt={item.flavorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.flavorName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.productType} - ${item.unitPrice.toFixed(2)}/unit
                </p>
              </div>
              <span className="text-right font-medium shrink-0">
                ${item.lineTotal.toFixed(2)}
              </span>
            </div>

            {/* Bottom row: quick buttons + custom input */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={item.quantity === PRODUCTION_QUANTITIES.HALF_BATCH ? "default" : "outline"}
                size="sm"
                onClick={() => onQuickQuantity(item.labelId, "half")}
                className="rounded-xs"
              >
                Half (624)
              </Button>
              <Button
                type="button"
                variant={item.quantity === PRODUCTION_QUANTITIES.FULL_BATCH ? "default" : "outline"}
                size="sm"
                onClick={() => onQuickQuantity(item.labelId, "full")}
                className="rounded-xs"
              >
                Full (1248)
              </Button>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onQuantityChange(item.labelId, Number(e.target.value))}
                min={1}
                className="w-24 rounded-xs border-border dark:border-white/20 bg-card"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
