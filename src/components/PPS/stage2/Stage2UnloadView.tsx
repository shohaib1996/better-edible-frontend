"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Wind, Printer, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPPSUser } from "@/lib/ppsUser";
import PrintLabel from "@/components/PPS/shared/PrintLabel";
import {
  useGetStage2UnloadItemsQuery,
  useCompleteUnloadMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import type { IUnloadCookItem } from "@/types/privateLabel/pps";

// ─── Dehydration Timer ────────────────────────────────────────────────────────

function useCountdown(endTime: string | null) {
  const [remaining, setRemaining] = useState<number>(() =>
    endTime ? Math.max(0, new Date(endTime).getTime() - Date.now()) : 0
  );

  useEffect(() => {
    if (!endTime) return;
    const tick = () => setRemaining(Math.max(0, new Date(endTime).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return remaining;
}

function DehydrationTimer({ assignments, compact }: {
  assignments: { expectedEndTime: string }[];
  compact?: boolean;
}) {
  // Use the latest expectedEndTime across all molds
  const endTime = assignments.length > 0
    ? assignments.reduce((latest, a) =>
        a.expectedEndTime > latest ? a.expectedEndTime : latest,
        assignments[0].expectedEndTime
      )
    : null;

  const remaining = useCountdown(endTime);
  const isReady = remaining === 0;

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  const timeStr = hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}m`
    : minutes > 0
    ? `${minutes}m ${String(seconds).padStart(2, "0")}s`
    : `${seconds}s`;

  if (isReady) {
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xs bg-green-50 border border-green-200 text-green-700 font-bold ${compact ? "text-sm" : "text-base"}`}>
        <CheckCircle2 className={compact ? "w-4 h-4 shrink-0" : "w-5 h-5 shrink-0"} />
        Dehydration complete — ready to unload
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xs bg-amber-50 border border-amber-200 text-amber-800 ${compact ? "text-sm" : "text-base"}`}>
      <Timer className={`animate-pulse ${compact ? "w-4 h-4 shrink-0" : "w-5 h-5 shrink-0"}`} />
      <span>Dehydrating — ready in </span>
      <span className="font-bold font-mono tabular-nums">{timeStr}</span>
    </div>
  );
}

// ─── Print helper ─────────────────────────────────────────────────────────────

function printProductionLabel(item: IUnloadCookItem, labelRef: HTMLDivElement | null) {
  if (!labelRef) return;
  const html = labelRef.innerHTML;
  const win = window.open("", "_blank", "width=600,height=700");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: 4in 3in; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 4in; font-family: sans-serif; }
  </style>
</head>
<body>${html}</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
}

// ─── Shelf Row ─────────────────────────────────────────────────────────────────

function ShelfRow({ shelfLabel, trayId, moldId, compact }: {
  shelfLabel: string;
  trayId: string;
  moldId: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xs border bg-muted/20">
      <div className={`shrink-0 font-bold font-mono rounded-xs border bg-background flex items-center justify-center ${compact ? "w-16 h-9 text-sm" : "w-20 h-11 text-base"}`}>
        {shelfLabel}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-mono font-semibold truncate ${compact ? "text-sm" : "text-base"}`}>{trayId}</p>
        <p className={`text-muted-foreground font-mono ${compact ? "text-xs" : "text-sm"}`}>Mold: {moldId}</p>
      </div>
    </div>
  );
}

// ─── Unload Item Card ─────────────────────────────────────────────────────────

interface UnloadItemCardProps {
  item: IUnloadCookItem;
  index: number;
  total: number;
  compact?: boolean;
}

function useDehydrationReady(assignments: { expectedEndTime: string }[]): boolean {
  const endTime = assignments.length > 0
    ? assignments.reduce((latest, a) =>
        a.expectedEndTime > latest ? a.expectedEndTime : latest,
        assignments[0].expectedEndTime
      )
    : null;
  const [ready, setReady] = useState(() =>
    endTime ? new Date(endTime).getTime() <= Date.now() : true
  );
  useEffect(() => {
    if (!endTime || ready) return;
    const ms = new Date(endTime).getTime() - Date.now();
    if (ms <= 0) { setReady(true); return; }
    const id = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(id);
  }, [endTime, ready]);
  return ready;
}

function UnloadItemCard({ item, index, total, compact }: UnloadItemCardProps) {
  const labelRef = useRef<HTMLDivElement | null>(null);
  const [completeUnload, { isLoading }] = useCompleteUnloadMutation();
  const dehydrationReady = useDehydrationReady(item.dehydratorAssignments);

  const handleComplete = useCallback(async () => {
    try {
      const result = await completeUnload({
        cookItemId: item.cookItemId,
        performedBy: getPPSUser(),
      }).unwrap();
      toast.success(`${item.flavor} — unloaded, label printed`);
      // Print label after successful unload
      printProductionLabel(result.cookItem as any, labelRef.current);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete unload");
    }
  }, [completeUnload, item]);

  return (
    <div className="flex flex-col gap-0 rounded-xs border bg-card">
      {/* Progress indicator */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className={`font-semibold text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
          Item {index + 1} of {total}
        </span>
        <Badge variant="outline" className={`text-xs ${dehydrationReady ? "bg-green-500/10 text-green-700 border-green-400/30" : "bg-amber-500/10 text-amber-700 border-amber-400/30"}`}>
          {dehydrationReady ? "Ready to Unload" : "Dehydrating"}
        </Badge>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className={`font-bold leading-tight truncate ${compact ? "text-2xl" : "text-4xl"}`}>
            {item.flavor}
          </p>
          <p className={`text-muted-foreground mt-0.5 ${compact ? "text-sm" : "text-base"}`}>
            {item.storeName}
          </p>
          <p className={`text-muted-foreground font-mono mt-0.5 ${compact ? "text-xs" : "text-sm"}`}>
            {item.cookItemId}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Qty</p>
          <p className={`font-bold ${compact ? "text-xl" : "text-3xl"}`}>{item.quantity.toLocaleString()}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Trays</p>
          <p className={`font-bold ${compact ? "text-xl" : "text-3xl"}`}>{item.shelves.length}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Order</p>
          <p className={`font-bold font-mono truncate ${compact ? "text-sm" : "text-base"}`}>{item.orderId}</p>
        </div>
      </div>

      {/* Shelf grid */}
      <div className="px-5 py-4 flex flex-col gap-2">
        <p className={`font-semibold text-muted-foreground mb-1 ${compact ? "text-xs" : "text-sm"}`}>
          Shelves to unload
        </p>
        {item.shelves.map((shelf) => (
          <ShelfRow
            key={shelf.trayId}
            shelfLabel={shelf.shelfLabel}
            trayId={shelf.trayId}
            moldId={shelf.moldId}
            compact={compact}
          />
        ))}
      </div>

      {/* Dehydration timer */}
      <div className="px-5 pb-4">
        <DehydrationTimer assignments={item.dehydratorAssignments} compact={compact} />
      </div>

      {/* Action */}
      <div className="px-5 pb-5">
        <Button
          size="lg"
          disabled={isLoading || !dehydrationReady}
          className={`w-full gap-2 rounded-xs bg-green-600 hover:bg-green-700 text-white font-bold ${compact ? "text-base h-12" : "text-2xl h-16"}`}
          onClick={handleComplete}
        >
          {isLoading ? (
            <Loader2 className={`animate-spin ${compact ? "w-4 h-4" : "w-6 h-6"}`} />
          ) : (
            <Printer className={compact ? "w-4 h-4" : "w-6 h-6"} />
          )}
          Complete — Print Label
        </Button>
      </div>

      {/* Hidden label for printing */}
      <div
        ref={labelRef}
        style={{ position: "absolute", left: "-9999px", top: 0, visibility: "hidden" }}
      >
        <PrintLabel type="production" data={item} />
      </div>
    </div>
  );
}

// ─── Stage 2 Unload View ──────────────────────────────────────────────────────

export default function Stage2UnloadView({ compact }: { compact?: boolean }) {
  const { data, isLoading, isError } = useGetStage2UnloadItemsQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className={compact ? "text-base" : "text-xl"}>Loading unload queue…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`text-destructive py-12 text-center ${compact ? "text-sm" : "text-lg"}`}>
        Failed to load unload items.
      </div>
    );
  }

  const items = data?.cookItems ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
        <CheckCircle2 className={`${compact ? "w-10 h-10" : "w-16 h-16"} opacity-30 text-green-500`} />
        <p className={`${compact ? "text-base" : "text-2xl"} font-medium`}>All items unloaded</p>
        <p className={compact ? "text-sm" : "text-base"}>No items waiting to be unloaded from the dehydrator.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Wind className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-orange-500`} />
        <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-lg"}`}>
          {items.length} item{items.length !== 1 ? "s" : ""} ready to unload
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <UnloadItemCard
            key={item._id}
            item={item}
            index={i}
            total={items.length}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
