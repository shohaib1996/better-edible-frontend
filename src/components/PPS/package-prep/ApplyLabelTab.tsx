"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import { useGetLabelInventoryQuery, usePrintLabelsMutation } from "@/redux/api/PrivateLabel/ppsApi";
import type { ILabelInventory } from "@/types/privateLabel/packagePrep";
import { Thumbnail, LoadingState, ErrorState, EmptyState, fieldClass, type PreviewImage } from "./PackagePrepShared";
import { ReorderThresholdInline } from "./ReorderThresholdInline";

type PrintForm = { qty: string; lotNumber: string; thcPercent: string; testDate: string };

export function ApplyLabelTab({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
  const { data, isLoading, isError } = useGetLabelInventoryQuery();
  const [printLabels, { isLoading: printing }] = usePrintLabelsMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, PrintForm>>({});
  const [previewImage, setPreviewImage] = useState<PreviewImage>(null);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load inventory." />;

  const items = (data?.inventory ?? [])
    .filter((i) => i.labeled > 0)
    .sort((a, b) => {
      const aBelow = a.reorderThreshold > 0 && (a.unprocessed + a.labeled + a.printed) < a.reorderThreshold;
      const bBelow = b.reorderThreshold > 0 && (b.unprocessed + b.labeled + b.printed) < b.reorderThreshold;
      return Number(bBelow) - Number(aBelow);
    });
  if (items.length === 0) return <EmptyState msg="No labeled bags awaiting printing." />;

  function getForm(id: string, labeled: number): PrintForm {
    return forms[id] ?? { qty: String(labeled), lotNumber: "", thcPercent: "", testDate: "" };
  }

  function setForm(id: string, patch: Partial<PrintForm>) {
    setForms((f) => ({ ...f, [id]: { ...getForm(id, 0), ...patch } }));
  }

  async function handlePrint(inv: ILabelInventory) {
    const form = getForm(inv._id, inv.labeled);
    const qty = parseInt(form.qty, 10);
    if (isNaN(qty) || qty < 1) { toast.error("Enter a valid quantity"); return; }
    if (qty > inv.labeled) { toast.error(`Only ${inv.labeled} labeled bags available`); return; }
    try {
      await printLabels({
        storeId: inv.storeId,
        labelId: inv.labelId,
        quantity: qty,
        lotNumber: form.lotNumber || undefined,
        thcPercent: form.thcPercent || undefined,
        testDate: form.testDate || undefined,
      }).unwrap();
      toast.success(`${qty} bags marked as printed`);
      setExpandedId(null);
    } catch {
      toast.error("Failed to record print");
    }
  }

  return (
    <>
      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
      <div className="flex flex-col gap-3">
        {items.map((inv) => {
          const isExpanded = expandedId === inv._id;
          const form = getForm(inv._id, inv.labeled);
          const belowThreshold = inv.reorderThreshold > 0 && (inv.unprocessed + inv.labeled + inv.printed) < inv.reorderThreshold;

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
                      <p className="text-sm text-muted-foreground mt-1">Awaiting print</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className={cn("font-bold tabular-nums", compact ? "text-xl" : "text-2xl")}>{inv.labeled.toLocaleString()}</p>
                    {!isExpanded && (
                      <button
                        onClick={() => { setExpandedId(inv._id); setForm(inv._id, { qty: String(inv.labeled) }); }}
                        className="px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                      >
                        Print Results
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-amber-400/30 bg-amber-400/10 px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">How many bags to mark as printed?</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={form.qty}
                      onChange={(e) => setForm(inv._id, { qty: e.target.value })}
                      className={cn(fieldClass, "flex-1")}
                      autoFocus
                    />
                    <button
                      onClick={() => setForm(inv._id, { qty: String(inv.labeled) })}
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
                      onClick={() => handlePrint(inv)}
                      disabled={printing}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {printing && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm Print
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
