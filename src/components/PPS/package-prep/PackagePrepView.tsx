"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, AlertTriangle, Pencil, Check, X, ImageOff, Eye, PackagePlus, ChevronDown, Trash2 } from "lucide-react";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useGetActiveLabelOrdersQuery,
  useReceiveLabelOrderMutation,
  useUpdateLabelOrderMutation,
  useDeleteLabelOrderMutation,
  useGetLabelInventoryQuery,
  useApplyLabelsMutation,
  usePrintLabelsMutation,
  useSetReorderThresholdMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import PackagePrepAdminOrder from "./PackagePrepAdminOrder";
import type {
  ILabelOrder,
  ILabelInventory,
} from "@/types/privateLabel/packagePrep";

type Tab = "on_order" | "unprocessed" | "apply_label" | "printed";

const TABS: { id: Tab; label: string }[] = [
  { id: "on_order", label: "On Order" },
  { id: "unprocessed", label: "Unprocessed" },
  { id: "apply_label", label: "Apply Label" },
  { id: "printed", label: "Printed" },
];

const fieldClass =
  "w-full rounded-xs border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors";

type PreviewImage = { url: string; filename: string } | null;

// ─── Thumbnail ─────────────────────────────────────────────────────────────────

function Thumbnail({
  url,
  name,
  onPreview,
}: {
  url?: string | null;
  name: string;
  onPreview: (img: { url: string; filename: string }) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => url && onPreview({ url, filename: name })}
      className={cn(
        "group relative h-12 w-12 shrink-0 rounded-xs overflow-hidden border border-border bg-muted flex items-center justify-center mt-0.5",
        url ? "cursor-pointer" : "cursor-default"
      )}
    >
      {url ? (
        <>
          <Image src={url} alt={name} fill className="object-cover" sizes="48px" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </>
      ) : (
        <ImageOff className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

// ─── On Order Tab ─────────────────────────────────────────────────────────────

type OnOrderPanel = "receive" | "edit" | "delete" | null;

function OnOrderTab({ compact, isAdmin }: { compact?: boolean; isAdmin: boolean }) {
  const { data, isLoading, isError } = useGetActiveLabelOrdersQuery();
  const [receiveOrder, { isLoading: receiving }] = useReceiveLabelOrderMutation();
  const [updateOrder, { isLoading: updating }] = useUpdateLabelOrderMutation();
  const [deleteOrder, { isLoading: deleting }] = useDeleteLabelOrderMutation();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<OnOrderPanel>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [editForms, setEditForms] = useState<Record<string, { qty: string; notes: string }>>({});
  const [previewImage, setPreviewImage] = useState<PreviewImage>(null);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load orders." />;

  const orders = data?.orders ?? [];
  if (orders.length === 0) return <EmptyState msg="No labels on order." />;

  function openPanel(orderId: string, panel: OnOrderPanel, order?: ILabelOrder) {
    setExpandedId(orderId);
    setActivePanel(panel);
    if (panel === "receive" && order) {
      setQuantities((q) => ({ ...q, [orderId]: String(order.quantityOrdered) }));
    }
    if (panel === "edit" && order) {
      setEditForms((f) => ({ ...f, [orderId]: { qty: String(order.quantityOrdered), notes: order.notes ?? "" } }));
    }
  }

  function closePanel() {
    setExpandedId(null);
    setActivePanel(null);
  }

  async function handleReceive(order: ILabelOrder) {
    const qty = parseInt(quantities[order._id] ?? String(order.quantityOrdered), 10);
    if (isNaN(qty) || qty < 1) { toast.error("Enter a valid quantity"); return; }
    try {
      await receiveOrder({ orderId: order._id, quantityReceived: qty }).unwrap();
      toast.success(`Received ${qty} labels for ${order.labelName}`);
      closePanel();
    } catch {
      toast.error("Failed to record receipt");
    }
  }

  async function handleEdit(order: ILabelOrder) {
    const form = editForms[order._id];
    if (!form) return;
    const qty = parseInt(form.qty, 10);
    if (isNaN(qty) || qty < 1) { toast.error("Enter a valid quantity"); return; }
    try {
      await updateOrder({ orderId: order._id, quantityOrdered: qty, notes: form.notes || undefined }).unwrap();
      toast.success("Order updated");
      closePanel();
    } catch {
      toast.error("Failed to update order");
    }
  }

  async function handleDelete(order: ILabelOrder) {
    try {
      await deleteOrder({ orderId: order._id }).unwrap();
      toast.success(`Order ${order.orderNumber} cancelled`);
      closePanel();
    } catch {
      toast.error("Failed to cancel order");
    }
  }

  return (
    <>
      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
      <div className="flex flex-col gap-3">
        {orders.map((order) => {
          const isThisExpanded = expandedId === order._id;
          const panel = isThisExpanded ? activePanel : null;
          const editForm = editForms[order._id] ?? { qty: String(order.quantityOrdered), notes: order.notes ?? "" };

          return (
            <div key={order._id} className="rounded-xs border border-border bg-card overflow-hidden">
              <div className="px-4 pt-4 pb-3 flex flex-col sm:flex-row sm:items-start gap-3">
                {/* Left: thumbnail + text */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Thumbnail url={order.labelImageUrl} name={order.labelName} onPreview={setPreviewImage} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{order.orderNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded-xs bg-amber-100 text-amber-800 border border-amber-200 font-medium dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                        On Order
                      </span>
                    </div>
                    <p className={cn("font-bold", compact ? "text-base" : "text-lg")}>{order.storeName}</p>
                    <p className={cn("font-medium text-foreground mt-0.5", compact ? "text-sm" : "text-base")}>{order.labelName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ordered:{" "}
                      <span className="font-semibold text-foreground">{order.quantityOrdered.toLocaleString()}</span>
                      <span className="mx-1.5 text-border">·</span>
                      {new Date(order.orderedAt).toLocaleDateString()}
                    </p>
                    {order.notes && <p className="text-xs text-muted-foreground mt-1 italic">{order.notes}</p>}
                  </div>
                </div>

                {/* Right: all three buttons in one row, hidden while panel open */}
                {!isThisExpanded && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openPanel(order._id, "edit", order)}
                          className="p-2 rounded-xs border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit order"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPanel(order._id, "delete", order)}
                          className="p-2 rounded-xs border border-border bg-background text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                          title="Cancel order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openPanel(order._id, "receive", order)}
                      className="px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Receive
                    </button>
                  </div>
                )}
              </div>

              {/* Receive panel */}
              {panel === "receive" && (
                <div className="border-t border-amber-400/30 bg-amber-400/10 px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Enter actual quantity received:</p>
                  <input
                    type="number"
                    min={1}
                    value={quantities[order._id] ?? order.quantityOrdered}
                    onChange={(e) => setQuantities((q) => ({ ...q, [order._id]: e.target.value }))}
                    className={fieldClass}
                    autoFocus
                  />
                  {order.notes && (
                    <p className="text-xs text-amber-800/70 dark:text-amber-400/70 italic">Note: {order.notes}</p>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <button onClick={closePanel} className="px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReceive(order)}
                      disabled={receiving}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {receiving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm Receipt
                    </button>
                  </div>
                </div>
              )}

              {/* Edit panel */}
              {panel === "edit" && (
                <div className="border-t border-blue-400/30 bg-blue-400/10 px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Edit order details:</p>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground font-medium">Quantity ordered</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.qty}
                      onChange={(e) => setEditForms((f) => ({ ...f, [order._id]: { ...editForm, qty: e.target.value } }))}
                      className={fieldClass}
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground font-medium">Notes (optional)</label>
                    <input
                      type="text"
                      value={editForm.notes}
                      onChange={(e) => setEditForms((f) => ({ ...f, [order._id]: { ...editForm, notes: e.target.value } }))}
                      placeholder="Add a note…"
                      className={fieldClass}
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <button onClick={closePanel} className="px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEdit(order)}
                      disabled={updating}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Delete confirmation panel */}
              {panel === "delete" && (
                <div className="border-t border-destructive/30 bg-destructive/5 px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm text-destructive font-medium">
                    Cancel order <span className="font-mono">{order.orderNumber}</span>? This cannot be undone.
                  </p>
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <button onClick={closePanel} className="px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      Keep Order
                    </button>
                    <button
                      onClick={() => handleDelete(order)}
                      disabled={deleting}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50"
                    >
                      {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Yes, Cancel Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Unprocessed Tab ──────────────────────────────────────────────────────────

function UnprocessedTab({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
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
                belowThreshold ? "border-red-300 border-l-4 border-l-red-500 dark:border-red-700 dark:border-l-red-500" : "border-border"
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

// ─── Apply Label Tab (labeled → printed) ─────────────────────────────────────

function ApplyLabelTab({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
  const { data, isLoading, isError } = useGetLabelInventoryQuery();
  const [printLabels, { isLoading: printing }] = usePrintLabelsMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, { qty: string; lotNumber: string; thcPercent: string; testDate: string }>>({});
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

  function getForm(id: string, labeled: number) {
    return forms[id] ?? { qty: String(labeled), lotNumber: "", thcPercent: "", testDate: "" };
  }

  function setForm(id: string, patch: Partial<(typeof forms)[string]>) {
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
                belowThreshold ? "border-red-300 border-l-4 border-l-red-500 dark:border-red-700 dark:border-l-red-500" : "border-border"
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

// ─── Printed Tab ──────────────────────────────────────────────────────────────

function PrintedTab({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
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
                belowThreshold ? "border-red-300 border-l-4 border-l-red-500 dark:border-red-700 dark:border-l-red-500" : "border-border"
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

// ─── Reorder Threshold Inline (admin only) ────────────────────────────────────

function ReorderThresholdInline({ inv }: { inv: ILabelInventory }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(inv.reorderThreshold));
  const [setThreshold, { isLoading }] = useSetReorderThresholdMutation();

  async function handleSave() {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) { toast.error("Enter a valid threshold"); return; }
    try {
      await setThreshold({ inventoryId: inv._id, reorderThreshold: n }).unwrap();
      toast.success("Reorder threshold updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update threshold");
    }
  }

  return (
    <div className="border-t border-border mx-4 py-3 flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Reorder threshold:</span>
      {editing ? (
        <>
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="rounded-xs border border-input bg-background px-2 py-1 text-xs w-24 focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <button onClick={handleSave} disabled={isLoading} className="p-1 rounded-xs text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </button>
          <button onClick={() => { setEditing(false); setValue(String(inv.reorderThreshold)); }} className="p-1 rounded-xs text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-3 h-3" />
          </button>
        </>
      ) : (
        <>
          <span className="text-xs font-semibold">{inv.reorderThreshold > 0 ? inv.reorderThreshold.toLocaleString() : "not set"}</span>
          <button onClick={() => { setEditing(true); setValue(String(inv.reorderThreshold)); }} className="p-1 rounded-xs text-muted-foreground hover:bg-muted transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return <p className="text-destructive text-sm py-10 text-center">{msg}</p>;
}

function EmptyState({ msg }: { msg: string }) {
  return <p className="text-muted-foreground text-sm py-10 text-center">{msg}</p>;
}

// ─── Main PackagePrepView ─────────────────────────────────────────────────────

export default function PackagePrepView({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
  const [active, setActive] = useState<Tab>("on_order");
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: inventoryData } = useGetLabelInventoryQuery();
  const belowCount = (inventoryData?.inventory ?? []).filter(
    (i) => i.reorderThreshold > 0 && i.unprocessed + i.labeled + i.printed < i.reorderThreshold,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex flex-col gap-0 rounded-xs border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setBulkOpen((v) => !v)}
            className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground">Place Bulk Label Order</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", bulkOpen && "rotate-180")} />
          </button>
          {bulkOpen && (
            <div className="border-t border-border p-4">
              <PackagePrepAdminOrder />
            </div>
          )}
        </div>
      )}

      {isAdmin && belowCount > 0 && (
        <div className="flex items-center gap-2 rounded-xs bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {belowCount} SKU{belowCount !== 1 ? "s are" : " is"} below reorder threshold
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-xs transition-colors text-center",
              active === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {active === "on_order" && <OnOrderTab compact={compact} isAdmin={isAdmin} />}
      {active === "unprocessed" && <UnprocessedTab isAdmin={isAdmin} compact={compact} />}
      {active === "apply_label" && <ApplyLabelTab isAdmin={isAdmin} compact={compact} />}
      {active === "printed" && <PrintedTab isAdmin={isAdmin} compact={compact} />}
    </div>
  );
}
