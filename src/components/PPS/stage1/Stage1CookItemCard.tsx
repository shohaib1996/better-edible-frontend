"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Loader2, Plus, FlaskConical, Palette, Pencil, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPPSUser } from "@/lib/ppsUser";
import CookItemHistory from "@/components/PPS/shared/CookItemHistory";
import Stage1MoldSlot from "@/components/PPS/stage1/Stage1MoldSlot";
import OilContainerSelect from "@/components/PPS/stage1/OilContainerSelect";
import FlavorColorModal from "@/components/PPS/stage1/FlavorColorModal";
import type { OilSelection } from "@/components/PPS/stage1/OilContainerSelect";
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

type CardMode = "idle" | "oil" | "molding" | "confirming" | "done";

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
  const initialMode: CardMode = isComplete
    ? "done"
    : item.status === "in-progress"
      ? "molding"
      : "idle";

  const [mode, setMode] = useState<CardMode>(initialMode);
  const [extraMolds, setExtraMolds] = useState(0);
  const [moldUnits, setMoldUnits] = useState<number[]>(() =>
    item.moldingTimestamps.map((t) => t.unitsPerMold ?? 70),
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
    [assignMold, item.cookItemId, assignedCount, moldUnits],
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
    [unassignMold, item.cookItemId],
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

  const c = compact; // shorthand

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

      {/* Flavor & Color block */}
      <FlavorColorBlock
        item={item}
        compact={compact}
        flavorNameMap={flavorNameMap}
        colorNameMap={colorNameMap}
        onOpen={() => setFlavorColorOpen(true)}
      />

      {/* Flavor & Color modal */}
      <FlavorColorModal
        open={flavorColorOpen}
        onClose={() => setFlavorColorOpen(false)}
        cookItem={item}
        compact={compact}
      />

      {/* Action area */}
      <div className={`px-5 ${c ? "py-4 gap-3" : "py-5 gap-4"} flex flex-col`}>
        {effectiveMode === "done" || isComplete ? (
          <div className="flex flex-col gap-2">
            <div className={`flex items-center gap-${c ? "3" : "4"} py-4 text-green-600`}>
              <CheckCircle2 className={`${c ? "w-8 h-8" : "w-10 h-10"} shrink-0`} />
              <p className={c ? "text-xl font-semibold" : "text-2xl font-bold"}>
                Molding Complete — {assignedCount} mold{assignedCount !== 1 ? "s" : ""},{" "}
                {qtyProduced.toLocaleString()} units
              </p>
            </div>
            {item.oilContainerId && item.oilActualAmount ? (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xs bg-amber-400/10 border border-amber-400/30 text-amber-500 ${c ? "text-xs" : "text-sm"}`}>
                <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                <span>Oil used: <span className="font-semibold">{item.oilActualAmount}g</span> from <span className="font-mono">{item.oilContainerId}</span></span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xs bg-muted border border-border text-muted-foreground ${c ? "text-xs" : "text-sm"}`}>
                <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                <span>No oil recorded</span>
              </div>
            )}
          </div>
        ) : effectiveMode === "confirming" ? (
          <div className={`flex flex-col ${c ? "gap-3" : "gap-4"}`}>
            <div className={`flex items-center ${c ? "gap-3 px-4 py-4" : "gap-4 px-5 py-5"} rounded-xs bg-green-50 border border-green-200`}>
              <CheckCircle2 className={`${c ? "w-7 h-7" : "w-9 h-9"} text-green-600 shrink-0`} />
              <p className={`${c ? "text-lg font-semibold" : "text-xl font-bold"} text-green-800`}>
                Molding for <span className="font-bold">{item.flavor}</span> is finished.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={handleFinish}
                disabled={isCompleting}
                className={`flex-1 ${c ? "text-xl h-14" : "text-2xl h-16 font-bold"} gap-3 rounded-xs bg-green-600 hover:bg-green-700 text-white disabled:opacity-40`}
              >
                {isCompleting
                  ? <Loader2 className={`${c ? "w-5 h-5" : "w-6 h-6"} animate-spin`} />
                  : <CheckCircle2 className={`${c ? "w-5 h-5" : "w-6 h-6"}`} />}
                Finish
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setMode("molding")}
                disabled={isCompleting}
                className={`${c ? "text-base h-14 px-6" : "text-lg h-16 px-8 font-semibold"} rounded-xs`}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : effectiveMode === "oil" ? (
          <OilContainerSelect
            moldCount={totalMolds}
            compact={compact}
            onConfirmed={(selection) => {
              setOilSelection(selection);
              setMode("molding");
            }}
            onSkip={() => {
              setOilSelection(null);
              setMode("molding");
            }}
          />
        ) : effectiveMode === "idle" ? (
          <Button
            size="lg"
            variant="outline"
            className={`w-full ${c ? "text-xl h-14" : "text-2xl h-16 font-bold"} rounded-xs`}
            onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); setMode("oil"); }}
          >
            Start
          </Button>
        ) : effectiveMode === "molding" ? (
          <div className="flex flex-col gap-3">
            {oilSelection && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xs bg-amber-400/10 border border-amber-400/30 text-amber-500 ${c ? "text-xs" : "text-sm"}`}>
                <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                <span>Oil confirmed: <span className="font-semibold">{oilSelection.actualAmount}g</span> from <span className="font-mono">{oilSelection.containerId}</span></span>
              </div>
            )}
            {Array.from({ length: totalMolds }).map((_, i) => (
              <Stage1MoldSlot
                key={i}
                index={i}
                total={totalMolds}
                isActive={i === assignedCount}
                isAssigned={i < assignedCount}
                assignedId={item.assignedMoldIds[i]}
                units={moldUnits[i] ?? UNITS_PER_MOLD}
                onUnitsChange={(u) => handleUnitsChange(i, u)}
                isAssigning={isAssigning}
                isCancelling={cancellingMoldId === item.assignedMoldIds[i]}
                onSubmit={handleAssignMold}
                onCancel={() => handleUnassignMold(item.assignedMoldIds[i])}
                focusKey={i === assignedCount ? assignedCount : -i}
                compact={compact}
              />
            ))}
            <Button
              size={c ? "sm" : "lg"}
              variant="outline"
              className={`self-start ${c ? "gap-1.5 text-sm" : "gap-2 text-lg h-12 px-5"} rounded-xs`}
              onClick={() => {
                setExtraMolds((n) => n + 1);
                setMoldUnits((prev) => [...prev, UNITS_PER_MOLD]);
              }}
            >
              <Plus className={c ? "w-4 h-4" : "w-5 h-5"} />
              Add Mold
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

// ─── Flavor & Color Info Block ────────────────────────────────────────────────

function FlavorColorBlock({
  item,
  compact,
  flavorNameMap,
  colorNameMap,
  onOpen,
}: {
  item: ICookItem;
  compact?: boolean;
  flavorNameMap: Map<string, string>;
  colorNameMap: Map<string, string>;
  onOpen: () => void;
}) {
  const c = compact;
  const hasData = (item.flavorIds?.length ?? 0) > 0;

  if (!hasData) {
    return (
      <div className={`mx-5 mb-3 flex items-center justify-between gap-3 px-4 ${c ? "py-3" : "py-4"} rounded-xs border border-dashed border-amber-400/50 bg-amber-400/5`}>
        <div className="flex items-center gap-2 text-amber-700">
          <AlertCircle className={`${c ? "w-4 h-4" : "w-5 h-5"} shrink-0`} />
          <p className={c ? "text-xs font-medium" : "text-sm font-medium"}>
            No flavor &amp; color recorded
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className={`shrink-0 rounded-xs gap-1.5 ${c ? "text-xs h-7" : "text-sm h-9"} border-amber-400/50 text-amber-700 hover:bg-amber-400/10`}
          onClick={onOpen}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>
    );
  }

  return (
    <div className={`mx-5 mb-3 rounded-xs border bg-muted/30 ${c ? "px-4 py-3" : "px-4 py-4"} space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`${c ? "text-xs" : "text-sm"} font-semibold text-foreground`}>
          Flavor &amp; Color
        </p>
        <Button
          size="sm"
          variant="ghost"
          className={`shrink-0 rounded-xs gap-1 ${c ? "text-xs h-6 px-2" : "text-xs h-7 px-2"} text-muted-foreground`}
          onClick={onOpen}
        >
          <Pencil className="w-3 h-3" />
          Edit
        </Button>
      </div>

      {/* Flavors */}
      {(item.flavorAmounts ?? []).map((fa, i) => (
        <div key={i} className="flex items-center gap-2">
          <FlaskConical className={`${c ? "w-3.5 h-3.5" : "w-4 h-4"} text-amber-500 shrink-0`} />
          <span className={`${c ? "text-xs" : "text-sm"} font-medium flex-1 truncate`}>
            {flavorNameMap.get(fa.flavorId) ?? fa.flavorId}
          </span>
          <span className={`${c ? "text-xs" : "text-sm"} font-semibold tabular-nums text-foreground`}>
            {fa.amountGrams}g
          </span>
        </div>
      ))}

      {/* Divider */}
      {(item.colorAmounts ?? []).length > 0 && (
        <div className="border-t my-1" />
      )}

      {/* Colors */}
      {(item.colorAmounts ?? []).length > 0 ? (
        (item.colorAmounts ?? []).map((ca, i) => (
          <div key={i} className="flex items-center gap-2">
            <Palette className={`${c ? "w-3.5 h-3.5" : "w-4 h-4"} text-purple-500 shrink-0`} />
            <span className={`${c ? "text-xs" : "text-sm"} font-medium flex-1 truncate`}>
              {colorNameMap.get(ca.colorId) ?? ca.colorId}
            </span>
            <span className={`${c ? "text-xs" : "text-sm"} font-semibold tabular-nums text-foreground`}>
              {ca.amountGrams}g
            </span>
          </div>
        ))
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Palette className={`${c ? "w-3.5 h-3.5" : "w-4 h-4"} shrink-0`} />
          <span className={c ? "text-xs" : "text-sm"}>No color</span>
        </div>
      )}
    </div>
  );
}
