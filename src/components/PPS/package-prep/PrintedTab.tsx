"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import { useGetLabelInventoryQuery } from "@/redux/api/PrivateLabel/ppsApi";
import { Thumbnail, LoadingState, ErrorState, EmptyState, type PreviewImage } from "./PackagePrepShared";
import { ReorderThresholdInline } from "./ReorderThresholdInline";

export function PrintedTab({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
  const { data, isLoading, isError } = useGetLabelInventoryQuery();
  const [previewImage, setPreviewImage] = useState<PreviewImage>(null);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load inventory." />;

  const items = (data?.inventory ?? [])
    .filter((i) => i.printed > 0)
    .sort((a, b) => {
      const aBelow = a.reorderThreshold > 0 && (a.unprocessed + a.labeled + a.printed) < a.reorderThreshold;
      const bBelow = b.reorderThreshold > 0 && (b.unprocessed + b.labeled + b.printed) < b.reorderThreshold;
      return Number(bBelow) - Number(aBelow);
    });
  if (items.length === 0) return <EmptyState msg="No printed bags in stock." />;

  const total = items.reduce((s, i) => s + i.printed, 0);

  return (
    <>
      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xs px-4 py-2.5 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
          {total.toLocaleString()} total finished bags ready for gummies
        </p>
        {items.map((inv) => {
          const belowThreshold = inv.reorderThreshold > 0 && (inv.unprocessed + inv.labeled + inv.printed) < inv.reorderThreshold;
          return (
            <div
              key={inv._id}
              className={cn(
                "rounded-xs border bg-card overflow-hidden",
                belowThreshold ? "border-red-300 border-l-4 border-l-red-500 dark:border-red-700 dark:border-l-red-500" : "border-border",
              )}
            >
              <div className="px-4 py-4">
                {belowThreshold && (
                  <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xs px-2.5 py-1.5 mb-3 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Below reorder threshold
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Thumbnail url={inv.labelImageUrl} name={inv.labelName} onPreview={setPreviewImage} />
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold truncate", compact ? "text-base" : "text-lg")}>{inv.storeName}</p>
                      <p className={cn("font-medium text-foreground mt-0.5", compact ? "text-sm" : "text-base")}>{inv.labelName}</p>
                      {inv.lastPrintData && (
                        <p className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                          <span>Lot: {inv.lastPrintData.lotNumber}</span>
                          <span>THC: {inv.lastPrintData.thcPercent}</span>
                          <span>{inv.lastPrintData.testDate}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <p className={cn("font-bold tabular-nums text-green-700 shrink-0 dark:text-green-400", compact ? "text-xl" : "text-2xl")}>
                    {inv.printed.toLocaleString()}
                  </p>
                </div>
              </div>
              {isAdmin && <ReorderThresholdInline inv={inv} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
