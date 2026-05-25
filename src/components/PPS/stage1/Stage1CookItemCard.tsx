"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getPPSUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/shared/CookItemHistory";
import FlavorColorModal from "./FlavorColorModal";
import FlavorColorBlock from "./FlavorColorBlock";
import Stage1ActionArea from "./Stage1ActionArea";
import type { OilSelection } from "./OilContainerSelect";
import {
  useAssignMoldMutation,
  useUnassignMoldMutation,
  useCompleteStage1Mutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import { useGetFlavorsQuery } from "@/redux/api/flavor/flavorsApi";
import { useGetColorsQuery } from "@/redux/api/color/colorsApi";
import {
  COOK_ITEM_STATUS_COLORS,
  COOK_ITEM_STATUS_LABELS,
} from "@/constants/privateLabel";
import type { ICookItem } from "@/types/privateLabel/pps";

const UNITS_PER_MOLD = 70;

function moldsNeeded(quantity: number) {
  return Math.ceil(quantity / UNITS_PER_MOLD);
}

export type CardMode = "idle" | "oil" | "molding" | "confirming" | "done";

export interface Stage1CookItemCardProps {
  item: ICookItem;
  isAdmin: boolean;
  batchStarted: boolean;
  onItemDone: () => void;
  compact?: boolean;
}

export default function Stage1CookItemCard({
  item,
  isAdmin,
  batchStarted,
  onItemDone,
  compact,
}: Stage1CookItemCardProps) {
  const isComplete = item.status === "cooking_molding_complete";
  const initialMode: CardMode = isComplete ? "done" : item.status === "in-progress" ? "molding" : "idle";

  const [mode, setMode] = useState<CardMode>(initialMode);
  const [extraMolds, setExtraMolds] = useState(0);
  const [moldUnits, setMoldUnits] = useState<number[]>(() =>
    item.moldingTimestamps.map((t) => t.unitsPerMold ?? 70)
  );
  const [cancellingMoldId, setCancellingMoldId] = useState<string | null>(null);
  const [oilSelection, setOilSelection] = useState<OilSelection | null>(null);
  const [flavorColorOpen, setFlavorColorOpen] = useState(false);

  const [assignMold, { isLoading: isAssigning }] = useAssignMoldMutation();
  const [unassignMold] = useUnassignMoldMutation();
  const [completeStage1, { isLoading: isCompleting }] = useCompleteStage1Mutation();

  const { data: flavorsData } = useGetFlavorsQuery();
  const { data: colorsData } = useGetColorsQuery();
  const flavorNameMap = new Map((flavorsData?.flavors ?? []).map((f) => [f.flavorId, f.name]));
  const colorNameMap = new Map((colorsData?.colors ?? []).map((c) => [c.colorId, c.name]));

  const totalMolds = moldsNeeded(item.quantity) + extraMolds;
  const assignedCount = item.assignedMoldIds.length;
  const allMoldsAssigned = assignedCount >= totalMolds;
  const effectiveMode: CardMode = mode === "idle" && batchStarted ? "oil" : mode;

  useEffect(() => {
    setMoldUnits((prev) => {
      const updated = [...prev];
      item.moldingTimestamps.forEach((t, i) => {
        if (updated[i] === undefined) updated[i] = t.unitsPerMold ?? 70;
      });
      while (updated.length < totalMolds) updated.push(UNITS_PER_MOLD);
      return updated;
    });
  }, [item.moldingTimestamps, totalMolds]);

  useEffect(() => {
    if (effectiveMode === "molding" && allMoldsAssigned && assignedCount > 0) {
      setMode("confirming");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMoldsAssigned, assignedCount]);

  const handleAssignMold = useCallback(
    async (barcode: string): Promise<boolean> => {
      const units = moldUnits[assignedCount] ?? UNITS_PER_MOLD;
      try {
        await assignMold({
          cookItemId: item.cookItemId,
          moldId: barcode,
          unitsPerMold: units,
          performedBy: getPPSUser(),
        } as any).unwrap();
        return true;
      } catch (err: any) {
        toast.error(err?.data?.message || "Mold already in use or not found");
        return false;
      }
    },
    [assignMold, item.cookItemId, assignedCount, moldUnits]
  );

  const handleUnassignMold = useCallback(
    async (moldId: string) => {
      setCancellingMoldId(moldId);
      try {
        await unassignMold({
          cookItemId: item.cookItemId,
          moldId,
          performedBy: getPPSUser(),
        } as any).unwrap();
        setMode("molding");
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to remove mold");
      } finally {
        setCancellingMoldId(null);
      }
    },
    [unassignMold, item.cookItemId]
  );

  const handleFinish = useCallback(async () => {
    try {
      await completeStage1({
        cookItemId: item.cookItemId,
        ...(oilSelection && {
          oilContainerId: oilSelection.containerId,
          oilCalculatedAmount: oilSelection.calculatedAmount,
          oilActualAmount: oilSelection.actualAmount,
        }),
        performedBy: getPPSUser(),
      } as any).unwrap();
      setMode("done");
      onItemDone();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to complete Stage 1");
    }
  }, [completeStage1, item.cookItemId, oilSelection, onItemDone]);

  const handleUnitsChange = useCallback((index: number, units: number) => {
    setMoldUnits((prev) => {
      const updated = [...prev];
      updated[index] = units;
      return updated;
    });
  }, []);

  const statusColor = COOK_ITEM_STATUS_COLORS[item.status] ?? "";
  const statusLabel = COOK_ITEM_STATUS_LABELS[item.status] ?? item.status;
  const qtyProduced = moldUnits.slice(0, assignedCount).reduce((sum, u) => sum + (u || 0), 0);
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
      <div className="grid grid-cols-4 gap-0 border-t border-b divide-x mx-5">
        {([
          ["Qty Ordered", item.quantity.toLocaleString(), ""],
          ["Qty Produced", qtyProduced.toLocaleString(), assignedCount > 0 ? "text-blue-600" : ""],
          ["Molds Needed", String(totalMolds), ""],
          ["Scanned", `${assignedCount}/${totalMolds}`, allMoldsAssigned ? "text-green-600" : ""],
        ] as const).map(([label, value, color]) => (
          <div key={label} className={`px-3 ${c ? "py-3" : "py-4"}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={`${c ? "text-2xl" : "text-3xl"} font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Flavor & Color */}
      <FlavorColorBlock
        item={item}
        compact={c}
        flavorNameMap={flavorNameMap}
        colorNameMap={colorNameMap}
        onOpen={() => setFlavorColorOpen(true)}
      />
      <FlavorColorModal
        open={flavorColorOpen}
        onClose={() => setFlavorColorOpen(false)}
        cookItem={item}
        compact={c}
      />

      {/* Action area */}
      <div className={`px-5 ${c ? "py-4 gap-3" : "py-5 gap-4"} flex flex-col`}>
        <Stage1ActionArea
          item={item}
          effectiveMode={effectiveMode}
          isComplete={isComplete}
          compact={c}
          assignedCount={assignedCount}
          totalMolds={totalMolds}
          qtyProduced={qtyProduced}
          oilSelection={oilSelection}
          moldUnits={moldUnits}
          isAssigning={isAssigning}
          isCompleting={isCompleting}
          cancellingMoldId={cancellingMoldId}
          onAssignMold={handleAssignMold}
          onUnassignMold={handleUnassignMold}
          onFinish={handleFinish}
          onSetMode={setMode}
          onAddMold={() => {
            setExtraMolds((n) => n + 1);
            setMoldUnits((prev) => [...prev, UNITS_PER_MOLD]);
          }}
          onUnitsChange={handleUnitsChange}
          onOilConfirmed={(sel) => setOilSelection(sel ?? null)}
        />
      </div>

      <div className="px-5 pb-5">
        <CookItemHistory cookItemId={item.cookItemId} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
