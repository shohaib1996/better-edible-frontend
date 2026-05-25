"use client";

import { CheckCircle2, FlaskConical, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Stage1MoldSlot from "./Stage1MoldSlot";
import OilContainerSelect from "./OilContainerSelect";
import type { OilSelection } from "./OilContainerSelect";
import type { ICookItem } from "@/types/privateLabel/pps";
import type { CardMode } from "./Stage1CookItemCard";

const UNITS_PER_MOLD = 70;

interface Props {
  item: ICookItem;
  effectiveMode: CardMode;
  isComplete: boolean;
  compact?: boolean;
  assignedCount: number;
  totalMolds: number;
  qtyProduced: number;
  oilSelection: OilSelection | null;
  moldUnits: number[];
  isAssigning: boolean;
  isCompleting: boolean;
  cancellingMoldId: string | null;
  onAssignMold: (barcode: string) => Promise<boolean>;
  onUnassignMold: (moldId: string) => void;
  onFinish: () => void;
  onSetMode: (mode: CardMode) => void;
  onAddMold: () => void;
  onUnitsChange: (index: number, units: number) => void;
  onOilConfirmed: (selection: OilSelection | null) => void;
}

export default function Stage1ActionArea({
  item,
  effectiveMode,
  isComplete,
  compact: c,
  assignedCount,
  totalMolds,
  qtyProduced,
  oilSelection,
  moldUnits,
  isAssigning,
  isCompleting,
  cancellingMoldId,
  onAssignMold,
  onUnassignMold,
  onFinish,
  onSetMode,
  onAddMold,
  onUnitsChange,
  onOilConfirmed,
}: Props) {
  if (effectiveMode === "done" || isComplete) {
    return (
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
            <span>
              Oil used: <span className="font-semibold">{item.oilActualAmount}g</span> from{" "}
              <span className="font-mono">{item.oilContainerId}</span>
            </span>
          </div>
        ) : (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xs bg-muted border border-border text-muted-foreground ${c ? "text-xs" : "text-sm"}`}>
            <FlaskConical className="w-3.5 h-3.5 shrink-0" />
            <span>No oil recorded</span>
          </div>
        )}
      </div>
    );
  }

  if (effectiveMode === "confirming") {
    return (
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
            onClick={onFinish}
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
            onClick={() => onSetMode("molding")}
            disabled={isCompleting}
            className={`${c ? "text-base h-14 px-6" : "text-lg h-16 px-8 font-semibold"} rounded-xs`}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (effectiveMode === "oil") {
    return (
      <OilContainerSelect
        moldCount={totalMolds}
        compact={c}
        onConfirmed={(selection) => {
          onOilConfirmed(selection);
          onSetMode("molding");
        }}
        onSkip={() => {
          onOilConfirmed(null);
          onSetMode("molding");
        }}
      />
    );
  }

  if (effectiveMode === "idle") {
    return (
      <Button
        size="lg"
        variant="outline"
        className={`w-full ${c ? "text-xl h-14" : "text-2xl h-16 font-bold"} rounded-xs`}
        onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); onSetMode("oil"); }}
      >
        Start
      </Button>
    );
  }

  if (effectiveMode === "molding") {
    return (
      <div className="flex flex-col gap-3">
        {oilSelection && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xs bg-amber-400/10 border border-amber-400/30 text-amber-500 ${c ? "text-xs" : "text-sm"}`}>
            <FlaskConical className="w-3.5 h-3.5 shrink-0" />
            <span>
              Oil confirmed: <span className="font-semibold">{oilSelection.actualAmount}g</span> from{" "}
              <span className="font-mono">{oilSelection.containerId}</span>
            </span>
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
            onUnitsChange={(u) => onUnitsChange(i, u)}
            isAssigning={isAssigning}
            isCancelling={cancellingMoldId === item.assignedMoldIds[i]}
            onSubmit={onAssignMold}
            onCancel={() => onUnassignMold(item.assignedMoldIds[i])}
            focusKey={i === assignedCount ? assignedCount : -i}
            compact={c}
          />
        ))}
        <Button
          size={c ? "sm" : "lg"}
          variant="outline"
          className={`self-start ${c ? "gap-1.5 text-sm" : "gap-2 text-lg h-12 px-5"} rounded-xs`}
          onClick={onAddMold}
        >
          <Plus className={c ? "w-4 h-4" : "w-5 h-5"} />
          Add Mold
        </Button>
      </div>
    );
  }

  return null;
}
