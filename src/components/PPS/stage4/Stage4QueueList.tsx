"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { ICookItem } from "@/types/privateLabel/pps";

interface Stage4QueueListProps {
  queueItems: ICookItem[];
  packedItems: ICookItem[];
  basePath: string;
  compact?: boolean;
}

export default function Stage4QueueList({
  queueItems,
  packedItems,
  basePath,
  compact,
}: Stage4QueueListProps) {
  const router = useRouter();
  const [queueTab, setQueueTab] = useState<"ready" | "packed">("ready");

  return (
    <div className="flex flex-col gap-3">
      {/* Tab bar */}
      <div className="flex rounded-xs border overflow-hidden">
        <button
          className={`flex-1 px-4 py-2 ${compact ? "text-sm" : "text-base"} font-semibold transition-colors ${queueTab === "ready" ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted"}`}
          onClick={() => setQueueTab("ready")}
        >
          Ready to Pack
          {queueItems.length > 0 ? ` (${queueItems.length})` : ""}
        </button>
        <button
          className={`flex-1 px-4 py-2 ${compact ? "text-sm" : "text-base"} font-semibold transition-colors border-l ${queueTab === "packed" ? "bg-foreground text-background" : "bg-card text-muted-foreground hover:bg-muted"}`}
          onClick={() => setQueueTab("packed")}
        >
          Packed{packedItems.length > 0 ? ` (${packedItems.length})` : ""}
        </button>
      </div>

      {/* Ready to Pack list */}
      {queueTab === "ready" &&
        (queueItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No items ready to pack.
          </p>
        ) : (
          queueItems.map((item) => {
            const sc = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
            const sl = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;
            const ec = item.expectedCount ?? 0;
            return (
              <button
                key={item._id}
                className="rounded-xs border bg-card w-full text-left"
                onClick={() =>
                  router.push(
                    `${basePath}/stage4/item/${encodeURIComponent(item.cookItemId)}`,
                  )
                }
              >
                <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`${compact ? "text-xl" : "text-3xl"} font-bold truncate`}
                    >
                      {item.flavor}
                    </p>
                    <p
                      className={`${compact ? "text-sm" : "text-base"} text-muted-foreground font-mono mt-0.5`}
                    >
                      {item.storeName}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${compact ? "text-sm" : "text-base"} px-3 py-1 ${sc}`}
                  >
                    {sl}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
                  <div className="px-3 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Qty
                    </p>
                    <p
                      className={`${compact ? "text-lg" : "text-2xl"} font-bold`}
                    >
                      {ec.toLocaleString()}
                    </p>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Molds
                    </p>
                    <p
                      className={`${compact ? "text-lg" : "text-2xl"} font-bold`}
                    >
                      {Math.ceil(ec / 70)}
                    </p>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Cases
                    </p>
                    <p
                      className={`${compact ? "text-lg" : "text-2xl"} font-bold`}
                    >
                      {Math.floor(ec / 100) + (ec % 100 > 0 ? 1 : 0)}
                    </p>
                  </div>
                </div>
                <div className="px-5 py-3">
                  <p className="text-sm font-mono text-muted-foreground">
                    {item.cookItemId}
                  </p>
                </div>
              </button>
            );
          })
        ))}

      {/* Packed list */}
      {queueTab === "packed" &&
        (packedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No packed items yet.
          </p>
        ) : (
          packedItems.map((item) => {
            const ec = item.expectedCount ?? 0;
            return (
              <button
                key={item._id}
                className="rounded-xs border bg-card w-full text-left"
                onClick={() =>
                  router.push(
                    `${basePath}/stage4/item/${encodeURIComponent(item.cookItemId)}`,
                  )
                }
              >
                <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`${compact ? "text-xl" : "text-3xl"} font-bold truncate`}
                    >
                      {item.flavor}
                    </p>
                    <p
                      className={`${compact ? "text-sm" : "text-base"} text-muted-foreground font-mono mt-0.5`}
                    >
                      {item.storeName}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-sm px-3 py-1 text-green-700 border-green-300 bg-green-50"
                  >
                    Packed
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
                  <div className="px-3 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Qty
                    </p>
                    <p
                      className={`${compact ? "text-lg" : "text-2xl"} font-bold`}
                    >
                      {ec.toLocaleString()}
                    </p>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Cases
                    </p>
                    <p
                      className={`${compact ? "text-lg" : "text-2xl"} font-bold`}
                    >
                      {item.totalCases ??
                        Math.floor(ec / 100) + (ec % 100 > 0 ? 1 : 0)}
                    </p>
                  </div>
                  <div className="px-3 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                      Actual
                    </p>
                    <p
                      className={`${compact ? "text-lg" : "text-2xl"} font-bold`}
                    >
                      {item.actualCount ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="px-5 py-3">
                  <p className="text-sm font-mono text-muted-foreground">
                    {item.cookItemId}
                  </p>
                </div>
              </button>
            );
          })
        ))}
    </div>
  );
}
