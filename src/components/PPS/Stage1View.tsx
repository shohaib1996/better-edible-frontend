"use client";

import { useRouter } from "next/navigation";
import { Loader2, ChefHat, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetStage1CookItemsQuery } from "@/redux/api/PrivateLabel/ppsApi";
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
  const isInProgress = items.some((i) => i.status === "in-progress");

  const statusCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <button
      type="button"
      className={`w-full text-left rounded-xs border bg-card transition-all active:scale-[0.99] border-l-4 ${
        isInProgress
          ? "border-l-yellow-500 shadow-md"
          : "border-l-transparent hover:border-l-primary/60 hover:shadow-md"
      }`}
      onClick={() => router.push(`${basePath}/stage1/${encodeURIComponent(orderId)}`)}
    >
      {/* Top section — store name + arrow */}
      <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          {isInProgress && (
            <p className="text-sm font-bold text-yellow-600 uppercase tracking-widest mb-1">
              ● In Progress
            </p>
          )}
          <p className="text-3xl font-bold leading-tight truncate text-foreground">{storeName}</p>
          <p className="text-base font-mono text-muted-foreground mt-0.5">Order {orderId}</p>
        </div>
        <ArrowRight className="w-8 h-8 text-primary shrink-0" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Items</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Total Units</p>
          <p className="text-2xl font-bold">{totalUnits.toLocaleString()}</p>
        </div>
      </div>

      {/* Flavor list */}
      <div className="px-5 pt-3 pb-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between gap-3">
            <span className="text-lg font-medium truncate">{item.flavor}</span>
            <span className="shrink-0 text-base font-bold tabular-nums text-foreground">
              {item.quantity.toLocaleString()}
            </span>
          </div>
        ))}
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

// ─── Stage 1 View ─────────────────────────────────────────────────────────────

export default function Stage1View({ basePath = "/admin/pps" }: { basePath?: string }) {
  const { data, isLoading, isError } = useGetStage1CookItemsQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xl">Loading cook queue…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center text-lg">
        Failed to load Stage 1 cook items. Check your connection and try again.
      </div>
    );
  }

  const cookItems = data?.cookItems ?? [];

  if (cookItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
        <ChefHat className="w-16 h-16 opacity-30" />
        <p className="text-2xl font-medium">No items in the cook queue</p>
        <p className="text-base">All caught up!</p>
      </div>
    );
  }

  const orderGroups = groupByOrder(cookItems);

  const sortedEntries = Array.from(orderGroups.entries()).sort(([, aItems], [, bItems]) => {
    const aActive = aItems.some((i) => i.status === "in-progress") ? 0 : 1;
    const bActive = bItems.some((i) => i.status === "in-progress") ? 0 : 1;
    return aActive - bActive;
  });

  const inProgressCount = sortedEntries.filter(([, items]) => items.some((i) => i.status === "in-progress")).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <p className="text-lg font-semibold text-foreground">
          {orderGroups.size} order{orderGroups.size !== 1 ? "s" : ""} in queue
        </p>
        {inProgressCount > 0 && (
          <span className="text-base font-bold text-yellow-700 bg-yellow-500/10 border border-yellow-500/20 rounded-xs px-3 py-1">
            {inProgressCount} in progress
          </span>
        )}
      </div>

      {/* Full-width stacked cards — 1 column on mobile, 2 on large tablets */}
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
        {sortedEntries.map(([orderId, items]) => (
          <OrderCard key={orderId} orderId={orderId} items={items} basePath={basePath} />
        ))}
      </div>
    </div>
  );
}
