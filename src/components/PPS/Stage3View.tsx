"use client";

import { useRouter } from "next/navigation";
import { Loader2, Thermometer, ArrowRight, CheckCircle2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetStage3CookItemsQuery } from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { IStage3CookItem } from "@/types/privateLabel/pps";

// ─── Group cook items by orderId ──────────────────────────────────────────────

function groupByOrder(items: IStage3CookItem[]): Map<string, IStage3CookItem[]> {
  return items.reduce((map, item) => {
    const existing = map.get(item.orderId) ?? [];
    map.set(item.orderId, [...existing, item]);
    return map;
  }, new Map<string, IStage3CookItem[]>());
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ orderId, items, basePath, compact }: { orderId: string; items: IStage3CookItem[]; basePath: string; compact?: boolean }) {
  const router = useRouter();
  const storeName = items[0]?.storeName ?? "Unknown Store";
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
  const allDone = items.every((i) => i.status === "bag_seal_complete");
  const anyBagSeal = items.some((i) => i.status === "bagging" || i.status === "sealing");
  const anyDemolded = items.some((i) => i.status === "demolding_complete");

  const statusCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  const bagSealDone = items.filter((i) => i.status === "bag_seal_complete").length;
  const baggingCount = items.filter((i) => i.status === "bagging").length;
  const sealingCount = items.filter((i) => i.status === "sealing").length;

  return (
    <button
      type="button"
      className={`w-full text-left rounded-xs border bg-card transition-all active:scale-[0.99] border-l-4 ${
        allDone
          ? "border-l-green-500 shadow-md hover:shadow-lg"
          : anyBagSeal
          ? "border-l-amber-400 hover:shadow-md"
          : anyDemolded
          ? "border-l-orange-400 hover:shadow-md"
          : "border-l-transparent hover:border-l-primary/60 hover:shadow-md"
      }`}
      onClick={() => router.push(`${basePath}/stage3/${encodeURIComponent(orderId)}`)}
    >
      {/* Top section */}
      <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          {allDone && (
            <p className="text-sm font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Bag & Seal Complete
            </p>
          )}
          {!allDone && anyBagSeal && (
            <p className="text-sm font-bold text-amber-700 uppercase tracking-widest mb-1">
              ● Bagging / Sealing
            </p>
          )}
          {!allDone && !anyBagSeal && anyDemolded && (
            <p className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-1">
              ● Ready to Bag
            </p>
          )}
          <p className={`${compact ? "text-xl" : "text-3xl"} font-bold leading-tight truncate text-foreground`}>{storeName}</p>
          <p className={`${compact ? "text-sm" : "text-base"} font-mono text-muted-foreground mt-0.5`}>Order {orderId}</p>
        </div>
        <ArrowRight className={`${compact ? "w-5 h-5" : "w-8 h-8"} text-primary shrink-0`} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Bagging</p>
          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{baggingCount}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Sealing</p>
          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{sealingCount}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Done</p>
          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold ${bagSealDone === items.length ? "text-green-600" : ""}`}>{bagSealDone}/{items.length}</p>
        </div>
      </div>

      {/* Flavor list */}
      <div className="px-5 pt-3 pb-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between gap-3">
            <span className={`${compact ? "text-sm" : "text-lg"} font-medium truncate`}>{item.flavor}</span>
            <Badge variant="outline" className={`shrink-0 text-xs px-2 py-0.5 ${COOK_ITEM_STATUS_COLORS[item.status] ?? ""}`}>
              {COOK_ITEM_STATUS_LABELS[item.status] ?? item.status}
            </Badge>
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

// ─── Stage 3 View ─────────────────────────────────────────────────────────────

export default function Stage3View({ basePath = "/admin/pps", compact, isAdmin }: { basePath?: string; compact?: boolean; isAdmin?: boolean }) {
  const router = useRouter();
  const { data, isLoading, isError } = useGetStage3CookItemsQuery(undefined, {
    pollingInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className={compact ? "text-base" : "text-xl"}>Loading bag & seal queue…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`text-destructive py-12 text-center ${compact ? "text-sm" : "text-lg"}`}>
        Failed to load Stage 3 cook items.
      </div>
    );
  }

  const cookItems = data?.cookItems ?? [];

  if (cookItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
        <Thermometer className={`${compact ? "w-10 h-10" : "w-16 h-16"} opacity-30`} />
        <p className={`${compact ? "text-base" : "text-2xl"} font-medium`}>No items in bag & seal</p>
        <p className={compact ? "text-sm" : "text-base"}>Items arrive here after tray removal completes.</p>
      </div>
    );
  }

  const orderGroups = groupByOrder(cookItems);
  const readyCount = Array.from(orderGroups.values()).filter((items) => items.every((i) => i.status === "bag_seal_complete")).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <p className={`${compact ? "text-sm" : "text-lg"} font-semibold text-foreground`}>
            {orderGroups.size} order{orderGroups.size !== 1 ? "s" : ""} in bag & seal
          </p>
          {readyCount > 0 && (
            <span className={`${compact ? "text-sm" : "text-base"} font-bold text-green-700 bg-green-500/10 border border-green-500/20 rounded-xs px-3 py-1`}>
              {readyCount} fully sealed
            </span>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => router.push(`${basePath}/package-prep`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground font-semibold ${compact ? "text-xs" : "text-sm"}`}
          >
            <Package className={compact ? "w-3 h-3" : "w-4 h-4"} />
            Package Prep
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
        {Array.from(orderGroups.entries()).map(([orderId, items]) => (
          <OrderCard key={orderId} orderId={orderId} items={items} basePath={basePath} compact={compact} />
        ))}
      </div>
    </div>
  );
}
