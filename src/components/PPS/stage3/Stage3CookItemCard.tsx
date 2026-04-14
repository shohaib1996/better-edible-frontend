"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ScanLine, Timer } from "lucide-react";
import { toast } from "sonner";
import { getPPSUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/shared/CookItemHistory";
import {
  useCompleteBagSealMutation,
  useStartSealingMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { IStage3CookItem } from "@/types/privateLabel/pps";

// ─── Timers ───────────────────────────────────────────────────────────────────

function formatDuration(ms: number) {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  return hours > 0
    ? `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
    : minutes > 0
    ? `${minutes}m ${String(seconds).padStart(2, "0")}s`
    : `${seconds}s`;
}

// Count-down: used for dehydrating_complete items
function DehydrationCountdown({ endTime, compact }: { endTime: string; compact?: boolean }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(endTime).getTime() - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, new Date(endTime).getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (remaining === 0) {
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xs bg-green-50 border border-green-200 text-green-700 font-bold ${compact ? "text-sm" : "text-base"}`}>
        <CheckCircle2 className={`${compact ? "w-4 h-4" : "w-5 h-5"} shrink-0`} />
        Dehydration complete — go to Stage 2 Unload
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xs bg-amber-50 border border-amber-200 text-amber-800 ${compact ? "text-sm" : "text-base"}`}>
      <Timer className={`animate-pulse ${compact ? "w-4 h-4" : "w-5 h-5"} shrink-0`} />
      <span>Dehydrating — ready in </span>
      <span className="font-bold font-mono tabular-nums">{formatDuration(remaining)}</span>
    </div>
  );
}

// Count-up: used for demolding_complete / bagging / sealing items
function ElapsedTimer({ since, compact }: { since: string; compact?: boolean }) {
  const [elapsed, setElapsed] = useState(() => Date.now() - new Date(since).getTime());
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - new Date(since).getTime()), 1000);
    return () => clearInterval(id);
  }, [since]);

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xs bg-blue-50 border border-blue-200 text-blue-800 ${compact ? "text-sm" : "text-base"}`}>
      <Timer className={`${compact ? "w-4 h-4" : "w-5 h-5"} shrink-0`} />
      <span>Demolded </span>
      <span className="font-bold font-mono tabular-nums">{formatDuration(elapsed)}</span>
      <span> ago</span>
    </div>
  );
}

// ─── Cook Item Card ────────────────────────────────────────────────────────────

export interface Stage3CookItemCardProps {
  item: IStage3CookItem;
  isAdmin: boolean;
  compact?: boolean;
}

export function Stage3CookItemCard({ item, isAdmin, compact }: Stage3CookItemCardProps) {
  const [startSealing, { isLoading: isStartingSealing }] = useStartSealingMutation();
  const [completeBagSeal, { isLoading: isCompleting }] = useCompleteBagSealMutation();

  const handleFinishBagging = async () => {
    try {
      await startSealing({ cookItemId: item.cookItemId, performedBy: getPPSUser() }).unwrap();
      toast.success(`${item.flavor} — sealing started`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to start sealing");
    }
  };

  const handleFinishSealing = async () => {
    try {
      await completeBagSeal({ cookItemId: item.cookItemId, performedBy: getPPSUser() }).unwrap();
      toast.success("Item sealed — ready for packaging");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete bag & seal");
    }
  };

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  const isDone = item.status === "bag_seal_complete";
  const isSealing = item.status === "sealing";
  const isBagging = item.status === "bagging";
  const isDemolded = item.status === "demolding_complete";
  const isDehydrating = item.status === "dehydrating_complete";
  // Latest end time across all molds
  const dehydrationEndTime = item.molds.length > 0
    ? item.molds.reduce((latest, m) => m.dehydrationEndTime > latest ? m.dehydrationEndTime : latest, item.molds[0].dehydrationEndTime)
    : null;

  return (
    <div className={`flex flex-col gap-0 rounded-xs border bg-card ${isDone ? "opacity-75" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className={`${compact ? "text-xl" : "text-3xl"} font-bold leading-tight truncate`}>{item.flavor}</p>
          <p className="text-sm text-muted-foreground font-mono mt-1">{item.cookItemId}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-sm px-3 py-1 ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-0 border-t border-b divide-x mx-5">
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Qty</p>
          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{item.quantity.toLocaleString()}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Molds</p>
          <p className={`${compact ? "text-lg" : "text-2xl"} font-bold`}>{item.assignedMoldIds.length}</p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        {/* ── dehydrating: countdown to ready ── */}
        {isDehydrating && dehydrationEndTime && (
          <DehydrationCountdown endTime={dehydrationEndTime} compact={compact} />
        )}

        {/* ── elapsed time since demolding ── */}
        {!isDone && !isDehydrating && item.demoldingCompletionTimestamp && (
          <ElapsedTimer since={item.demoldingCompletionTimestamp} compact={compact} />
        )}

        {/* ── demolding_complete: waiting for scan ── */}
        {isDemolded && (
          <div className="flex items-center gap-3 py-3 px-3 rounded-xs bg-orange-50 border border-orange-200 text-orange-700">
            <ScanLine className={`${compact ? "w-5 h-5" : "w-6 h-6"} shrink-0`} />
            <p className={`${compact ? "text-sm" : "text-base"} font-medium`}>
              Scan barcode above to start bagging &amp; print label
            </p>
          </div>
        )}

        {/* ── bagging: label printed, show Finish Bagging button ── */}
        {isBagging && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 py-3 px-3 rounded-xs bg-amber-50 border border-amber-200 text-amber-700">
              <CheckCircle2 className={`${compact ? "w-5 h-5" : "w-6 h-6"} shrink-0`} />
              <p className={`${compact ? "text-sm" : "text-base"} font-medium`}>
                Label printed — bagging in progress
              </p>
            </div>
            <Button
              size="lg"
              disabled={isStartingSealing}
              className={`w-full gap-2 rounded-xs bg-amber-500 hover:bg-amber-600 text-white font-bold ${compact ? "text-base h-11" : "text-xl h-14"}`}
              onClick={handleFinishBagging}
            >
              {isStartingSealing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Finish Bagging
            </Button>
          </div>
        )}

        {/* ── sealing: show Finish Sealing button ── */}
        {isSealing && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 py-3 px-3 rounded-xs bg-indigo-50 border border-indigo-200 text-indigo-700">
              <CheckCircle2 className={`${compact ? "w-5 h-5" : "w-6 h-6"} shrink-0`} />
              <p className={`${compact ? "text-sm" : "text-base"} font-medium`}>Sealing in progress</p>
            </div>
            <Button
              size="lg"
              disabled={isCompleting}
              className={`w-full gap-2 rounded-xs bg-green-600 hover:bg-green-700 text-white font-bold ${compact ? "text-base h-11" : "text-xl h-14"}`}
              onClick={handleFinishSealing}
            >
              {isCompleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Finish Sealing
            </Button>
          </div>
        )}

        {/* ── bag_seal_complete ── */}
        {isDone && (
          <div className="flex items-center gap-3 py-2 px-3 rounded-xs bg-green-50 border border-green-200 text-green-700">
            <CheckCircle2 className={`${compact ? "w-5 h-5" : "w-6 h-6"} shrink-0`} />
            <p className={`${compact ? "text-base" : "text-lg"} font-semibold`}>Sealed — ready for packaging</p>
          </div>
        )}

        {isAdmin && (
          <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
