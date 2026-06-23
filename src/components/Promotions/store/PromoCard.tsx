"use client";

import { useState } from "react";
import { Copy, Check, Tag, Percent, Zap, Clock } from "lucide-react";
import type { IPromotion } from "@/types/promotions/promotions";
import { fmtDate, discountLabel } from "@/utils/promotionHelpers";

export function PromoCard({ promo }: { promo: IPromotion }) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (!promo.code) return;
    navigator.clipboard.writeText(promo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xs border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">{promo.name}</p>
          {promo.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{promo.description}</p>
          )}
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 rounded-xs bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 text-xs font-medium">
          {promo.type === "flat" ? <Tag className="w-3 h-3" /> : <Percent className="w-3 h-3" />}
          {discountLabel(promo.type, promo.value)}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {promo.minOrderAmount && (
          <span>Min. order: <strong className="text-foreground">${promo.minOrderAmount.toFixed(2)}</strong></span>
        )}
        {(promo.startDate || promo.endDate) && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {fmtDate(promo.startDate)} — {fmtDate(promo.endDate)}
          </span>
        )}
        {promo.autoApply && (
          <span className="flex items-center gap-1 text-purple-600">
            <Zap className="w-3 h-3" /> Auto-applied at checkout
          </span>
        )}
      </div>

      {promo.code && (
        <div className="flex items-center gap-2 pt-1 border-t">
          <p className="text-xs text-muted-foreground">Promo code:</p>
          <div className="flex items-center gap-1.5">
            <code className="bg-muted px-2.5 py-1 rounded text-sm font-mono font-semibold tracking-wide">
              {promo.code}
            </code>
            <button
              onClick={copyCode}
              className="p-1.5 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
