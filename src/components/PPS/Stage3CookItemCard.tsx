"use client";

import { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { getPPSUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import {
  useCompleteBagSealMutation,
  useCompleteStage3Mutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { IStage3CookItem, ICookItem } from "@/types/privateLabel/pps";

// ─── Dehydration Timer ───────────────────────────────────────────────────────

export function DehydrationTimer({ expectedEndTime }: { expectedEndTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(expectedEndTime).getTime() - Date.now();
      if (diff <= 0) {
        setIsReady(true);
        setTimeLeft("READY");
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expectedEndTime]);

  return (
    <Badge variant="outline" className={`font-mono tabular-nums ${isReady ? "bg-green-500/10 text-green-600 border-green-500/20 font-bold" : "bg-orange-500/10 text-orange-600 border-orange-500/20"}`}>
      {timeLeft || "…"}
    </Badge>
  );
}

// ─── Cook Item Card ────────────────────────────────────────────────────────────

export interface Stage3CookItemCardProps {
  item: IStage3CookItem;
  isAdmin: boolean;
  compact?: boolean;
  onPrintLabel: (cookItem: ICookItem) => void;
}

export function Stage3CookItemCard({ item, isAdmin, compact, onPrintLabel }: Stage3CookItemCardProps) {
  const [completeBagSeal, { isLoading: isCompleting }] = useCompleteBagSealMutation();
  const [completeStage3, { isLoading: isCompletingTrayRemoval }] = useCompleteStage3Mutation();

  const handleFinish = async () => {
    try {
      await completeBagSeal({ cookItemId: item.cookItemId, performedBy: getPPSUser() }).unwrap();
      toast.success("Item sealed — ready for packaging");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete bag & seal");
    }
  };

  const handleTrayRemoval = async () => {
    try {
      const result = await completeStage3({ cookItemId: item.cookItemId, performedBy: getPPSUser() } as any).unwrap();
      toast.success("Tray removal complete");
      onPrintLabel(result.cookItem);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete tray removal");
    }
  };

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;

  const isDone = item.status === "bag_seal_complete";
  const isSealing = item.status === "sealing";
  const isBagging = item.status === "bagging";
  const isDemolded = item.status === "demolding_complete";
  const isDehydrating = item.status === "dehydrating_complete";
  const allMoldsReady = isDehydrating && item.molds?.every((m) => m.isReady);

  return (
    <div className={`flex flex-col gap-0 rounded-xs border bg-card ${isDone ? "opacity-75" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className={`${compact ? "text-xl" : "text-3xl"} font-bold leading-tight truncate`}>{item.flavor}</p>
          <p className="text-sm text-muted-foreground font-mono mt-1">{item.cookItemId}</p>
          <div className="mt-2">
            <Barcode
              value={item.cookItemId}
              format="CODE128"
              width={1.2}
              height={40}
              displayValue={false}
              margin={0}
              background="#ffffff"
              lineColor="#000000"
            />
          </div>
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
        {isDehydrating && item.molds?.length > 0 && (
          <div className="flex flex-col gap-2">
            {item.molds.map((mold, idx) => {
              const unitsThisMold = Math.min(70, item.quantity - idx * 70);
              return (
                <div key={mold.moldId} className={`flex items-center gap-3 px-3 py-2.5 rounded-xs border ${mold.isReady ? "bg-green-500/5 border-green-200" : "bg-muted/30"}`}>
                  <div className="shrink-0 w-8 h-8 rounded-xs border flex items-center justify-center font-bold text-sm bg-background">
                    {mold.shelfPosition}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Shelf {mold.shelfPosition} · {mold.dehydratorUnitId}</p>
                    <p className="text-xs text-muted-foreground font-mono">{mold.trayId} · {unitsThisMold} units</p>
                  </div>
                  <DehydrationTimer expectedEndTime={mold.dehydrationEndTime} />
                </div>
              );
            })}
            {allMoldsReady ? (
              <Button
                size="lg"
                disabled={isCompletingTrayRemoval}
                className={`w-full gap-2 rounded-xs bg-green-600 hover:bg-green-700 text-white font-bold ${compact ? "text-base h-11" : "text-xl h-14"}`}
                onClick={handleTrayRemoval}
              >
                {isCompletingTrayRemoval ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Complete Tray Removal & Print Label
              </Button>
            ) : (
              <p className={`${compact ? "text-xs" : "text-sm"} text-muted-foreground text-center py-1`}>Waiting for dehydration to finish…</p>
            )}
          </div>
        )}

        {isDone ? (
          <div className="flex items-center gap-3 py-2 px-3 rounded-xs bg-green-50 border border-green-200 text-green-700">
            <CheckCircle2 className={`${compact ? "w-5 h-5" : "w-6 h-6"} shrink-0`} />
            <p className={`${compact ? "text-base" : "text-lg"} font-semibold`}>Sealed — ready for packaging</p>
          </div>
        ) : isDemolded ? (
          <div className="flex items-center gap-3 py-3 px-3 rounded-xs bg-orange-50 border border-orange-200 text-orange-700">
            <ScanLine className={`${compact ? "w-5 h-5" : "w-6 h-6"} shrink-0`} />
            <p className={`${compact ? "text-sm" : "text-base"} font-medium`}>Scan barcode above to start bagging</p>
          </div>
        ) : isBagging ? (
          <div className="flex items-center gap-3 py-3 px-3 rounded-xs bg-amber-50 border border-amber-200 text-amber-700">
            <ScanLine className={`${compact ? "w-5 h-5" : "w-6 h-6"} shrink-0`} />
            <p className={`${compact ? "text-sm" : "text-base"} font-medium`}>Scan again to start sealing (label will print)</p>
          </div>
        ) : isSealing ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 py-3 px-3 rounded-xs bg-indigo-50 border border-indigo-200 text-indigo-700">
              <CheckCircle2 className={`${compact ? "w-5 h-5" : "w-6 h-6"} shrink-0`} />
              <p className={`${compact ? "text-sm" : "text-base"} font-medium`}>Label printed — sealing in progress</p>
            </div>
            <Button
              size="lg"
              disabled={isCompleting}
              className={`w-full gap-2 rounded-xs bg-green-600 hover:bg-green-700 text-white font-bold ${compact ? "text-base h-11" : "text-xl h-14"}`}
              onClick={handleFinish}
            >
              {isCompleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Finish Item
            </Button>
          </div>
        ) : null}

        {isAdmin && (
          <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
