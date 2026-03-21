"use client";

import { useRouter } from "next/navigation";
import { Loader2, Wind, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetStage2CookItemsQuery } from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { ICookItem } from "@/types/privateLabel/pps";

// ─── Group cook items by orderId ──────────────────────────────────────────────

function groupByOrder(items: ICookItem[]): Map<string, ICookItem[]> {
  return items.reduce((map, item) => {
    const existing = map.get(item.orderId) ?? [];
    map.set(item.orderId, [...existing, item]);
    return map;
  }, new Map<string, ICookItem[]>());
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ orderId, items, basePath }: { orderId: string; items: ICookItem[]; basePath: string }) {
  const router = useRouter();
  const storeName = items[0]?.storeName ?? "Unknown Store";
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalMolds = items.reduce((sum, i) => sum + i.assignedMoldIds.length, 0);
  const processedMolds = items.reduce((sum, i) => sum + i.dehydratorAssignments.length, 0);
  const allLoaded = processedMolds >= totalMolds && totalMolds > 0;

  const statusCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <button
      type="button"
      className="w-full text-left rounded-xs border bg-card transition-all active:scale-[0.99] hover:border-primary/60 hover:shadow-md border-l-4 border-l-transparent"
      onClick={() => router.push(`${basePath}/stage2/${encodeURIComponent(orderId)}`)}
    >
      {/* Top section */}
      <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className="text-3xl font-bold leading-tight truncate text-foreground">{storeName}</p>
          <p className="text-base font-mono text-muted-foreground mt-0.5">Order {orderId}</p>
        </div>
        <ArrowRight className="w-8 h-8 text-primary shrink-0" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Units</p>
          <p className="text-2xl font-bold">{totalUnits.toLocaleString()}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Molds</p>
          <p className="text-2xl font-bold">{totalMolds}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Loaded</p>
          <p className={`text-2xl font-bold ${allLoaded ? "text-green-600" : ""}`}>
            {processedMolds}/{totalMolds}
          </p>
        </div>
      </div>

      {/* Flavor list */}
      <div className="px-5 pt-3 pb-2 flex flex-col gap-1.5">
        {items.map((item) => {
          const processed = item.dehydratorAssignments.length;
          const total = item.assignedMoldIds.length;
          return (
            <div key={item._id} className="flex items-center justify-between gap-3">
              <span className="text-lg font-medium truncate">{item.flavor}</span>
              <span className="shrink-0 text-base font-bold tabular-nums text-foreground">
                {processed}/{total} molds
              </span>
            </div>
          );
        })}
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 px-5 pb-4 pt-2 border-t mx-5 mt-1">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Badge
            key={status}
            variant="outline"
            className={`text-sm px-3 py-1 ${COOK_ITEM_STATUS_COLORS[status as keyof typeof COOK_ITEM_STATUS_COLORS] ?? ""}`}
          >
            {count} {COOK_ITEM_STATUS_LABELS[status as keyof typeof COOK_ITEM_STATUS_LABELS] ?? status}
          </Badge>
        ))}
      </div>
    </button>
  );
}

// ─── Stage 2 View ─────────────────────────────────────────────────────────────

export default function Stage2View({ basePath = "/admin/pps" }: { basePath?: string }) {
  const { data, isLoading, isError } = useGetStage2CookItemsQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xl">Loading dehydrator queue…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center text-lg">
        Failed to load Stage 2 cook items.
      </div>
    );
  }

  const cookItems = data?.cookItems ?? [];

  if (cookItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
        <Wind className="w-16 h-16 opacity-30" />
        <p className="text-2xl font-medium">No items ready for loading</p>
        <p className="text-base">Check back after Stage 1 completes.</p>
      </div>
    );
  }

  const orderGroups = groupByOrder(cookItems);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-semibold text-foreground">
        {orderGroups.size} order{orderGroups.size !== 1 ? "s" : ""} awaiting dehydrator loading
      </p>
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
        {Array.from(orderGroups.entries()).map(([orderId, items]) => (
          <OrderCard key={orderId} orderId={orderId} items={items} basePath={basePath} />
        ))}
      </div>
    </div>
  );
}
