"use client";

import { Loader2, ImageIcon, Minus, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ILabel } from "@/types";
import { cn } from "@/lib/utils";

const STEP = 140;

interface Props {
  selectedClientId: string;
  labels: ILabel[] | undefined;
  isLoading: boolean;
  quantities: Record<string, number>;
  onQuantityChange: (labelId: string, qty: number) => void;
  onPreviewImage?: (url: string, filename: string) => void;
}

export function LabelPicker({
  selectedClientId,
  labels,
  isLoading,
  quantities,
  onQuantityChange,
  onPreviewImage,
}: Props) {
  if (!selectedClientId) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const orderableLabels = (labels ?? []).filter((l) => (l.unitPrice || 0) > 0);

  if (!labels || labels.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No approved labels found for this client.
      </p>
    );
  }

  if (orderableLabels.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No labels have pricing configured yet. Contact an admin to set up product pricing.
      </p>
    );
  }

  return (
    <div>
      <Label>Labels & Quantities *</Label>
      <div className="mt-2 space-y-2">
        {orderableLabels.map((label) => {
          const qty = quantities[label._id] || 0;
          const unitPrice = label.unitPrice || 0;
          const lineTotal = qty * unitPrice;
          const isOrdered = qty > 0;
          const img = label.labelImages?.[0];

          return (
            <div
              key={label._id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xs border transition-colors bg-card",
                isOrdered
                  ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                  : "border-border dark:border-white/20"
              )}
            >
              {/* Thumbnail */}
              <div
                className={cn("relative w-12 h-12 shrink-0 overflow-hidden rounded-xs bg-muted border border-border cursor-pointer")}
                onClick={() => {
                  if (onPreviewImage && img) {
                    onPreviewImage(
                      img.secureUrl || img.url,
                      img.originalFilename || `${label.flavorName}-label`
                    );
                  }
                }}
              >
                {img ? (
                  <img src={img.secureUrl || img.url} alt={label.flavorName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Label info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{label.flavorName}</p>
                <p className="text-xs text-muted-foreground">
                  {label.productType} · ${unitPrice.toFixed(2)}/unit
                </p>
              </div>

              {/* − qty + controls */}
              <div className="flex items-center shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onQuantityChange(label._id, Math.max(0, qty - STEP))}
                  className="rounded-l-xs rounded-r-none h-8 w-8 border-border dark:border-white/20"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={qty}
                  onChange={(e) => onQuantityChange(label._id, Math.max(0, Number(e.target.value) || 0))}
                  min={0}
                  step={STEP}
                  className="w-20 h-8 rounded-none border-x-0 border-border dark:border-white/20 bg-card text-sm text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onQuantityChange(label._id, qty + STEP)}
                  className="rounded-r-xs rounded-l-none h-8 w-8 border-border dark:border-white/20"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Line total */}
              <span className={cn("text-sm font-medium w-16 text-right shrink-0", isOrdered ? "text-foreground" : "text-muted-foreground")}>
                {isOrdered ? `$${lineTotal.toFixed(2)}` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
