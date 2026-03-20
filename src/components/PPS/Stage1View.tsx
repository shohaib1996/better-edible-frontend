"use client";

import { useRouter } from "next/navigation";
import { Loader2, ChefHat, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

  // Collect unique statuses for summary badges
  const statusCounts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card
      className="flex flex-col gap-0 cursor-pointer hover:border-primary/60 hover:shadow-md transition-all rounded-xs h-full"
      onClick={() => router.push(`${basePath}/stage1/${encodeURIComponent(orderId)}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">{storeName}</CardTitle>
            <CardDescription className="text-xs mt-0.5 font-mono">
              Order {orderId}
            </CardDescription>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        </div>

        <p className="text-xs text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""} &bull;{" "}
          {totalUnits.toLocaleString()} total units
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 flex-1">
        {/* Item list */}
        <div className="flex flex-col gap-1.5 flex-1">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between text-sm gap-2"
            >
              <span className="truncate text-muted-foreground">{item.flavor}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {item.quantity.toLocaleString()} units
              </span>
            </div>
          ))}
        </div>

        {/* Status summary */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Badge
              key={status}
              variant="outline"
              className={`text-xs ${COOK_ITEM_STATUS_COLORS[status as keyof typeof COOK_ITEM_STATUS_COLORS] ?? ""}`}
            >
              {count} {COOK_ITEM_STATUS_LABELS[status as keyof typeof COOK_ITEM_STATUS_LABELS] ?? status}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Stage 1 View ─────────────────────────────────────────────────────────────

export default function Stage1View({ basePath = "/admin/pps" }: { basePath?: string }) {
  const { data, isLoading, isError } = useGetStage1CookItemsQuery();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading cook queue…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive py-12 text-center text-sm">
        Failed to load Stage 1 cook items. Check your connection and try again.
      </div>
    );
  }

  const cookItems = data?.cookItems ?? [];

  if (cookItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <ChefHat className="w-10 h-10 opacity-40" />
        <p className="text-sm">No items in the Stage 1 cook queue.</p>
      </div>
    );
  }

  const orderGroups = groupByOrder(cookItems);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {orderGroups.size} order{orderGroups.size !== 1 ? "s" : ""} in queue
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from(orderGroups.entries()).map(([orderId, items]) => (
          <OrderCard key={orderId} orderId={orderId} items={items} basePath={basePath} />
        ))}
      </div>
    </div>
  );
}
