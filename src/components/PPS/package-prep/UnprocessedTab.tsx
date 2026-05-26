"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import { useGetLabelInventoryQuery, useApplyLabelsMutation } from "@/redux/api/PrivateLabel/ppsApi";
import type { ILabelInventory } from "@/types/privateLabel/packagePrep";
import { Thumbnail, LoadingState, ErrorState, EmptyState, fieldClass, type PreviewImage } from "./PackagePrepShared";
import { ReorderThresholdInline } from "./ReorderThresholdInline";

export function UnprocessedTab({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
  const { data, isLoading, isError } = useGetLabelInventoryQuery();
  const [applyLabels, { isLoading: applying }] = useApplyLabelsMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applyQty, setApplyQty] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<PreviewImage>(null);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load inventory." />;

  const items = (data?.inventory ?? [])
    .filter((i) => i.unprocessed > 0)
    .sort((a, b) => {
      const aBelow = a.reorderThreshold > 0 && (a.unprocessed + a.labeled + a.printed) < a.reorderThreshold;
      const bBelow = b.reorderThreshold > 0 && (b.unprocessed + b.labeled + b.printed) < b.reorderThreshold;
      return Number(bBelow) - Number(aBelow);
    });
  if (items.length === 0) return <EmptyState msg="No unprocessed labels." />;

  async function handleApply(inv: ILabelInventory) {
    const qty = parseInt(applyQty[inv._id] ?? "", 10);
    if (isNaN(qty) || qty < 1) { toast.error("Enter a valid quantity"); return; }
    try {
      await applyLabels({ storeId: inv.storeId, labelId: inv.labelId, quantity: qty }).unwrap();
      toast.success(`${qty} labels moved to labeled`);
      setExpandedId(null);
    } catch {
      toast.error("Failed to apply labels");
    }
  }

  return (
    <>
      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
      <div className="flex flex-col gap-3">
        {items.map((inv) => {
          const isExpanded = expandedId === inv._id;
          const totalStock = inv.unprocessed + inv.labeled + inv.printed;
          const belowThreshold = inv.reorderThreshold > 0 && totalStock < inv.reorderThreshold;

          return (
            <div
              key={inv._id}
              className={cn(
                "rounded-xs border bg-card overflow-hidden",
                belowThreshold ? "border-red-300 border-l-4 border-l-red-500 dark:border-red-700 dark:border-l-red-500" : "border-border",
              )}
            >
              <div className="px-4 pt-4 pb-3">
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
                      {isAdmin && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reorder threshold:{" "}
                          <span className="font-semibold">
                            {inv.reorderThreshold > 0 ? inv.reorderThreshold.toLocaleString() : "not set"}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className={cn("font-bold tabular-nums", compact ? "text-xl" : "text-2xl")}>{inv.unprocessed.toLocaleString()}</p>
                    {!isExpanded && (
                      <button
                        onClick={() => { setExpandedId(inv._id); setApplyQty((q) => ({ ...q, [inv._id]: String(inv.unprocessed) })); }}
                        className="px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-amber-400/30 bg-amber-400/10 px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">How many labels to apply to bags now?</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={applyQty[inv._id] ?? ""}
                      onChange={(e) => setApplyQty((q) => ({ ...q, [inv._id]: e.target.value }))}
                      className={cn(fieldClass, "flex-1")}
                      autoFocus
                    />
                    <button
                      onClick={() => setApplyQty((q) => ({ ...q, [inv._id]: String(inv.unprocessed) }))}
                      className="shrink-0 px-3 py-2 rounded-xs border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
                    >
                      All
                    </button>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <button onClick={() => setExpandedId(null)} className="px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleApply(inv)}
                      disabled={applying}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {applying && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm Apply
                    </button>
                  </div>
                </div>
              )}

              {isAdmin && <ReorderThresholdInline inv={inv} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
