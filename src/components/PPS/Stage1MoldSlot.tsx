"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import BarcodeScannerInput from "@/components/PPS/BarcodeScannerInput";

export interface Stage1MoldSlotProps {
  index: number;
  total: number;
  isActive: boolean;
  isAssigned: boolean;
  assignedId?: string;
  units: number;
  onUnitsChange: (units: number) => void;
  isAssigning: boolean;
  isCancelling: boolean;
  onSubmit: (barcode: string) => Promise<boolean>;
  onCancel: () => void;
  /** Changes when a new mold is assigned — forces remount so autoFocus fires */
  focusKey: number;
  compact?: boolean;
}

export default function Stage1MoldSlot({
  index,
  total,
  isActive,
  isAssigned,
  assignedId,
  units,
  onUnitsChange,
  isAssigning,
  isCancelling,
  onSubmit,
  onCancel,
  focusKey,
  compact,
}: Stage1MoldSlotProps) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState(false);

  const handleSubmit = useCallback(
    async (barcode: string) => {
      const trimmed = barcode.trim();
      if (!trimmed || isAssigning) return;
      const ok = await onSubmit(trimmed);
      if (ok) {
        setValue("");
        setFlash(true);
        setTimeout(() => setFlash(false), 700);
      }
    },
    [isAssigning, onSubmit],
  );

  if (isAssigned) {
    return (
      <div className={`flex items-center ${compact ? "gap-3 px-4 py-3" : "gap-4 px-5 py-4"} rounded-xs bg-green-50 border border-green-200`}>
        <CheckCircle2 className={`${compact ? "w-6 h-6" : "w-9 h-9"} text-green-600 shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`${compact ? "text-xs" : "text-base"} text-muted-foreground font-medium`}>
            Mold {index + 1} of {total}
          </p>
          <p className={`${compact ? "text-lg" : "text-2xl"} font-mono font-bold text-green-700 truncate`}>
            {assignedId}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`${compact ? "text-xs" : "text-sm"} text-muted-foreground`}>Units:</span>
          <input
            type="number"
            min={1}
            value={units}
            onChange={(e) => onUnitsChange(Math.max(1, Number(e.target.value) || 1))}
            className={`${compact ? "w-16 text-sm px-1 py-1 focus:ring-1" : "w-20 text-lg px-2 py-2 focus:ring-2"} font-mono font-bold text-center border rounded-xs bg-white focus:outline-none focus:ring-primary`}
          />
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isCancelling}
          className={`shrink-0 ${compact ? "p-1.5" : "p-2"} rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40`}
          title="Remove mold"
        >
          {isCancelling
            ? <Loader2 className={`${compact ? "w-4 h-4" : "w-5 h-5"} animate-spin`} />
            : <X className={`${compact ? "w-4 h-4" : "w-5 h-5"}`} />}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${compact ? "gap-2" : "gap-3"} rounded-xs border p-4 transition-colors ${
        flash
          ? "bg-green-100 border-green-400"
          : isActive
            ? "border-primary bg-primary/5"
            : "border-muted bg-muted/30 opacity-60"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={compact ? "text-sm font-medium text-muted-foreground" : "text-lg font-semibold text-foreground"}>
          Mold {index + 1} of {total}
        </p>
        <div className="flex items-center gap-2">
          <span className={`${compact ? "text-xs" : "text-sm"} text-muted-foreground`}>Units:</span>
          <input
            type="number"
            min={1}
            value={units}
            onChange={(e) => onUnitsChange(Math.max(1, Number(e.target.value) || 1))}
            disabled={!isActive}
            className={`${compact ? "w-16 text-sm px-1 py-1 focus:ring-1" : "w-20 text-lg px-2 py-2 focus:ring-2"} font-mono font-bold text-center border rounded-xs bg-white focus:outline-none focus:ring-primary disabled:opacity-50`}
          />
        </div>
      </div>
      <BarcodeScannerInput
        key={focusKey}
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder={isActive ? "Scan mold barcode…" : "Waiting…"}
        disabled={!isActive || isAssigning}
        mode="barcode"
        inputClassName={compact ? "text-xl font-mono h-14" : "text-2xl font-mono h-16"}
        showManualActions={isActive}
        autoFocus={isActive}
      />
      {isActive && (
        <p className={`${compact ? "text-xs" : "text-sm"} text-muted-foreground`}>
          Scan barcode, use camera, or press Enter
        </p>
      )}
    </div>
  );
}
