"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAdminUser } from "@/lib/ppsUser";
import { CookItemCard } from "@/components/PPS/Stage4View";
import { useGetStage4CookItemsQuery } from "@/redux/api/PrivateLabel/ppsApi";

export default function LockedStage4OrderPage({
  params,
}: {
  params: Promise<{ stageNum: string; orderId: string }>;
}) {
  const { stageNum, orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();
  const isAdmin = isAdminUser();

  const { data, isLoading, isError } = useGetStage4CookItemsQuery();
  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === decodedOrderId);
  const storeName = orderItems[0]?.storeName;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center text-sm">
        Failed to load cook items. Check your connection and try again.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-background flex-1 overflow-y-auto overscroll-contain">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/pps/stage/${stageNum}`)} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Package className="w-8 h-8 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 4 — Packaging"}
            </h1>
            <p className="text-base text-muted-foreground font-mono">Order {decodedOrderId}</p>
          </div>
        </div>
      </div>

      {orderItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <Package className="w-10 h-10 opacity-40" />
          <p className="text-base">No Stage 4 items found for order {decodedOrderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orderItems.map((item) => (
            <CookItemCard
              key={item._id}
              item={item}
              isAdmin={isAdmin}
              basePath={`/pps/stage/${stageNum}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
