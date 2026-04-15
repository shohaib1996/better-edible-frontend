"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, FlaskConical, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetOilContainersQuery, useCalculateOilPullQuery } from "@/redux/api/oil/oilApi";
import type { IOilContainer } from "@/types/privateLabel/pps";

export interface OilSelection {
  containerId: string;
  calculatedAmount: number;
  actualAmount: number;
}

interface OilContainerSelectProps {
  moldCount: number;
  compact?: boolean;
  onConfirmed: (selection: OilSelection) => void;
  onSkip: () => void;
}

export default function OilContainerSelect({
  moldCount,
  compact,
  onConfirmed,
  onSkip,
}: OilContainerSelectProps) {
  const c = compact;

  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const { data: containersData, isLoading: isLoadingContainers } = useGetOilContainersQuery(
    { status: "active" }
  );
  const containers = containersData?.containers ?? [];

  const { data: pullData, isLoading: isCalculating, isError: calcError } = useCalculateOilPullQuery(
    { containerId: selectedContainerId!, moldCount },
    { skip: !selectedContainerId }
  );

  const handleConfirm = () => {
    if (!pullData || !selectedContainerId) return;
    setConfirmed(true);
    onConfirmed({
      containerId: selectedContainerId,
      calculatedAmount: pullData.amountToUse,
      actualAmount: pullData.amountToUse,
    });
  };

  if (confirmed && pullData) {
    return (
      <div className={`flex items-center gap-3 px-4 ${c ? "py-3" : "py-4"} rounded-xs bg-green-500/10 border border-green-500/30 text-green-500`}>
        <CheckCircle2 className={`${c ? "w-5 h-5" : "w-6 h-6"} shrink-0`} />
        <p className={c ? "text-sm font-semibold" : "text-base font-semibold"}>
          Oil confirmed — {pullData.amountToUse}g from {pullData.containerName}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${c ? "gap-3" : "gap-4"} rounded-xs border border-amber-400/40 bg-amber-400/10 px-4 ${c ? "py-4" : "py-5"}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <FlaskConical className={`${c ? "w-4 h-4" : "w-5 h-5"} text-amber-500 shrink-0`} />
        <p className={`${c ? "text-sm" : "text-base"} font-semibold text-amber-500`}>
          Select the oil container in front of you
        </p>
      </div>

      {/* Container list */}
      {isLoadingContainers ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading containers…</span>
        </div>
      ) : containers.length === 0 ? (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">No active containers available. Contact admin.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {containers.map((container: IOilContainer) => {
            const isSelected = selectedContainerId === container.containerId;
            return (
              <button
                key={container.containerId}
                type="button"
                onClick={() => setSelectedContainerId(container.containerId)}
                className={`flex items-center justify-between px-4 ${c ? "py-3" : "py-4"} rounded-xs border text-left transition-colors ${
                  isSelected
                    ? "border-amber-500/60 bg-amber-400/15"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className={`${c ? "text-base" : "text-lg"} font-semibold`}>
                    {container.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {container.containerId}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className={`${c ? "text-base" : "text-lg"} font-bold text-primary`}>
                    {container.remainingAmount}g
                  </span>
                  <span className="text-xs text-muted-foreground">remaining</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pull calculation result */}
      {selectedContainerId && (
        <div className={`rounded-xs border px-4 ${c ? "py-3" : "py-4"} ${
          calcError
            ? "border-destructive/40 bg-destructive/10"
            : "border-border bg-muted/50"
        }`}>
          {isCalculating ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Calculating…</span>
            </div>
          ) : calcError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">Insufficient oil in this container — select another.</span>
            </div>
          ) : pullData ? (
            <p className={`${c ? "text-base" : "text-lg"} font-bold`}>
              {pullData.instruction}
            </p>
          ) : null}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          size={c ? "sm" : "lg"}
          onClick={handleConfirm}
          disabled={!pullData || isCalculating || !!calcError}
          className={`flex-1 ${c ? "text-sm h-10" : "text-base h-12"} rounded-xs bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40`}
        >
          {isCalculating
            ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
            : <CheckCircle2 className="w-4 h-4 mr-2" />}
          I have the oil — confirm
        </Button>
        <Button
          size={c ? "sm" : "lg"}
          variant="ghost"
          onClick={onSkip}
          className={`${c ? "text-xs h-10 px-4" : "text-sm h-12 px-5"} rounded-xs text-muted-foreground`}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
