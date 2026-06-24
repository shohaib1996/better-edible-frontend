"use client";

import { Loader2, Zap } from "lucide-react";
import { useGetStorePromotionsQuery } from "@/redux/api/Promotions/promotionsApi";
import { PromoCard } from "./PromoCard";

export function StoreAvailableTab({ storeId }: { storeId: string }) {
  const { data, isLoading } = useGetStorePromotionsQuery({ storeId });
  const promotions = data?.promotions ?? [];

  const personal = promotions.filter((p) => p.storeIds.length > 0);
  const general  = promotions.filter((p) => p.storeIds.length === 0);

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-8">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Loading promotions…</span>
    </div>
  );

  if (!promotions.length) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Zap className="w-10 h-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No active promotions available right now. Check back soon.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {personal.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
            Personal offers just for you
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {personal.map((promo) => <PromoCard key={promo._id} promo={promo} isPersonal />)}
          </div>
        </div>
      )}
      {general.length > 0 && (
        <div className="space-y-3">
          {personal.length > 0 && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Available to all stores
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {general.map((promo) => <PromoCard key={promo._id} promo={promo} />)}
          </div>
        </div>
      )}
    </div>
  );
}
