"use client";

import { Loader2, Zap } from "lucide-react";
import { useGetPublicPromotionsQuery } from "@/redux/api/Promotions/promotionsApi";
import { PromoCard } from "./PromoCard";

export function StoreAvailableTab({ storeId }: { storeId: string }) {
  const { data, isLoading } = useGetPublicPromotionsQuery({ storeId });
  const promotions = data?.promotions ?? [];

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
    <div className="grid gap-4 sm:grid-cols-2">
      {promotions.map((promo) => <PromoCard key={promo._id} promo={promo} />)}
    </div>
  );
}
