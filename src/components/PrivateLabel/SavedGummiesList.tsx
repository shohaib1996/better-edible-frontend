"use client";

import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";
import { LabelCard } from "./LabelCard";

interface Props {
  storeId: string;
  labels: IStoreDraftLabel[];
  isLoading: boolean;
}

export function SavedGummiesList({ storeId, labels, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xs border border-border bg-card p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (labels.length === 0) {
    return (
      <div className="rounded-xs border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
        No gummies saved yet. Use the builder to add your first SKU.
      </div>
    );
  }

  const totalUnits = labels.reduce((sum, l) => sum + (l.unitsOrdered ?? 0), 0);
  const totalCost = labels.reduce((sum, l) => sum + (l.totalCost ?? 0), 0);
  const totalTestingFees = labels.reduce(
    (sum, l) => sum + (l.isRatio && !l.testingFeeWaived ? 250 : 0),
    0,
  );
  const grandTotal = totalCost + totalTestingFees;

  return (
    <div className="space-y-3">
      {labels.map((label) => (
        <LabelCard key={label._id} label={label} storeId={storeId} />
      ))}

      {/* Line summary */}
      <div className="rounded-xs border border-border bg-muted/30 mt-1">
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">SKUs</p>
            <p className="text-lg font-bold mt-0.5">{labels.length}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Units</p>
            <p className="text-lg font-bold mt-0.5">{totalUnits.toLocaleString()}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Cost</p>
            <p className="text-lg font-bold mt-0.5 text-primary">${grandTotal.toFixed(2)}</p>
          </div>
        </div>
        {totalTestingFees > 0 && (
          <div className="px-4 py-2 text-xs text-amber-700 dark:text-amber-400 text-center">
            Includes ${totalTestingFees.toLocaleString()} in testing fees — order 3,000+ units per ratio SKU to waive.
          </div>
        )}
      </div>
    </div>
  );
}
