"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChefHat, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAdminUser } from "@/lib/ppsUser";
import { useGetStage1CookItemsQuery } from "@/redux/api/PrivateLabel/ppsApi";
import Stage1CookItemCard from "@/components/PPS/stage1/Stage1CookItemCard";

export interface Stage1OrderDetailProps {
  orderId: string;
  backRoute: string;
  nextOrderRoute: string;
  doneRoute: string;
  compact?: boolean;
  headerExtra?: React.ReactNode;
}

export default function Stage1OrderDetail({
  orderId,
  backRoute,
  nextOrderRoute,
  doneRoute,
  compact,
  headerExtra,
}: Stage1OrderDetailProps) {
  const router = useRouter();
  const isAdmin = isAdminUser();

  const { data, isLoading, isError } = useGetStage1CookItemsQuery();
  const allItems = data?.cookItems ?? [];
  const orderItems = allItems.filter((item) => item.orderId === orderId);
  const storeName = orderItems[0]?.storeName;

  const [batchStarted, setBatchStarted] = useState(false);
  const allComplete =
    orderItems.length > 0 && orderItems.every((i) => i.status === "cooking_molding_complete");

  const completedCountRef = useRef(0);

  const handleItemDone = useCallback(() => {
    completedCountRef.current += 1;
    if (completedCountRef.current >= orderItems.length) {
      const otherOrders = Array.from(
        new Set(
          allItems
            .filter((i) => i.orderId !== orderId && ["pending", "in-progress"].includes(i.status))
            .map((i) => i.orderId),
        ),
      );
      router.push(
        otherOrders.length > 0
          ? `${nextOrderRoute}/${encodeURIComponent(otherOrders[0])}`
          : doneRoute,
      );
    }
  }, [allItems, orderId, orderItems.length, router, nextOrderRoute, doneRoute]);

  if (isLoading) {
    return compact ? (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /><span>Loading…</span>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin" /><p className="text-xl">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`text-destructive py-12 text-center ${compact ? "text-sm" : "text-lg"}`}>
        Failed to load cook items. Check your connection and try again.
      </div>
    );
  }

  return (
    <div className={compact ? "p-4 md:p-8 bg-background min-h-screen" : "p-4 md:p-6 bg-background flex-1 overflow-y-auto overscroll-contain"}>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push(backRoute)} className={compact ? "shrink-0" : "shrink-0 w-12 h-12"}>
          <ArrowLeft className={compact ? "w-5 h-5" : "w-6 h-6"} />
        </Button>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ChefHat className={`${compact ? "w-8 h-8" : "w-10 h-10"} text-primary shrink-0`} />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight truncate">
              {storeName ?? "Stage 1 — Cooking & Molding"}
            </h1>
            <p className={`${compact ? "text-base" : "text-lg"} text-muted-foreground font-mono`}>
              Order {orderId}
            </p>
          </div>
        </div>
        {headerExtra}
      </div>

      {orderItems.length === 0 ? (
        <div className={`flex flex-col items-center ${compact ? "gap-3" : "gap-4"} py-20 text-muted-foreground`}>
          <ChefHat className={`${compact ? "w-10 h-10" : "w-14 h-14"} opacity-40`} />
          <p className={compact ? "text-base" : "text-xl"}>No Stage 1 items found for order {orderId}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {!allComplete && (
            <Button
              size="lg"
              onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); setBatchStarted(true); }}
              disabled={batchStarted}
              className={`w-full ${compact ? "text-2xl h-16" : "text-2xl h-18 py-5"} rounded-xs font-bold transition-colors ${batchStarted ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
            >
              {batchStarted ? (
                <><CheckCircle2 className={`${compact ? "w-6 h-6" : "w-7 h-7"} mr-2`} />Molding in Progress</>
              ) : "Start All"}
            </Button>
          )}
          {allComplete && (
            <div className={`flex items-center gap-${compact ? "3" : "4"} px-5 ${compact ? "py-4" : "py-5"} rounded-xs bg-green-50 border border-green-200 text-green-700`}>
              <CheckCircle2 className={`${compact ? "w-7 h-7" : "w-9 h-9"} shrink-0`} />
              <p className={compact ? "text-xl font-semibold" : "text-2xl font-bold"}>
                All items complete — ready for Stage 2
              </p>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {orderItems.map((item) => (
              <Stage1CookItemCard
                key={item._id}
                item={item}
                isAdmin={isAdmin}
                batchStarted={batchStarted}
                onItemDone={handleItemDone}
                compact={compact}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
