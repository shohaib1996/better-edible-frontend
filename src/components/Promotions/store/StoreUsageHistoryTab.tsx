"use client";

import { Loader2 } from "lucide-react";
import { useGetStorePromoUsageQuery } from "@/redux/api/Promotions/promotionsApi";
import type { IPromotionUsage } from "@/types/promotions/promotions";
import { fmtDate } from "@/utils/promotionHelpers";

export function StoreUsageHistoryTab({ storeId }: { storeId: string }) {
  const { data, isLoading } = useGetStorePromoUsageQuery({ storeId, limit: 50 });
  const usages: IPromotionUsage[] = data?.usages ?? [];

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-8">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Loading usage history…</span>
    </div>
  );

  if (!usages.length) return (
    <p className="text-sm text-muted-foreground py-8">No promotions applied to your orders yet.</p>
  );

  return (
    <div className="flex flex-col gap-2">
      {usages.map((u) => {
        const promo = typeof u.promotionId === "object" ? u.promotionId : null;
        const promoName = promo ? promo.name : "Promotion";
        const promoCode = promo?.code;
        return (
          <div key={u._id} className="rounded-xs border bg-card px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">{promoName}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {promoCode && <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{promoCode}</code>}
                <span>{fmtDate(u.appliedAt)}</span>
                <span className="capitalize">{u.appliedBy}</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-green-700 shrink-0">
              -${u.discountAmount.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
