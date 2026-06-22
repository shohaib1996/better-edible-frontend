"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  useGetAvailablePromotionsQuery,
  useJoinPromotionMutation,
} from "@/redux/api/Promotions/promotionsApi";

interface Props {
  storeId: string;
}

export default function AvailablePromotionsTab({ storeId }: Props) {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const { data, isLoading } = useGetAvailablePromotionsQuery({ page, limit });
  const [joinPromotion] = useJoinPromotionMutation();

  const promotions = data?.promotions ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  async function handleJoin(promotionId: string, name: string) {
    setJoiningId(promotionId);
    try {
      await joinPromotion({ promotionId, storeId }).unwrap();
      toast.success(`Joined "${name}"`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to join promotion");
    } finally {
      setJoiningId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No promotions available right now. Check back soon.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {promotions.map((promo) => {
          const start = new Date(promo.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const end = new Date(promo.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const isJoining = joiningId === promo._id;

          return (
            <div key={promo._id} className="rounded-xs border bg-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold text-sm">{promo.name}</p>
                  <p className="text-xs text-muted-foreground">{promo.productName}</p>
                </div>
                <Badge className="rounded-xs bg-green-100 text-green-800 border-green-300 shrink-0 text-xs">
                  Active
                </Badge>
              </div>

              {promo.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{promo.description}</p>
              )}

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>SKU: <span className="font-mono text-foreground">{promo.sku}</span></span>
                <span>{start} — {end}</span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t">
                <div className="flex items-center gap-1 text-green-700 font-semibold text-sm">
                  <Zap className="w-3.5 h-3.5" />
                  ${promo.creditRatePerUnit.toFixed(2)} / unit sold
                </div>
                <Button
                  size="sm"
                  className="rounded-xs"
                  onClick={() => handleJoin(promo._id, promo.name)}
                  disabled={isJoining}
                >
                  {isJoining && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Join
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <GlobalPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={limit}
        onPageChange={setPage}
        onLimitChange={() => {}}
        limitOptions={[20]}
      />
    </div>
  );
}
