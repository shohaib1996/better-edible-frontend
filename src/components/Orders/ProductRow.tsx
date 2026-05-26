"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const normKey = (s?: string | null) =>
  s ? String(s).trim().toLowerCase() : "";

function pickPrice(
  product: any,
  typeOrLabel: string | null | undefined,
  discountAllowed: boolean,
) {
  const norm = normKey(typeOrLabel ?? "");

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
}

function renderPrice(regular?: number, discount?: number) {
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
}

const inputCls =
  "h-6 text-xs border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xs px-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface Props {
  product: any;
  config: { pricingType: string; variantLabels: string[]; typeLabels: string[] };
  pid: string;
  quantities: Record<string, any>;
  isChecked: boolean;
  hasDiscount: boolean;
  onQtyChange: (pid: string, key: string, value: number) => void;
  onDiscountToggle: (pid: string, checked: boolean) => void;
}

export function ProductRow({
  product,
  config,
  pid,
  quantities,
  isChecked,
  hasDiscount,
  onQtyChange,
  onDiscountToggle,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 bg-card p-2 rounded-xs border border-border hover:border-primary/50 transition-colors">
      <div className="sm:col-span-3 font-medium text-sm flex items-center gap-2">
        <span
          className={cn(
            "flex-1 wrap-break-word text-xs sm:text-sm",
            hasDiscount ? "text-primary font-bold" : "text-muted-foreground",
          )}
        >
          {product.subProductLine || product.itemName}
        </span>
        {hasDiscount && (
          <Checkbox
            className="border-2 border-primary cursor-pointer rounded-xs h-4 w-4 shrink-0 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            checked={isChecked}
            onCheckedChange={(checked) => onDiscountToggle(pid, !!checked)}
          />
        )}
      </div>

      {config.pricingType === "variants" && product.variants?.length ? (
        <div className="sm:col-span-9 grid grid-cols-3 gap-2">
          {product.variants.map((variant: any) => {
            const key = normKey(variant.label);
            const { unitPrice, discountPrice } = pickPrice(product, variant.label, isChecked);
            return (
              <div key={variant.label} className="flex flex-col gap-0.5">
                <Label className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {variant.label}
                </Label>
                {renderPrice(unitPrice, discountPrice)}
                <Input
                  type="number"
                  min="0"
                  className={inputCls}
                  value={quantities[pid]?.[key] || ""}
                  onChange={(e) =>
                    onQtyChange(pid, key, parseFloat(e.target.value || "0") || 0)
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
            );
          })}
        </div>
      ) : config.pricingType === "multi-type" && config.typeLabels.length > 0 ? (
        <div className="sm:col-span-9 grid grid-cols-3 gap-2">
          {config.typeLabels.map((type: string) => {
            const { unitPrice, discountPrice } = pickPrice(product, type, isChecked);
            return (
              <div key={type} className="flex flex-col gap-0.5">
                <Label className="text-[10px] sm:text-xs text-muted-foreground font-medium capitalize">
                  {type}
                </Label>
                {renderPrice(unitPrice, discountPrice)}
                <Input
                  type="number"
                  min="0"
                  className={inputCls}
                  value={quantities[pid]?.[normKey(type)] || ""}
                  onChange={(e) =>
                    onQtyChange(
                      pid,
                      normKey(type),
                      parseFloat(e.target.value || "0") || 0,
                    )
                  }
                  onWheel={(e) => e.currentTarget.blur()}
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
            className={inputCls}
            value={quantities[pid]?.qty || ""}
            onChange={(e) =>
              onQtyChange(pid, "qty", parseFloat(e.target.value || "0") || 0)
            }
            onWheel={(e) => e.currentTarget.blur()}
          />
        </div>
      )}
    </div>
  );
}
