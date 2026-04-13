"use client";

import { useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPPSUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/CookItemHistory";
import Stage2TraySlot from "@/components/PPS/Stage2TraySlot";
import {
  useProcessMoldMutation,
  useUnprocessMoldMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { ICookItem } from "@/types/privateLabel/pps";

interface ShelfSlot {
  moldId: string;
  trayId?: string;
  dehydratorUnitId?: string;
  shelfPosition?: number;
}

export interface NextShelf {
  dehydratorUnitId: string;
  shelfPosition: number;
}

type CardMode = "idle" | "scanning" | "done";

export interface Stage2CookItemCardProps {
  item: ICookItem;
  isAdmin: boolean;
  batchStarted: boolean;
  onGetNextShelf: () => Promise<NextShelf | null>;
  compact?: boolean;
}

export default function Stage2CookItemCard({
  item,
  isAdmin,
  batchStarted,
  onGetNextShelf,
  compact,
}: Stage2CookItemCardProps) {
  const isComplete = item.status === "dehydrating_complete";

  const initialMode: CardMode = isComplete
    ? "done"
    : item.dehydratorAssignments.length > 0
      ? "scanning"
      : "idle";

  const [mode, setMode] = useState<CardMode>(initialMode);
  const [slots, setSlots] = useState<ShelfSlot[]>(() =>
    item.assignedMoldIds.map((moldId) => {
      const existing = item.dehydratorAssignments.find((a) => a.moldId === moldId);
      return existing
        ? { moldId, trayId: existing.trayId, dehydratorUnitId: existing.dehydratorUnitId, shelfPosition: existing.shelfPosition }
        : { moldId };
    }),
  );

  const [processMold, { isLoading: isProcessing }] = useProcessMoldMutation();
  const [unprocessMold, { isLoading: isUnprocessing }] = useUnprocessMoldMutation();

  const handleUnprocessMold = useCallback(async (moldId: string) => {
    try {
      await unprocessMold({ cookItemId: item.cookItemId, moldId, performedBy: getPPSUser() } as any).unwrap();
      setSlots((prev) => prev.map((s) => s.moldId === moldId ? { moldId: s.moldId } : s));
      if (mode === "done") setMode("scanning");
      toast.success("Tray unassigned");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove tray assignment");
    }
  }, [unprocessMold, item.cookItemId, mode]);

  const totalTrays = item.assignedMoldIds.length;
  const lockedCount = slots.filter((s) => s.trayId).length;
  const allLocked = lockedCount >= totalTrays && totalTrays > 0;
  const effectiveMode: CardMode = mode === "idle" && batchStarted ? "scanning" : mode;

  const handleTrayScan = useCallback(
    async (moldId: string, trayId: string): Promise<boolean> => {
      const shelf = await onGetNextShelf();
      if (!shelf) return false;
      try {
        await processMold({
          cookItemId: item.cookItemId,
          moldId, trayId,
          dehydratorUnitId: shelf.dehydratorUnitId,
          shelfPosition: shelf.shelfPosition,
          performedBy: getPPSUser(),
        } as any).unwrap();
        setSlots((prev) =>
          prev.map((s) =>
            s.moldId === moldId
              ? { ...s, trayId, dehydratorUnitId: shelf.dehydratorUnitId, shelfPosition: shelf.shelfPosition }
              : s,
          ),
        );
        return true;
      } catch (err: any) {
        toast.error(err?.data?.message || "Tray not found or already in use");
        return false;
      }
    },
    [processMold, item.cookItemId, onGetNextShelf],
  );

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;
  const activeSlotIndex = slots.findIndex((s) => !s.trayId);
  const c = compact;

  return (
    <div className="flex flex-col gap-0 rounded-xs border bg-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <p className={`${c ? "text-3xl" : "text-4xl"} font-bold leading-tight truncate`}>{item.flavor}</p>
          <p className="text-base text-muted-foreground font-mono mt-1">{item.cookItemId}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 ${c ? "text-sm px-3 py-1" : "text-base px-3 py-1.5"} ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-0 border-t border-b divide-x mx-5">
        {([
          ["Qty", item.quantity.toLocaleString(), ""],
          ["Trays", String(totalTrays), ""],
          ["Loaded", `${lockedCount}/${totalTrays}`, allLocked ? "text-green-600" : ""],
        ] as const).map(([label, value, color]) => (
          <div key={label} className={`px-3 ${c ? "py-3" : "py-4"}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={`${c ? "text-2xl" : "text-3xl"} font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className={`px-5 ${c ? "py-4 gap-3" : "py-5 gap-4"} flex flex-col`}>
        {/* Flavor components */}
        {item.flavorComponents.length > 0 && (
          <div>
            <p className={`${c ? "text-sm" : "text-base"} text-muted-foreground mb-${c ? "1.5" : "2"}`}>
              Flavor Components
            </p>
            <div className={`flex flex-wrap gap-${c ? "1.5" : "2"}`}>
              {item.flavorComponents.map((fc) => (
                <Badge key={fc.name} variant="secondary" className={c ? "text-sm" : "text-base px-3 py-1"}>
                  {fc.name} {fc.percentage}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action area */}
        {effectiveMode === "done" || isComplete ? (
          <div className={`flex items-center gap-${c ? "3" : "4"} py-4 text-green-600`}>
            <CheckCircle2 className={`${c ? "w-8 h-8" : "w-10 h-10"} shrink-0`} />
            <p className={c ? "text-xl font-semibold" : "text-2xl font-bold"}>
              All trays loaded — {lockedCount} tray{lockedCount !== 1 ? "s" : ""}
            </p>
          </div>
        ) : effectiveMode === "idle" ? (
          <Button
            size="lg" variant="outline"
            className={`w-full ${c ? "text-xl h-14" : "text-2xl h-16 font-bold"} rounded-xs`}
            onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); setMode("scanning"); }}
          >
            Load to Dehydrator
          </Button>
        ) : effectiveMode === "scanning" ? (
          <div className="flex flex-col gap-3">
            {slots.map((slot, i) => (
              <Stage2TraySlot
                key={i === activeSlotIndex ? `active-${lockedCount}` : slot.moldId}
                slotId={`${item.cookItemId}-${i}`}
                index={i}
                total={totalTrays}
                moldId={slot.moldId}
                isActive={i === activeSlotIndex}
                lockedTrayId={slot.trayId}
                lockedUnit={slot.dehydratorUnitId || undefined}
                lockedShelf={slot.shelfPosition || undefined}
                isProcessing={isProcessing}
                onSubmit={(trayId) => handleTrayScan(slot.moldId, trayId)}
                onUnprocess={slot.trayId ? () => handleUnprocessMold(slot.moldId) : undefined}
                isUnprocessing={isUnprocessing}
                focusKey={i === activeSlotIndex ? lockedCount : -i}
                compact={compact}
              />
            ))}
            <Button
              size="lg"
              disabled={!allLocked || isProcessing}
              className={`w-full ${c ? "text-xl h-14" : "text-2xl h-16 font-bold"} gap-3 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40`}
              onClick={() => {}}
            >
              <CheckCircle2 className={c ? "w-5 h-5" : "w-6 h-6"} />
              Dehydrating Complete
            </Button>
          </div>
        ) : null}
      </div>

      <div className="px-5 pb-5">
        <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
